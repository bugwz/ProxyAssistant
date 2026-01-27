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

  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list', 'scenarios', 'currentScenarioId'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error loading settings:', chrome.runtime.lastError);
      return;
    }

    // If no stored mode, default to 'disabled'
    let mode = result.proxyMode;
    if (!mode) {
      mode = 'disabled';
      // Save default status
      chrome.storage.local.set({ proxyMode: 'disabled' }, function () {
        if (chrome.runtime.lastError) {
          console.log('Error saving default proxyMode:', chrome.runtime.lastError);
        }
      });
    }

    // If stored mode is invalid, default to disabled
    if (!['disabled', 'manual', 'auto'].includes(mode)) {
      mode = 'disabled';
    }

    // Load scenarios and list
    scenarios = result.scenarios || [];
    currentScenarioId = result.currentScenarioId || 'default';
    list = result.list || [];

    // If scenarios empty but list exists (migration case not handled by main page yet), use default
    // Note: main.js handles migration on load, popup assumes valid state or graceful fallback
    if (scenarios.length === 0 && list.length > 0) {
      scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: list }];
      currentScenarioId = 'default';
    } else if (scenarios.length === 0) {
      scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: [] }];
      currentScenarioId = 'default';
    }

    const currentProxy = result.currentProxy;

    updateModeUI(mode);
    updateStatusDisplay(mode, currentProxy);

    // For manual mode, restore previous selection if available
    if (mode === 'manual') {
      if (currentProxy) {
        updateStatusDisplay('manual', currentProxy);
      } else {
        updateStatusDisplay('manual', null);
      }
    }

    // Render Scenario Selector
    renderScenarioSelector();
    updateScenarioVisibility();

    // Initial list render
    list_init();
    // Initialize bypass button
    initBypassButton();
    updateBypassButton();
    // Update current site display
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

    chrome.storage.local.set({ proxyMode: mode }, function () {
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
        // Manual mode - restore previous selection or show disconnected
        chrome.storage.local.get(['currentProxy'], function (result) {
          if (chrome.runtime.lastError) {
            console.log('Error getting currentProxy:', chrome.runtime.lastError);
            return;
          }
          const currentProxy = result.currentProxy;
          if (currentProxy) {
            updateStatusDisplay('manual', currentProxy);
          } else {
            updateStatusDisplay('manual', null);
          }
          list_init();
          updateBypassButton();
          updateCurrentSiteDisplay(); updateScenarioVisibility();
          // Apply the current proxy settings
          chrome.runtime.sendMessage({ action: "refreshProxy" }, function () {
            if (chrome.runtime.lastError) {
              console.log('Error sending refreshProxy:', chrome.runtime.lastError);
            }
          });
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
  if (namespace === 'local') {
    if (changes.proxyMode || changes.currentProxy) {
      // Update status display when storage changes
      refreshProxyStatus();
    }
    if (changes.list) {
      // Reload list if it changes (e.g. sync or scenario switch from main page)
      list = changes.list.newValue || [];
      list_init();
    }
    if (changes.scenarios || changes.currentScenarioId) {
      // Refresh scenario selector if scenarios change
      chrome.storage.local.get(['scenarios', 'currentScenarioId'], function (res) {
        if (chrome.runtime.lastError) {
          console.log('Error getting scenarios:', chrome.runtime.lastError);
          return;
        }
        scenarios = res.scenarios || scenarios;
        currentScenarioId = res.currentScenarioId || currentScenarioId;
        renderScenarioSelector();
      });
    }
  }
});

// ==========================================
// Theme Logic
// ==========================================
function initThemeMode() {
  // Always load from local storage (consistent with proxy config)
  chrome.storage.local.get({ themeSettings: {} }, function (items) {
    if (chrome.runtime.lastError) {
      console.log('Error getting themeSettings:', chrome.runtime.lastError);
      return;
    }
    const settings = items.themeSettings || {};
    themeMode = settings.mode || 'light';

    // Apply theme based on mode
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
    chrome.storage.local.get(['proxyMode'], function (result) {
      if (chrome.runtime.lastError) {
        console.log('Error getting proxyMode:', chrome.runtime.lastError);
        return;
      }
      const mode = result.proxyMode || 'disabled';

      currentScenarioId = id;
      list = scenario.proxies || [];
      const displayName = scenario.name || I18n.t("scenario_default");
      $(".scenario-btn").attr("title", `${I18n.t("switch_scenario_tooltip")} (${displayName})`);

      if (mode === 'manual') {
        chrome.storage.local.set({
          currentScenarioId: currentScenarioId,
          list: list,
          currentProxy: null
        }, function () {
          if (chrome.runtime.lastError) {
            console.log('Error switching scenario:', chrome.runtime.lastError);
            return;
          }
          list_init();
          updateStatusDisplay('manual', null);
          chrome.runtime.sendMessage({ action: "turnOffProxy" }, function () {
            if (chrome.runtime.lastError) {
              console.log('Error sending turnOffProxy:', chrome.runtime.lastError);
            }
          });
        });
      } else if (mode === 'auto') {
        chrome.storage.local.set({
          currentScenarioId: currentScenarioId,
          list: list
        }, function () {
          if (chrome.runtime.lastError) {
            console.log('Error switching scenario:', chrome.runtime.lastError);
            return;
          }
          list_init();
          chrome.runtime.sendMessage({ action: "refreshProxy" }, function () {
            if (chrome.runtime.lastError) {
              console.log('Error sending refreshProxy:', chrome.runtime.lastError);
            }
          });
          updateCurrentSiteDisplay();
        });
      } else {
        chrome.storage.local.set({
          currentScenarioId: currentScenarioId,
          list: list
        }, function () {
          if (chrome.runtime.lastError) {
            console.log('Error switching scenario:', chrome.runtime.lastError);
            return;
          }
          list_init();
        });
      }
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

  chrome.storage.local.get(['proxyMode', 'list'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting proxyMode/list:', chrome.runtime.lastError);
      return;
    }
    const mode = result.proxyMode || 'disabled';

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
  chrome.storage.local.get(['currentProxy', 'proxyMode'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      return;
    }
    const currentProxy = result.currentProxy;
    const mode = result.proxyMode || 'disabled';

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
        if (info.enabled === false || info.disabled === true) continue;

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
    chrome.storage.local.set({ currentProxy: info }, function () {
      if (chrome.runtime.lastError) {
        console.log('Error saving currentProxy:', chrome.runtime.lastError);
        return;
      }
      // Update bypass button status
      updateBypassButton();
    });

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
  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      return;
    }
    const mode = result.proxyMode || 'disabled';
    const list = result.list || [];

    // Get browser proxy settings
    if (typeof chrome !== 'undefined' && chrome.proxy && chrome.proxy.settings) {
      chrome.proxy.settings.get({ incognito: false }, function (browserConfig) {
        if (chrome.runtime.lastError) {
          console.log('Error getting proxy settings:', chrome.runtime.lastError);
          updateStatusDisplay(mode, result.currentProxy);
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
        updateStatusDisplay(mode, result.currentProxy);
        updateRefreshIndicator();
      });
    } else {
      // Fallback for Firefox
      updateStatusDisplay(mode, result.currentProxy);
      updateRefreshIndicator();
    }
  });
}

function getAutoProxy(proxyList, hostname) {
  if (!proxyList || !hostname) return null;

  // Check include_urls in proxy list order, return first match
  for (const proxy of proxyList) {
    if (proxy.enabled === false || proxy.disabled === true) continue;
    if (!proxy.ip || !proxy.port) continue;

    // Only check include_urls, match in order
    if (checkMatch(proxy.include_urls, hostname)) {
      return proxy; // Return first matched proxy
    }
  }

  return null; // No match, Fallback to DIRECT
}

function checkMatch(patternsStr, hostname) {
  if (!patternsStr) return false;
  const patterns = patternsStr.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      // Regex match for wildcards
      try {
        const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
        if (new RegExp(regexStr).test(hostname)) return true;
      } catch (e) { }
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

  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      $bypassBtn.hide();
      return;
    }
    const mode = result.proxyMode || 'disabled';

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

        const currentProxy = result.currentProxy;
        if (!currentProxy) {
          $bypassBtn.hide();
          return;
        }

        // Check if already in bypass list (using exact match for toggle)
        const bypassUrls = currentProxy.bypass_urls || '';
        const isExactBypassed = isExactMatchBypassed(bypassUrls, hostname);

        if (isExactBypassed) {
          // Show as bypassed, clickable to remove - display "use proxy" text
          $bypassBtn
            .text(I18n.t('use_proxy'))
            .removeClass('btn-bypass-proxy btn-use-proxy')
            .addClass('btn-use-proxy');
        } else {
          $bypassBtn
            .text(I18n.t('bypass_proxy'))
            .removeClass('btn-bypass-proxy btn-use-proxy')
            .addClass('btn-bypass-proxy');
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
  for (const pattern of patterns) {
    // Exact match or subdomain match
    if (pattern === hostname || hostname.endsWith('.' + pattern)) {
      return true;
    }
    // Wildcard match
    if (pattern.includes('*')) {
      const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
      if (new RegExp(`^${regexStr}$`).test(hostname)) {
        return true;
      }
    }
  }
  return false;
}

function handleAddToBypass(hostname, $btn) {
  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }
    const mode = result.proxyMode || 'disabled';
    let proxy = result.currentProxy;
    const list = result.list || [];

    if (mode === 'auto') {
      const autoMatchProxy = getAutoProxy(list, hostname);
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

    // Add hostname to bypass_urls
    let bypassUrls = proxy.bypass_urls || '';
    if (bypassUrls) {
      bypassUrls += '\n' + hostname;
    } else {
      bypassUrls = hostname;
    }
    proxy.bypass_urls = bypassUrls;

    // Update corresponding proxy in list
    const proxyIndex = list.findIndex(p => p.ip === proxy.ip && p.port === proxy.port);
    if (proxyIndex !== -1) {
      list[proxyIndex].bypass_urls = bypassUrls;
    }

    // Update scenarios with modified list
    const currentScenario = scenarios.find(s => s.id === currentScenarioId);
    if (currentScenario) {
      currentScenario.proxies = list;
    }

    // Save to local storage
    chrome.storage.local.set({ currentProxy: proxy, scenarios: scenarios }, function () {
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

      // Update button status - show as bypassed (use proxy)
      $btn.text(I18n.t('use_proxy'))
        .removeClass('btn-processing btn-bypass-proxy')
        .addClass('btn-use-proxy')
        .prop('disabled', false);
    });
  });
}

function handleRemoveFromBypass(hostname, $btn) {
  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting settings:', chrome.runtime.lastError);
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }
    const mode = result.proxyMode || 'disabled';
    let proxy = result.currentProxy;
    const list = result.list || [];

    if (mode === 'auto') {
      const autoMatchProxy = getAutoProxy(list, hostname);
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

    if (!proxy || !proxy.bypass_urls) {
      $btn.prop('disabled', false).removeClass('btn-processing');
      return;
    }

    // Remove hostname from bypass_urls using exact match
    const bypassUrls = proxy.bypass_urls;
    const patterns = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

    // Filter out the exact hostname match
    const filteredPatterns = patterns.filter(pattern => pattern !== hostname);

    // Reconstruct bypass_urls string
    proxy.bypass_urls = filteredPatterns.join('\n');

    // Update corresponding proxy in list
    const proxyIndex = list.findIndex(p => p.ip === proxy.ip && p.port === proxy.port);
    if (proxyIndex !== -1) {
      list[proxyIndex].bypass_urls = proxy.bypass_urls;
    }

    // Update scenarios with modified list
    const currentScenario = scenarios.find(s => s.id === currentScenarioId);
    if (currentScenario) {
      currentScenario.proxies = list;
    }

    // Save to local storage
    chrome.storage.local.set({ currentProxy: proxy, scenarios: scenarios }, function () {
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

      // Update button status - show as not bypassed (bypass site)
      $btn.text(I18n.t('bypass_proxy'))
        .removeClass('btn-processing btn-use-proxy')
        .addClass('btn-bypass-proxy')
        .prop('disabled', false);
    });
  });
}
