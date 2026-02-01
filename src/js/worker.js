// Proxy Assistant - Background Service Worker
// Implements Manifest V3 proxy functionality for Chrome and Firefox

// Browser detection
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;
const isChrome = !isFirefox && typeof chrome !== 'undefined';

// Global variable to store current proxy authentication credentials
let currentProxyAuth = {
  username: '',
  password: ''
};

// Helper to sync auth to session storage (MV3 state safety)
function updateSessionAuth(auth) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    chrome.storage.session.set({ currentProxyAuth: auth });
  }
}

// Firefox-specific state management
// FoxyProxy implementation uses internal state + onRequest instead of settings API
let firefoxProxyState = {
  mode: 'disabled', // disabled, manual, auto
  currentProxy: null,
  list: [],
  testMode: false,
  testProxy: null
};

// Helper to sync Firefox state to session storage
function updateFirefoxSessionState() {
  if (isFirefox && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    chrome.storage.session.set({ firefoxProxyState: firefoxProxyState });
  }
}

// State loading promise for async handling
let stateLoaded = false;
let stateLoadedResolve = null;
const stateLoadedPromise = new Promise(resolve => {
  stateLoadedResolve = resolve;
});

// Listener for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Proxy Assistant installed/updated');

  if (details.reason === 'install') {
    // Requirement 4: Default sync enabled on first install, pull from remote
    chrome.storage.local.set({ auto_sync: true }, () => {
      chrome.storage.sync.get(['list'], (items) => {
        if (items.list && items.list.length > 0) {
          console.log('Initial sync: Pulled ' + items.list.length + ' proxies from remote');
          chrome.storage.local.set({ list: items.list });
        }
      });
    });

    // Disable proxy on initialization only for new installs
    turnOffProxy();
  }
});

// Restore previous proxy settings
function restoreProxySettings() {
  console.log('Checking for saved proxy settings');

  // Load both local (persistent) and session (runtime) settings
  const storagePromise = new Promise(resolve => {
    chrome.storage.local.get(['currentProxy', 'proxyEnabled', 'proxyMode', 'list'], (localResult) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get(['firefoxProxyState'], (sessionResult) => {
          resolve({ local: localResult, session: sessionResult });
        });
      } else {
        resolve({ local: localResult, session: {} });
      }
    });
  });

  storagePromise.then(({ local: result, session: sessionResult }) => {
    if (isFirefox) {
      // Sync local state for Firefox
      if (result.list) firefoxProxyState.list = result.list;
      if (result.currentProxy) firefoxProxyState.currentProxy = result.currentProxy;
      // If enabled, restore mode
      if (result.proxyEnabled) {
        firefoxProxyState.mode = result.proxyMode || 'manual';
      } else {
        firefoxProxyState.mode = 'disabled';
      }

      // OVERRIDE: If we have session state (e.g. recovered from suspension during test), restore it
      if (sessionResult.firefoxProxyState) {
        console.log("Restoring Firefox runtime state from session");
        const savedState = sessionResult.firefoxProxyState;

        // Restore test mode if it was active
        if (savedState.testMode) {
          firefoxProxyState.testMode = true;
          firefoxProxyState.testProxy = savedState.testProxy;
        }

        // Restore mode if valid (session takes precedence for runtime consistency if needed)
        // But generally we trust local storage for the main mode, session for transient states
        if (savedState.mode && savedState.mode !== firefoxProxyState.mode) {
          console.log(`Session mode ${savedState.mode} differs from local mode ${firefoxProxyState.mode}, keeping local`);
        }
      }

      // Ensure settings are cleared and listeners are active
      setupFirefoxProxy();

      if (firefoxProxyState.mode !== 'disabled') {
        console.log('Restoring saved proxy settings');
      } else {
        // Clear badge for disabled
        updateBadge();
      }
    } else {
      // Chrome
      if (result.proxyEnabled) {
        console.log('Restoring saved proxy settings');
        applyProxySettings(result.currentProxy);
      } else {
        // Clear badge for disabled
        updateBadge();
      }
    }

    // Mark state as loaded
    if (!stateLoaded) {
      stateLoaded = true;
      if (stateLoadedResolve) stateLoadedResolve();
    }
  });
}

// Hook into startup event
chrome.runtime.onStartup.addListener(restoreProxySettings);

// Also run immediately on script load to handle Service Worker wakeups
restoreProxySettings();

// Helper function to get proxy settings with browser-specific implementation
function getProxySettings() {
  return new Promise((resolve) => {
    try {
      if (isFirefox) {
        // Firefox API - we return our internal state because we use onRequest
        // We mock the Chrome API structure for compatibility with UI
        let config = { value: { mode: "system" }, levelOfControl: "controlled_by_this_extension" };

        if (firefoxProxyState.mode === 'manual') {
          config.value = {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                host: firefoxProxyState.currentProxy?.ip,
                port: parseInt(firefoxProxyState.currentProxy?.port || 0)
              }
            }
          };
        } else if (firefoxProxyState.mode === 'auto') {
          config.value = { mode: "pac_script" };
        }

        resolve(config);
      } else {
        // Chrome API
        chrome.proxy.settings.get({ incognito: false }, (config) => {
          if (chrome.runtime.lastError) {
            console.log("Chrome proxy.settings.get error:", chrome.runtime.lastError);
            resolve({ value: null, levelOfControl: "unknown" });
          } else {
            resolve(config || { value: null, levelOfControl: "unknown" });
          }
        });
      }
    } catch (error) {
      console.log("Exception getting proxy settings:", error);
      resolve({ value: null, levelOfControl: "unknown" });
    }
  });
}

// List of URLs to preconnect to warm up proxy connection
const TEST_URLS = [
  'https://www.baidu.com/favicon.ico',
];

// Set extension icon badge
function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color: color });
  }
}

// Monitor storage changes to keep badge updated
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.list || changes.proxyMode || changes.proxyEnabled) {
      updateBadge();
    }

    // Sync Firefox state on storage changes
    if (isFirefox) {
      if (changes.list) firefoxProxyState.list = changes.list.newValue;
      if (changes.currentProxy) firefoxProxyState.currentProxy = changes.currentProxy.newValue;
    }
  }
});

// Update badge based on current state and requirements
function updateBadge() {
  chrome.storage.local.get(['proxyEnabled', 'proxyMode', 'list'], (result) => {
    const mode = result.proxyMode || 'disabled';

    if (mode === 'manual') {
      setBadge("ᴍ", "#4164f5");
    } else if (mode === 'auto') {
      setBadge("ᴀ", "#28a745");
    } else {
      setBadge("");
    }
  });
}

// Handle different types of proxy settings
function applyProxySettings(proxyInfo) {
  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], (result) => {
    const mode = result.proxyMode || 'manual';

    if (isFirefox) {
      // Update Firefox state
      firefoxProxyState.list = result.list || [];
      if (mode === 'disabled') {
        firefoxProxyState.mode = 'disabled';
        firefoxProxyState.currentProxy = null;
      } else if (mode === 'auto') {
        firefoxProxyState.mode = 'auto';
        firefoxProxyState.currentProxy = null;
      } else {
        // Manual
        firefoxProxyState.mode = 'manual';
        // Use provided info or fallback to storage
        firefoxProxyState.currentProxy = proxyInfo || result.currentProxy;
      }
      updateFirefoxSessionState();

      // Update UI
      chrome.storage.local.set({
        proxyEnabled: mode !== 'disabled',
        currentProxy: firefoxProxyState.currentProxy // Ensure storage matches state
      }, () => {
        updateBadge();
        setupFirefoxProxy(); // Activate the proxy logic
      });
    } else {
      // Chrome
      const chromeMode = result.proxyMode || 'manual';

      if (chromeMode === 'auto') {
        applyAutoProxySettings();
      } else if (chromeMode === 'disabled') {
        // If mode is disabled, always turn off proxy regardless of proxyInfo
        turnOffProxy();
      } else {
        // Manual mode
        // If manual mode and no proxyInfo provided (e.g. from refreshProxy), use the one from storage
        const infoToApply = proxyInfo || result.currentProxy;
        if (infoToApply) {
          applyManualProxySettings(infoToApply);
        } else {
          turnOffProxy();
        }
      }
    }
  });
}

// Protocol field cleaning function - prevents protocol value corruption
function cleanProtocol(protocol) {
  if (!protocol || typeof protocol !== 'string') return 'http';
  // Remove potential URL prefixes (http://, https://, http:, https:, etc.)
  let cleaned = protocol.replace(/^(https?:\/?\/?)/i, '').trim();
  // Normalize to lowercase
  cleaned = cleaned.toLowerCase();
  // Validate against known protocols
  const validProtocols = ['http', 'https', 'socks4', 'socks5', 'socks'];
  if (!validProtocols.includes(cleaned)) {
    return 'http';
  }
  return cleaned;
}

// Helper function to validate proxy configuration
function validateProxyConfig(ip, port) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

  if (!ipv4Regex.test(ip) && !hostnameRegex.test(ip)) {
    return { valid: false, error: "Invalid IP address or hostname format" };
  }

  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { valid: false, error: "Invalid port number (must be 1-65535)" };
  }

  return { valid: true };
}

// -----------------------------------------------------------------------------
// Chrome Implementation Section
// -----------------------------------------------------------------------------

// Manual mode: Apply fixed server configuration (Chrome only)
async function applyManualProxySettings(proxyInfo) {
  if (!proxyInfo) {
    console.log("No proxy info provided, turning off proxy");
    turnOffProxy();
    return { success: false, error: "No proxy information provided" };
  }

  // Clean protocol field to prevent corruption
  const type = cleanProtocol(proxyInfo.protocol || proxyInfo.type || "http");
  const ip = proxyInfo.ip;
  const port = proxyInfo.port;
  const username = proxyInfo.username;
  const password = proxyInfo.password;
  const proxyName = proxyInfo.name || "";
  const bypassUrls = proxyInfo.bypass_urls || "";

  if (!type || !ip || !port) {
    console.log("Missing required proxy information", proxyInfo);
    return { success: false, error: "Missing proxy IP, port, or protocol" };
  }

  // Validate IP and port format before applying
  const validation = validateProxyConfig(ip, port);
  if (!validation.valid) {
    console.log("Invalid proxy configuration:", validation.error);
    return { success: false, error: validation.error };
  }

  let proxyScheme = type === "socks5" ? "socks5" : (type === "socks4" ? "socks4" : "http");
  if (type === "https") proxyScheme = "https";

  let portNumber = parseInt(port);

  // Parse bypassUrls
  let bypassList = ["localhost", "127.0.0.1", "<local>"];
  if (bypassUrls) {
    const customBypass = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    bypassList = [...new Set([...bypassList, ...customBypass])];
  }

  // Merge subscription bypass rules (DIRECT) for Manual Mode
  if (proxyInfo.subscription && proxyInfo.subscription.enabled !== false && proxyInfo.subscription.current) {
    try {
      const format = proxyInfo.subscription.current;
      const subConfig = proxyInfo.subscription.lists ? proxyInfo.subscription.lists[format] : null;

      if (subConfig && subConfig.unusedContent) {
        const reverse = subConfig.reverse || false;
        const rules = parseSubscriptionRules(subConfig.unusedContent, 'pac', 'PROXY', '0.0.0.0:0', reverse);

        // Filter for DIRECT rules (exceptions/bypass)
        const directRules = rules.filter(r => r.action === 'DIRECT');
        let addedCount = 0;

        for (const rule of directRules) {
          // Chrome bypassList supports hosts and simple wildcards
          if (rule.type === 'domain') {
            // Domain rule: remove || prefix, Chrome matches domain and subdomains automatically
            // e.g., "google.com" matches "google.com", "www.google.com", "mail.google.com"
            let pattern = rule.pattern.replace(/^\|\|/, '');
            if (!pattern) continue;

            // If pattern starts with *. (from subscription like *.example.com),
            // remove the * and use the domain directly - Chrome bypass matches subdomains
            if (pattern.startsWith('*.')) {
              pattern = pattern.substring(2);
            }

            // Skip patterns that look like URL paths (contain /)
            if (pattern.includes('/')) continue;

            // Skip pure IP addresses in bypass rules (they may cause issues)
            const isIpPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
            if (isIpPattern.test(pattern)) continue;

            if (pattern && !bypassList.includes(pattern)) {
              bypassList.push(pattern);
              addedCount++;
            }
          } else if (rule.type === 'wildcard') {
            // Simple wildcard pattern (Chrome doesn't fully support wildcards in bypassList)
            // Try to extract domain from patterns like *.example.com
            let pattern = rule.pattern;
            if (!pattern) continue;

            // Handle *.example.com format
            if (pattern.startsWith('*.')) {
              const domain = pattern.substring(2);
              // Skip if it looks like a path
              if (domain.includes('/')) continue;
              // Skip if it looks like an IP
              const isIpPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
              if (!isIpPattern.test(domain)) {
                pattern = domain;
              }
            }

            if (pattern && !bypassList.includes(pattern)) {
              bypassList.push(pattern);
              addedCount++;
            }
          } else if (rule.type === 'start') {
            // URL prefix rule (from | pattern)
            // Chrome bypassList doesn't support URL prefix matching
            // Skip these rules - they can't be properly represented
            console.log(`Skipping URL prefix bypass rule: ${rule.pattern} (not supported by Chrome bypassList)`);
          }
        }
        console.log(`Merged ${addedCount} bypass rules from subscription (Manual Mode)`);
      }
    } catch (e) {
      console.error("Error merging subscription bypass rules:", e);
    }
  }

  currentProxyAuth = { username: username || '', password: password || '' };
  updateSessionAuth(currentProxyAuth);

  chrome.storage.local.set({
    currentProxy: { ...proxyInfo, type: type, ip: ip, port: port, name: proxyName },
    proxyEnabled: true
  }, () => {
    updateBadge();
  });

  setupAuthListener();

  const config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: proxyScheme, host: ip, port: portNumber },
      bypassList: bypassList
    }
  };

  // Check if we have control over proxy settings
  const controlStatus = await getProxySettings();

  if (controlStatus.levelOfControl === "controlled_by_other_extensions") {
    console.warn("Cannot apply proxy - controlled by other extension");
    return {
      success: false,
      error: "Proxy settings are controlled by another extension. Please disable other proxy/VPN extensions."
    };
  }

  chrome.proxy.settings.set({ value: config, scope: "regular" }, async () => {
    if (chrome.runtime.lastError) {
      console.log("Error setting proxy:", chrome.runtime.lastError);
    } else {
      console.log("Manual proxy enabled:", proxyName);
      preconnectToTestUrls();
    }
  });

  return { success: true };
}

// Auto mode: Generate and apply PAC script (Chrome only)
function applyAutoProxySettings() {
  // Always read from local storage for auto mode consistency
  chrome.storage.local.get({ list: [] }, (items) => {
    const list = items.list || [];
    const pacScript = generatePacScript(list);

    console.log("Generated PAC Script:", pacScript);

    const config = {
      mode: "pac_script",
      pacScript: {
        data: pacScript
      }
    };

    // In auto mode, we need to handle auth for all matched proxies
    // Here we simply set up a global listener, handleAuthRequest will query storage as needed
    setupAuthListener();

    chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
      if (chrome.runtime.lastError) {
        console.log("Error setting auto proxy:", chrome.runtime.lastError);
      } else {
        console.log("Auto proxy (PAC) enabled");
        chrome.storage.local.set({ proxyEnabled: true }, () => {
          updateBadge();
        });
      }
    });
  });
}

// Helper function to check if pattern is an IP address
function isIpPattern(pattern) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  return ipv4Pattern.test(pattern);
}

// Generate PAC script logic (Chrome only)
function generatePacScript(list) {
  let script = `function FindProxyForURL(url, host) {
  function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  function isInCidrRange(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

`;

  // Check include_urls in proxy list order, use first match
  for (const proxy of list) {
    // Skip disabled proxies
    if (proxy.disabled === true) continue;
    if (!proxy.ip || !proxy.port) continue;

    const type = (proxy.protocol || "HTTP").toUpperCase();
    let proxyType = "PROXY";
    if (type.startsWith("SOCKS")) proxyType = "SOCKS5";
    const proxyStr = `${proxyType} ${proxy.ip}:${proxy.port}`;

    // Determine fallback behavior based on fallback_policy
    const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
    const returnVal = `"${proxyStr}${fallback}"`;

    // Only process include_urls, ignore bypass_urls in auto mode
    if (proxy.include_urls) {
      const includeUrls = proxy.include_urls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      for (const pattern of includeUrls) {
        // Support regex pattern: /pattern/flags
        if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
          const regexContent = pattern.slice(1, -1);
          const regexFlags = pattern.includes('/') ? pattern.split('/').pop() : '';
          const flags = regexFlags && !regexFlags.includes('/') ? regexFlags : '';
          script += `  if (/${regexContent}/${flags}.test(host)) return ${returnVal};\n`;
        } else if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          script += `  if (/${regexPattern}/.test(host)) return ${returnVal};\n`;
        } else if (isIpPattern(pattern)) {
          // IP address or CIDR range
          if (pattern.includes('/')) {
            // CIDR format: 192.168.1.0/24
            script += `  if (isInCidrRange(host, "${pattern}")) return ${returnVal};\n`;
          } else {
            // Single IP address
            script += `  if (host === "${pattern}") return ${returnVal};\n`;
          }
        } else {
          script += `  if (dnsDomainIs(host, "${pattern}") || host === "${pattern}") return ${returnVal};\n`;
        }
      }
    }

    // Process subscription rules for Auto Mode
    if (proxy.subscription && proxy.subscription.enabled !== false && proxy.subscription.current) {
      try {
        const format = proxy.subscription.current;
        const subConfig = proxy.subscription.lists ? proxy.subscription.lists[format] : null;

        if (subConfig && subConfig.usedContent) {
          const proxyTypeFull = `${proxyStr}${fallback}`;
          const reverse = subConfig.reverse || false;
          const rules = parseSubscriptionRules(subConfig.usedContent, 'pac', proxyTypeFull, "", reverse);

          // Filter for "need to proxy" rules (ignore exceptions/DIRECT)
          // Requirement 2 implies we only care about adding proxy rules
          const activeRules = rules.filter(r => r.action !== 'DIRECT');

          for (const rule of activeRules) {
            script += "  " + rule.js + "\n";
          }
          console.log(`Merged ${activeRules.length} rules from subscription for proxy ${proxy.name || 'unnamed'}`);
        }
      } catch (e) {
        console.error("Error merging subscription rules in Auto Mode:", e);
      }
    }
  }

  script += "  return \"DIRECT\";\n}"; // Direct connection when no match
  return script;
}

// -----------------------------------------------------------------------------
// Firefox Implementation Section
// -----------------------------------------------------------------------------

function setupFirefoxProxy() {
  if (typeof browser === 'undefined' || !browser.proxy) {
    console.warn("Firefox proxy API not available");
    return;
  }

  browser.proxy.settings.clear({});

  registerFirefoxListener();

  setupAuthListener();
}

// Firefox proxy listener registration - will be called after handleFirefoxRequest is defined
function registerFirefoxListener() {
  if (isFirefox && typeof browser !== 'undefined' && browser.proxy && browser.proxy.onRequest) {
    if (!browser.proxy.onRequest.hasListener(handleFirefoxRequest)) {
      browser.proxy.onRequest.addListener(handleFirefoxRequest, { urls: ["<all_urls>"] });
      console.log("Firefox proxy.onRequest listener registered");
    }
  }
}

async function handleFirefoxRequest(details) {
  // Wait for state to be loaded from storage
  if (!stateLoaded) {
    await stateLoadedPromise;
  }

  // Test Mode Override
  if (firefoxProxyState.testMode && firefoxProxyState.testProxy) {
    return createFirefoxProxyObject(firefoxProxyState.testProxy);
  }

  // Disabled
  if (firefoxProxyState.mode === 'disabled') {
    return null; // Fallthrough to system
  }

  // Manual Mode
  if (firefoxProxyState.mode === 'manual') {
    if (firefoxProxyState.currentProxy) {
      const proxy = firefoxProxyState.currentProxy;
      let bypassAll = proxy.bypass_urls || '';

      // Merge subscription unusedContent (bypass rules)
      if (proxy.subscription && proxy.subscription.enabled !== false && proxy.subscription.current) {
        const format = proxy.subscription.current;
        const subConfig = proxy.subscription.lists ? proxy.subscription.lists[format] : null;
        if (subConfig && subConfig.unusedContent) {
          bypassAll = bypassAll + '\n' + subConfig.unusedContent;
        }
      }

      // Check bypass list for manual mode
      if (checkBypass(bypassAll, details.url)) {
        return { type: "direct" };
      }
      return createFirefoxProxyObject(proxy);
    }
    return null; // No config -> System
  }

  // Auto Mode
  if (firefoxProxyState.mode === 'auto') {
    return findProxyForRequestFirefox(details.url);
  }

  return { type: "direct" };
}

function checkBypass(bypassUrls, url) {
  if (!bypassUrls) return false;

  // Standard bypass for localhost
  const host = new URL(url).hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;

  const patterns = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
  for (const pattern of patterns) {
    if (matchesPattern(url, pattern)) {
      return true;
    }
  }
  return false;
}

function findProxyForRequestFirefox(url) {
  const host = new URL(url).hostname;

  // 按代理列表顺序检查，使用第一个匹配的include_urls
  for (const proxy of firefoxProxyState.list) {
    if (proxy.enabled === false || proxy.disabled === true) continue;
    if (!proxy.ip || !proxy.port) continue;

    // 只检查include_urls，忽略bypass_urls在自动模式下
    if (proxy.include_urls) {
      const includeUrls = proxy.include_urls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      for (const pattern of includeUrls) {
        if (matchesPattern(url, pattern)) {
          return createFirefoxProxyObject(proxy);
        }
      }
    }
  }

  return { type: "direct" }; // 没有匹配，直接连接
}

function matchesPattern(url, pattern) {
  const host = new URL(url).hostname;

  if (pattern.includes('*')) {
    // Wildcard match
    const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexStr}$`, 'i'); // exact match with wildcard
    return regex.test(host);
  } else {
    // Domain match (dnsDomainIs equivalent)
    return host === pattern || host.endsWith('.' + pattern);
  }
}

function createFirefoxProxyObject(proxy) {
  const type = cleanProtocol(proxy.protocol || proxy.type || "http");

  let proxyType = "http";
  let proxyDNS = false;
  let socksVersion = undefined;

  if (type === "socks5") {
    proxyType = "socks";
    proxyDNS = true; // Default to remote DNS for SOCKS5
  } else if (type === "socks4") {
    proxyType = "socks";
    socksVersion = 4;
  } else if (type === "https") {
    proxyType = "https";
  }

  const result = {
    type: proxyType,
    host: proxy.ip,
    port: parseInt(proxy.port),
    username: proxy.username || undefined,
    password: proxy.password || undefined,
    proxyDNS: proxyDNS
  };

  if (socksVersion) {
    result.socksVersion = socksVersion;
  }

  // Include Auth header for HTTP/HTTPS to potentially skip onAuthRequired
  if ((proxyType === 'http' || proxyType === 'https') && proxy.username && proxy.password) {
    result.proxyAuthorizationHeader = 'Basic ' + btoa(proxy.username + ':' + proxy.password);
  }

  return result;
}

// -----------------------------------------------------------------------------
// End Browser-Specific Implementation Sections
// -----------------------------------------------------------------------------

// Preconnect to test URLs to warm up proxy connection and avoid auth popups
function preconnectToTestUrls() {
  console.log("Preconnecting to test URLs to warm up proxy connection");

  // Create a hidden iframe to load test URLs
  TEST_URLS.forEach(url => {
    fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    }).catch(err => {
      // Ignore errors, this is just to warm up the connection
      console.log(`Preconnect to ${url} completed (errors are expected)`);
    });
  });
}

// Set up authentication listener
function setupAuthListener() {
  // Remove previous auth listener first
  try {
    chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
  } catch (e) {
    console.log("No previous auth listener to remove");
  }

  // Add new auth listener - using asyncBlocking in Manifest V3
  chrome.webRequest.onAuthRequired.addListener(
    handleAuthRequest,
    { urls: ["<all_urls>"] },
    ["asyncBlocking"]
  );

  console.log("Auth listener set up with asyncBlocking");
}

// Authentication callback function - handles auth requests
function handleAuthRequest(details, callback) {
  console.log("Auth request received for: " + details.url);

  // Only handle proxy authentication requests
  if (details.isProxy) {
    console.log("Handling proxy auth request");

    if (currentProxyAuth.username && currentProxyAuth.password) {
      console.log("Providing auth credentials for: " + currentProxyAuth.username);

      // Direct callback for better performance and reliability with fetch
      callback({
        authCredentials: {
          username: currentProxyAuth.username,
          password: currentProxyAuth.password
        }
      });
    } else {
      // Helper for local storage fallback
      const checkLocalStorage = () => {
        chrome.storage.local.get(['currentProxy'], (result) => {
          if (result.currentProxy &&
            result.currentProxy.username &&
            result.currentProxy.password) {

            // Update global variables
            currentProxyAuth.username = result.currentProxy.username;
            currentProxyAuth.password = result.currentProxy.password;
            // Note: We don't updateSessionAuth here because local storage is the source of truth for persisted settings

            console.log("Retrieved auth credentials from storage");

            setTimeout(() => {
              callback({
                authCredentials: {
                  username: result.currentProxy.username,
                  password: result.currentProxy.password
                }
              });
            }, 0);
          } else {
            console.log("No auth credentials available");
            callback({ cancel: false });
          }
        });
      };

      // If no auth info in global var, try session storage first (MV3 state safety)
      // This is crucial for testProxyConnection scenarios where credentials are temporary
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get(['currentProxyAuth'], (sessionResult) => {
          if (sessionResult.currentProxyAuth && sessionResult.currentProxyAuth.username) {
            currentProxyAuth = sessionResult.currentProxyAuth;
            console.log("Retrieved auth credentials from session storage");
            callback({
              authCredentials: {
                username: currentProxyAuth.username,
                password: currentProxyAuth.password
              }
            });
          } else {
            checkLocalStorage();
          }
        });
      } else {
        checkLocalStorage();
      }
    }
  } else {
    console.log("Not a proxy auth request");
    callback({ cancel: false });
  }
}

// Turn off proxy
async function turnOffProxy() {
  if (isFirefox) {
    firefoxProxyState.mode = 'disabled';
    updateFirefoxSessionState();
    chrome.storage.local.set({ proxyEnabled: false }, () => {
      updateBadge();
    });
    browser.proxy.settings.clear({});
  } else {
    // Chrome
    return new Promise(async (resolve) => {
      try {
        // First check current proxy control status
        const currentConfig = await getProxySettings();

        // Check if controlled by other extensions
        if (currentConfig.levelOfControl === "controlled_by_other_extensions") {
          console.warn("Proxy is controlled by other extensions, cannot turn off");
        }

        const config = {
          mode: "system"
        };

        // Clear auth info
        currentProxyAuth = {
          username: '',
          password: ''
        };
        updateSessionAuth(currentProxyAuth);

        // Mark proxy as disabled
        chrome.storage.local.set({ proxyEnabled: false }, () => {
          updateBadge();
        });

        // Remove auth listener
        try {
          chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
        } catch (e) {
          console.log("No auth listener to remove");
        }

        chrome.proxy.settings.set(
          { value: config, scope: "regular" },
          async () => {
            if (chrome.runtime.lastError) {
              console.log("Error turning off proxy:", chrome.runtime.lastError);
            } else {
              console.log("Proxy turned off (mode: system)");
            }
            resolve();
          }
        );
      } catch (error) {
        console.log("Error in turnOffProxy:", error);
        resolve();
      }
    });
  }
}

// Listen for messages from popup or settings page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message.action);

  try {
    if (message.action === "applyProxy") {
      applyProxySettings(message.proxyInfo);
      sendResponse({ success: true });
    } else if (message.action === "refreshProxy") {
      applyProxySettings();
      sendResponse({ success: true });
    } else if (message.action === "turnOffProxy") {
      turnOffProxy();
      sendResponse({ success: true });
    } else if (message.action === "getProxyStatus") {
      chrome.storage.local.get(['proxyEnabled', 'currentProxy'], (result) => {
        sendResponse({
          enabled: result.proxyEnabled || false,
          proxyInfo: result.currentProxy || null
        });
      });
      return true; // Keep message channel open for async response
    } else if (message.action === "testProxyConnection") {
      testProxyConnection(message.proxyInfo, sendResponse);
      return true;
    } else if (message.action === "getPacScript") {
      chrome.storage.local.get({ list: [] }, (items) => {
        const list = items.list || [];
        try {
          const script = generatePacScript(list);
          sendResponse({ success: true, script: script });
        } catch (e) {
          console.error("Error generating PAC script:", e);
          sendResponse({ success: false, error: e.message });
        }
      });
      return true;
    } else {
      console.warn("Unknown action:", message.action);
      sendResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.log("Error handling message:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

async function testProxyConnection(proxyInfo, sendResponse) {
  const previousAuth = { ...currentProxyAuth };

  // Set test auth
  currentProxyAuth = {
    username: proxyInfo.username || '',
    password: proxyInfo.password || ''
  };
  updateSessionAuth(currentProxyAuth);

  // Ensure listener is active
  setupAuthListener();

  // Clean protocol field to prevent corruption
  const type = cleanProtocol(proxyInfo.protocol || "http");

  // Validate IP format
  const ipValidation = validateProxyConfig(proxyInfo.ip, proxyInfo.port);
  if (!ipValidation.valid) {
    sendResponse({ success: false, error: `Invalid proxy configuration: ${ipValidation.error}` });
    return;
  }

  if (isFirefox) {
    // -------------------------
    // Firefox Test Implementation
    // -------------------------
    // Backup state
    const previousMode = firefoxProxyState.mode;

    // Set Test Mode
    firefoxProxyState.testMode = true;
    firefoxProxyState.testProxy = proxyInfo;
    updateFirefoxSessionState();

    // In Firefox, we rely on onRequest which reads the state
    // We don't need to "set" anything other than the state variables
    console.log("Firefox: Enabled Test Mode for connectivity check");

    try {
      // Wait a bit for state to be picked up
      await new Promise(resolve => setTimeout(resolve, 500));

      const testResult = await runConnectivityTest(proxyInfo);
      sendResponse(testResult);

    } catch (error) {
      sendResponse({ success: false, error: error.message || "Connection failed" });
    } finally {
      // Restore state
      firefoxProxyState.testMode = false;
      firefoxProxyState.testProxy = null;
      firefoxProxyState.mode = previousMode;
      currentProxyAuth = previousAuth;
      updateSessionAuth(currentProxyAuth);
      updateFirefoxSessionState();
    }
  } else {
    // -------------------------
    // Chrome Test Implementation
    // -------------------------
    let proxyScheme = type === "socks5" ? "socks5" : (type === "socks4" ? "socks4" : "http");
    if (type === "https") proxyScheme = "https";

    // Config for test
    const config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: proxyScheme,
          host: proxyInfo.ip,
          port: parseInt(proxyInfo.port)
        },
        bypassList: ["<local>"]
      }
    };

    try {
      // Apply test proxy
      await new Promise((resolve, reject) => {
        chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // Wait a bit for proxy settings to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      const testResult = await runConnectivityTest(proxyInfo);
      sendResponse(testResult);

    } catch (error) {
      sendResponse({ success: false, error: error.message || "Connection failed" });
    } finally {
      // Restore previous settings
      currentProxyAuth = previousAuth;
      updateSessionAuth(currentProxyAuth);
      applyProxySettings(); // Re-apply whatever was in storage
    }
  }
}

// Shared connectivity test logic
async function runConnectivityTest(proxyInfo) {
  // First test: Try to connect to a URL that should fail if proxy is invalid
  const invalidTargetTest = await testProxyConnectivity(proxyInfo);
  if (!invalidTargetTest.success) {
    return { success: false, error: invalidTargetTest.error };
  }

  // Phase 2: Test with actual URLs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 8000); // 8s timeout

  const startTime = Date.now();

  const testUrls = [
    "https://www.baidu.com/favicon.ico?_t=" + Date.now(),
    "https://httpbin.org/status/200?_t=" + Date.now()
  ];

  let testResult = null;
  let lastError = null;

  // Try each URL until one succeeds
  for (const testUrl of testUrls) {
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok && response.status === 200) {
        const latency = Date.now() - startTime;
        testResult = { success: true, latency: latency, url: testUrl };
        break;
      } else {
        lastError = `HTTP ${response.status} from ${testUrl}`;
      }
    } catch (error) {
      lastError = `${error.message} for ${testUrl}`;
      continue; // Try next URL
    }
  }

  clearTimeout(timeoutId);

  if (testResult && testResult.success) {
    return { success: true, latency: testResult.latency, testUrl: testResult.url };
  } else {
    return { success: false, error: lastError || "All test URLs failed" };
  }
}

// Helper function to test if proxy is actually being used
async function testProxyConnectivity(proxyInfo) {
  const testHost = "invalid-test-host-12345.com";
  const testUrl = `https://${testHost}/test`;

  let timeoutId;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(testUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      return {
        success: false,
        error: "Proxy connectivity test failed - request did not go through proxy"
      };
    }
    return { success: true };

  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error.name === 'TypeError' && error.message.includes('fetch')) return { success: true };
    if (error.name === 'AbortError') return { success: true };
    return { success: false, error: `Proxy connectivity test failed: ${error.message}` };
  }
}

// Subscription rules parser for worker context
function parseSubscriptionRuleLine(line, format, defaultType, defaultAddress, reverse) {
  let isException = false;
  let actionType = defaultType;
  let isDirect = false;

  if (format === 'autoproxy') {
    if (line.startsWith('[') && line.endsWith(']')) return null;
    if (line.startsWith('!')) return null;
    if (line.startsWith('@@')) {
      isException = true;
      line = line.substring(2);
    }
    const finalActionIsDirect = reverse ? !isException : isException;
    isDirect = finalActionIsDirect;
  } else if (format === 'switchy_omega') {
    if (line.startsWith('[SwitchyOmega Conditions]')) return null;
    if (line.startsWith(';')) return null;
    if (line.startsWith('@')) return null;
    if (line.includes(' +')) {
      const parts = line.split(' +');
      line = parts[0].trim();
      const res = parts[1].trim().toLowerCase();
      if (res === 'direct') isDirect = true;
    }
    if (line.startsWith('!')) {
      isException = true;
      line = line.substring(1).trim();
    }
    if (isException) isDirect = true;
    if (reverse) isDirect = !isDirect;
  } else if (format === 'switchy_legacy') {
    if (line.startsWith(';')) return null;
    if (line === '#BEGIN' || line === '#END') return null;
    if (line.startsWith('[') && line.endsWith(']')) return null;
    if (line.startsWith('!')) {
      isException = true;
      line = line.substring(1);
    }
    const finalActionIsDirect = reverse ? !isException : isException;
    isDirect = finalActionIsDirect;
  }

  const result = isDirect ? 'DIRECT' : defaultType;
  const addressPart = defaultAddress ? ` ${defaultAddress}` : '';
  const returnVal = isDirect ? '"DIRECT"' : `"${defaultType}${addressPart}"`;

  if (format === 'switchy_omega' && line === '*') {
    return { type: 'all', pattern: '*', action: result, js: `return ${returnVal};` };
  }

  let js = '';
  let pattern = line;
  let ruleType = 'keyword';

  const wildcardToRegex = (wildcard) => {
    let escaped = wildcard.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    let regex = '^' + escaped.replace(/\*/g, '.*');
    return regex;
  };

  if (line.startsWith('||')) {
    pattern = line.substring(2);
    js = `if (host.endsWith('.${pattern}') || host === '${pattern}') return ${returnVal};`;
    ruleType = 'domain';
  } else if (line.startsWith('|')) {
    pattern = line.substring(1);
    js = `if (url.startsWith('${pattern}')) return ${returnVal};`;
    ruleType = 'start';
  } else if (line.startsWith('/') && line.endsWith('/')) {
    pattern = line.substring(1, line.length - 1);
    js = `if (/${pattern}/.test(url)) return ${returnVal};`;
    ruleType = 'regex';
  } else if (line.indexOf('*') !== -1) {
    const regex = wildcardToRegex(line);
    js = `if (/${regex}/.test(url)) return ${returnVal};`;
    ruleType = 'wildcard';
  } else if (format === 'switchy_omega' && line.startsWith(':')) {
    pattern = line.substring(1).trim();
    js = `if (host.endsWith('.${pattern}') || host === '${pattern}') return ${returnVal};`;
    ruleType = 'domain';
  } else if (format === 'switchy_omega') {
    js = `if (host.endsWith('.${line}') || host === '${line}') return ${returnVal};`;
    ruleType = 'domain';
  } else {
    js = `if (url.indexOf('${line}') >= 0) return ${returnVal};`;
  }

  return { type: ruleType, pattern, action: result, js };
}

function parseSubscriptionRules(content, format, proxyType, proxyAddress, reverse = false) {
  if (!content) return [];

  let decoded = content;
  let actualFormat = format;

  if (format === 'autoproxy' && (content.startsWith('W0F1dG9Qcm94') || content.trim().startsWith('[AutoProxy'))) {
    if (content.startsWith('W0F1dG9Qcm94')) {
      try {
        decoded = atob(content);
      } catch (e) {
        console.error("Base64 decode failed", e);
      }
    }
  }

  if (format === 'pac') {
    actualFormat = 'autoproxy';
  }

  const lines = decoded.split(/[\r\n]+/);
  const rules = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const rule = parseSubscriptionRuleLine(line, actualFormat, proxyType, proxyAddress, reverse);
    if (rule) {
      rules.push(rule);
    }
  }

  return rules;
}

// Register Firefox proxy listener after all functions are defined
registerFirefoxListener();
