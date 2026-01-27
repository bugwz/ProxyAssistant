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
  ProxyModule.saveData();
};

window.onScenarioRename = function (id, newName) {
  ProxyModule.saveData();
};

window.onScenarioDelete = function (id, isOnlyScenario) {
  ProxyModule.setList(ScenariosModule.updateCurrentListFromScenario());
  ProxyModule.saveData();
  if (isOnlyScenario) {
    ProxyModule.renderList();
  }
};

window.onScenariosReorder = function (scenarios) {
  ScenariosModule.setScenarios(scenarios);
  ProxyModule.saveData();
};

window.onProxyMove = function (proxyIndex, targetScenarioId, proxy) {
  ProxyModule.setList(ScenariosModule.updateCurrentListFromScenario());
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
  LanguageModule.initLanguage();
  ThemeModule.initTheme();
  ScenariosModule.init();
  ProxyModule.init();
  initDropdowns();
  loadSettingsAndList();
  bindGlobalEvents();
}

function loadSettingsAndList() {
  chrome.storage.local.get({ sync_config: null }, async function (settings) {
    if (settings.sync_config) {
      SyncModule.setSyncConfig(settings.sync_config);
    }
    SyncModule.updateSyncUI();
    loadFromLocal();
  });
}

function loadFromLocal(config) {
  const keys = ['list', 'scenarios', 'currentScenarioId', 'themeSettings', 'sync_config', 'appLanguage', 'auto_sync', 'system'];

  chrome.storage.local.get(keys, function (items) {
    if (chrome.runtime.lastError) {
      console.info("Local storage get error:", chrome.runtime.lastError);
      items = {};
    }
    items = items || {};

    const sourceConfig = config || items;
    const newConfig = ConfigModule.migrateConfig(sourceConfig);

    ScenariosModule.setScenarios(newConfig.scenarios);
    ScenariosModule.setCurrentScenarioId(newConfig.currentScenarioId);

    if (!ScenariosModule.getScenarios().find(s => s.id === ScenariosModule.getCurrentScenarioId())) {
      ScenariosModule.setCurrentScenarioId(ScenariosModule.getScenarios()[0]?.id || 'default');
    }

    const list = ScenariosModule.updateCurrentListFromScenario();
    ProxyModule.setList(list);

    if (newConfig.system) {
      if (newConfig.system.appLanguage) {
        I18n.setLanguage(newConfig.system.appLanguage);
        const langName = $(`#language-options li[data-value="${newConfig.system.appLanguage}"]`).text();
        if (langName) $('#current-language-display').text(langName);
      }

      if (newConfig.system.themeMode) {
        ThemeModule.setThemeMode(newConfig.system.themeMode);
      }
      const nightTimes = newConfig.system.nightModeStart ? {
        start: newConfig.system.nightModeStart,
        end: newConfig.system.nightModeEnd || '06:00'
      } : null;
      if (nightTimes) {
        ThemeModule.setNightModeTimes(nightTimes.start, nightTimes.end);
      }

      if (newConfig.system.sync) {
        SyncModule.setSyncConfig(newConfig.system.sync);
      }
      if (newConfig.system.auto_sync !== undefined) {
        chrome.storage.local.set({ auto_sync: newConfig.system.auto_sync });
      }
    }

    if (!config) {
      ProxyModule.saveData({ silent: true });
      ThemeModule.updateThemeUI();
      SyncModule.updateSyncUI();
      ProxyModule.renderList();
      ScenariosModule.renderScenarioSelector();
    } else {
      ThemeModule.updateThemeUI();
      SyncModule.updateSyncUI();
      ProxyModule.renderList();
      ScenariosModule.renderScenarioSelector();
    }
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

    if (typeof i !== 'undefined' && ProxyModule.getList() && ProxyModule.getList()[i]) {
      const list = ProxyModule.getList();
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
  });

  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local') {
      if (changes.scenarios || changes.currentScenarioId) {
        chrome.storage.local.get(['scenarios', 'currentScenarioId'], function (res) {
          if (res.scenarios) {
            ScenariosModule.setScenarios(res.scenarios);
          }
          if (res.currentScenarioId) {
            ScenariosModule.setCurrentScenarioId(res.currentScenarioId);
          }
          ScenariosModule.renderScenarioSelector();
        });
      }
      if (changes.list) {
        chrome.storage.local.get(['currentScenarioId'], function (res) {
          const scenario = ScenariosModule.getScenarios().find(s => s.id === (res.currentScenarioId || ScenariosModule.getCurrentScenarioId()));
          if (scenario) {
            ProxyModule.setList(scenario.proxies || []);
            ProxyModule.renderList();
          }
        });
      }
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

    chrome.storage.local.set({ sync_config: config }, function () {
      if (chrome.runtime.lastError) {
        UtilsModule.showTip(I18n.t('save_failed'), true);
      } else {
        UtilsModule.showTip(I18n.t('save_success'), false);
      }
      $(".sync-config-tip").removeClass("show");
      setTimeout(function () { $(".sync-config-tip").hide(); }, 300);
      SyncModule.updateSyncUI();
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
