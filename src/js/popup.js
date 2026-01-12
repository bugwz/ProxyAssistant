// Theme mode variables
var themeMode = 'light';
var auto_sync = true;

// Theme mode toggle event handlers
function initThemeMode() {
  // Check auto_sync setting first
  chrome.storage.local.get({ auto_sync: true }, function (settings) {
    auto_sync = settings.auto_sync;
    var storage = auto_sync ? chrome.storage.sync : chrome.storage.local;
    storage.get({ themeSettings: {} }, function (items) {
      var settings = items.themeSettings || {};
      themeMode = settings.mode || 'light';

      // Apply theme based on mode
      applyTheme(themeMode);
    });
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

    // For manual mode, always show disconnected state by default
    // User must manually select a proxy to use
    if (mode === 'manual') {
      updateStatusDisplay('manual', null);
      chrome.storage.local.set({ currentProxy: null });
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
      } else if (mode === 'disabled') {
        // Disabled mode
        chrome.runtime.sendMessage({ action: "turnOffProxy" }, function () {
          list_init();
          updateStatusDisplay('disabled', null);
        });
      } else {
        // Manual mode - always show disconnected state by default
        // User must manually select a proxy to use
        updateStatusDisplay('manual', null);
        chrome.storage.local.set({ currentProxy: null }, function () {
          list_init();
        });
        // Ensure proxy is turned off
        chrome.runtime.sendMessage({ action: "refreshProxy" });
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

  function updateStatusDisplay(mode, currentProxy) {
    const $statusValue = $('#status-display');

    if (mode === 'disabled') {
      $statusValue.text(I18n.t('status_disabled')).attr('data-i18n', 'status_disabled');
      $statusValue.css('color', '#dc3545'); // Red to match Disabled button
    } else if (mode === 'auto') {
      // In auto mode, try to get match status for current page
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            $statusValue.text(`${url.hostname}`).removeAttr('data-i18n');
            $statusValue.attr('title', url.hostname); // Show full hostname on hover
          } catch (e) {
            $statusValue.text(I18n.t('mode_auto_text')).attr('data-i18n', 'mode_auto_text');
            $statusValue.removeAttr('title');
          }
          $statusValue.css('color', '#28a745'); // Green to match Auto button
        } else {
          $statusValue.text(I18n.t('mode_auto_text')).attr('data-i18n', 'mode_auto_text');
          $statusValue.removeAttr('title');
          $statusValue.css('color', '#28a745'); // Green to match Auto button
        }
      });
    } else {
      // Manual mode
      if (currentProxy && (currentProxy.name || currentProxy.ip)) {
        const displayName = currentProxy.name || I18n.t('unnamed_proxy');
        $statusValue.text(displayName).removeAttr('data-i18n');
        $statusValue.css('color', '#4164f5'); // Blue for connected (matches Manual mode button)
      } else {
        $statusValue.text(I18n.t('status_disconnected')).attr('data-i18n', 'status_disconnected');
        $statusValue.css('color', '#ff9800'); // Orange for disconnected
      }
    }
  }

  // Get proxy list
  // Requirement 1: Always load from local storage regardless of sync setting
  chrome.storage.local.get({ list: [] }, function (items) {
    list = items.list || [];
    // Initial list render
    list_init();
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

        // Sync status display with selected proxy in manual mode
        if (mode === 'manual' && selectedProxy) {
          updateStatusDisplay('manual', selectedProxy);
        }
      }
    });
  });
}

// Auto Match Logic Helpers
function getAutoProxy(proxyList, hostname) {
  if (!proxyList || !hostname) return null;

  for (const proxy of proxyList) {
    if (proxy.disabled) continue;
    if (!proxy.ip || !proxy.port) continue;

    // 1. Bypass Check - if matches, return null (DIRECT)
    if (checkMatch(proxy.bypass_urls, hostname)) {
      return null;
    }

    // 2. Include Check - if matches, return this proxy
    if (checkMatch(proxy.include_urls, hostname)) {
      return proxy;
    }
  }
  return null; // Fallback to DIRECT
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
    $('#status-display').text(proxyName).css('color', '#4164f5'); // Changed from #28a745 (Green) to #4164f5 (Blue)

    // Save current proxy selection
    chrome.storage.local.set({ currentProxy: info });

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
