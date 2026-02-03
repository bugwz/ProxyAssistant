// ==========================================
// Main Application Logic
// Initialization and coordination of modules
// ==========================================

// ==========================================
// Module Callbacks
// ==========================================
window.onScenarioSwitch = function (id, list) {
  ProxyModule.setList(list);
  ProxyModule.renderList();
};

window.onScenarioAdd = function (id, name) {
  saveConfig();
};

window.onScenarioRename = function (id, newName) {
  saveConfig();
};

window.onScenarioDelete = function (id, isOnlyScenario) {
  const list = StorageModule.getProxies();
  ProxyModule.setList(list);
  ProxyModule.renderList();
  saveConfig();
};

window.onScenariosReorder = function (scenarios) {
  StorageModule.setScenarios(scenarios);
  saveConfig();
};

window.onProxyMove = function (proxyIndex, targetScenarioId, proxy) {
  const list = StorageModule.getProxies();
  ProxyModule.setList(list);
  ProxyModule.renderList();
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
  // Initialize storage module
  StorageModule.init().then(() => {
    LanguageModule.initLanguage();
    ThemeModule.initTheme();
    ScenariosModule.init();
    ProxyModule.init();
    SubscriptionModule.init();
    initDropdowns();
    loadSettings();
    bindGlobalEvents();
  }).catch(err => {
    console.info('Failed to initialize storage:', err);
  });
}

function loadSettings() {
  const config = StorageModule.getConfig();

  // Apply system settings (only if not already loaded by modules)
  if (config.system) {
    // Language settings - only apply if I18n current language matches storage
    if (config.system.app_language && I18n.getCurrentLanguage() !== config.system.app_language) {
      I18n.setLanguage(config.system.app_language);
    }
    const langName = $(`#language-options li[data-value="${config.system.app_language || I18n.getCurrentLanguage()}"]`).text();
    if (langName) $('#current-language-display').text(langName);

    // Theme settings - ThemeModule.loadThemeSettings() handles this in initTheme()
    // We only set night mode times here if not already set
    const nightTimes = config.system.night_mode_start ? {
      start: config.system.night_mode_start,
      end: config.system.night_mode_end || '06:00'
    } : null;
    if (nightTimes) {
      ThemeModule.setNightModeTimes(nightTimes.start, nightTimes.end);
    }

    // Sync settings
    if (config.system.sync) {
      SyncModule.setSyncConfig(config.system.sync);
    }
  }

  // Load proxy list
  const list = StorageModule.getProxies();
  SubscriptionModule.parseProxyListSubscriptions(list);
  ProxyModule.setList(list);

  // Update UI (but don't re-init theme UI since ThemeModule.initTheme() already did it)
  SyncModule.updateSyncUI();
  ProxyModule.renderList();
  ScenariosModule.renderScenarioSelector();
}

function saveConfig(options) {
  options = options || {};

  StorageModule.save().then(() => {
    if (!options.silent) {
      UtilsModule.showTip(options.successMsg || I18n.t('save_success'), false);
    }

    if ($(".sync-config-tip").hasClass("show") && SyncModule.getSyncConfig().type === 'native') {
      SyncModule.updateNativeQuotaInfo();
    }

    if (options.callback) options.callback(true);
  }).catch(err => {
    console.info('Save failed:', err);
    if (!options.silent) {
      UtilsModule.showTip(I18n.t('save_failed'), true);
    }
    if (options.callback) options.callback(false);
  });
}

// ==========================================
// UI Components
// ==========================================
function initDropdowns() {
  $("html").on("click", function () {
    $(".lh-select-op").hide();
  });

  $(document).off("click", ".lh-select-k").on("click", ".lh-select-k", function (e) {
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

  $(document).off("click", ".main-scenario-btn").on("click", ".main-scenario-btn", function (e) {
    e.stopPropagation();
    const $btn = $(this);
    const $op = $btn.siblings('.main-scenario-dropdown');
    const display = $op.css('display');

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
    const $li = $(this);
    const $container = $li.closest('.lh-select');
    const type = $container.data("type");

    if (type === 'main_scenario') {
      const scenarioId = $li.data('value');
      ScenariosModule.switchScenario(scenarioId);
      $li.parent().hide();
      return;
    }

    if ($li.parent().hasClass('main-scenario-dropdown')) {
      const scenarioId = $li.data('value');
      ScenariosModule.switchScenario(scenarioId);
      $li.parent().hide();
      return;
    }

    if ($container.hasClass('target-scenario-selector')) {
      $('#target-scenario-display').text($li.text()).data('value', $li.data('value'));
      $li.parent().hide();
      return;
    }

    $li.siblings().removeClass("selected-option");
    $li.addClass("selected-option");
    $li.parent().hide();

    const txt = $li.text();
    const val = $li.data("value") || txt;

    const $selectVal = $container.find(".lh-select-value");
    $selectVal.text(txt);

    const i = $selectVal.data("index");

    if (typeof i !== 'undefined') {
      const list = StorageModule.getProxies();
      if (list[i]) {
        if (type === 'protocol') {
          const cleanVal = UtilsModule.cleanProtocol(val);
          list[i].protocol = cleanVal;
          const $badge = $li.closest('.proxy-card').find('.proxy-type-badge');
          $badge.text(cleanVal.toUpperCase()).removeClass('http https socks5').addClass(cleanVal);

          const isSocks5 = cleanVal === 'socks5';
          const disableAuth = !isFirefox && isSocks5;
          const $formGrid = $li.closest('.proxy-body-container');
          const $authInputs = $formGrid.find('.username, .password');

          $authInputs.prop('disabled', disableAuth);
          if (!disableAuth) {
            $authInputs.removeAttr('title');
          }
        } else if (type === 'fallback') {
          list[i].fallback_policy = val;
        }
      }
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local' && changes.config) {
      StorageModule.reload().then(() => {
        ProxyModule.setList(StorageModule.getProxies());
        ProxyModule.renderList();
        ScenariosModule.renderScenarioSelector();
      });
    }
  });
}

function bindGlobalEvents() {
  $("#open-sync-config-btn").on("click", function () {
    SyncModule.updateSyncUI();
    $(".sync-config-tip").show().addClass("show");
  });

  $(".sync-selector .lh-select-op li").on("click", function () {
    const type = $(this).data("value");
    const config = SyncModule.getSyncConfig();
    config.type = type;
    SyncModule.setSyncConfig(config);
    SyncModule.updateSyncUI();
    $(this).closest('.lh-select-op').hide();
  });

  $("#gist-token-eye input").on("change", function () {
    const isChecked = $(this).prop("checked");
    const $input = $("#gist-token");
    $input.attr("type", isChecked ? "text" : "password");
    const $toggle = $(this).parent();
    if (isChecked) $toggle.removeClass('hide-password').addClass('show-password');
    else $toggle.removeClass('show-password').addClass('hide-password');
  });

  $("#save-sync-config").on("click", function () {
    UtilsModule.showProcessingTip(I18n.t('processing'));
    const config = SyncModule.getSyncConfig();
    if (config.type === 'gist') {
      config.gist.token = $("#gist-token").val();
      config.gist.filename = $("#gist-filename").val() || 'proxy_assistant_config.json';
    }

    StorageModule.setSyncConfig(config);
    StorageModule.save().then(() => {
      UtilsModule.showTip(I18n.t('save_success'), false);
      $(".sync-config-tip").removeClass("show");
      setTimeout(function () { $(".sync-config-tip").hide(); }, 300);
      SyncModule.updateSyncUI();
    }).catch(() => {
      UtilsModule.showTip(I18n.t('save_failed'), true);
    });
  });

  $("#sync-pull-btn").on("click", function () {
    UtilsModule.showProcessingTip(I18n.t('processing'));
    SyncModule.manualPull();
  });

  $("#sync-push-btn").on("click", function () {
    UtilsModule.showProcessingTip(I18n.t('processing'));
    SyncModule.manualPush();
  });

  $("#test-sync-connection").on("click", async function () {
    const $btn = $(this);
    const originalText = $btn.find('span').text();
    UtilsModule.showProcessingTip(I18n.t('processing'));
    $btn.prop('disabled', true).find('span').text(I18n.t('testing'));

    try {
      let resultMsg = "";
      const config = SyncModule.getSyncConfig();
      if (config.type === 'gist') {
        config.gist.token = $("#gist-token").val();
        config.gist.filename = $("#gist-filename").val() || 'proxy_assistant_config.json';
        SyncModule.setSyncConfig(config);
        resultMsg = await SyncModule.testGistConnection();
      }

      UtilsModule.showTip(resultMsg, false);

    } catch (e) {
      UtilsModule.showTip(I18n.t('test_failed') + ": " + e.message, true);
    } finally {
      $btn.prop('disabled', false).find('span').text(originalText);
    }
  });

  $(".sync-config-close-btn, .sync-config-tip").on("click", function (e) {
    if (this === e.target || $(this).hasClass('sync-config-close-btn')) {
      $(".sync-config-tip").removeClass("show");
      setTimeout(function () { $(".sync-config-tip").hide(); }, 300);
    }
  });

  $(".export-btn").on("click", ConfigModule.exportConfig);
  $(".import-json-btn").on("click", function () { $("#json-file-input").click(); });
  $("#json-file-input").on("change", ConfigModule.importConfig);

  $("#detect-proxy-btn").on("click", DetectionModule.detectProxy);
  $("#pac-details-btn").on("click", DetectionModule.showPacDetails);

  $("#check-version-btn").on("click", VersionModule.showVersionCheck);
  $(".version-check-close-btn, .version-check-tip").on("click", function (e) {
    if (this === e.target || $(this).hasClass('version-check-close-btn')) {
      $(".version-check-tip").removeClass("show");
      setTimeout(function () { $(".version-check-tip").hide(); }, 300);
    }
  });

  $(document).on("click", ".version-row-retry-btn", function () {
    const source = $(this).data("source");
    const currentVersion = chrome.runtime.getManifest().version;
    $(this).prop("disabled", true).text(I18n.t('version_checking'));

    if (source === "github") {
      VersionModule.checkGitHubVersion(currentVersion).finally(() => {
        $(this).prop("disabled", false);
      });
    } else if (source === "store") {
      VersionModule.checkStoreVersion(currentVersion, true).finally(() => {
        $(this).prop("disabled", false);
      });
    }
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      const popupOrder = [
        '.edit-scenario-tip',
        '.delete-scenario-tip',
        '.move-proxy-tip',
        '.alert-scenario-tip',
        '.scenario-manage-tip',
        '.sync-config-tip',
        '.subscription-config-tip',
        '.pac-details-tip',
        '.proxy-detection-tip',
        '.version-check-tip',
        '.delete-tip'
      ];

      for (let i = 0; i < popupOrder.length; i++) {
        const $popup = $(popupOrder[i]);
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
}

// ==========================================
// Popups
// ==========================================

$(".delete-tip-close-btn, .delete-tip-cancel-btn, .delete-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('delete-tip-close-btn') || $(this).hasClass('delete-tip-cancel-btn')) {
    $(".delete-tip").removeClass("show");
    setTimeout(function () { $(".delete-tip").hide(); }, 300);
  }
});

$(".delete-tip-confirm-btn").on("click", function () {
  ProxyModule.confirmDelete();
});

$(".delete-tip").hide();

$(".proxy-detection-close-btn, .proxy-detection-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('proxy-detection-close-btn')) {
    $(".proxy-detection-tip").removeClass("show");
    setTimeout(function () { $(".proxy-detection-tip").hide(); }, 300);
  }
});

$(".pac-details-close-btn, .pac-details-close-btn-secondary, .pac-details-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('pac-details-close-btn') || $(this).hasClass('pac-details-close-btn-secondary')) {
    if (typeof DetectionModule !== 'undefined' && DetectionModule.closePacDetails) {
      DetectionModule.closePacDetails();
    }
    $(".pac-details-tip").removeClass("show");
    setTimeout(function () { $(".pac-details-tip").hide(); }, 300);
  }
});

$("#pac-copy-btn").on("click", function () {
  var script = $("#pac-script-content").text();
  var $btn = $(this);
  var copyIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
  var checkIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

  navigator.clipboard.writeText(script).then(function () {
    $btn.html(checkIcon);
    setTimeout(function () { $btn.html(copyIcon); }, 2000);
  }).catch(function (err) { console.log("Failed to copy:", err); });
});

$("#pac-toggle-btn").on("click", function () {
  var $btn = $(this);
  var $wrapper = $("#pac-script-wrapper");
  var isExpanded = !$wrapper.hasClass("collapsed");

  if (isExpanded) {
    $wrapper.addClass("collapsed");
    $btn.removeClass("expanded");
  } else {
    $wrapper.removeClass("collapsed");
    $btn.addClass("expanded");
  }
});

$(".pac-details-tip").hide();

// ==========================================
// Export for use in other modules
// ==========================================
window.saveConfig = saveConfig;
