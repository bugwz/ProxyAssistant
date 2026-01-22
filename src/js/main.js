// ==========================================
// State & Constants
// ==========================================
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;
var list = [];
var scenarios = [];
var currentScenarioId = 'default';
var save = true;
var themeMode = 'light';
var nightModeStart = '22:00';
var nightModeEnd = '06:00';
var themeInterval = null;
var del_index = -1;
var move_proxy_index = -1;
let pacStorageListener = null;
var syncConfig = {
  type: 'native',
  gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
};

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
  chrome.storage.local.get({ sync_config: null }, async function (settings) {
    if (settings.sync_config) {
      syncConfig = settings.sync_config;
    }
    updateSyncUI();
    loadFromLocal();
  });
}

function loadFromLocal(remoteItems) {
  chrome.storage.local.get({ list: [], scenarios: [], currentScenarioId: 'default', themeSettings: {} }, function (items) {
    if (chrome.runtime.lastError) {
      console.warn("Local storage get error:", chrome.runtime.lastError);
      items = {};
    }
    items = items || {};

    // Data Migration: If scenarios missing, create default from list
    if (remoteItems) {
      if (remoteItems.scenarios) {
        scenarios = remoteItems.scenarios;
        currentScenarioId = remoteItems.currentScenarioId || 'default';
      } else if (remoteItems.proxies) {
        var proxyList = remoteItems.proxies;
        scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: proxyList }];
        currentScenarioId = 'default';
      }
    } else {
      if (!items.scenarios || items.scenarios.length === 0) {
        // Migration from local list
        scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: items.list || [] }];
        currentScenarioId = 'default';
        saveData(); // Persist migration
      } else {
        scenarios = items.scenarios;
        currentScenarioId = items.currentScenarioId || 'default';
      }
    }

    // Ensure current scenario exists
    if (!scenarios.find(s => s.id === currentScenarioId)) {
      currentScenarioId = scenarios[0]?.id || 'default';
    }

    // Sync list with current scenario
    updateCurrentListFromScenario();

    // Load theme settings
    var themeSettings = items.themeSettings || {};
    themeMode = themeSettings.mode || 'light';
    nightModeStart = themeSettings.startTime || '22:00';
    nightModeEnd = themeSettings.endTime || '06:00';

    updateThemeUI();
    renderList();
    renderScenarioSelector();
  });
}

function updateCurrentListFromScenario() {
  const scenario = scenarios.find(s => s.id === currentScenarioId);
  list = scenario ? scenario.proxies : [];
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

  chrome.storage.local.set({ themeSettings: themeSettings });
}

function updateSyncUI() {
  const type = syncConfig.type || 'native';

  // Update Badge on Main Page
  const $badge = $('#sync-status-badge');
  const typeTextKey = type === 'native' ? 'sync_native' : 'sync_gist';
  const typeText = I18n.t(typeTextKey);

  $badge.text(typeText).addClass('active');

  // Update Popup UI
  const $selectedOption = $(`.sync-selector li[data-value="${type}"]`);
  if ($selectedOption.length) {
    $('#current-sync-display').text($selectedOption.text());
  }

  // Handle Panels in Popup
  $('.sync-panel').hide();
  $('#test-sync-connection').hide();

  if (type === 'gist') {
    $('#gist-token').val(syncConfig.gist.token);
    $('#gist-filename').val(syncConfig.gist.filename || 'proxy_assistant_config.json');
    $('#gist-config').show();
    $('#test-sync-connection').show();
  } else {
    $('#native-config').show();
    updateNativeQuotaInfo();
  }
}

function updateNativeQuotaInfo() {
  const data = buildConfigData();
  const jsonStr = JSON.stringify(data);
  const chunks = chunkString(jsonStr, SYNC_CHUNK_SIZE);
  const meta = buildSyncMeta(chunks);

  const quotaItemLimit = chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 7168; // 7KB per item
  const quotaTotalLimit = chrome.storage.sync.QUOTA_BYTES || 102400; // 100KB total (typical)

  const usageBytes = meta.totalSize;
  const chunksCount = chunks.length;
  const usageKB = (usageBytes / 1024).toFixed(1);
  const quotaItemKB = (quotaItemLimit / 1024).toFixed(1);
  const quotaTotalKB = (quotaTotalLimit / 1024).toFixed(0);

  // Calculate percentage based on total quota (more relevant for chunked storage)
  const percentage = ((usageBytes / quotaTotalLimit) * 100).toFixed(1);

  // Update usage text with chunk info
  const usageText = I18n.t('sync_quota_usage_chunked')
    .replace('{usage}', usageKB + 'KB')
    .replace('{chunks}', chunksCount)
    .replace('{quota}', quotaTotalKB + 'KB')
    .replace('{percent}', percentage + '%');
  $('#quota-usage-text').text(usageText);

  // Update progress bar (capped at 100% visually)
  const $barFill = $('#quota-bar-fill');
  $barFill.css('width', Math.min(percentage, 100) + '%');

  // Update bar color based on usage
  $barFill.removeClass('normal warning exceeded');
  if (usageBytes > quotaTotalLimit) {
    $barFill.addClass('exceeded');
  } else if (usageBytes > quotaTotalLimit * 0.8) {
    $barFill.addClass('warning');
  } else {
    $barFill.addClass('normal');
  }

  // Show warning if approaching limit
  const $warning = $('#quota-warning');
  if (usageBytes > quotaTotalLimit) {
    const exceededText = I18n.t('sync_quota_limit_exceeded')
      .replace('{size}', usageKB + 'KB');
    $warning.text(exceededText).show();
  } else if (usageBytes > quotaTotalLimit * 0.8) {
    const warningText = I18n.t('sync_quota_warning')
      .replace('{percent}', percentage + '%');
    $warning.text(warningText).show();
  } else {
    $warning.hide();
  }
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
    renderScenarioSelector();
    updateSyncUI();
  });
}

// ==========================================
// UI Components
// ==========================================
function initDropdowns() {
  $("html").on("click", function () {
    $(".lh-select-op").hide();
  });

  // Delegate event to support dynamic elements
  $(document).off("click", ".lh-select-k").on("click", ".lh-select-k", function (e) {
    e.stopPropagation();
    var that = this;
    var $op = $(that).next();
    var display = $op.css('display');

    // Close other dropdowns
    $(".lh-select-op").not($op).hide();

    if (display != 'none') {
      $op.hide();
      return;
    }

    setTimeout(function () {
      $op.toggle();
    }, 50);
  });

  // Main scenario button click handler
  $(document).off("click", ".main-scenario-btn").on("click", ".main-scenario-btn", function (e) {
    e.stopPropagation();
    var $btn = $(this);
    var $op = $btn.siblings('.main-scenario-dropdown');
    var display = $op.css('display');

    // Close other dropdowns
    $(".lh-select-op").not($op).hide();

    if (display !== 'none') {
      $op.hide();
      return;
    }

    setTimeout(function () {
      $op.show();
    }, 50);
  });

  $(document).off("click", ".lh-select-op li").on("click", ".lh-select-op li", function (e) {
    e.stopPropagation();
    var $li = $(this);
    var $container = $li.closest('.lh-select');
    var type = $container.data("type");

    // Special handling for main scenario selector
    if (type === 'main_scenario') {
      const scenarioId = $li.data('value');
      switchScenario(scenarioId);
      $li.parent().hide();
      return;
    }

    // Special handling for main scenario dropdown (not inside lh-select)
    if ($li.parent().hasClass('main-scenario-dropdown')) {
      const scenarioId = $li.data('value');
      switchScenario(scenarioId);
      $li.parent().hide();
      return;
    }

    // Special handling for target scenario selector in move modal
    if ($container.hasClass('target-scenario-selector')) {
      $('#target-scenario-display').text($li.text()).data('value', $li.data('value'));
      $li.parent().hide();
      return;
    }

    // Default handling for other dropdowns
    $li.siblings().removeClass("selected-option");
    $li.addClass("selected-option");
    $li.parent().hide();

    var txt = $li.text();
    var val = $li.data("value") || txt;

    var $selectVal = $container.find(".lh-select-value");
    $selectVal.text(txt);

    var i = $selectVal.data("index");

    if (typeof i !== 'undefined' && list && list[i]) {
      if (type === 'protocol') {
        var cleanVal = cleanProtocol(val);
        list[i].protocol = cleanVal;
        var $badge = $li.closest('.proxy-card').find('.proxy-type-badge');
        $badge.text(cleanVal.toUpperCase()).removeClass('http https socks5').addClass(cleanVal);

        var isSocks5 = cleanVal === 'socks5';
        var disableAuth = !isFirefox && isSocks5;
        var $formGrid = $li.closest('.proxy-body-container');
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

  // Storage change listener
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local') {
      if (changes.scenarios || changes.currentScenarioId) {
        chrome.storage.local.get(['scenarios', 'currentScenarioId'], function (res) {
          if (res.scenarios) {
            scenarios = res.scenarios;
          }
          if (res.currentScenarioId) {
            currentScenarioId = res.currentScenarioId;
          }
          renderScenarioSelector();
        });
      }
      if (changes.list) {
        chrome.storage.local.get(['currentScenarioId'], function (res) {
          const scenario = scenarios.find(s => s.id === (res.currentScenarioId || currentScenarioId));
          if (scenario) {
            list = scenario.proxies || [];
            renderList();
          }
        });
      }
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
      var $newItem = $(".proxy-card").last();
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
      var $item = $(`.proxy-card[data-id="${index}"]`);

      // Sync latest values from DOM just in case
      proxy.name = $item.find('.name').val();
      proxy.protocol = cleanProtocol($item.find('.lh-select-value[data-index="' + index + '"]').closest('.lh-select[data-type="protocol"]').find('.lh-select-op li.selected-option').data('value') || proxy.protocol);
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

  // Open Sync Config Popup
  $("#open-sync-config-btn").on("click", function () {
    updateSyncUI();
    $(".sync-config-tip").show().addClass("show");
  });

  // Sync Mode Selection in Popup
  $(".sync-selector .lh-select-op li").on("click", function () {
    const type = $(this).data("value");
    syncConfig.type = type;
    updateSyncUI();
    $(this).closest('.lh-select-op').hide();
  });

  // Gist Token Eye Toggle
  $("#gist-token-eye input").on("change", function () {
    var isChecked = $(this).prop("checked");
    var $input = $("#gist-token");
    $input.attr("type", isChecked ? "text" : "password");
    var $toggle = $(this).parent();
    if (isChecked) $toggle.removeClass('hide-password').addClass('show-password');
    else $toggle.removeClass('show-password').addClass('hide-password');
  });

  // Save Sync Config
  $("#save-sync-config").on("click", function () {
    // Update config object from inputs
    if (syncConfig.type === 'gist') {
      syncConfig.gist.token = $("#gist-token").val();
      syncConfig.gist.filename = $("#gist-filename").val() || 'proxy_assistant_config.json';
    }

    chrome.storage.local.set({ sync_config: syncConfig }, function () {
      showTip(I18n.t('save_success'), false);
      $(".sync-config-tip").removeClass("show");
      setTimeout(function () { $(".sync-config-tip").hide(); }, 300);
      updateSyncUI();
    });
  });

  // Manual Sync Buttons
  $("#sync-pull-btn").on("click", function () {
    manualPull();
  });

  $("#sync-push-btn").on("click", function () {
    manualPush();
  });

  // Test Connection Button
  $("#test-sync-connection").on("click", async function () {
    var $btn = $(this);
    var originalText = $btn.find('span').text();
    $btn.prop('disabled', true).find('span').text(I18n.t('testing'));

    try {
      let resultMsg = "";
      if (syncConfig.type === 'gist') {
        // Temporarily update config from inputs for testing
        syncConfig.gist.token = $("#gist-token").val();
        syncConfig.gist.filename = $("#gist-filename").val() || 'proxy_assistant_config.json';
        resultMsg = await testGistConnection();
      }

      showTip(resultMsg, false);

    } catch (e) {
      showTip(I18n.t('test_failed') + ": " + e.message, true);
    } finally {
      $btn.prop('disabled', false).find('span').text(originalText);
    }
  });

  // Close Sync Popup
  $(".sync-config-close-btn, .sync-config-tip").on("click", function (e) {
    if (this === e.target || $(this).hasClass('sync-config-close-btn')) {
      $(".sync-config-tip").removeClass("show");
      setTimeout(function () { $(".sync-config-tip").hide(); }, 300);
    }
  });

  // Expand/Collapse All
  $("#expand-collapse-btn").on("click", function () {
    var $btn = $(this);
    var isExpanded = $btn.hasClass("expanded");

    if (isExpanded) {
      $(".proxy-card").addClass("collapsed");
      $btn.removeClass("expanded");
      $btn.html(`<svg class="icon-expand" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg> <span data-i18n="expand_all">${I18n.t('expand_all')}</span>`);
    } else {
      $(".proxy-card").removeClass("collapsed");
      $btn.addClass("expanded");
      $btn.html(`<svg class="icon-collapse" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg> <span data-i18n="collapse_all">${I18n.t('collapse_all')}</span>`);
    }
  });

  // Export/Import Events
  $(".export-btn").on("click", exportConfig);
  $(".import-json-btn").on("click", function () { $("#json-file-input").click(); });
  $("#json-file-input").on("change", importConfig);

  // Detect/PAC Buttons
  $("#detect-proxy-btn").on("click", detectProxy);
  $("#pac-details-btn").on("click", showPacDetails);

  // Scenario dropdown is handled by initDropdowns()
  // The button now shows a dropdown for scenario selection
  $(".scenario-manage-close-btn, .scenario-manage-tip").on("click", function (e) {
    if (this === e.target || $(this).hasClass('scenario-manage-close-btn')) {
      $(".scenario-manage-tip").removeClass("show");
      setTimeout(function () { $(".scenario-manage-tip").hide(); }, 300);
    }
  });

  $("#add-scenario-btn").on("click", function () {
    const name = $("#new-scenario-name").val().trim();
    if (addScenario(name)) {
      $("#new-scenario-name").val("");
    }
  });

  // Edit Scenario Modal Events
  let editingScenarioId = null;
  $(".edit-scenario-close-btn, .edit-scenario-cancel-btn, .edit-scenario-tip").on("click", function (e) {
    if (this === e.target || $(this).hasClass('edit-scenario-close-btn') || $(this).hasClass('edit-scenario-cancel-btn')) {
      $(".edit-scenario-tip").removeClass("show");
      setTimeout(function () { $(".edit-scenario-tip").hide(); }, 300);
      editingScenarioId = null;
    }
  });

  $("#confirm-edit-scenario-btn").on("click", function () {
    const newName = $("#edit-scenario-name").val().trim();
    if (editingScenarioId) {
      renameScenario(editingScenarioId, newName);
      $(".edit-scenario-tip").removeClass("show");
      setTimeout(function () { $(".edit-scenario-tip").hide(); }, 300);
      editingScenarioId = null;
    }
  });

  // Delete Scenario Modal Events
  let deletingScenarioId = null;
  $(".delete-scenario-close-btn, .delete-scenario-cancel-btn, .delete-scenario-tip").on("click", function (e) {
    if (this === e.target || $(this).hasClass('delete-scenario-close-btn') || $(this).hasClass('delete-scenario-cancel-btn')) {
      $(".delete-scenario-tip").removeClass("show");
      setTimeout(function () { $(".delete-scenario-tip").hide(); }, 300);
      deletingScenarioId = null;
    }
  });

  $("#confirm-delete-scenario-btn").on("click", function () {
    if (deletingScenarioId) {
      doDeleteScenario(deletingScenarioId);
      $(".delete-scenario-tip").removeClass("show");
      setTimeout(function () { $(".delete-scenario-tip").hide(); }, 300);
      deletingScenarioId = null;
    }
  });

  // Alert Modal Events
  $(".alert-scenario-close-btn, .alert-scenario-tip, #alert-scenario-ok-btn").on("click", function (e) {
    if (this === e.target || $(this).hasClass('alert-scenario-close-btn') || $(this).is("#alert-scenario-ok-btn")) {
      $(".alert-scenario-tip").removeClass("show");
      setTimeout(function () { $(".alert-scenario-tip").hide(); }, 300);
    }
  });

  // Scenario List Actions (Delete/Edit)
  $("#scenario-manage-list").on("click", ".delete-scenario-btn", function () {
    const id = $(this).data("id");
    const scenario = scenarios.find(s => s.id === id);
    if (scenario && scenario.proxies && scenario.proxies.length > 0) {
      showAlertScenario(I18n.t('scenario_delete_not_empty'));
      return;
    }
    deletingScenarioId = id;
    $("#delete-scenario-message").html(`${I18n.t('scenario_delete_confirm')}<br><span style="color: #ef4444; font-weight: 600; margin-top: 10px; display: block; text-align: center; font-size: 16px;">${escapeHtml(scenario.name)}</span>`);
    $(".delete-scenario-tip").show().addClass("show");
  });

  $("#scenario-manage-list").on("click", ".edit-scenario-btn", function () {
    const id = $(this).data("id");
    const oldName = $(this).data("name");
    editingScenarioId = id;
    $("#edit-scenario-oldname").text(escapeHtml(oldName));
    $("#edit-scenario-name").val(oldName);
    $("#edit-scenario-name").removeClass('input-error');
    $(".edit-scenario-tip").show().addClass("show");
    setTimeout(() => $("#edit-scenario-name").focus(), 100);
  });

  // Move Proxy Modal Events
  $(".move-proxy-close-btn, .move-proxy-cancel-btn, .move-proxy-tip").on("click", function (e) {
    if (this === e.target || $(this).hasClass('move-proxy-close-btn') || $(this).hasClass('move-proxy-cancel-btn')) {
      $(".move-proxy-tip").removeClass("show");
      setTimeout(function () { $(".move-proxy-tip").hide(); }, 300);
    }
  });

  $("#confirm-move-proxy-btn").on("click", function () {
    const targetScenarioId = $("#target-scenario-display").data("value");
    if (targetScenarioId && move_proxy_index !== -1) {
      moveProxy(move_proxy_index, targetScenarioId);
      $(".move-proxy-tip").removeClass("show");
      setTimeout(function () { $(".move-proxy-tip").hide(); }, 300);
    }
  });

  // ESC Key Support for Popups
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      var popupOrder = [
        '.edit-scenario-tip',
        '.delete-scenario-tip',
        '.move-proxy-tip',
        '.alert-scenario-tip',
        '.scenario-manage-tip',
        '.sync-config-tip',
        '.pac-details-tip',
        '.proxy-detection-tip',
        '.delete-tip'
      ];

      for (var i = 0; i < popupOrder.length; i++) {
        var $popup = $(popupOrder[i]);
        if ($popup.hasClass('show')) {
          $popup.removeClass("show");
          setTimeout(function (popup) {
            return function () { popup.hide(); };
          }($popup), 300);
          return;
        }
      }
    }
  });

  // Scenario Manage Button
  $("#scenario-manage-btn").on("click", function () {
    renderScenarioManagementList();
    $(".scenario-manage-tip").show().addClass("show");
  });
}

// ==========================================
// Scenario Logic
// ==========================================

function renderScenarioSelector() {
  var html = "";
  var currentScenarioName = "";

  scenarios.forEach(function (scenario) {
    const isCurrent = scenario.id === currentScenarioId;
    const proxyCount = scenario.proxies ? scenario.proxies.length : 0;
    const cssClass = isCurrent ? 'current-scenario' : '';
    html += `<li data-value="${scenario.id}" class="${cssClass}">
      <span class="scenario-name">${escapeHtml(scenario.name)}</span>
      <span class="scenario-count">${proxyCount}</span>
    </li>`;
    if (scenario.id === currentScenarioId) {
      currentScenarioName = scenario.name;
    }
  });

  $(".main-scenario-dropdown").html(html);
  $(".main-scenario-btn").attr("title", `${I18n.t("switch_scenario_tooltip")} (${currentScenarioName || I18n.t('scenario_default')})`);
  $("#current-scenario-indicator").text(currentScenarioName || I18n.t('scenario_default'));
}

function switchScenario(id) {
  if (currentScenarioId === id) return;

  const scenario = scenarios.find(s => s.id === id);
  if (scenario) {
    currentScenarioId = id;
    list = scenario.proxies || [];

    // Save state immediately
    chrome.storage.local.set({
      currentScenarioId: currentScenarioId,
      list: list // Sync list for worker/popup compatibility
    });

    renderList();
    renderScenarioSelector();
  }
}

function renderScenarioManagementList() {
  var html = "";
  scenarios.forEach(function (scenario, index) {
    const isCurrent = scenario.id === currentScenarioId;
    const proxyCount = (scenario.proxies || []).length;
    const isFirst = index === 0;
    const isLast = index === scenarios.length - 1;

    html += `
      <div class="scenario-item" data-id="${scenario.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="sort-buttons" style="display: flex; flex-direction: column; gap: 0px;">
            ${!isFirst ? `<button class="move-up-btn" data-id="${scenario.id}" style="border: none; background: none; color: var(--text-secondary); cursor: pointer; padding: 0px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>` : ''}
            ${!isLast ? `<button class="move-down-btn" data-id="${scenario.id}" style="border: none; background: none; color: var(--text-secondary); cursor: pointer; padding: 0px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>` : ''}
          </div>
          <span style="font-weight: 500; color: var(--text-primary);">${escapeHtml(scenario.name)}</span>
          <span style="font-size: 12px; color: var(--text-secondary); background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${proxyCount}</span>
          ${isCurrent ? '<span style="font-size: 12px; color: var(--accent-color);">(' + I18n.t('status_current') + ')</span>' : ''}
        </div>
        <div class="scenario-actions">
          <button class="edit-scenario-btn" data-id="${scenario.id}" data-name="${escapeHtml(scenario.name)}" style="border: none; background: none; color: var(--text-secondary); cursor: pointer; padding: 4px; margin-right: 4px;" title="${I18n.t('scenario_edit')}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="delete-scenario-btn" data-id="${scenario.id}" style="border: none; background: none; color: #ef4444; cursor: pointer; padding: 4px;" title="${I18n.t('delete')}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  });
  $("#scenario-manage-list").html(html);

  // Bind move buttons
  $("#scenario-manage-list").off("click", ".move-up-btn").on("click", ".move-up-btn", function () {
    const scenarioId = $(this).data("id");
    moveScenarioUp(scenarioId);
  });

  $("#scenario-manage-list").off("click", ".move-down-btn").on("click", ".move-down-btn", function () {
    const scenarioId = $(this).data("id");
    moveScenarioDown(scenarioId);
  });
}

function addScenario(name, callback) {
  if (!name) {
    showAlertScenario(I18n.t('scenario_name_required'));
    return false;
  }

  if (/\s/.test(name)) {
    showAlertScenario(I18n.t('alert_scenario_name_spaces'));
    return false;
  }

  if (scenarios.some(s => s.name === name)) {
    showAlertScenario(I18n.t('scenario_name_duplicate'));
    return false;
  }

  const newId = 'scenario_' + Date.now();
  scenarios.push({
    id: newId,
    name: name,
    proxies: []
  });

  saveData();
  renderScenarioManagementList();
  renderScenarioSelector();
  if (callback) callback();
  return true;
}

function renameScenario(id, newName) {
  if (!newName) {
    showAlertScenario(I18n.t('scenario_name_required'));
    return;
  }

  if (/\s/.test(newName)) {
    showAlertScenario(I18n.t('alert_scenario_name_spaces'));
    return;
  }

  // Check duplicate (excluding self)
  if (scenarios.some(s => s.name === newName && s.id !== id)) {
    showAlertScenario(I18n.t('scenario_name_duplicate'));
    return;
  }

  const scenario = scenarios.find(s => s.id === id);
  if (scenario) {
    scenario.name = newName;
    saveData();
    renderScenarioManagementList();
    renderScenarioSelector();
  }
}

function doDeleteScenario(id) {
  const scenarioIndex = scenarios.findIndex(s => s.id === id);
  if (scenarioIndex === -1) return;

  // If deleting current scenario, switch to another one first
  if (id === currentScenarioId) {
    // Find another scenario
    let nextScenario = scenarios.find(s => s.id !== id);
    if (!nextScenario) {
      // If this is the last scenario, create a default one or block deletion
      if (scenarios.length === 1) {
        // Re-init default
        scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: [] }];
        currentScenarioId = 'default';
        list = [];
        saveData();
        renderScenarioManagementList();
        renderScenarioSelector();
        renderList();
        return;
      } else {
        switchScenario(nextScenario.id);
      }
    } else {
      switchScenario(nextScenario.id);
    }
  }

  scenarios.splice(scenarioIndex, 1);
  saveData();
  renderScenarioManagementList();
  renderScenarioSelector();
}

function showAlertScenario(message) {
  $("#alert-scenario-message").text(message);
  $(".alert-scenario-tip").show().addClass("show");
}

function moveProxy(proxyIndex, targetScenarioId) {
  if (proxyIndex === -1 || !list[proxyIndex]) return;
  if (targetScenarioId === currentScenarioId) return;

  const targetScenario = scenarios.find(s => s.id === targetScenarioId);
  if (!targetScenario) return;

  const proxy = list[proxyIndex];

  // Check name conflict in target (Global check already covers this, but double check is safe)
  // Actually, user requires global uniqueness. If it's unique now, it's unique everywhere.
  // BUT, if we are moving, we need to make sure we don't duplicate logic.

  // Remove from current list
  list.splice(proxyIndex, 1);

  // Add to target
  if (!targetScenario.proxies) targetScenario.proxies = [];
  targetScenario.proxies.push(proxy);

  saveData();
  renderList();
  showTip(I18n.t('move_success'), false);
}

// Global Uniqueness Check
function checkNameGlobalUniqueness(name, excludeProxyIndex, excludeScenarioId) {
  for (const scenario of scenarios) {
    if (!scenario.proxies) continue;

    for (let i = 0; i < scenario.proxies.length; i++) {
      const p = scenario.proxies[i];
      // If checking current scenario and index matches, skip (editing self)
      if (scenario.id === excludeScenarioId && i === excludeProxyIndex) continue;

      if (p.name === name) {
        return {
          isDuplicate: true,
          scenarioName: scenario.name
        };
      }
    }
  }
  return { isDuplicate: false };
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

    html += `<div class="proxy-card ${collapsedClass} ${is_disabled ? "disabled" : ""}" data-id="${i}">
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
                              <div class="lh-select-k">
                                  <span class="lh-select-value" data-index="${i}">${displayProtocol}</span>
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
                              <div class="lh-select-k">
                                  <span class="lh-select-value" data-index="${i}">${displayFallback}</span>
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
                   <button class="right-panel-btn btn-test test-proxy-btn" data-index="${i}" tabindex="-1">
                        ${I18n.t('link_test')}
                   </button>
                   <button class="right-panel-btn btn-move move-proxy-btn" data-index="${i}" title="${I18n.t('move_proxy_title')}">
                        ${I18n.t('move_proxy')}
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
  $("#proxy-list").html(html);

  initDropdowns(); // Re-bind dropdowns in list
  initSortable();
  bindItemEvents();

  // Bind Move Button
  $(".move-proxy-btn").on("click", function () {
    move_proxy_index = $(this).data("index");
    var proxy = list[move_proxy_index];
    var currentScenario = scenarios.find(s => s.id === currentScenarioId);
    $("#current-scenario-display").text(currentScenario ? currentScenario.name : I18n.t('scenario_default'));

    // Populate modal with other scenarios
    var html = "";
    var hasOptions = false;
    scenarios.forEach(function (scenario) {
      if (scenario.id !== currentScenarioId) {
        html += `<li data-value="${scenario.id}">${escapeHtml(scenario.name)}</li>`;
        hasOptions = true;
      }
    });

    if (!hasOptions) {
      html = `<li class="disabled" style="color: var(--text-secondary); cursor: not-allowed; font-style: italic; padding: 8px 12px;">无其他场景可用</li>`;
    }

    $("#target-scenario-options").html(html);
    $("#target-scenario-display").text("请选择").removeData("value");
    $(".move-proxy-tip").show().addClass("show");
  });
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
      $(".delete-tip-content").html(`${I18n.t('delete_proxy_confirm')}<br><span style="color: #e11d48; font-weight: 600; margin-top: 10px; display: block;">${previewText}</span>`);
      $(".delete-tip").show().addClass("show");
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
      var $item = $(`.proxy-card[data-id="${i}"]`);
      list[i].name = $item.find('.name').val();
      list[i].protocol = cleanProtocol($item.find('.lh-select-value').text());
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
      const $item = $(this).closest('.proxy-card');
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
    $(this).closest('.proxy-card').toggleClass("collapsed");
  });
}

function initSortable() {
  const container = document.getElementById('proxy-list');
  let dragItem = null;
  const items = container.querySelectorAll('.proxy-card');

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
      const newItems = Array.from(container.querySelectorAll('.proxy-card'));
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
      const target = e.target.closest('.proxy-card');
      if (target && target !== dragItem) {
        const rect = target.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        container.insertBefore(dragItem, next ? target.nextSibling : target);
      }
    });
  });
}



function moveScenarioUp(scenarioId) {
  const index = scenarios.findIndex(s => s.id === scenarioId);
  if (index > 0) {
    [scenarios[index], scenarios[index - 1]] = [scenarios[index - 1], scenarios[index]];
    renderScenarioManagementList();
    saveData();
  }
}

function moveScenarioDown(scenarioId) {
  const index = scenarios.findIndex(s => s.id === scenarioId);
  if (index < scenarios.length - 1) {
    [scenarios[index], scenarios[index + 1]] = [scenarios[index + 1], scenarios[index]];
    renderScenarioManagementList();
    saveData();
  }
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
        $(`.proxy-card[data-id="${i}"] .proxy-title-preview`).text(previewText).attr('title', previewText);
      }
    }
  }
}

function saveData() {
  // Update the current scenario in the scenarios array with current list state
  const scenario = scenarios.find(s => s.id === currentScenarioId);
  if (scenario) {
    scenario.proxies = list;
  }

  chrome.storage.local.set({
    scenarios: scenarios,
    currentScenarioId: currentScenarioId,
    list: list // Sync current list for background worker compatibility
  }, function () {
    if (chrome.runtime.lastError) {
      console.error("Local save failed:", chrome.runtime.lastError);
      showTip(I18n.t('save_failed'), true);
      return;
    }

    showTip(I18n.t('save_success'), false);
    chrome.runtime.sendMessage({ action: "refreshProxy" });

    // Update quota info if sync config popup is open and native mode is selected
    if ($(".sync-config-tip").hasClass("show") && syncConfig.type === 'native') {
      updateNativeQuotaInfo();
    }
  });
  save = true;
}

function saveSingleProxy(i) {
  var info = list[i];
  if (!info) return;

  var isNameValid = info.name.trim() !== '';

  // Check global uniqueness
  const conflict = checkNameGlobalUniqueness(info.name, i, currentScenarioId);
  if (conflict.isDuplicate) {
    isNameValid = false;
  }

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

  var $item = $(`.proxy-card[data-id="${i}"]`);

  if (isNameValid) $item.find('.name').removeClass('input-error'); else $item.find('.name').addClass('input-error');
  if (isIpValid) $item.find('.ip').removeClass('input-error'); else $item.find('.ip').addClass('input-error');
  if (isPortValid) $item.find('.port').removeClass('input-error'); else $item.find('.port').addClass('input-error');
  if (isIncludeUrlsValid) $item.find('.include_urls').removeClass('input-error'); else $item.find('.include_urls').addClass('input-error');

  if (!isNameValid || !isIpValid || !isPortValid || !isIncludeUrlsValid) {
    var failMsg = I18n.t('save_failed');
    if (!isNameValid) {
      if (conflict.isDuplicate) {
        showTip(failMsg + I18n.t('global_name_conflict').replace('{name}', info.name).replace('{scenario}', conflict.scenarioName), true);
      } else {
        showTip(failMsg + I18n.t('alert_name_required'), true);
      }
    }
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
  var $item = $(`.proxy-card[data-id="${i}"]`);
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

// Unified function to build config data object
function buildConfigData() {
  // Sync list back to current scenario before building
  const currentScenario = scenarios.find(s => s.id === currentScenarioId);
  if (currentScenario) {
    currentScenario.proxies = list;
  }

  // Clear sensitive fields (token and password) for export
  var syncForExport = {
    type: syncConfig.type,
    gist: {
      token: '',
      filename: syncConfig.gist.filename || 'proxy_assistant_config.json',
      gist_id: ''
    }
  };

  return {
    version: 2,
    system: {
      appLanguage: I18n.getCurrentLanguage(),
      themeMode: themeMode,
      nightModeStart: nightModeStart,
      nightModeEnd: nightModeEnd,
      sync: syncForExport
    },
    currentScenarioId: currentScenarioId,
    scenarios: scenarios
  };
}

function exportConfig() {
  var configBundle = buildConfigData();
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
      if (data) {
        // Handle V2 Import
        if (data.scenarios) {
          scenarios = data.scenarios;
          currentScenarioId = data.currentScenarioId || 'default';
          updateCurrentListFromScenario();
        }
        // Handle V1 Import (fallback)
        else if (data.proxies && Array.isArray(data.proxies)) {
          list = data.proxies.map(p => ({ ...p, protocol: cleanProtocol(p.protocol || p.type || 'http') }));
          scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: list }];
          currentScenarioId = 'default';
        } else if (Array.isArray(data)) {
          // Plain array import
          list = data.map(p => ({ ...p, protocol: cleanProtocol(p.protocol || p.type || 'http') }));
          scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: list }];
          currentScenarioId = 'default';
        } else {
          alert(I18n.t('alert_invalid_format'));
          return;
        }

        var systemData = data.system;
        if (systemData) {
          if (systemData.auto_sync !== undefined) {
            chrome.storage.local.set({ auto_sync: systemData.auto_sync });
          }
          if (systemData.appLanguage) {
            I18n.setLanguage(systemData.appLanguage);
            $('#current-language-display').text($(`#language-options li[data-value="${systemData.appLanguage}"]`).text());
          }
          if (systemData.themeMode) {
            themeMode = systemData.themeMode;
            if (systemData.nightModeStart) nightModeStart = systemData.nightModeStart;
            if (systemData.nightModeEnd) nightModeEnd = systemData.nightModeEnd;
            saveThemeSettings();
            updateThemeUI();
          }
          if (systemData.sync) {
            syncConfig = systemData.sync;
            chrome.storage.local.set({ sync_config: syncConfig });
            updateSyncUI();
          }
        }
        save = false;
        renderList();
        renderScenarioSelector();
        saveData();
        showTip(I18n.t('save_success'), false);
      }
    } catch (err) {
      alert(I18n.t('alert_parse_error') + err.message);
    }
    $("#json-file-input").val("");
  };
  reader.readAsText(file);
}

// ==========================================
// Popups (Delete, Proxy Detection, PAC)
// ==========================================

// Delete Popup
$(".delete-tip-close-btn, .delete-tip-cancel-btn, .delete-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('delete-tip-close-btn') || $(this).hasClass('delete-tip-cancel-btn')) {
    $(".delete-tip").removeClass("show");
    setTimeout(function () { $(".delete-tip").hide(); }, 300);
  }
});

$(".delete-tip-confirm-btn").on("click", function () {
  $(".delete-tip").removeClass("show");
  setTimeout(function () { $(".delete-tip").hide(); }, 300);

  if (del_index !== undefined && del_index >= 0 && list[del_index]) {
    list.splice(del_index, 1);
    chrome.storage.local.set({ list: list }, function () {
      chrome.runtime.sendMessage({ action: "refreshProxy" });
    });
    renderList();
  }
});

$(".delete-tip").hide();

// Proxy Detection
async function detectProxy() {
  var $btn = $("#detect-proxy-btn");
  $btn.prop("disabled", true);

  $("#detection-status-icon").html(detectionIcons.loading);
  $("#detection-status-text").text(I18n.t('proxy_effect_testing'));
  $("#detection-details, #detection-warning, #detection-suggestion").hide();
  $(".proxy-detection-tip").show().addClass("show");

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

$(".proxy-detection-close-btn, .proxy-detection-close-btn-secondary, .proxy-detection-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('proxy-detection-close-btn') || $(this).hasClass('proxy-detection-close-btn-secondary')) {
    $(".proxy-detection-tip").removeClass("show");
    setTimeout(function () { $(".proxy-detection-tip").hide(); }, 300);
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
  $(".pac-details-tip").show().addClass("show");
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

$(".pac-details-close-btn, .pac-details-close-btn-secondary, .pac-details-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('pac-details-close-btn') || $(this).hasClass('pac-details-close-btn-secondary')) {
    if (pacStorageListener) { chrome.storage.onChanged.removeListener(pacStorageListener); pacStorageListener = null; }
    $(".pac-details-tip").removeClass("show");
    setTimeout(function () { $(".pac-details-tip").hide(); }, 300);
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

$(".pac-details-tip").hide();

// ==========================================
// Sync Logic (Native + Gist)
// ==========================================

// Constants for native sync chunked storage
const SYNC_CHUNK_SIZE = 7 * 1024; // 7KB per chunk (leaving 1KB headroom for overhead)

// ==========================================
// Chunked Storage Helpers
// ==========================================

/**
 * Split a string into chunks of specified size
 * @param {string} str - The string to split
 * @param {number} size - Chunk size in bytes
 * @returns {string[]} Array of chunks
 */
function chunkString(str, size) {
  const chunks = [];
  let i = 0;
  while (i < str.length) {
    chunks.push(str.substring(i, i + size));
    i += size;
  }
  return chunks;
}

/**
 * Calculate simple checksum for data integrity verification
 * @param {string} str - String to checksum
 * @returns {string} Simple checksum hash
 */
function calculateChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'crc:' + Math.abs(hash).toString(16);
}

/**
 * Build metadata for chunked storage
 * @param {string[]} chunks - Array of data chunks
 * @returns {object} Metadata object
 */
function buildSyncMeta(chunks) {
  const totalSize = chunks.reduce((sum, chunk) => sum + new Blob([chunk]).size, 0);
  const fullData = chunks.join('');
  return {
    version: 1,
    chunks: {
      start: 0,
      end: chunks.length - 1
    },
    totalSize: totalSize,
    checksum: calculateChecksum(fullData)
  };
}

/**
 * Validate metadata structure
 * @param {object} meta - Metadata to validate
 * @returns {boolean} True if valid
 */
function isValidMeta(meta) {
  return meta &&
    typeof meta.version === 'number' &&
    meta.chunks &&
    typeof meta.chunks.start === 'number' &&
    typeof meta.chunks.end === 'number' &&
    typeof meta.checksum === 'string';
}

// ==========================================
// Native Sync Push (Chunked)
// ==========================================

async function nativePush(data) {
  // 1. Serialize and chunk the data
  const jsonStr = JSON.stringify(data);
  const chunks = chunkString(jsonStr, SYNC_CHUNK_SIZE);

  // 2. Build metadata
  const meta = buildSyncMeta(chunks);

  // 3. Build write object with all chunks and meta
  const toWrite = { 'meta': meta };
  chunks.forEach((chunk, index) => {
    toWrite['data.' + index] = chunk;
  });

  // 4. Clear all existing sync data first
  await new Promise((resolve, reject) => {
    chrome.storage.sync.clear(function () {
      if (chrome.runtime.lastError) {
        reject(new Error('Clear failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });

  // 5. Atomically write all new data
  await new Promise((resolve, reject) => {
    chrome.storage.sync.set(toWrite, function () {
      if (chrome.runtime.lastError) {
        reject(new Error('Write failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });

  return {
    chunks: chunks.length,
    totalSize: meta.totalSize
  };
}

// ==========================================
// Native Sync Pull (Chunked)
// ==========================================

async function nativePull() {
  // 1. Read metadata first
  const metaResult = await new Promise((resolve, reject) => {
    chrome.storage.sync.get('meta', function (items) {
      if (chrome.runtime.lastError) {
        reject(new Error('Read meta failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve(items);
      }
    });
  });

  const meta = metaResult.meta;

  // 2. Validate metadata
  if (!isValidMeta(meta)) {
    throw new Error('Invalid or missing metadata');
  }

  // 3. Build keys list for all chunks
  const keys = ['meta'];
  for (let i = meta.chunks.start; i <= meta.chunks.end; i++) {
    keys.push('data.' + i);
  }

  // 4. Read all chunks
  const items = await new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error('Read chunks failed: ' + chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });

  // 5. Verify all chunks exist
  for (let i = meta.chunks.start; i <= meta.chunks.end; i++) {
    if (!items['data.' + i]) {
      throw new Error('Missing chunk: data.' + i);
    }
  }

  // 6. Merge chunks and validate checksum
  const mergedData = [];
  for (let i = meta.chunks.start; i <= meta.chunks.end; i++) {
    mergedData.push(items['data.' + i]);
  }
  const fullData = mergedData.join('');

  // Verify checksum
  const calculatedChecksum = calculateChecksum(fullData);
  if (calculatedChecksum !== meta.checksum) {
    throw new Error('Checksum mismatch - data may be corrupted');
  }

  // 7. Parse and return
  return JSON.parse(fullData);
}

// ==========================================
// Manual Sync Handlers
// ==========================================

async function manualPush() {
  const type = syncConfig.type || 'native';
  var $btn = $("#sync-push-btn");
  $btn.prop('disabled', true);

  // Use unified config data builder
  const data = buildConfigData();

  try {
    if (type === 'native') {
      const result = await nativePush(data);
      console.log('Native sync: Pushed ' + result.chunks + ' chunks, ' + result.totalSize + ' bytes');
    } else if (type === 'gist') {
      await pushToGist(data);
    }
    showTip(I18n.t('sync_success'), false);
  } catch (e) {
    console.error("Sync Push Error:", e);
    showTip(I18n.t('sync_failed') + (e.message || e), true);
  } finally {
    $btn.prop('disabled', false);
  }
}

async function manualPull() {
  const type = syncConfig.type || 'native';
  var $btn = $("#sync-pull-btn");
  $btn.prop('disabled', true);

  try {
    let remoteData = null;

    if (type === 'native') {
      remoteData = await nativePull();
    } else if (type === 'gist') {
      remoteData = await pullFromGist();
    }

    if (remoteData) {
      console.log("Sync: Pulled data from " + type);

      // Support both V1 (proxies at top) and V2 (scenarios)
      let hasData = false;
      let toSave = {};

      if (remoteData.scenarios && Array.isArray(remoteData.scenarios)) {
        toSave.scenarios = remoteData.scenarios;
        toSave.currentScenarioId = remoteData.currentScenarioId || 'default';
        const currentScenario = remoteData.scenarios.find(s => s.id === toSave.currentScenarioId) || remoteData.scenarios[0];
        toSave.list = currentScenario ? currentScenario.proxies : [];
        hasData = true;
      } else if (remoteData.proxies && Array.isArray(remoteData.proxies)) {
        toSave.list = remoteData.proxies;
        toSave.scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: remoteData.proxies }];
        toSave.currentScenarioId = 'default';
        hasData = true;
      }

      if (hasData) {
        if (remoteData.settings) {
          toSave.themeSettings = remoteData.settings;
        }

        chrome.storage.local.set(toSave, function () {
          if (chrome.runtime.lastError) {
            showTip(I18n.t('sync_failed') + chrome.runtime.lastError.message, true);
            return;
          }
          // Reload UI using the remote structure
          loadFromLocal(remoteData);
          showTip(I18n.t('sync_success'), false);
        });
      } else {
        showTip(I18n.t('sync_failed') + "No valid data found", true);
      }
    } else {
      showTip(I18n.t('sync_failed') + "No data found", true);
    }
  } catch (e) {
    console.error("Sync Pull Error:", e);
    showTip(I18n.t('sync_failed') + (e.message || e), true);
  } finally {
    $btn.prop('disabled', false);
  }
}

// --- GitHub Gist Implementation ---

async function pushToGist(data) {
  const token = syncConfig.gist.token;
  const filename = syncConfig.gist.filename || 'proxy_assistant_config.json';
  if (!token) return;

  // First validate the token by checking user info
  const validateResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!validateResponse.ok) {
    if (validateResponse.status === 401) throw new Error(I18n.t('sync_error_invalid_token'));
    throw new Error(I18n.t('sync_error_connection') + validateResponse.status);
  }

  const content = JSON.stringify(data, null, 2);

  let gistId = syncConfig.gist.gist_id;
  let fileExists = false;

  // If gist_id exists, check if the gist contains the specified file
  if (gistId) {
    try {
      const gistContent = await getGistContent(token, gistId, filename);
      if (gistContent) {
        fileExists = true;
      }
    } catch (e) {
      console.warn("Gist not found or inaccessible, will try to find or create:", e);
      gistId = null; // Reset gist_id, search or create again
    }
  }

  // If no gist_id or file doesn't exist, try to find gist containing the file
  if (!gistId || !fileExists) {
    gistId = await findGistByFilename(token, filename);
    if (gistId) {
      fileExists = true;
      syncConfig.gist.gist_id = gistId;
      chrome.storage.local.set({ sync_config: syncConfig });
    }
  }

  // Update or create based on the situation
  if (gistId && fileExists) {
    await updateGist(token, gistId, filename, content);
  } else {
    const newId = await createGist(token, filename, content);
    syncConfig.gist.gist_id = newId;
    chrome.storage.local.set({ sync_config: syncConfig });
  }
}

async function pullFromGist() {
  const token = syncConfig.gist.token;
  const filename = syncConfig.gist.filename || 'proxy_assistant_config.json';
  if (!token) return null;

  let gistId = syncConfig.gist.gist_id;

  if (!gistId) {
    gistId = await findGistByFilename(token, filename);
    if (gistId) {
      syncConfig.gist.gist_id = gistId;
      chrome.storage.local.set({ sync_config: syncConfig });
    } else {
      return null;
    }
  }

  return await getGistContent(token, gistId, filename);
}

async function findGistByFilename(token, filename) {
  // Fetch all pages of gists (GitHub returns 30 per page by default)
  let page = 1;
  const perPage = 100;
  let foundGistId = null;

  while (page <= 10 && !foundGistId) { // Limit to 10 pages (1000 gists) max
    const response = await fetch(`https://api.github.com/gists?page=${page}&per_page=${perPage}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Invalid Token");
      if (response.status === 403) {
        // Rate limited - if we already have partial results, try to use them
        console.warn("GitHub API rate limited while searching for gist");
        break;
      }
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const gists = await response.json();

    if (gists.length === 0) {
      // No more gists to check
      break;
    }

    for (const gist of gists) {
      if (gist.files && gist.files[filename]) {
        foundGistId = gist.id;
        break;
      }
    }

    page++;
  }

  return foundGistId;
}

async function createGist(token, filename, content) {
  const files = {};
  files[filename] = { content: content };

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Proxy Assistant Configuration',
      public: false,
      files: files
    })
  });

  if (!response.ok) throw new Error(I18n.t('sync_error_create_gist'));
  const data = await response.json();
  return data.id;
}

async function updateGist(token, gistId, filename, content) {
  const files = {};
  files[filename] = { content: content };

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: files })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gist update error:", response.status, errorText);
    throw new Error(I18n.t('sync_error_update_gist') + ` (${response.status})`);
  }
}

async function getGistContent(token, gistId, filename) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok) throw new Error(I18n.t('sync_error_get_gist'));
  const data = await response.json();

  if (data.files && data.files[filename]) {
    const content = data.files[filename].content;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Parse Gist Content Error", e);
      return null;
    }
  }
  return null;
}

async function testGistConnection() {
  const token = syncConfig.gist.token;
  if (!token) throw new Error(I18n.t('sync_error_token_empty'));

  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error(I18n.t('sync_error_invalid_token'));
    throw new Error(I18n.t('sync_error_connection') + response.status);
  }

  const filename = syncConfig.gist.filename || 'proxy_assistant_config.json';
  const gistId = await findGistByFilename(token, filename);

  if (gistId) {
    syncConfig.gist.gist_id = gistId;
    chrome.storage.local.set({ sync_config: syncConfig });
    return I18n.t('sync_success_found') + filename;
  } else {
    return I18n.t('sync_success_new');
  }
}

// ==========================================
// Utilities
// ==========================================
function showTip(msg, isError) {
  console.log("Show Tip:", msg, isError);
  var $tip = $(".save-success-toast");
  $tip.text(msg);
  if (isError) $tip.addClass("error"); else $tip.removeClass("error");
  $tip.stop(true, true).fadeIn("slow").delay(1000).fadeOut("slow");
  // $tip.css({ visibility: 'visible', opacity: 0 }).stop(true, true).animate({ opacity: 1 }, 300).delay(1000).animate({ opacity: 0 }, 300, function() {
  //   $tip.css({ visibility: 'hidden' });
  // });
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

$(".save-success-toast").hide();

// Spin Animation
var style = document.createElement('style');
style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }';
document.head.appendChild(style);
