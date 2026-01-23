// Proxy Assistant - Background Service Worker
// Implements Manifest V3 proxy functionality for Chrome and Firefox

// Browser detection
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;
const isChrome = !isFirefox && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getBrowserInfo !== undefined;

// Global variable to store current proxy authentication credentials
let currentProxyAuth = {
  username: '',
  password: ''
};

// Firefox-specific state management
// FoxyProxy implementation uses internal state + onRequest instead of settings API
let firefoxProxyState = {
  mode: 'disabled', // disabled, manual, auto
  currentProxy: null,
  list: [],
  testMode: false,
  testProxy: null
};

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
  chrome.storage.local.get(['currentProxy', 'proxyEnabled', 'proxyMode', 'list'], (result) => {
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

      // Ensure settings are cleared and listeners are active
      setupFirefoxProxy();

      if (result.proxyEnabled) {
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
            console.error("Chrome proxy.settings.get error:", chrome.runtime.lastError);
            resolve({ value: null, levelOfControl: "unknown" });
          } else {
            resolve(config || { value: null, levelOfControl: "unknown" });
          }
        });
      }
    } catch (error) {
      console.error("Exception getting proxy settings:", error);
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

// -----------------------------------------------------------------------------
// Chrome Implementation Section
// -----------------------------------------------------------------------------

// Manual mode: Apply fixed server configuration (Chrome only)
async function applyManualProxySettings(proxyInfo) {
  if (!proxyInfo) {
    console.error("No proxy info provided, turning off proxy");
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
    console.error("Missing required proxy information", proxyInfo);
    return { success: false, error: "Missing proxy IP, port, or protocol" };
  }

  // Validate IP and port format before applying
  const validation = validateProxyConfig(ip, port);
  if (!validation.valid) {
    console.error("Invalid proxy configuration:", validation.error);
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

  currentProxyAuth = { username: username || '', password: password || '' };

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
      console.error("Error setting proxy:", chrome.runtime.lastError);
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
        console.error("Error setting auto proxy:", chrome.runtime.lastError);
      } else {
        console.log("Auto proxy (PAC) enabled");
        chrome.storage.local.set({ proxyEnabled: true }, () => {
          updateBadge();
        });
      }
    });
  });
}

// Generate PAC script logic (Chrome only)
function generatePacScript(list) {
  let script = "function FindProxyForURL(url, host) {\n";

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
        if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          script += `  if (/${regexPattern}/.test(host)) return ${returnVal};\n`;
        } else {
          script += `  if (dnsDomainIs(host, "${pattern}") || host === "${pattern}") return ${returnVal};\n`;
        }
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
  // Clear existing settings to avoid conflicts with onRequest
  // This is important because if settings are present, they might override or conflict
  browser.proxy.settings.clear({});

  // Note: We register the listener globally at the top level for Firefox
  // to ensure it persists through Service Worker/Event Page lifecycles.
  // However, we can ensure it's registered here just in case.
  if (!browser.proxy.onRequest.hasListener(handleFirefoxRequest)) {
    browser.proxy.onRequest.addListener(handleFirefoxRequest, { urls: ["<all_urls>"] });
    console.log("Firefox proxy.onRequest listener registered");
  }

  setupAuthListener();
}

// Ensure listener is registered immediately for Firefox
if (isFirefox) {
  if (!browser.proxy.onRequest.hasListener(handleFirefoxRequest)) {
    browser.proxy.onRequest.addListener(handleFirefoxRequest, { urls: ["<all_urls>"] });
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
      // Check bypass list for manual mode
      if (checkBypass(firefoxProxyState.currentProxy.bypass_urls, details.url)) {
        return { type: "direct" };
      }
      return createFirefoxProxyObject(firefoxProxyState.currentProxy);
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
    if (proxy.disabled) continue;
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
      // If no auth info in global var, try to get from storage
      chrome.storage.local.get(['currentProxy'], (result) => {
        if (result.currentProxy &&
          result.currentProxy.username &&
          result.currentProxy.password) {

          // Update global variables
          currentProxyAuth.username = result.currentProxy.username;
          currentProxyAuth.password = result.currentProxy.password;

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
              console.error("Error turning off proxy:", chrome.runtime.lastError);
            } else {
              console.log("Proxy turned off (mode: system)");
            }
            resolve();
          }
        );
      } catch (error) {
        console.error("Error in turnOffProxy:", error);
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
    } else {
      console.warn("Unknown action:", message.action);
      sendResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.error("Error handling message:", error);
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

// Helper function to validate proxy configuration
function validateProxyConfig(ip, port) {
  // Validate IP format
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

  if (!ipv4Regex.test(ip) && !hostnameRegex.test(ip)) {
    return { valid: false, error: "Invalid IP address or hostname format" };
  }

  // Validate port
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { valid: false, error: "Invalid port number (must be 1-65535)" };
  }

  return { valid: true };
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
