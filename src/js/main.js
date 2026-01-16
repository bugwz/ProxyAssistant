// ==========================================
// State & Constants
// ==========================================
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;
var list = [];
var save = true;
var auto_sync = true;
var themeMode = 'light';
var nightModeStart = '22:00';
var nightModeEnd = '06:00';
var themeInterval = null;
var del_index = -1;
let pacStorageListener = null;

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
  I18n.init(function () {
    initApp();
  });
});

function initApp() {
  initLanguage();
  initDropdowns();
  initTheme();
  loadSettingsAndList();
  bindGlobalEvents();
}

function loadSettingsAndList() {
  // Load settings
  chrome.storage.local.get({ auto_sync: true }, function (settings) {
    auto_sync = settings.auto_sync;
    $("#auto_sync_toggle").prop("checked", auto_sync);

    // If sync enabled, pull from remote and update local
    if (auto_sync) {
      chrome.storage.sync.get({ list: [], themeSettings: {} }, function (remoteItems) {
        const hasError = chrome.runtime.lastError;
        const isEmpty = !remoteItems.list || remoteItems.list.length === 0;

        if (hasError) {
          console.warn("Remote sync error:", chrome.runtime.lastError.message);
        }

        if (hasError || isEmpty) {
          // Remote is empty or error - try to merge with local data
          chrome.storage.local.get({ list: [], themeSettings: {} }, function (localItems) {
            const localList = localItems.list || [];
            const remoteList = remoteItems.list || [];

            if (localList.length > 0 && remoteList.length === 0) {
              console.log("Pushing local data to remote sync...");
              chrome.storage.sync.set({ list: localList }, function () {
                if (chrome.runtime.lastError) {
                  console.warn("Sync push failed:", chrome.runtime.lastError.message);
                }
              });
            }
            loadFromLocal();
          });
        } else {
          console.log("Sync enabled: Pulled data from remote, updating local");
          chrome.storage.local.set({ list: remoteItems.list }, function () {
            loadFromLocal(remoteItems);
          });
        }
      });
    } else {
      loadFromLocal();
    }
  });
}

function loadFromLocal(remoteItems) {
  chrome.storage.local.get({ list: [], themeSettings: {} }, function (items) {
    if (chrome.runtime.lastError) {
      console.warn("Local storage get error:", chrome.runtime.lastError);
      items = {};
    }
    items = items || {};

    if (remoteItems && remoteItems.list) {
      list = remoteItems.list;
    } else {
      list = items.list || [];
    }

    // Load theme settings
    var themeSettings = items.themeSettings || {};
    themeMode = themeSettings.mode || 'light';
    nightModeStart = themeSettings.startTime || '22:00';
    nightModeEnd = themeSettings.endTime || '06:00';

    updateThemeUI();
    renderList();
  });
}

// ==========================================
// Theme Logic
// ==========================================
function initTheme() {
  $('.theme-btn').on('click', function () {
    var mode = $(this).data('theme');
    $('.theme-btn').removeClass('active');
    $(this).addClass('active');

    if (mode === 'auto') {
      $('.auto-mode-time-row').show();
    } else {
      $('.auto-mode-time-row').hide();
    }

    setThemeMode(mode);
  });

  $('#night-mode-start, #night-mode-end').on('change', function () {
    nightModeStart = $('#night-mode-start').val();
    nightModeEnd = $('#night-mode-end').val();
    saveThemeSettings();
    if (themeMode === 'auto') {
      updateThemeByTime();
    }
  });
}

function updateThemeUI() {
  $('#night-mode-start').val(nightModeStart);
  $('#night-mode-end').val(nightModeEnd);
  $('.theme-btn').removeClass('active');
  $('.theme-btn[data-theme="' + themeMode + '"]').addClass('active');

  if (themeMode === 'auto') {
    $('.auto-mode-time-row').show();
    updateThemeByTime();
    startThemeInterval();
  } else {
    $('.auto-mode-time-row').hide();
    applyTheme(themeMode);
  }
}

function setThemeMode(mode) {
  themeMode = mode;
  if (mode === 'auto') {
    updateThemeByTime();
    startThemeInterval();
  } else {
    if (themeInterval) clearInterval(themeInterval);
    applyTheme(mode);
  }
  saveThemeSettings();
}

function applyTheme(theme) {
  if (theme === 'dark') {
    $('body').attr('data-theme', 'dark');
  } else {
    $('body').removeAttr('data-theme');
  }
}

function updateThemeByTime() {
  var now = new Date();
  var currentHour = now.getHours();
  var currentMinute = now.getMinutes();
  var currentTime = currentHour * 60 + currentMinute;

  var startParts = nightModeStart.split(':');
  var endParts = nightModeEnd.split(':');
  var startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
  var endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

  var isNightMode;
  if (startMinutes < endMinutes) {
    isNightMode = currentTime >= startMinutes || currentTime < endMinutes;
  } else {
    isNightMode = currentTime >= startMinutes || currentTime < endMinutes;
  }

  applyTheme(isNightMode ? 'dark' : 'light');
}

function startThemeInterval() {
  if (themeInterval) clearInterval(themeInterval);
  themeInterval = setInterval(function () {
    if (themeMode === 'auto') {
      updateThemeByTime();
    }
  }, 60000);
}

function saveThemeSettings() {
  var themeSettings = {
    mode: themeMode,
    startTime: nightModeStart,
    endTime: nightModeEnd
  };

  chrome.storage.local.set({ themeSettings: themeSettings }, function () {
    if (auto_sync) {
      chrome.storage.sync.set({ themeSettings: themeSettings });
    }
  });
}

// ==========================================
// Language Logic
// ==========================================
function initLanguage() {
  const currentLang = I18n.getCurrentLanguage();
  const $currentLangDisplay = $('#current-language-display');
  const $options = $('#language-options li');

  const currentLangText = $options.filter(`[data-value="${currentLang}"]`).text();
  if (currentLangText) {
    $currentLangDisplay.text(currentLangText);
  }

  $options.off('click').on('click', function () {
    const lang = $(this).data('value');
    const text = $(this).text();

    $currentLangDisplay.text(text);
    $(this).closest('.lh-select').find('.lh-select-op').hide();

    I18n.setLanguage(lang);
    renderList();
  });
}

// ==========================================
// UI Components
// ==========================================
function initDropdowns() {
  $("html").on("click", function () {
    $(".lh-select-op").hide();
  });

  $(".lh-select_k").off().on("click", function (e) {
    e.stopPropagation();
    var that = this;
    var display = $(that).next().css('display');
    if (display != 'none') return;

    // Close other dropdowns
    $(".lh-select-op").hide();

    setTimeout(function () {
      $(that).next().toggle();
    }, 50);
  });

  $("#proxy-list").off("click", ".lh-select-op li").on("click", ".lh-select-op li", function (e) {
    e.stopPropagation();
    $(this).siblings().removeClass("op_a");
    $(this).addClass("op_a");
    $(this).parent().hide();

    var txt = $(this).text();
    var val = $(this).data("value") || txt;

    var $selectContainer = $(this).closest('.lh-select');
    var $selectVal = $selectContainer.find(".lh-select-val");
    $selectVal.text(txt);

    var i = $selectVal.data("index");
    var type = $selectContainer.data("type");

    if (typeof i !== 'undefined' && list && list[i]) {
      if (type === 'protocol') {
        var cleanVal = cleanProtocol(val);
        list[i].protocol = cleanVal;
        var $badge = $(this).closest('.list_a').find('.proxy-type-badge');
        $badge.text(cleanVal.toUpperCase()).removeClass('http https socks5').addClass(cleanVal);

        var isSocks5 = cleanVal === 'socks5';
        var disableAuth = !isFirefox && isSocks5;
        var $formGrid = $(this).closest('.proxy-body-container');
        var $authInputs = $formGrid.find('.username, .password');

        $authInputs.prop('disabled', disableAuth);
        if (!disableAuth) {
          $authInputs.removeAttr('title');
        }
      } else if (type === 'fallback') {
        list[i].fallback_policy = val;
      }
      save = false;
    }
  });
}

function bindGlobalEvents() {
  // Add Proxy Button
  $("#add-proxy-btn").on("click", function () {
    list.push({
      name: "", protocol: "http", fallback_policy: "direct",
      ip: "", port: "", username: "", password: "",
      is_show: 0, open: 0, include_urls: "", bypass_urls: "",
      is_new: true,
    });
    renderList();

    setTimeout(function () {
      var $newItem = $(".list_a").last();
      if ($newItem.length) {
        $("html, body").animate({ scrollTop: $newItem.offset().top - 100 }, 500);
      }
    }, 50);
  });

  // Test All Button
  $("#test-all-btn").on("click", async function () {
    var $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    $(".proxy-header-test-result").text("").removeClass("text-green text-orange text-red text-blue");

    for (let index = 0; index < list.length; index++) {
      var proxy = list[index];
      var $item = $(`.list_a[data-id="${index}"]`);

      // Sync latest values from DOM just in case
      proxy.name = $item.find('.name').val();
      proxy.protocol = cleanProtocol($item.find('.lh-select-val[data-index="' + index + '"]').closest('.lh-select[data-type="protocol"]').find('.lh-select-op li.op_a').data('value') || proxy.protocol);
      proxy.ip = $item.find('.ip').val();
      proxy.port = $item.find('.port').val();
      proxy.username = $item.find('.username').val();
      proxy.password = $item.find('.password').val();

      if (proxy.disabled || !proxy.ip || !proxy.port) continue;

      var $resultSpan = $(`.proxy-header-test-result[data-index="${index}"]`);
      $resultSpan.text(I18n.t('testing')).removeClass("text-green text-orange text-red").addClass("text-blue");

      await new Promise(function (resolve) {
        chrome.runtime.sendMessage({
          action: "testProxyConnection",
          proxyInfo: proxy
        }, function (response) {
          if (chrome.runtime.lastError) {
            $resultSpan.text(I18n.t('test_failed')).removeClass("text-blue").addClass("text-red");
          } else if (response && response.success) {
            var latency = response.latency;
            var colorClass = latency < 500 ? "text-green" : "text-orange";
            $resultSpan.text(latency + "ms").removeClass("text-blue").addClass(colorClass);
          } else {
            var errorMsg = (response && response.error) ? response.error : I18n.t('test_failed');
            if (errorMsg.length > 10) errorMsg = I18n.t('test_failed');
            $resultSpan.text(errorMsg).removeClass("text-blue").addClass("text-red");
          }
          resolve();
        });
      });
    }
    $btn.prop('disabled', false);
  });

  // Auto Sync Toggle
  $("#auto_sync_toggle").on("change", function () {
    auto_sync = $(this).prop("checked");
    chrome.storage.local.set({ auto_sync: auto_sync });
  });

  // Expand/Collapse All
  $("#expand-collapse-btn").on("click", function () {
    var $btn = $(this);
    var isExpanded = $btn.hasClass("expanded");

    if (isExpanded) {
      $(".list_a").addClass("collapsed");
      $btn.removeClass("expanded");
      $btn.html(`<svg class="icon-expand" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg> <span data-i18n="expand_all">${I18n.t('expand_all')}</span>`);
    } else {
      $(".list_a").removeClass("collapsed");
      $btn.addClass("expanded");
      $btn.html(`<svg class="icon-collapse" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg> <span data-i18n="collapse_all">${I18n.t('collapse_all')}</span>`);
    }
  });

  // Export/Import Events
  $(".export_btn").on("click", exportConfig);
  $(".import_json_btn").on("click", function () { $("#json_file_input").click(); });
  $("#json_file_input").on("change", importConfig);

  // Detect/PAC Buttons
  $("#detect-proxy-btn").on("click", detectProxy);
  $("#pac-details-btn").on("click", showPacDetails);
}

// ==========================================
// List Rendering
// ==========================================
function renderList() {
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var info = list[i];
    var is_disabled = info.disabled === true;
    var protocolClass = (info.protocol || "http").toLowerCase();
    var displayProtocol = (info.protocol || "http").toUpperCase();

    var isSocks5 = protocolClass === 'socks5';
    var disableAuth = !isFirefox && isSocks5;
    var disabledAttr = disableAuth ? 'disabled' : '';

    var fallbackPolicy = info.fallback_policy || "direct";
    var displayFallback = fallbackPolicy === "reject" ? I18n.t('fallback_reject') : I18n.t('fallback_direct');
    var previewText = `${info.name || I18n.t('unnamed_proxy')} · ${info.ip || "0.0.0.0"}:${info.port || "0"}`;

    var collapsedClass = info.is_new ? "" : "collapsed";
    delete info.is_new;

    html += `<div class="list_a ${collapsedClass} ${is_disabled ? "disabled" : ""}" data-id="${i}">
      <div class="proxy-header" data-index="${i}">
          <div class="header-left">
              <div class="drag-handle" title="${I18n.t('drag_sort')}">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
              </div>
              <span class="proxy-index">#${i + 1}</span>
              <div class="proxy-type-badge ${protocolClass}">${displayProtocol}</div>
              <div class="proxy-title-preview" title="${previewText}">${previewText}</div>
          </div>
          <div class="header-right">
              <div class="proxy-header-test-result" data-index="${i}"></div>
              <div class="status-container">
                  <span class="status-text">${is_disabled ? I18n.t('status_disabled') : I18n.t('status_enabled')}</span>
                  <label class="switch-modern">
                      <input type="checkbox" class="proxy-status-toggle" data-index="${i}" ${is_disabled ? "" : "checked"}>
                      <span class="slider-modern"></span>
                  </label>
              </div>
          </div>
      </div>

      <div class="proxy-body">
          <div class="proxy-body-container">
              <div class="proxy-content-left">
                  <div class="form-grid">
                      <div class="form-item" style="grid-column: span 4;">
                          <label>${I18n.t('proxy_name')}</label>
                          <input data-index="${i}" class="name" type="text" placeholder="${I18n.t('proxy_name_placeholder')}" value="${info.name}" tabindex="1">
                      </div>
                      <div class="form-item" style="grid-column: span 2;">
                          <label>${I18n.t('protocol')}</label>
                          <div class="lh-select" data-type="protocol" tabindex="2">
                              <div class="lh-select_k">
                                  <span class="lh-select-val" data-index="${i}">${displayProtocol}</span>
                                  <span class="iconfont"></span>
                              </div>
                              <ul class="lh-select-op">
                                  <li data-value="HTTP">HTTP</li>
                                  <li data-value="HTTPS">HTTPS</li>
                                  <li data-value="SOCKS5">SOCKS5</li>
                              </ul>
                          </div>
                      </div>
                      <div class="form-item" style="grid-column: span 3;">
                          <label>
                              ${I18n.t('username_optional')}
                              <span class="info-icon" data-tooltip="${I18n.t('socks5_auth_not_supported')}">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                              </span>
                          </label>
                          <input data-index="${i}" class="username" type="text" placeholder="${I18n.t('username_placeholder')}" value="${info.username}" tabindex="5" ${disabledAttr}>
                      </div>
                      <div class="form-item" style="grid-column: span 3;">
                          <label>
                              ${I18n.t('password_optional')}
                              <span class="info-icon" data-tooltip="${I18n.t('socks5_auth_not_supported')}">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                              </span>
                          </label>
                          <div style="position: relative; display: flex; align-items: center; width: 100%;">
                              <input data-index="${i}" class="password" type="${info.is_show == 1 ? "text" : "password"}" placeholder="${I18n.t('password_placeholder')}" value="${info.password}" style="padding-right: 35px; width: 100%;" tabindex="6" ${disabledAttr}>
                              <label class="container eye-toggle ${info.is_show == 1 ? 'show-password' : 'hide-password'}" data-index="${i}" style="position: absolute; right: 8px; margin: 0; cursor: pointer;">
                                  <input type="checkbox" ${info.is_show == 1 ? "checked" : ""}>
                                  <svg class="eye" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"></path></svg>
                                  <svg class="eye-slash" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"></path></svg>
                              </label>
                          </div>
                      </div>
                  </div>

                  <div class="form-grid" style="margin-top: 15px;">
                      <div class="form-item" style="grid-column: span 4;">
                          <label>${I18n.t('ip_address')}</label>
                          <input data-index="${i}" class="ip" type="text" placeholder="127.0.0.1" value="${info.ip}" tabindex="3">
                      </div>
                      <div class="form-item" style="grid-column: span 2;">
                          <label>${I18n.t('port')}</label>
                          <input data-index="${i}" class="port" type="text" placeholder="8080" value="${info.port}" tabindex="4">
                      </div>
                      <div class="form-item" style="grid-column: span 6;">
                          <label>${I18n.t('fallback_policy')}</label>
                          <div class="lh-select" data-type="fallback" tabindex="7">
                              <div class="lh-select_k">
                                  <span class="lh-select-val" data-index="${i}">${displayFallback}</span>
                                  <span class="iconfont"></span>
                              </div>
                              <ul class="lh-select-op">
                                  <li data-value="direct">${I18n.t('fallback_direct')}</li>
                                  <li data-value="reject">${I18n.t('fallback_reject')}</li>
                              </ul>
                          </div>
                      </div>
                  </div>

                  <div class="url-config-section">
                      <div class="form-item">
                          <label>${I18n.t('bypass_urls')}</label>
                          <textarea data-index="${i}" class="bypass_urls" placeholder="${I18n.t('bypass_urls_placeholder')}" tabindex="8">${info.bypass_urls || ""}</textarea>
                      </div>
                      <div class="form-item">
                          <label>${I18n.t('include_urls')}</label>
                          <textarea data-index="${i}" class="include_urls" placeholder="${I18n.t('include_urls_placeholder')}" tabindex="9">${info.include_urls || ""}</textarea>
                      </div>
                  </div>
              </div>

              <div class="proxy-content-right">
                  <label>&nbsp;</label>
                  <button class="right-panel-btn btn-test test-proxy-btn" data-index="${i}" tabindex="-1">
                       ${I18n.t('link_test')}
                  </button>
                  <div class="test-result-display test-result" data-index="${i}"></div>
                  <button class="right-panel-btn btn-save item-save-btn" data-index="${i}" tabindex="10">
                       ${I18n.t('save')}
                  </button>
                  <button class="right-panel-btn btn-delete del" data-index="${i}" title="${I18n.t('delete_proxy_title')}" tabindex="11">
                       ${I18n.t('delete')}
                  </button>
              </div>
          </div>
      </div>
    </div>`;
  }
  $(".list").html(html);

  initDropdowns(); // Re-bind dropdowns in list
  initSortable();
  bindItemEvents();
}

function bindItemEvents() {
  // Input Blur
  $("input, textarea").on("blur", function () {
    var i = $(this).data("index");
    var val = $(this).val();
    var name = $(this).attr("class");
    if (name && name.indexOf(" ") !== -1) name = name.split(" ")[0];
    input_blur(i, name, val);
  });

  // Paste handling for IP
  $("input.ip").on("paste", function () {
    var i = $(this).data("index");
    var that = this;
    setTimeout(function () {
      var val = $(that).val();
      if (val.indexOf(":") != -1) {
        var txt_arr = val.split(":");
        $(that).val(txt_arr[0]);
        $(that).closest('.form-grid').find('.port').val(txt_arr[1]);
        input_blur(i, 'ip', txt_arr[0]);
        input_blur(i, 'port', txt_arr[1]);
      }
    }, 100);
  });

  // Eye Toggle
  $(".eye-toggle input").on("change", function () {
    var i = $(this).parent().data("index");
    if (i !== undefined && list[i]) {
      list[i].is_show = $(this).prop("checked") ? 1 : 0;
      save = false;
      var passwordInput = $(".password[data-index='" + i + "']");
      passwordInput.attr("type", list[i].is_show == 1 ? "text" : "password");

      var $toggle = $(this).parent();
      if (list[i].is_show == 1) $toggle.removeClass('hide-password').addClass('show-password');
      else $toggle.removeClass('show-password').addClass('hide-password');
    }
  });

  // Delete
  $(".del").on("click", function () {
    var index = $(this).data("index");
    if (index !== undefined && list[index]) {
      var info = list[index];
      var previewText = `${info.name || I18n.t('unnamed_proxy')} (${info.ip || "0.0.0.0"}:${info.port || "0"})`;
      $(".del_tip_content").html(`${I18n.t('delete_proxy_confirm')}<br><span style="color: #e11d48; font-weight: 600; margin-top: 10px; display: block;">${previewText}</span>`);
      $(".del_tip").show().addClass("show");
      del_index = index;
    }
  });

  // Save Item
  $(".item-save-btn").on("click", function () {
    saveSingleProxy($(this).data("index"));
  });

  // Test Item
  $(".test-proxy-btn").on("click", function () {
    var i = $(this).data("index");
    var $btn = $(this);
    var $headerResultSpan = $(`.proxy-header-test-result[data-index="${i}"]`);

    if (i !== undefined && list[i]) {
      // Sync DOM
      var $item = $(`.list_a[data-id="${i}"]`);
      list[i].name = $item.find('.name').val();
      list[i].protocol = cleanProtocol($item.find('.lh-select-val').text());
      list[i].ip = $item.find('.ip').val();
      list[i].port = $item.find('.port').val();
      list[i].username = $item.find('.username').val();
      list[i].password = $item.find('.password').val();

      if (!list[i].ip || !list[i].port) return;

      $headerResultSpan.text(I18n.t('testing')).removeClass("text-green text-orange text-red").addClass("text-blue");
      $btn.prop("disabled", true);

      chrome.runtime.sendMessage({
        action: "testProxyConnection",
        proxyInfo: list[i]
      }, function (response) {
        $btn.prop("disabled", false);
        if (chrome.runtime.lastError) {
          $headerResultSpan.text(I18n.t('test_failed')).removeClass("text-blue").addClass("text-red");
        } else if (response && response.success) {
          var latency = response.latency;
          var colorClass = latency < 500 ? "text-green" : "text-orange";
          $headerResultSpan.text(latency + "ms").removeClass("text-blue").addClass(colorClass);
        } else {
          var errorMsg = (response && response.error) ? response.error : I18n.t('test_failed');
          if (errorMsg.length > 10) errorMsg = I18n.t('test_failed');
          $headerResultSpan.text(errorMsg).removeClass("text-blue").addClass("text-red");
        }
      });
    }
  });

  // Toggle Switch
  $(document).off("change", ".proxy-status-toggle").on("change", ".proxy-status-toggle", function () {
    var i = $(this).data("index");
    if (i !== undefined && list[i]) {
      list[i].disabled = !$(this).prop("checked");
      const $item = $(this).closest('.list_a');
      const $statusText = $item.find('.status-text');
      if (list[i].disabled) {
        $item.addClass('disabled');
        $statusText.text(I18n.t('status_disabled'));
      } else {
        $item.removeClass('disabled');
        $statusText.text(I18n.t('status_enabled'));
      }
      saveSingleProxy(i);
    }
  });

  // Header Collapse (excluding inputs)
  $(document).off("click", ".proxy-header").on("click", ".proxy-header", function (e) {
    if ($(e.target).closest('.switch-modern, .action-btn-delete, input').length) return;
    $(this).closest('.list_a').toggleClass("collapsed");
  });
}

function initSortable() {
  const container = document.getElementById('proxy-list');
  let dragItem = null;
  const items = container.querySelectorAll('.list_a');

  items.forEach(item => {
    const handle = item.querySelector('.drag-handle');
    handle.setAttribute('draggable', true);

    handle.addEventListener('dragstart', (e) => {
      dragItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    handle.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      dragItem = null;
      const newItems = Array.from(container.querySelectorAll('.list_a'));
      const newList = newItems.map(node => {
        const oldIdx = parseInt(node.getAttribute('data-id'));
        return list[oldIdx];
      });
      list = newList;
      save = false;
      renderList();
      saveData();
    });

    handle.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.list_a');
      if (target && target !== dragItem) {
        const rect = target.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        container.insertBefore(dragItem, next ? target.nextSibling : target);
      }
    });
  });
}

// ==========================================
// Data Persistence & Validation
// ==========================================
function input_blur(i, name, val) {
  if (i !== undefined && name && list[i]) {
    var validProperties = ["name", "ip", "port", "username", "password", "include_urls", "bypass_urls"];
    if (validProperties.includes(name)) {
      list[i][name] = val;
      save = false;
      if (["name", "ip", "port", "include_urls"].includes(name)) {
        validateProxy(i, name, val);
      }
      if (["name", "ip", "port"].includes(name)) {
        var info = list[i];
        var previewText = `${info.name || I18n.t('unnamed_proxy')} · ${info.ip || "0.0.0.0"}:${info.port || "0"}`;
        $(`.list_a[data-id="${i}"] .proxy-title-preview`).text(previewText).attr('title', previewText);
      }
    }
  }
}

function saveData() {
  chrome.storage.local.set({ list: list }, function () {
    if (chrome.runtime.lastError) {
      console.error("Local save failed:", chrome.runtime.lastError);
      showTip(I18n.t('save_failed'), true);
      return;
    }
    if (auto_sync) {
      chrome.storage.sync.set({ list: list }, function () {
        if (chrome.runtime.lastError) {
          console.error("Remote sync failed:", chrome.runtime.lastError);
          showTip(I18n.t('sync_failed') || "同步失败，请重试", true);
        } else {
          showTip(I18n.t('save_success'), false);
        }
      });
    } else {
      showTip(I18n.t('save_success'), false);
    }
    chrome.runtime.sendMessage({ action: "refreshProxy" });
  });
  save = true;
}

function saveSingleProxy(i) {
  var info = list[i];
  if (!info) return;

  var isNameValid = info.name.trim() !== '' && !list.some((item, index) => index !== i && item.name === info.name);
  var isIpValid = true, ipErrorMsg = '';
  var parts = info.ip.split('.');
  var isIpLike = parts.length === 4 && parts.every(p => /^\d+$/.test(p));

  if (isIpLike) {
    var ipValidation = validateIPAddress(info.ip);
    if (!ipValidation.isValid) { isIpValid = false; ipErrorMsg = ipValidation.error; }
  } else {
    if (!isValidHost(info.ip)) { isIpValid = false; ipErrorMsg = I18n.t('alert_ip_invalid'); }
  }

  var port = parseInt(info.port);
  var isPortValid = !isNaN(port) && port >= 1 && port <= 65535 && info.port.toString() === port.toString();

  var isIncludeUrlsValid = true, includeUrlsErrorMsg = '';
  var includeUrlsCheck = checkIncludeUrlsConflict(i, info.include_urls);
  if (includeUrlsCheck.hasConflict) { isIncludeUrlsValid = false; includeUrlsErrorMsg = includeUrlsCheck.error; }

  var $item = $(`.list_a[data-id="${i}"]`);

  if (isNameValid) $item.find('.name').removeClass('input-error'); else $item.find('.name').addClass('input-error');
  if (isIpValid) $item.find('.ip').removeClass('input-error'); else $item.find('.ip').addClass('input-error');
  if (isPortValid) $item.find('.port').removeClass('input-error'); else $item.find('.port').addClass('input-error');
  if (isIncludeUrlsValid) $item.find('.include_urls').removeClass('input-error'); else $item.find('.include_urls').addClass('input-error');

  if (!isNameValid || !isIpValid || !isPortValid || !isIncludeUrlsValid) {
    var failMsg = I18n.t('save_failed');
    if (!isNameValid) showTip(failMsg + (list.some((item, index) => index !== i && item.name === info.name) ? I18n.t('alert_name_duplicate') : I18n.t('alert_name_required')), true);
    else if (!isIpValid) showTip(failMsg + (ipErrorMsg || I18n.t('alert_ip_invalid')), true);
    else if (!isPortValid) showTip(failMsg + I18n.t('alert_port_invalid'), true);
    else if (!isIncludeUrlsValid) showTip(failMsg + includeUrlsErrorMsg, true);
    return;
  }

  saveData();
}

// Validation Helpers
function validateProxy(i, name, val) {
  var isValid = true;
  var errorMessage = '';
  var $item = $(`.list_a[data-id="${i}"]`);
  var $input = $item.find('.' + name);

  if (name === 'name') {
    var isDuplicate = list.some((item, index) => index !== i && item.name === val);
    if (val.trim() === '') { isValid = false; errorMessage = I18n.t('alert_name_required') || '代理名称不能为空'; }
    else if (isDuplicate) { isValid = false; errorMessage = I18n.t('alert_name_duplicate') || '代理名称不能重复'; }
  } else if (name === 'include_urls') {
    var includeUrlsCheck = checkIncludeUrlsConflict(i, val);
    if (includeUrlsCheck.hasConflict) { isValid = false; errorMessage = includeUrlsCheck.error; }
  } else if (name === 'ip') {
    var parts = val.split('.');
    var isIpLike = parts.length === 4 && parts.every(p => /^\d+$/.test(p));
    if (isIpLike) {
      var ipValidation = validateIPAddress(val);
      if (!ipValidation.isValid) { isValid = false; errorMessage = ipValidation.error; }
    } else {
      if (!isValidHost(val)) { isValid = false; errorMessage = I18n.t('alert_ip_invalid') || '请输入有效的代理地址'; }
    }
  } else if (name === 'port') {
    var port = parseInt(val);
    if (isNaN(port) || port < 1 || port > 65535 || val.toString() !== port.toString()) {
      isValid = false; errorMessage = I18n.t('alert_port_invalid') || '端口号必须在1-65535范围内';
    }
  }

  if (isValid) { $input.removeClass('input-error').removeAttr('title'); }
  else { $input.addClass('input-error'); if (errorMessage) $input.attr('title', errorMessage); }
  return isValid;
}

function validateIPAddress(ip) {
  if (!ip || ip.trim() === '') return { isValid: false, error: I18n.t('alert_ip_required') || 'IP地址不能为空' };
  var parts = ip.split('.');
  if (parts.length !== 4) return { isValid: false, error: I18n.t('alert_ip_format') || 'IP地址格式错误' };
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part === '') return { isValid: false, error: I18n.t('alert_ip_part_empty') };
    if (!/^\d+$/.test(part)) return { isValid: false, error: I18n.t('alert_ip_part_nan') };
    if (part.length > 1 && part[0] === '0') return { isValid: false, error: I18n.t('alert_ip_leading_zero') };
    var num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return { isValid: false, error: I18n.t('alert_ip_part_range') };
  }
  return { isValid: true, error: '' };
}

function isValidHost(val) {
  var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(val)) return true;
  var hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  return hostnameRegex.test(val);
}

function checkIncludeUrlsConflict(i, includeUrls) {
  if (!includeUrls || !includeUrls.trim()) return { hasConflict: false, error: '' };
  var currentUrls = includeUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

  for (var j = 0; j < list.length; j++) {
    if (j === i) continue;
    var otherProxy = list[j];
    if (!otherProxy || !otherProxy.ip || !otherProxy.port) continue;
    var otherUrls = (otherProxy.include_urls || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    var commonPatterns = currentUrls.filter(pattern => otherUrls.indexOf(pattern) !== -1);

    if (commonPatterns.length > 0) {
      var otherProxyName = otherProxy.name || (otherProxy.ip + ':' + otherProxy.port);
      var errorMsg = I18n.t('alert_include_urls_conflict').replace('{pattern}', commonPatterns[0]).replace('{proxy}', otherProxyName);
      return { hasConflict: true, error: errorMsg };
    }
  }
  return { hasConflict: false, error: '' };
}

function cleanProtocol(protocol) {
  if (!protocol || typeof protocol !== 'string') return 'http';
  let cleaned = protocol.replace(/^(https?:\/?\/?)/i, '').trim().toLowerCase();
  const validProtocols = ['http', 'https', 'socks4', 'socks5', 'socks'];
  if (!validProtocols.includes(cleaned)) return 'http';
  return cleaned;
}

// ==========================================
// Import / Export
// ==========================================
function exportConfig() {
  var orderedProxies = list.map(function (proxy) {
    var ordered = {
      "name": proxy.name, "protocol": proxy.protocol, "ip": proxy.ip, "port": proxy.port,
      "username": proxy.username, "password": proxy.password,
      "fallback_policy": proxy.fallback_policy || "direct",
      "is_show": proxy.is_show, "open": proxy.open,
      "include_urls": proxy.include_urls, "bypass_urls": proxy.bypass_urls
    };
    if (proxy.disabled !== undefined) ordered.disabled = proxy.disabled;
    return ordered;
  });

  var configBundle = {
    version: 1,
    settings: {
      auto_sync: auto_sync,
      appLanguage: I18n.getCurrentLanguage(),
      themeMode: themeMode,
      nightModeStart: nightModeStart,
      nightModeEnd: nightModeEnd
    },
    proxies: orderedProxies
  };
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configBundle, null, 4));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "proxy_assistant_config.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importConfig(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var data = JSON.parse(e.target.result);
      if (data && data.proxies && Array.isArray(data.proxies)) {
        list = data.proxies.map(p => ({ ...p, protocol: cleanProtocol(p.protocol || p.type || 'http') }));
        if (data.settings) {
          if (data.settings.auto_sync !== undefined) {
            auto_sync = data.settings.auto_sync;
            $("#auto_sync_toggle").prop("checked", auto_sync);
            chrome.storage.local.set({ auto_sync: auto_sync });
          }
          if (data.settings.appLanguage) {
            I18n.setLanguage(data.settings.appLanguage);
            $('#current-language-display').text($(`#language-options li[data-value="${data.settings.appLanguage}"]`).text());
          }
          if (data.settings.themeMode) {
            themeMode = data.settings.themeMode;
            if (data.settings.nightModeStart) nightModeStart = data.settings.nightModeStart;
            if (data.settings.nightModeEnd) nightModeEnd = data.settings.nightModeEnd;
            saveThemeSettings();
            updateThemeUI();
          }
        }
        save = false;
        renderList();
        saveData();
      } else if (Array.isArray(data)) {
        list = data.map(p => ({ ...p, protocol: cleanProtocol(p.protocol || p.type || 'http') }));
        save = false;
        renderList();
        saveData();
      } else {
        alert(I18n.t('alert_invalid_format'));
      }
    } catch (err) {
      alert(I18n.t('alert_parse_error') + err.message);
    }
    $("#json_file_input").val("");
  };
  reader.readAsText(file);
}

// ==========================================
// Popups (Delete, Proxy Detection, PAC)
// ==========================================

// Delete Popup
$(".del_tip_close_btn, .del_tip_Cancel_btn, .del_tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('del_tip_close_btn') || $(this).hasClass('del_tip_Cancel_btn')) {
    $(".del_tip").removeClass("show");
    setTimeout(function () { $(".del_tip").hide(); }, 300);
  }
});

$(".del_tip_del_btn").on("click", function () {
  $(".del_tip").removeClass("show");
  setTimeout(function () { $(".del_tip").hide(); }, 300);

  if (del_index !== undefined && del_index >= 0 && list[del_index]) {
    list.splice(del_index, 1);
    chrome.storage.local.set({ list: list }, function () {
      if (auto_sync) chrome.storage.sync.set({ list: list });
      chrome.runtime.sendMessage({ action: "refreshProxy" });
    });
    renderList();
  }
});

$(".del_tip").hide();

// Proxy Detection
async function detectProxy() {
  var $btn = $("#detect-proxy-btn");
  $btn.prop("disabled", true);

  $("#detection-status-icon").html(detectionIcons.loading);
  $("#detection-status-text").text(I18n.t('proxy_effect_testing'));
  $("#detection-details, #detection-warning, #detection-suggestion").hide();
  $(".proxy_detection_tip").show().addClass("show");

  try {
    var browserConfig = await getBrowserProxyConfig();
    var pluginConfig = await getPluginProxyConfig();
    var result = analyzeProxyStatus(browserConfig, pluginConfig);
    displayDetectionResult(result);
  } catch (error) {
    console.error("Proxy detection error:", error);
    displayErrorResult(error.message);
  }
  $btn.prop("disabled", false);
}

function getBrowserProxyConfig() {
  return new Promise(function (resolve) {
    if (typeof chrome !== 'undefined' && chrome.proxy && chrome.proxy.settings) {
      chrome.proxy.settings.get({ incognito: false }, function (config) {
        resolve(config || { value: { mode: 'system' } });
      });
    } else {
      resolve({ value: { mode: 'system' } });
    }
  });
}

function getPluginProxyConfig() {
  return new Promise(function (resolve) {
    chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
      resolve({
        mode: result.proxyMode || 'disabled',
        currentProxy: result.currentProxy || null,
        list: result.list || []
      });
    });
  });
}

function analyzeProxyStatus(browserConfig, pluginConfig) {
  var result = { status: 'normal', statusText: '', statusIcon: '', details: [], warning: null, suggestion: null };
  var browserMode = (browserConfig.value && browserConfig.value.mode) || 'system';
  var levelOfControl = browserConfig.levelOfControl || '';

  var proxyServer = '', proxyProtocol = '';
  if (browserConfig.value && browserConfig.value.rules) {
    var rules = browserConfig.value.rules;
    if (rules.singleProxy) { proxyServer = rules.singleProxy.host + ':' + rules.singleProxy.port; proxyProtocol = rules.singleProxy.scheme || 'http'; }
    else if (rules.proxyForHttp || rules.proxyForHttps) { var p = rules.proxyForHttp || rules.proxyForHttps; proxyServer = p.host + ':' + p.port; proxyProtocol = p.scheme || 'http'; }
  } else if (browserConfig.value && browserConfig.value.pacScript) { proxyServer = 'PAC Script'; proxyProtocol = 'Auto'; }

  result.details.push({ label: I18n.t('proxy_mode'), value: getModeDisplayName(browserMode) });
  if (proxyServer) result.details.push({ label: I18n.t('proxy_server'), value: proxyServer });
  if (proxyProtocol) result.details.push({ label: I18n.t('proxy_protocol'), value: proxyProtocol.toUpperCase() });

  var controlText = '';
  if (levelOfControl === 'controlled_by_this_extension') controlText = I18n.t('proxy_control_this');
  else if (levelOfControl === 'controlled_by_other_extensions') controlText = I18n.t('proxy_control_other');
  else controlText = I18n.t('proxy_control_system');
  result.details.push({ label: I18n.t('proxy_control'), value: controlText });

  var isUsingPlugin = false;
  var isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;

  if (isFirefox) {
    if (pluginConfig.mode !== 'disabled' && levelOfControl !== 'controlled_by_other_extensions') isUsingPlugin = true;
  } else {
    if (browserMode === 'fixed_servers' && pluginConfig.mode === 'manual') {
      if (pluginConfig.currentProxy && proxyServer) {
        var expectedServer = pluginConfig.currentProxy.ip + ':' + pluginConfig.currentProxy.port;
        isUsingPlugin = (proxyServer === expectedServer);
      }
    } else if (browserMode === 'pac_script' && pluginConfig.mode === 'auto') { isUsingPlugin = true; }
    else if (browserMode === 'disabled' && pluginConfig.mode === 'disabled') { isUsingPlugin = true; }
  }

  var hasOtherProxy = (levelOfControl === 'controlled_by_other_extensions');
  if (!isFirefox && pluginConfig.mode !== 'disabled') hasOtherProxy = hasOtherProxy || (browserMode === 'system');

  if (pluginConfig.mode === 'disabled') {
    result.status = 'normal'; result.statusText = I18n.t('status_disabled'); result.statusIcon = detectionIcons.success;
    result.details.push({ label: I18n.t('proxy_effect'), value: I18n.t('proxy_control_system') });
  } else if (isUsingPlugin && !hasOtherProxy) {
    result.status = 'normal'; result.statusText = I18n.t('proxy_status_normal'); result.statusIcon = detectionIcons.success;
    result.details.push({ label: I18n.t('proxy_effect'), value: I18n.t('proxy_effect_verified') });
  } else {
    result.status = 'warning'; result.statusText = I18n.t('proxy_status_warning'); result.statusIcon = detectionIcons.warning;
    result.warning = I18n.t('proxy_warning_system'); result.suggestion = I18n.t('proxy_suggestion_check');
    result.details.push({ label: I18n.t('proxy_effect'), value: I18n.t('proxy_effect_failed') });
  }
  return result;
}

function getModeDisplayName(mode) {
  switch (mode) {
    case 'fixed_servers': return I18n.t('mode_manual');
    case 'pac_script': return I18n.t('mode_auto');
    case 'system': return I18n.t('proxy_control_system');
    case 'direct': return I18n.t('mode_disabled');
    default: return mode || I18n.t('mode_disabled');
  }
}

const detectionIcons = {
  success: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="12" r="10" fill="#dcfce7"/><path d="M8 12l2.5 2.5L16 9" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warning: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="12" r="10" fill="#fef3c7"/><path d="M12 8v4m0 4h.01" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>',
  error: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M15 9l-6 6m0-6l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>',
  loading: '<svg class="spin" viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>'
};

function displayDetectionResult(result) {
  var iconKey = result.status === 'normal' ? 'success' : (result.status === 'warning' ? 'warning' : 'error');
  $("#detection-status-icon").html(detectionIcons[iconKey]);
  $("#detection-status-text").text(result.statusText);

  var detailsHtml = '';
  result.details.forEach(function (item) {
    detailsHtml += '<div class="detection-row"><span class="detection-label">' + item.label + '</span><span class="detection-value">' + item.value + '</span></div>';
  });
  $("#detection-details").html(detailsHtml).show();

  if (result.warning) $("#detection-warning").text(result.warning).show(); else $("#detection-warning").hide();
  if (result.suggestion) { $("#detection-suggestion-text").text(result.suggestion); $("#detection-suggestion").show(); } else $("#detection-suggestion").hide();
}

function displayErrorResult(errorMsg) {
  $("#detection-status-icon").html(detectionIcons.error);
  $("#detection-status-text").text(I18n.t('proxy_status_error'));
  $("#detection-details").html('<div class="detection-row"><span class="detection-label">Error</span><span class="detection-value">' + (errorMsg || I18n.t('proxy_suggestion_retry')) + '</span></div>').show();
  $("#detection-warning").hide();
  $("#detection-suggestion-text").text(I18n.t('proxy_suggestion_retry'));
  $("#detection-suggestion").show();
}

$(".proxy_detection_close_btn, .proxy_detection_close_btn2, .proxy_detection_tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('proxy_detection_close_btn') || $(this).hasClass('proxy_detection_close_btn2')) {
    $(".proxy_detection_tip").removeClass("show");
    setTimeout(function () { $(".proxy_detection_tip").hide(); }, 300);
  }
});

// PAC Details
function showPacDetails() {
  updatePacDetails();
  pacStorageListener = function (changes, namespace) {
    if (namespace === 'local' && (changes.list || changes.proxyMode)) {
      updatePacDetails();
    }
  };
  chrome.storage.onChanged.addListener(pacStorageListener);
  $(".pac_details_tip").show().addClass("show");
}

function updatePacDetails() {
  chrome.storage.local.get(['proxyMode', 'list'], function (result) {
    const mode = result.proxyMode || 'disabled';
    const proxyList = result.list || [];
    const pacData = generatePacDetailsData(proxyList);

    $("#pac-mode-value").text(mode === 'auto' ? I18n.t('mode_auto') : I18n.t('mode_disabled'));
    $("#pac-generated-time").text(new Date().toLocaleString());
    $("#pac-rules-count").text(pacData.rules.length);

    var rulesHtml = '';
    if (pacData.rules.length === 0) rulesHtml = '<div class="pac-rule-item empty">' + I18n.t('pac_no_rules') + '</div>';
    else {
      pacData.rules.forEach(function (rule) {
        rulesHtml += `<div class="pac-rule-item"><span class="pac-rule-pattern">${escapeHtml(rule.pattern)}</span><span class="pac-rule-arrow">→</span><span class="pac-rule-proxy">${escapeHtml(rule.proxy)}</span></div>`;
      });
    }
    $("#pac-rules-list").html(rulesHtml);
    $("#pac-script-content").text(pacData.script);
  });
}

function generatePacDetailsData(proxyList) {
  var rules = [];
  var script = "function FindProxyForURL(url, host) {\n";
  var usedPatterns = new Set();

  proxyList.forEach(function (proxy) {
    if (proxy.disabled === true || !proxy.ip || !proxy.port) return;
    const type = (proxy.protocol || "HTTP").toUpperCase();
    let proxyType = type.startsWith("SOCKS") ? "SOCKS5" : "PROXY";
    const proxyStr = proxyType + " " + proxy.ip + ":" + proxy.port;
    const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
    const returnVal = '"' + proxyStr + fallback + '"';

    if (proxy.include_urls) {
      const includeUrls = proxy.include_urls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      includeUrls.forEach(function (pattern) {
        if (usedPatterns.has(pattern)) return;
        usedPatterns.add(pattern);
        rules.push({ pattern: pattern, proxy: proxy.name || (proxy.ip + ":" + proxy.port) });

        if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          script += '  if (/' + regexPattern + '/.test(host)) return ' + returnVal + ';\n';
        } else {
          script += '  if (dnsDomainIs(host, "' + pattern + '") || host === "' + pattern + '") return ' + returnVal + ';\n';
        }
      });
    }
  });
  script += '  return "DIRECT";\n}';
  return { rules: rules, script: script };
}

$(".pac_details_close_btn, .pac_details_close_btn2, .pac_details_tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('pac_details_close_btn') || $(this).hasClass('pac_details_close_btn2')) {
    if (pacStorageListener) { chrome.storage.onChanged.removeListener(pacStorageListener); pacStorageListener = null; }
    $(".pac_details_tip").removeClass("show");
    setTimeout(function () { $(".pac_details_tip").hide(); }, 300);
  }
});

$("#pac-copy-btn").on("click", function () {
  var script = $("#pac-script-content").text();
  navigator.clipboard.writeText(script).then(function () {
    var $btn = $("#pac-copy-btn");
    var originalText = $btn.text();
    $btn.text(I18n.t('pac_copied'));
    setTimeout(function () { $btn.text(originalText); }, 2000);
  }).catch(function (err) { console.error("Failed to copy:", err); });
});

$(".pac_details_tip").hide();

// ==========================================
// Utilities
// ==========================================
function showTip(msg, isError) {
  var $tip = $(".su_tip");
  $tip.text(msg);
  if (isError) $tip.addClass("error"); else $tip.removeClass("error");
  $tip.stop(true, true).fadeIn("slow").delay(1000).fadeOut("slow");
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

$(".su_tip").hide();

// Spin Animation
var style = document.createElement('style');
style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }';
document.head.appendChild(style);
