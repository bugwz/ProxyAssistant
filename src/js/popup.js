// ==========================================
// State & Constants
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
  I18n.init(function () {
    // Initialize theme mode first
    initThemeMode();
    // Initialize mode switcher and app
    initApp();
  });
});

function initApp() {
  const currentVersion = chrome.runtime.getManifest().version;
  $('#version-display').text('v' + currentVersion);

  chrome.storage.local.get(['config', 'state'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error loading settings:', chrome.runtime.lastError);
      return;
    }

    const config = result.config;
    if (!config) {
      const defaultId = window.ConfigModule.generateScenarioId();
      scenarios = [{ id: defaultId, name: I18n.t('scenario_default'), proxies: [] }];
      currentScenarioId = defaultId;
      list = [];
    } else {
      scenarios = config.scenarios?.lists || [];
      currentScenarioId = config.scenarios?.current || 'default';
      const currentScenario = scenarios.find(s => s.id === currentScenarioId);
      list = currentScenario?.proxies || [];
    }

    if (scenarios.length === 0) {
      const defaultId = window.ConfigModule.generateScenarioId();
      scenarios = [{ id: defaultId, name: I18n.t('scenario_default'), proxies: [] }];
      currentScenarioId = defaultId;
      list = [];
    }

    const state = result.state;
    const proxyMode = state?.proxy?.mode || 'disabled';
    let mode = proxyMode;
    if (!['disabled', 'manual', 'auto'].includes(mode)) {
      mode = 'disabled';
    }

    updateModeUI(mode);
    updateStatusDisplay(mode, state?.proxy?.current);

    renderScenarioSelector();
    updateScenarioVisibility();

    list_init();
    initBypassButton();
    updateBypassButton();
    updateCurrentSiteDisplay();
  });

  bindGlobalEvents();
}

function bindGlobalEvents() {
  // Settings button click event
  $(".settings-btn").on("click", function () {
    window.open("./main.html");
  });

  $(".add-btn").on("click", function () {
    window.open("./main.html");
  });

  // Mode switch button click event
  $('.mode-btn').on('click', function () {
    const mode = $(this).data('mode');
    updateModeUI(mode);

    chrome.storage.local.set({ state: { proxy: { mode: mode, current: null } } }, function () {
      if (chrome.runtime.lastError) {
        console.log('Error setting proxy mode:', chrome.runtime.lastError);
        return;
      }
      if (mode === 'auto') {
        // Auto mode
        chrome.runtime.sendMessage({ action: "refreshProxy" }, function () {
          if (chrome.runtime.lastError) {
            console.log('Error sending refreshProxy:', chrome.runtime.lastError);
          }
        });
        updateStatusDisplay('auto');
        // Re-render list to apply auto-match highlighting
        list_init();
        updateBypassButton();
        updateCurrentSiteDisplay(); updateScenarioVisibility();
      } else if (mode === 'disabled') {
        // Disabled mode
        chrome.runtime.sendMessage({ action: "turnOffProxy" }, function () {
          if (chrome.runtime.lastError) {
            console.log('Error sending turnOffProxy message:', chrome.runtime.lastError);
          }
          list_init();
          updateStatusDisplay('disabled', null);
          updateBypassButton();
          updateCurrentSiteDisplay(); updateScenarioVisibility();
        });
      } else {
        // Manual mode - restore previous selection or auto-select first proxy
        chrome.storage.local.get(['state'], function (result) {
          if (chrome.runtime.lastError) {
            console.log('Error getting state:', chrome.runtime.lastError);
            return;
          }
          let currentProxy = result.state?.proxy?.current;

          // Auto-select first available proxy if none selected
          if (!currentProxy && list && list.length > 0) {
            const firstEnabled = list.find(p => p.enabled !== false && p.ip && p.port);
            if (firstEnabled) {
              currentProxy = firstEnabled;
              // Save the auto-selected proxy
              chrome.storage.local.set({ state: { proxy: { mode: 'manual', current: currentProxy } } }, function () {
                if (chrome.runtime.lastError) {
                  console.log('Error saving auto-selected proxy:', chrome.runtime.lastError);
                }
              });
              // Apply the selected proxy
              chrome.runtime.sendMessage({ action: "applyProxy", proxyInfo: currentProxy }, function () {
                if (chrome.runtime.lastError) {
                  console.log('Error applying auto-selected proxy:', chrome.runtime.lastError);
                }
              });
            }
          }

          if (currentProxy) {
            updateStatusDisplay('manual', currentProxy);
          } else {
            updateStatusDisplay('manual', null);
          }
          list_init();
          updateBypassButton();
          updateCurrentSiteDisplay(); updateScenarioVisibility();
        });
      }
    });
  });

  // Dropdown handling
  $("html").on("click", function () {
    $(".lh-select-op").hide();
  });

  $(document).on("click", ".lh-select-k", function (e) {
    e.stopPropagation();
    const that = this;
    const $op = $(that).next();
    const display = $op.css('display');

    $(".lh-select-op").not($op).hide();

    if (display != 'none') {
      $op.hide();
      return;
    }
    setTimeout(function () {
      $op.toggle();
    }, 50);
  });

  $(document).on("click", ".lh-select-op li", function (e) {
    e.stopPropagation();
    const $li = $(this);
    const $container = $li.closest('.lh-select');
    const type = $container.data("type");

    if (type === 'popup_scenario') {
      const scenarioId = $li.data('value');
      switchScenario(scenarioId);
      $li.parent().hide();
    }
  });
}

// Storage change listener for real-time updates
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === 'local' && changes.config) {
    const newConfig = changes.config.newValue;
    if (newConfig) {
      scenarios = newConfig.scenarios?.lists || [];
      currentScenarioId = newConfig.scenarios?.current || 'default';
      const currentScenario = scenarios.find(s => s.id === currentScenarioId);
      list = currentScenario?.proxies || [];
      renderScenarioSelector();
      list_init();
    }
  }
});

// ==========================================
// Theme Logic
// ==========================================
function initThemeMode() {
  chrome.storage.local.get(['config'], function (items) {
    if (chrome.runtime.lastError) {
      console.log('Error getting config:', chrome.runtime.lastError);
      return;
    }
    const config = items.config || {};
    const settings = config.system || {};
    themeMode = settings.theme_mode || 'light';

    applyTheme(themeMode);
  });
}

function applyTheme(mode) {
  if (mode === 'dark') {
    $('body').attr('data-theme', 'dark');
  } else {
    $('body').removeAttr('data-theme');
  }
}

// ==========================================
// Scenario Logic
// ==========================================
function renderScenarioSelector() {
  let html = "";
  let currentScenarioName = "";

  scenarios.forEach(function (scenario) {
    const isCurrent = scenario.id === currentScenarioId;
    const displayName = scenario.name || I18n.t('unnamed_proxy');
    const cssClass = isCurrent ? 'current-scenario' : '';
    const proxyCount = scenario.proxies ? scenario.proxies.length : 0;
    html += `<li data-value="${scenario.id}" class="${cssClass}">
      <span class="scenario-name">${UtilsModule.escapeHtml(displayName)}</span>
      <span class="scenario-count">${proxyCount}</span>
    </li>`;
    if (isCurrent) {
      currentScenarioName = displayName;
    }
  });

  // Safety check if current scenario not found
  if (!currentScenarioName && scenarios.length > 0) {
    currentScenarioName = scenarios[0].name;
    currentScenarioId = scenarios[0].id;
  }

  $("#popup-scenario-options").html(html);
  $(".scenario-btn").attr("title", `${I18n.t("switch_scenario_tooltip")} (${currentScenarioName})`);
}

function updateScenarioVisibility() {
  $('.header-scenario-selector').show();
}

function switchScenario(id) {
  if (currentScenarioId === id) return;

  const scenario = scenarios.find(s => s.id === id);
  if (scenario) {
    chrome.storage.local.get(['config', 'state'], function (result) {
      if (chrome.runtime.lastError) {
        console.log('Error getting config:', chrome.runtime.lastError);
        return;
      }
      const config = result.config || { scenarios: { current: 'default', lists: [] } };
      const currentMode = result.state?.proxy?.mode || 'disabled';
      const newProxies = scenario.proxies || [];

      currentScenarioId = id;
      list = newProxies;
      const displayName = scenario.name || I18n.t("scenario_default");
      $(".scenario-btn").attr("title", `${I18n.t("switch_scenario_tooltip")} (${displayName})`);

      config.scenarios = config.scenarios || { current: 'default', lists: [] };
      config.scenarios.current = id;

      let stateUpdate = null;
      // Auto-select first proxy in manual mode
      if (currentMode === 'manual') {
        const firstEnabled = newProxies.find(p => p.enabled !== false && p.ip && p.port);
        if (firstEnabled) {
          stateUpdate = { proxy: { mode: 'manual', current: firstEnabled } };
        } else {
          stateUpdate = { proxy: { mode: 'manual', current: null } };
        }
      }

      chrome.storage.local.set({ config: config, state: stateUpdate }, function () {
        if (chrome.runtime.lastError) {
          console.log('Error switching scenario:', chrome.runtime.lastError);
          return;
        }
        if (currentMode === 'manual' && stateUpdate?.proxy?.current) {
          chrome.runtime.sendMessage({ action: "applyProxy", proxyInfo: stateUpdate.proxy.current }, function () {
            if (chrome.runtime.lastError) {
              console.log('Error applying proxy after scenario switch:', chrome.runtime.lastError);
            }
          });
        }
        list_init();
      });
    });
  }
}

// ==========================================
// UI Updates
// ==========================================
function updateModeUI(mode) {
  // Update button status
  $('.mode-btn').removeClass('active');
  $(`.mode-btn[data-mode="${mode}"]`).addClass('active');

  // Update list interaction status
  if (mode === 'manual') {
    $('.proxy-list-container').removeClass('list-disabled').removeClass('mode-auto');
  } else if (mode === 'auto') {
    // Auto mode: do not add list-disabled, but add mode-auto class for styling
    $('.proxy-list-container').removeClass('list-disabled').addClass('mode-auto');
  } else {
    $('.proxy-list-container').addClass('list-disabled').removeClass('mode-auto');
  }
}

function updateStatusDisplay(mode, currentProxy) {
  const $statusValue = $('#status-display');

  if (mode === 'disabled') {
    $statusValue.text(I18n.t('status_disabled')).attr('data-i18n', 'status_disabled');
    $statusValue.css('color', 'var(--danger-color)'); // Red for disabled mode
  } else if (mode === 'auto') {
    // Auto mode - show current proxy name
    if (currentProxy && (currentProxy.name || currentProxy.ip)) {
      const displayName = currentProxy.name || I18n.t('unnamed_proxy');
      $statusValue.text(displayName).removeAttr('data-i18n');
      $statusValue.css('color', 'var(--text-primary)'); // Use CSS variable for theme support
    } else {
      $statusValue.text(I18n.t('mode_auto_text')).attr('data-i18n', 'mode_auto_text');
      $statusValue.css('color', 'var(--text-primary)'); // Use CSS variable for theme support
    }
    $statusValue.removeAttr('title');
  } else {
    // Manual mode
    if (currentProxy && (currentProxy.name || currentProxy.ip)) {
      const displayName = currentProxy.name || I18n.t('unnamed_proxy');
      $statusValue.text(displayName).removeAttr('data-i18n');
      $statusValue.css('color', 'var(--text-primary)'); // Use CSS variable for theme support
    } else {
      $statusValue.text(I18n.t('status_disconnected')).attr('data-i18n', 'status_disconnected');
      $statusValue.css('color', 'var(--text-primary)'); // Use CSS variable for theme support
    }
  }
}

// Update current site display area (unified for manual/auto mode)
function updateCurrentSiteDisplay() {
  const $siteBar = $('#current-site-bar');
  const $siteUrl = $('#current-site-url');
  const $bypassBtn = $('#add-bypass-btn');

  chrome.storage.local.get(['state'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting state:', chrome.runtime.lastError);
      return;
    }
    const mode = result.state?.proxy?.mode || 'disabled';

    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (chrome.runtime.lastError) {
        console.log('Error querying tabs:', chrome.runtime.lastError);
        $siteBar.hide();
        return;
      }
      const tabUrl = tabs[0] && (tabs[0].pendingUrl || tabs[0].url);

      if (!tabUrl) {
        $siteBar.hide();
        return;
      }

      try {
        const url = new URL(tabUrl);
        // Exclude browser internal pages
        if (url.protocol === 'chrome:' || url.protocol === 'about:' ||
          url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:' ||
          url.protocol === 'edge:') {
          $siteBar.hide();
          return;
        }

        const hostname = url.hostname;
        const fullUrl = url.hostname + (url.port ? ':' + url.port : '');

        if (!hostname) {
          $siteBar.hide();
          return;
        }

        // Show current site in manual and auto mode
        if (mode === 'manual' || mode === 'auto') {
          // Set displayed URL (hostname only), limit length
          const displayUrl = fullUrl.length > 23 ? fullUrl.substring(0, 23) + '...' : fullUrl;
          $siteUrl.text(displayUrl).attr('title', fullUrl); // Set full URL as tooltip

          // Show bypass button in manual mode, hide in auto mode
          if (mode === 'manual') {
            updateBypassButton();
          } else {
            $bypassBtn.hide();
          }

          $siteBar.show();
        } else {
          $siteBar.hide();
        }
      } catch (e) {
        $siteBar.hide();
      }
    });
  });
}

// Update current site display area (unified for manual/auto mode)
function updateRefreshIndicator() {
  // Add visual indicator that status is being refreshed
  // Apply animation to outer container instead of text to avoid color flashing
  const $currentStatus = $('.current-status');
  $currentStatus.addClass('status-refreshing');
  setTimeout(function () {
    $currentStatus.removeClass('status-refreshing');
  }, 500);
}

// ==========================================
// Proxy List Logic
// ==========================================
function list_init() {
  chrome.storage.local.get(['state'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      return;
    }
    const currentProxy = result.state?.proxy?.current;
    const mode = result.state?.proxy?.mode || 'disabled';

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (chrome.runtime.lastError) {
        console.log('Error querying tabs:', chrome.runtime.lastError);
        tabs = [];
      }
      let autoMatchProxy = null;
      if (mode === 'auto' && tabs && tabs[0] && tabs[0].url) {
        try {
          const hostname = new URL(tabs[0].url).hostname;
          autoMatchProxy = getAutoProxy(list, hostname);
        } catch (e) {
          console.log("Error parsing URL for auto match", e);
        }
      }

      let len = 0;
      let html = "";
      let selectedProxy = null; // Track the selected proxy for status sync

      for (let i = 0; i < list.length; i++) {
        const info = list[i];

        // Skip disabled proxies
        if (info.enabled === false) continue;

        if (info.ip != "" && info.port != "") {
          // Determine selection status
          let isSelected = false;
          if (mode === 'manual' && currentProxy) {
            // Manual mode: match by IP and Port
            isSelected = (info.ip === currentProxy.ip && info.port === currentProxy.port);
            if (isSelected) {
              selectedProxy = info; // Store selected proxy for status sync
            }
          } else if (mode === 'auto' && autoMatchProxy) {
            // Auto mode: match the calculated proxy object
            isSelected = (info === autoMatchProxy);
          }

          const selectedClass = isSelected ? "selected" : "";
          const protocolClass = (info.protocol || "HTTP").toLowerCase();
          const displayProtocol = (info.protocol || "HTTP").toUpperCase();
          const hasAuth = info.username || info.password;

          html += `<div class="proxy-item-card ${selectedClass}" data-index="${i}">
              <div style="flex: 1; overflow: hidden; pointer-events: none;">
                <div class="proxy-name">${UtilsModule.escapeHtml(info.name || I18n.t('unnamed_proxy'))}</div>
                <div class="proxy-details">
                  <span class="proxy-badge ${protocolClass}">${displayProtocol}</span>
                  <span class="proxy-ip">${UtilsModule.escapeHtml(info.ip)}:${UtilsModule.escapeHtml(info.port)}</span>
                  ${hasAuth ? `<span class="auth-badge" title="${I18n.t('authentication')}" data-i18n-title="authentication"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <span data-i18n="authentication">${I18n.t('authentication')}</span></span>` : ""}
                </div>
              </div>
              <div class="radio-indicator"></div>
            </div>`;
          len++;
        }
      }
      $(".proxy-list").html(html);

      if (len == 0) {
        $(".init-box").show();
        $(".settings-box").hide();
      } else {
        $(".init-box").hide();
        $(".settings-box").show();

        // Bind click events
        bindListEvents();

        // Sync status display with selected proxy
        if (mode === 'manual' && selectedProxy) {
          updateStatusDisplay('manual', selectedProxy);
        } else if (mode === 'auto' && autoMatchProxy) {
          // Auto mode - show matched proxy in status
          updateStatusDisplay('auto', autoMatchProxy);
        } else if (mode === 'auto' && !autoMatchProxy) {
          // Auto mode - no proxy matched, show "Auto Mode"
          updateStatusDisplay('auto', null);
        }
      }
    });
  });
}

function bindListEvents() {
  // Remove previous events using namespace to prevent duplicate binding
  $(".proxy-list").off("click.proxySelect");

  $(".proxy-list").on("click.proxySelect", ".proxy-item-card", function (e) {
    // Allow click switch only in manual mode (disabled mode has list-disabled, auto mode has mode-auto)
    if ($('.proxy-list-container').hasClass('list-disabled') || $('.proxy-list-container').hasClass('mode-auto')) {
      console.log("Manual mode not active, ignoring click");
      return;
    }

    const $this = $(this);
    const i = $this.data("index");
    const info = list[i];

    if (!info) return;

    // Update UI immediately for responsiveness
    $(".proxy-item-card").removeClass("selected");
    $this.addClass("selected");

    const proxyName = info.name || "Proxy";
    $('#status-display').text(proxyName);

    // Save current proxy selection
    chrome.storage.local.set({ state: { proxy: { mode: 'manual', current: info } } }, function () {
      if (chrome.runtime.lastError) {
        console.log('Error saving state:', chrome.runtime.lastError);
        return;
      }
      // Update bypass button status
      updateBypassButton();
    });

    // Log bypass URLs (不使用代理的地址) for manual mode
    let bypassOutput = '';
    const proxyBypassUrls = info.bypass_rules || '';

    if (proxyBypassUrls) {
      bypassOutput += proxyBypassUrls;
    }

    // Also include subscription bypass rules
    if (info.subscription && info.subscription.enabled !== false && info.subscription.current) {
      const format = info.subscription.current;
      const subConfig = info.subscription.lists ? info.subscription.lists[format] : null;

      if (subConfig && subConfig.bypass_rules) {
        const subBypass = subConfig.bypass_rules.trim();
        if (subBypass) {
          if (bypassOutput) {
            bypassOutput += '\n--- 订阅规则 ---\n';
          }
          bypassOutput += subBypass;
        }
      }
    }

    console.log('不使用代理的地址 (手动模式):', bypassOutput || '(无)');

    // Execute persistence and background communication
    chrome.runtime.sendMessage(
      { action: "applyProxy", proxyInfo: info },
      function (response) {
        if (chrome.runtime.lastError) {
          console.log('Error sending applyProxy message:', chrome.runtime.lastError);
          list_init();
          return;
        }
        // Refresh only on success, or revert UI if not successful
        if (!response || !response.success) {
          list_init();
        }
      }
    );
  });
}

// ==========================================
// Proxy Status Logic
// ==========================================
// Refresh proxy status from browser and storage
function refreshProxyStatus() {
  chrome.storage.local.get(['state'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      return;
    }
    const mode = result.state?.proxy?.mode || 'disabled';
    const currentProxy = result.state?.proxy?.current;

    // Get browser proxy settings
    if (typeof chrome !== 'undefined' && chrome.proxy && chrome.proxy.settings) {
      chrome.proxy.settings.get({ incognito: false }, function (browserConfig) {
        if (chrome.runtime.lastError) {
          console.log('Error getting proxy settings:', chrome.runtime.lastError);
          updateStatusDisplay(mode, currentProxy);
          updateRefreshIndicator();
          return;
        }
        let browserMode = 'system';
        let proxyServer = '';

        if (browserConfig && browserConfig.value) {
          browserMode = browserConfig.value.mode || 'system';

          // Extract proxy server info
          if (browserConfig.value.rules) {
            const rules = browserConfig.value.rules;
            if (rules.singleProxy) {
              proxyServer = rules.singleProxy.host + ':' + rules.singleProxy.port;
            } else if (rules.proxyForHttp) {
              proxyServer = rules.proxyForHttp.host + ':' + rules.proxyForHttp.port;
            }
          } else if (browserConfig.value.pacScript) {
            proxyServer = 'PAC Script';
          }
        }

        // Update status display based on comparison
        updateStatusDisplay(mode, currentProxy);
        updateRefreshIndicator();
      });
    } else {
      // Fallback for Firefox
      updateStatusDisplay(mode, currentProxy);
      updateRefreshIndicator();
    }
  });
}

function getAutoProxy(proxyList, hostname) {
  if (!proxyList || !hostname) return null;

  // Check include_rules in proxy list order, return first match
  for (const proxy of proxyList) {
    if (proxy.enabled === false) continue;
    if (!proxy.ip || !proxy.port) continue;

    // Only check include_rules, match in order
    if (checkMatch(proxy.include_rules, hostname)) {
      return proxy; // Return first matched proxy
    }
  }

  return null; // No match, Fallback to DIRECT
}

function checkMatch(patternsStr, hostname) {
  if (!patternsStr) return false;
  const patterns = patternsStr.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

  function isIpPattern(pattern) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    return ipv4Pattern.test(pattern);
  }

  function isInCidrRange(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

  function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  for (const pattern of patterns) {
    // Support regex pattern: /pattern/flags
    if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
      const regexContent = pattern.slice(1, -1);
      const regexFlags = pattern.split('/').pop();
      const flags = regexFlags && !regexFlags.includes('/') ? regexFlags : '';
      try {
        if (new RegExp(regexContent, flags).test(hostname)) return true;
      } catch (e) { }
    } else if (pattern.includes('*')) {
      // Regex match for wildcards
      try {
        const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
        if (new RegExp(regexStr).test(hostname)) return true;
      } catch (e) { }
    } else if (isIpPattern(pattern)) {
      // IP address or CIDR range
      if (pattern.includes('/')) {
        // CIDR format: 192.168.1.0/24
        if (isInCidrRange(hostname, pattern)) return true;
      } else {
        // Single IP address
        if (hostname === pattern) return true;
      }
    } else {
      // Handle leading dot if present (e.g. .google.com -> google.com)
      let normalizedPattern = pattern;
      if (normalizedPattern.startsWith('.')) {
        normalizedPattern = normalizedPattern.substring(1);
      }

      // Exact match or subdomain match
      // Matches "google.com" or "www.google.com" if pattern is "google.com" or ".google.com"
      if (hostname === normalizedPattern || hostname.endsWith('.' + normalizedPattern)) return true;
    }
  }
  return false;
}

// ==========================================
// Bypass Functionality
// ==========================================
function initBypassButton() {
  $('#add-bypass-btn').off('click').on('click', function () {
    const $btn = $(this);

    // Check current state - if button shows "use_proxy", it's currently bypassed and can be removed
    const isCurrentlyBypassed = $btn.text() === I18n.t('use_proxy');

    // Visual feedback: disable button and show loading state
    $btn.prop('disabled', true).addClass('btn-processing');

    // Get hostname from current URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (chrome.runtime.lastError) {
        console.log('Error querying tabs:', chrome.runtime.lastError);
        $btn.prop('disabled', false).removeClass('btn-processing');
        return;
      }
      const tabUrl = tabs[0] && (tabs[0].pendingUrl || tabs[0].url);
      if (!tabUrl) {
        $btn.prop('disabled', false).removeClass('btn-processing');
        return;
      }

      try {
        const url = new URL(tabUrl);
        const hostname = url.hostname;
        if (!hostname) {
          $btn.prop('disabled', false).removeClass('btn-processing');
          return;
        }

        if (isCurrentlyBypassed) {
          // Remove from bypass list
          handleRemoveFromBypass(hostname, $btn);
        } else {
          // Add to bypass list
          handleAddToBypass(hostname, $btn);
        }
      } catch (e) {
        $btn.prop('disabled', false).removeClass('btn-processing');
      }
    });
  });
}

function updateBypassButton() {
  const $bypassBtn = $('#add-bypass-btn');

  chrome.storage.local.get(['state'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      $bypassBtn.hide();
      return;
    }
    const mode = result.state?.proxy?.mode || 'disabled';

    // Only process in manual mode
    if (mode !== 'manual') {
      $bypassBtn.hide();
      return;
    }

    // Get current tab hostname
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (chrome.runtime.lastError) {
        console.log('Error querying tabs:', chrome.runtime.lastError);
        $bypassBtn.hide();
        return;
      }
      const tabUrl = tabs[0] && (tabs[0].pendingUrl || tabs[0].url);

      if (!tabUrl) {
        $bypassBtn.hide();
        return;
      }

      try {
        const url = new URL(tabUrl);
        const hostname = url.hostname;

        if (!hostname) {
          $bypassBtn.hide();
          return;
        }

        const currentProxy = result.state?.proxy?.current;
        if (!currentProxy) {
          $bypassBtn.hide();
          return;
        }

        // Check subscription bypass rules
        const subscription = currentProxy.subscription || {};
        const format = subscription.current || 'autoproxy';
        const subConfig = subscription.lists ? subscription.lists[format] : null;
        const subBypassRules = subConfig ? subConfig.bypass_rules || '' : '';

        // Check if already in bypass list (using exact match for toggle)
        const bypassUrls = currentProxy.bypass_rules || '';
        const isExactBypassed = isExactMatchBypassed(bypassUrls, hostname);

        // Check subscription rule match (using fuzzy match logic)
        let isSubBypassed = false;
        if (subBypassRules) {
          isSubBypassed = checkIfBypassed(subBypassRules, hostname);
        }

        // Check custom fuzzy match (non-exact, non-subscription)
        let isCustomFypassed = false;
        if (bypassUrls && !isExactBypassed) {
          isCustomFypassed = checkIfBypassed(bypassUrls, hostname) && !isSubBypassed;
        }

        // Update button state based on match result
        if (isExactBypassed) {
          // Exact match: clickable to remove bypass - show "use proxy" text
          $bypassBtn
            .text(I18n.t('use_proxy'))
            .attr('data-i18n', 'use_proxy')
            .removeClass('btn-bypass-proxy btn-use-proxy btn-disabled')
            .addClass('btn-use-proxy')
            .prop('disabled', false)
            .prop('title', '');
        } else if (isSubBypassed) {
          // Subscription rule match: not clickable, show "bypass" text with tooltip
          $bypassBtn
            .text(I18n.t('use_proxy'))
            .attr('data-i18n', 'use_proxy')
            .removeClass('btn-bypass-proxy btn-use-proxy btn-disabled')
            .addClass('btn-use-proxy btn-disabled')
            .prop('disabled', true)
            .prop('title', I18n.t('subscription_match_tooltip') || '命中订阅规则，无法变更');
        } else if (isCustomFypassed) {
          // Custom fuzzy match: not clickable, show "bypass" text with tooltip
          $bypassBtn
            .text(I18n.t('use_proxy'))
            .attr('data-i18n', 'use_proxy')
            .removeClass('btn-bypass-proxy btn-use-proxy btn-disabled')
            .addClass('btn-use-proxy btn-disabled')
            .prop('disabled', true)
            .prop('title', I18n.t('fuzzy_match_tooltip') || '命中模糊匹配，无法变更');
        } else {
          // No match: clickable to add bypass - show "bypass" text
          $bypassBtn
            .text(I18n.t('bypass_proxy'))
            .attr('data-i18n', 'bypass_proxy')
            .removeClass('btn-bypass-proxy btn-use-proxy btn-disabled')
            .addClass('btn-bypass-proxy')
            .prop('disabled', false)
            .prop('title', '');
        }

        $bypassBtn.show();
      } catch (e) {
        $bypassBtn.hide();
      }
    });
  });
}

// Check if hostname has exact match in bypass list (no subdomain matching)
function isExactMatchBypassed(bypassUrls, hostname) {
  if (!bypassUrls) return false;
  const patterns = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
  // Only exact match for toggle functionality
  return patterns.includes(hostname);
}

// Check if hostname is already in bypass list (with subdomain match)
function checkIfBypassed(bypassUrls, hostname) {
  if (!bypassUrls) return false;
  const patterns = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

  function isIpPattern(pattern) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    return ipv4Pattern.test(pattern);
  }

  function isInCidrRange(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    return (ipNum & mask) === (rangeNum & mask);
  }

  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
      if (new RegExp(`^${regexStr}$`).test(hostname)) {
        return true;
      }
    } else if (isIpPattern(pattern)) {
      if (pattern.includes('/')) {
        if (isInCidrRange(hostname, pattern)) return true;
      } else {
        if (hostname === pattern) return true;
      }
    } else if (pattern === hostname || hostname.endsWith('.' + pattern)) {
      return true;
    }
  }
  return false;
}

function handleAddToBypass(hostname, $btn) {
  chrome.storage.local.get(['state', 'config'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }
    const mode = result.state?.proxy?.mode || 'disabled';
    let proxy = result.state?.proxy?.current;
    const config = result.config || {};
    const configScenarios = config.scenarios?.lists || [];
    const configCurrentScenarioId = config.scenarios?.current || 'default';
    const configCurrentScenario = configScenarios.find(s => s.id === configCurrentScenarioId);
    const proxyList = configCurrentScenario?.proxies || [];

    if (mode === 'auto') {
      const autoMatchProxy = getAutoProxy(proxyList, hostname);
      if (autoMatchProxy) {
        proxy = autoMatchProxy;
      } else {
        $btn.prop('disabled', false).removeClass('btn-processing');
        return;
      }
    } else if (mode !== 'manual' || !proxy) {
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }

    if (!proxy) {
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }

    // Add hostname to bypass_rules
    let bypassUrls = proxy.bypass_rules || '';
    if (bypassUrls) {
      bypassUrls += '\n' + hostname;
    } else {
      bypassUrls = hostname;
    }
    proxy.bypass_rules = bypassUrls;

    // Update corresponding proxy in list
    const proxyIndex = proxyList.findIndex(p => p.ip === proxy.ip && p.port === proxy.port);
    if (proxyIndex !== -1) {
      proxyList[proxyIndex].bypass_rules = bypassUrls;
    }

    // Update scenarios with modified list
    const currentScenario = configScenarios.find(s => s.id === configCurrentScenarioId);
    if (currentScenario) {
      currentScenario.proxies = proxyList;
    }

    // Save to local storage
    chrome.storage.local.set({ state: { proxy: { mode: mode, current: proxy } } }, function () {
      if (chrome.runtime.lastError) {
        console.log('Error saving settings:', chrome.runtime.lastError);
        $btn.prop('disabled', false).removeClass('btn-processing');
        return;
      }
      chrome.runtime.sendMessage({ action: "refreshProxy" }, function () {
        if (chrome.runtime.lastError) {
          console.log('Error sending refreshProxy:', chrome.runtime.lastError);
        }
      });

      // Update button status immediately
      updateBypassButton();
      updateCurrentSiteDisplay();

      // Update button status - show as bypassed (use proxy)
      $btn.text(I18n.t('use_proxy'))
        .removeClass('btn-processing btn-bypass-proxy')
        .addClass('btn-use-proxy')
        .prop('disabled', false);
    });
  });
}

function handleRemoveFromBypass(hostname, $btn) {
  chrome.storage.local.get(['state', 'config'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }
    const mode = result.state?.proxy?.mode || 'disabled';
    let proxy = result.state?.proxy?.current;
    const config = result.config || {};
    const configScenarios = config.scenarios?.lists || [];
    const configCurrentScenarioId = config.scenarios?.current || 'default';
    const configCurrentScenario = configScenarios.find(s => s.id === configCurrentScenarioId);
    const proxyList = configCurrentScenario?.proxies || [];

    if (mode === 'auto') {
      const autoMatchProxy = getAutoProxy(proxyList, hostname);
      if (autoMatchProxy) {
        proxy = autoMatchProxy;
      } else {
        $btn.prop('disabled', false).removeClass('btn-processing');
        return;
      }
    } else if (mode !== 'manual' || !proxy) {
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }

    if (!proxy || !proxy.bypass_rules) {
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }

    const bypassUrls = proxy.bypass_rules;
    const patterns = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

    function isIpPattern(pattern) {
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      return ipv4Pattern.test(pattern);
    }

    function isInCidrRange(ip, cidr) {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
      const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
      return (ipNum & mask) === (rangeNum & mask);
    }

    const filteredPatterns = patterns.filter(pattern => {
      if (pattern === hostname) return false;
      if (isIpPattern(pattern) && pattern.includes('/')) {
        if (isInCidrRange(hostname, pattern)) return false;
      }
      return true;
    });

    proxy.bypass_rules = filteredPatterns.join('\n');

    // Update corresponding proxy in list
    const proxyIndex = proxyList.findIndex(p => p.ip === proxy.ip && p.port === proxy.port);
    if (proxyIndex !== -1) {
      proxyList[proxyIndex].bypass_rules = proxy.bypass_rules;
    }

    // Update scenarios with modified list
    const currentScenario = configScenarios.find(s => s.id === configCurrentScenarioId);
    if (currentScenario) {
      currentScenario.proxies = proxyList;
    }

    // Save to local storage
    chrome.storage.local.set({ state: { proxy: { mode: mode, current: proxy } } }, function () {
      if (chrome.runtime.lastError) {
        console.log('Error saving settings:', chrome.runtime.lastError);
        $btn.prop('disabled', false).removeClass('btn-processing');
        return;
      }
      chrome.runtime.sendMessage({ action: "refreshProxy" }, function () {
        if (chrome.runtime.lastError) {
          console.log('Error sending refreshProxy:', chrome.runtime.lastError);
        }
      });

      // Update button status immediately
      updateBypassButton();
      updateCurrentSiteDisplay();

      // Update button status - show as not bypassed (bypass site)
      $btn.text(I18n.t('bypass_proxy'))
        .removeClass('btn-processing btn-use-proxy')
        .addClass('btn-bypass-proxy')
        .prop('disabled', false);
    });
  });
}
