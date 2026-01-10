// Proxy Assistant - Background Service Worker
// Implements Manifest V3 proxy functionality

// Listener for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Proxy Assistant installed/updated');
  // Disable proxy on initialization
  turnOffProxy();
});

// Restore previous proxy settings on browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome started, checking for saved proxy settings');
  chrome.storage.local.get(['currentProxy', 'proxyEnabled'], (result) => {
    if (result.proxyEnabled && result.currentProxy) {
      console.log('Restoring saved proxy settings');
      applyProxySettings(result.currentProxy);
    } else {
      // Set badge to N for disabled
      setBadge("ɴ", "#ff9800");
    }
  });
});

// Global variable to store current proxy authentication credentials
let currentProxyAuth = {
  username: '',
  password: ''
};

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

// Handle different types of proxy settings
function applyProxySettings(proxyInfo) {
  chrome.storage.local.get(['proxyMode', 'currentProxy'], (result) => {
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

// Manual mode: Apply fixed server configuration
function applyManualProxySettings(proxyInfo) {
  if (!proxyInfo) {
    console.error("No proxy info provided, turning off proxy");
    turnOffProxy();
    return;
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
    return;
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
  });

  setBadge("ᴍ", "#4164f5");
  setupAuthListener();

  const config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: proxyScheme, host: ip, port: portNumber },
      bypassList: bypassList
    }
  };

  chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
    console.log("Manual proxy enabled:", proxyName);
    preconnectToTestUrls();
  });
}

// Auto mode: Generate and apply PAC script
function applyAutoProxySettings() {
  chrome.storage.sync.get({ list: [] }, (items) => {
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
    setBadge("ᴀ", "#28a745");

    chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting auto proxy:", chrome.runtime.lastError);
      } else {
        console.log("Auto proxy (PAC) enabled");
        chrome.storage.local.set({ proxyEnabled: true });
      }
    });
  });
}

// Generate PAC script logic
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
function turnOffProxy() {
  const config = {
    mode: "system"
  };

  // Clear auth info
  currentProxyAuth = {
    username: '',
    password: ''
  };

  // Mark proxy as disabled
  chrome.storage.local.set({ proxyEnabled: false });

  // Set badge to N for disabled
  setBadge("ɴ", "#ff9800");

  // Remove auth listener
  try {
    chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
  } catch (e) {
    console.log("No auth listener to remove");
  }

  chrome.proxy.settings.set(
    { value: config, scope: "regular" },
    () => {
      console.log("Proxy turned off");
    }
  );
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
  const proxyAddress = `${proxyInfo.ip}:${proxyInfo.port}`;
  const proxyName = proxyInfo.name || proxyAddress;

  const previousAuth = { ...currentProxyAuth };
  const previousProxyEnabled = await new Promise(resolve => {
    chrome.storage.local.get(['proxyEnabled'], result => resolve(result.proxyEnabled || false));
  });

  // Set test auth
  currentProxyAuth = {
    username: proxyInfo.username || '',
    password: proxyInfo.password || ''
  };

  // Ensure listener is active
  setupAuthListener();

  // Clean protocol field to prevent corruption
  const type = cleanProtocol(proxyInfo.protocol || "http");
  let proxyScheme = type === "socks5" ? "socks5" : (type === "socks4" ? "socks4" : "http");
  if (type === "https") proxyScheme = "https";

  // Validate IP format
  const ipValidation = validateProxyConfig(proxyInfo.ip, proxyInfo.port);
  if (!ipValidation.valid) {
    sendResponse({ success: false, error: `Invalid proxy configuration: ${ipValidation.error}` });
    return;
  }

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


    // Check proxy control status before applying our settings
    const currentConfig = await new Promise(resolve => {
      chrome.proxy.settings.get({ incognito: false }, (config) => {
        resolve(config);
      });
    });

    // Handle different control scenarios
    if (currentConfig && currentConfig.levelOfControl) {
      switch (currentConfig.levelOfControl) {
        case "controlled_by_other_extensions":
          // Check if we can still proceed with testing
          if (currentConfig.value && currentConfig.value.mode === "system") {
            // Continue with applying our settings, but be more lenient in verification
          } else {
            sendResponse({
              success: false,
              error: "Proxy settings are controlled by another extension. Please disable other proxy/VPN extensions and try again."
            });
            return;
          }
          break;

        case "controllable_by_this_extension":
          break;

        case "controlled_by_this_extension":
          break;

        default:
      }
    }

    // Try to apply our proxy settings

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

    // Wait a moment and check if our proxy settings took effect
    await new Promise(resolve => setTimeout(resolve, 500));

    const newConfig = await new Promise(resolve => {
      chrome.proxy.settings.get({ incognito: false }, (config) => {
        resolve(config);
      });
    });

    // More lenient verification - check if we can proceed with testing
    let canProceed = false;

    if (newConfig && newConfig.value) {
      if (newConfig.value.mode === "fixed_servers" &&
        newConfig.value.rules &&
        newConfig.value.rules.singleProxy &&
        newConfig.value.rules.singleProxy.host === proxyInfo.ip &&
        newConfig.value.rules.singleProxy.port === parseInt(proxyInfo.port)) {
        canProceed = true;
      } else if (newConfig.levelOfControl === "controlled_by_other_extensions") {
        // In case of other extension control, we'll try to test but be aware of limitations
        canProceed = true;
      } else {
      }
    } else {
    }

    if (!canProceed) {
      sendResponse({
        success: false,
        error: "Unable to apply proxy configuration. This may be due to conflicts with other extensions."
      });
      return;
    }

    // Wait a bit for proxy settings to take effect
    await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1s

    // First test: Try to connect to a URL that should fail if proxy is invalid
    const invalidTargetTest = await testProxyConnectivity(proxyInfo);
    if (!invalidTargetTest.success) {
      sendResponse({ success: false, error: invalidTargetTest.error });
      return;
    }

    // Phase 2: Test with actual URLs
    // Race fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000); // 8s timeout

    const startTime = Date.now();

    // Use multiple test URLs for better reliability
    // Primary: Baidu for China network compatibility
    // Fallback: Global services if Baidu fails
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
      sendResponse({ success: true, latency: testResult.latency, testUrl: testResult.url });
    } else {
      sendResponse({ success: false, error: lastError || "All test URLs failed" });
    }

  } catch (error) {
    sendResponse({ success: false, error: error.message || "Connection failed" });
  } finally {
    // Restore previous settings synchronously to avoid race conditions
    currentProxyAuth = previousAuth;

    // Wait for proxy restoration to complete before sending response
    await new Promise(resolve => {
      chrome.storage.local.get(['proxyEnabled', 'currentProxy', 'proxyMode'], (result) => {
        const mode = result.proxyMode || 'manual';

        if (mode === 'disabled') {
          // If mode is disabled, always turn off proxy
          turnOffProxy();
        } else if (previousProxyEnabled && result.currentProxy) {
          // Only restore proxy if previous state was enabled and we have a proxy
          applyProxySettings(result.currentProxy);
        } else {
          // Otherwise turn off proxy
          turnOffProxy();
        }
        resolve();
      });
    });

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

  let timeoutId; // Define timeoutId at function scope

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for connectivity test

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
      // This should not happen if proxy is working - we got a response from invalid host
      return {
        success: false,
        error: "Proxy connectivity test failed - request did not go through proxy (got response from invalid host)"
      };
    }

    // If we get DNS resolution error or connection timeout, proxy might be working
    return { success: true };

  } catch (error) {
    // Clear timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // DNS resolution errors or connection failures are expected for invalid hosts
    // if the proxy is actually being used
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { success: true }; // This is expected - proxy tried to resolve invalid host
    }

    if (error.name === 'AbortError') {
      return { success: true }; // Timeout is also expected for invalid hosts through proxy
    }

    // Other errors might indicate proxy issues
    return {
      success: false,
      error: `Proxy connectivity test failed: ${error.message}`
    };
  }
}
