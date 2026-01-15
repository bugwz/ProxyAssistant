// Theme mode variables
var themeMode = 'light';

// Refresh proxy status from browser and storage
function refreshProxyStatus() {
  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
    const mode = result.proxyMode || 'disabled';
    const list = result.list || [];

    // Get browser proxy settings
    if (typeof chrome !== 'undefined' && chrome.proxy && chrome.proxy.settings) {
      chrome.proxy.settings.get({ incognito: false }, function (browserConfig) {
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

// Update refresh indicator visibility
function updateRefreshIndicator() {
  // Add visual indicator that status is being refreshed
  // Apply animation to outer container instead of text to avoid color flashing
  const $currentStatus = $('.current-status');
  $currentStatus.addClass('status-refreshing');
  setTimeout(function () {
    $currentStatus.removeClass('status-refreshing');
  }, 500);
}

// Theme mode toggle event handlers
function initThemeMode() {
  // Always load from local storage (consistent with proxy config)
  chrome.storage.local.get({ themeSettings: {} }, function (items) {
    var settings = items.themeSettings || {};
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

// Settings button click event
$(".filter").on("click", function () {
  window.open("./main.html");
});

$(".add_btn").on("click", function () {
  window.open("./main.html");
});

// Check proxy status on page load
document.addEventListener('DOMContentLoaded', function () {
  I18n.init(function () {
    // Initialize theme mode first
    initThemeMode();
    // Initialize mode switcher
    initApp();
  });
});

function updateStatusDisplay(mode, currentProxy) {
  const $statusValue = $('#status-display');

  if (mode === 'disabled') {
    $statusValue.text(I18n.t('status_disabled')).attr('data-i18n', 'status_disabled');
    $statusValue.css('color', '#dc3545'); // Red for disabled mode
  } else if (mode === 'auto') {
    // Auto mode - show current proxy name
    if (currentProxy && (currentProxy.name || currentProxy.ip)) {
      const displayName = currentProxy.name || I18n.t('unnamed_proxy');
      $statusValue.text(displayName).removeAttr('data-i18n');
      $statusValue.css('color', '#1e293b');
    } else {
      $statusValue.text(I18n.t('mode_auto_text')).attr('data-i18n', 'mode_auto_text');
      $statusValue.css('color', '#1e293b');
    }
    $statusValue.removeAttr('title');
  } else {
    // Manual mode
    if (currentProxy && (currentProxy.name || currentProxy.ip)) {
      const displayName = currentProxy.name || I18n.t('unnamed_proxy');
      $statusValue.text(displayName).removeAttr('data-i18n');
      $statusValue.css('color', '#1e293b');
    } else {
      $statusValue.text(I18n.t('status_disconnected')).attr('data-i18n', 'status_disconnected');
      $statusValue.css('color', '#1e293b');
    }
  }
}

// Update current site display area (unified for manual/auto mode)
function updateCurrentSiteDisplay() {
  const $siteBar = $('#current-site-bar');
  const $siteUrl = $('#current-site-url');
  const $bypassBtn = $('#add-bypass-btn');

  chrome.storage.local.get(['proxyMode', 'list'], function (result) {
    const mode = result.proxyMode || 'disabled';

    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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

// Storage change listener for real-time updates
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === 'local') {
    if (changes.proxyMode || changes.currentProxy) {
      // Update status display when storage changes
      refreshProxyStatus();
    }
  }
});

function initApp() {
  chrome.storage.local.get(['proxyMode', 'currentProxy'], function (result) {
    // If no stored mode, default to 'disabled'
    let mode = result.proxyMode;
    if (!mode) {
      mode = 'disabled';
      // Save default status
      chrome.storage.local.set({ proxyMode: 'disabled' });
    }

    // If stored mode is invalid, default to disabled
    if (!['disabled', 'manual', 'auto'].includes(mode)) {
      mode = 'disabled';
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
  });

  // Mode switch button click event
  $('.mode-btn').on('click', function () {
    const mode = $(this).data('mode');
    updateModeUI(mode);

    chrome.storage.local.set({ proxyMode: mode }, function () {
      if (mode === 'auto') {
        // Auto mode
        chrome.runtime.sendMessage({ action: "refreshProxy" });
        updateStatusDisplay('auto');
        // Re-render list to apply auto-match highlighting
        list_init();
        updateBypassButton();
        updateCurrentSiteDisplay();
      } else if (mode === 'disabled') {
        // Disabled mode
        chrome.runtime.sendMessage({ action: "turnOffProxy" }, function () {
          list_init();
          updateStatusDisplay('disabled', null);
          updateBypassButton();
          updateCurrentSiteDisplay();
        });
      } else {
        // Manual mode - restore previous selection or show disconnected
        chrome.storage.local.get(['currentProxy'], function (result) {
          const currentProxy = result.currentProxy;
          if (currentProxy) {
            updateStatusDisplay('manual', currentProxy);
          } else {
            updateStatusDisplay('manual', null);
          }
          list_init();
          updateBypassButton();
          updateCurrentSiteDisplay();
          // Apply the current proxy settings
          chrome.runtime.sendMessage({ action: "refreshProxy" });
        });
      }
    });
  });

  function updateModeUI(mode) {
    // Update button status
    $('.mode-btn').removeClass('active');
    $(`.mode-btn[data-mode="${mode}"]`).addClass('active');

    // Update list interaction status
    if (mode === 'manual') {
      $('.set_box_user').removeClass('list-disabled').removeClass('mode-auto');
    } else {
      $('.set_box_user').addClass('list-disabled');
      if (mode === 'auto') {
        $('.set_box_user').addClass('mode-auto');
      } else {
        $('.set_box_user').removeClass('mode-auto');
      }
    }
  }

  // Get proxy list
  // Requirement 1: Always load from local storage regardless of sync setting
  chrome.storage.local.get({ list: [] }, function (items) {
    list = items.list || [];
    // Initial list render
    list_init();
    // Initialize bypass button
    initBypassButton();
    updateBypassButton();
    // Update current site display
    updateCurrentSiteDisplay();
  });
}

var list = [];

function list_init() {
  chrome.storage.local.get(['currentProxy', 'proxyMode'], function (result) {
    const currentProxy = result.currentProxy;
    const mode = result.proxyMode || 'disabled';

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let autoMatchProxy = null;
      if (mode === 'auto' && tabs && tabs[0] && tabs[0].url) {
        try {
          const hostname = new URL(tabs[0].url).hostname;
          autoMatchProxy = getAutoProxy(list, hostname);
        } catch (e) {
          console.error("Error parsing URL for auto match", e);
        }
      }

      var len = 0;
      var html = "";
      let selectedProxy = null; // Track the selected proxy for status sync

      for (var i = 0; i < list.length; i++) {
        var info = list[i];

        // Skip disabled proxies
        if (info.disabled === true) continue;

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

          html += `<div class="set_box_user_box ${selectedClass}" data-index="${i}">
              <div style="flex: 1; overflow: hidden; pointer-events: none;">
                <div class="name_txt">${info.name || I18n.t('unnamed_proxy')}</div>
                <div class="proxy-details">
                  <span class="proxy-badge ${protocolClass}">${displayProtocol}</span>
                  <span class="ip_txt">${info.ip}:${info.port}</span>
                  ${hasAuth ? `<span class="auth-badge" title="${I18n.t('authentication')}" data-i18n-title="authentication"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <span data-i18n="authentication">${I18n.t('authentication')}</span></span>` : ""}
                </div>
              </div>
              <div class="radio-indicator"></div>
            </div>`;
          len++;
        }
      }
      $(".set_box_user_list").html(html);

      if (len == 0) {
        $(".init_box").show();
        $(".set_box").hide();
      } else {
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

// Auto Match Logic Helpers
function getAutoProxy(proxyList, hostname) {
  if (!proxyList || !hostname) return null;

  // Check include_urls in proxy list order, return first match
  for (const proxy of proxyList) {
    if (proxy.disabled) continue;
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

// Update bypass button status
function updateBypassButton() {
  const $bypassBtn = $('#add-bypass-btn');

  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
    const mode = result.proxyMode || 'disabled';

    // Only process in manual mode
    if (mode !== 'manual') {
      $bypassBtn.hide();
      return;
    }

    // Get current tab hostname
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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

// Check if hostname has exact match in bypass list (no subdomain matching)
function isExactMatchBypassed(bypassUrls, hostname) {
  if (!bypassUrls) return false;
  const patterns = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
  // Only exact match for toggle functionality
  return patterns.includes(hostname);
}

// Initialize bypass button click event
function initBypassButton() {
  $('#add-bypass-btn').off('click').on('click', function () {
    const $btn = $(this);

    // Check current state - if button shows "use_proxy", it's currently bypassed and can be removed
    const isCurrentlyBypassed = $btn.text() === I18n.t('use_proxy');

    // Visual feedback: disable button and show loading state
    $btn.prop('disabled', true).addClass('btn-processing');

    // Get hostname from current URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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

// Handle adding to bypass list
function handleAddToBypass(hostname, $btn) {
  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list', 'auto_sync'], function (result) {
    const mode = result.proxyMode || 'disabled';
    let proxy = result.currentProxy;
    const list = result.list || [];
    const autoSync = result.auto_sync !== false;

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

    // Save to local storage
    chrome.storage.local.set({ currentProxy: proxy, list: list }, function () {
      if (autoSync) {
        chrome.storage.sync.set({ list: list }, function () {
          if (chrome.runtime.lastError) {
            console.warn("Sync failed:", chrome.runtime.lastError);
          }
        });
      }

      chrome.runtime.sendMessage({ action: "refreshProxy" });

      // Update button status - show as bypassed (use proxy)
      $btn.text(I18n.t('use_proxy'))
        .removeClass('btn-processing btn-bypass-proxy')
        .addClass('btn-use-proxy')
        .prop('disabled', false);
    });
  });
}

// Handle removing from bypass list
function handleRemoveFromBypass(hostname, $btn) {
  chrome.storage.local.get(['proxyMode', 'currentProxy', 'list', 'auto_sync'], function (result) {
    const mode = result.proxyMode || 'disabled';
    let proxy = result.currentProxy;
    const list = result.list || [];
    const autoSync = result.auto_sync !== false;

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

    // Save to local storage
    chrome.storage.local.set({ currentProxy: proxy, list: list }, function () {
      if (autoSync) {
        chrome.storage.sync.set({ list: list }, function () {
          if (chrome.runtime.lastError) {
            console.warn("Sync failed:", chrome.runtime.lastError);
          }
        });
      }

      chrome.runtime.sendMessage({ action: "refreshProxy" });

      // Update button status - show as not bypassed (bypass site)
      $btn.text(I18n.t('bypass_proxy'))
        .removeClass('btn-processing btn-use-proxy')
        .addClass('btn-bypass-proxy')
        .prop('disabled', false);
    });
  });
}

function bindListEvents() {
  // Remove previous events using namespace to prevent duplicate binding
  $(".set_box_user_list").off("click.proxySelect");

  $(".set_box_user_list").on("click.proxySelect", ".set_box_user_box", function (e) {
    // Allow click switch only in manual mode
    if ($('.set_box_user').hasClass('list-disabled')) {
      console.log("Manual mode not active, ignoring click");
      return;
    }

    const $this = $(this);
    const i = $this.data("index");
    const info = list[i];

    if (!info) return;

    // Update UI immediately for responsiveness
    $(".set_box_user_box").removeClass("selected");
    $this.addClass("selected");

    const proxyName = info.name || "Proxy";
    $('#status-display').text(proxyName);

    // Save current proxy selection
    chrome.storage.local.set({ currentProxy: info }, function () {
      // Update bypass button status
      updateBypassButton();
    });

    // Execute persistence and background communication
    chrome.runtime.sendMessage(
      { action: "applyProxy", proxyInfo: info },
      function (response) {
        // Refresh only on success, or revert UI if not successful
        if (!response || !response.success) {
          list_init();
        }
      }
    );
  });
}
