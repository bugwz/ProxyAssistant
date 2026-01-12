// Proxy Assistant - Background Service Worker (Chrome)
// Implements Manifest V3 proxy functionality

// Browser detection
const isFirefox = false;
const isChrome = true;

// Global variable to store current proxy authentication credentials
let currentProxyAuth = {
  username: '',
  password: ''
};

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
  }

  // Disable proxy on initialization
  turnOffProxy();
});

// Restore previous proxy settings on browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome started, checking for saved proxy settings');
  chrome.storage.local.get(['currentProxy', 'proxyEnabled', 'proxyMode'], (result) => {
    if (result.proxyEnabled) {
      console.log('Restoring saved proxy settings');
      applyProxySettings(result.currentProxy);
    } else {
      // Clear badge for disabled
      updateBadge();
    }
  });
});

// Helper function to get proxy settings with browser-specific implementation
function getProxySettings() {
  return new Promise((resolve) => {
    try {
      // Chrome API
      chrome.proxy.settings.get({ incognito: false }, (config) => {
        if (chrome.runtime.lastError) {
          console.error("Chrome proxy.settings.get error:", chrome.runtime.lastError);
          resolve({ value: null, levelOfControl: "unknown" });
        } else {
          resolve(config || { value: null, levelOfControl: "unknown" });
        }
      });
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

    if (mode === 'auto') {
      applyAutoProxySettings();
    } else if (mode === 'disabled') {
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

  for (const proxy of list) {
    // Skip disabled proxies
    if (proxy.disabled === true) continue;
    if (!proxy.ip || !proxy.port) continue;

    const type = (proxy.protocol || "HTTP").toUpperCase();
    let proxyType = "PROXY";
    if (type.startsWith("SOCKS")) proxyType = "SOCKS5";
    const proxyStr = `${proxyType} ${proxy.ip}:${proxy.port}`;

    // Check fallback policy: direct (default) or reject
    const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
    const returnVal = `"${proxyStr}${fallback}"`;

    // 1. Process Bypass URLs (Manual Mode config but also applies to Auto Mode for consistency)
    if (proxy.bypass_urls) {
      const bypassUrls = proxy.bypass_urls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      for (const pattern of bypassUrls) {
        if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          script += `  if (/${regexPattern}/.test(host)) return "DIRECT";\n`;
        } else {
          script += `  if (dnsDomainIs(host, "${pattern}") || host === "${pattern}") return "DIRECT";\n`;
        }
      }
    }

    // 2. Process Include URLs
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

  script += "  return \"DIRECT\";\n}";
  return script;
}

// Preconnect to test URLs to warm up proxy connection and avoidauth popups
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
