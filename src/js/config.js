// ==========================================
// Config Module - Configuration Import/Export
// ==========================================

// ==========================================
// Constants
// ==========================================

const PROXY_STATE_KEYS = ['show_password', 'is_new', 'open'];
const PROXY_EXPORT_KEYS = [
  'enabled', 'id', 'name', 'protocol', 'ip', 'port', 'username', 'password',
  'bypass_rules', 'include_rules', 'fallback_policy', 'subscription'
];

// ==========================================
// Config Migration
// ==========================================

function migrateConfig(config) {
  if (!config) return getDefaultConfig();

  // If already in new format (with version and system), return directly
  if (config.version === 4 && config.system && config.scenarios) {
    return normalizeConfig(config);
  }

  // Migrate from old format
  const v4 = getDefaultConfig();

  // Migrate proxy data
  const migrateProxy = (p) => {
    let enabled = true;
    if (p.enabled !== undefined) enabled = p.enabled;
    else if (p.disabled !== undefined) enabled = p.disabled !== true;

    let subscription = null;

    if (p.subscription) {
      const current = p.subscription.current || p.subscription.activeFormat || 'autoproxy';
      const enabled = p.subscription.enabled !== false;
      const lists = {};
      const sourceLists = p.subscription.lists || p.subscription.formats || {};
      const FORMATS = ['autoproxy', 'switchy_legacy', 'switchy_omega'];

      FORMATS.forEach(f => {
        if (sourceLists[f]) {
          const item = sourceLists[f];
          lists[f] = {
            url: Object.prototype.hasOwnProperty.call(item, 'url') ? item.url : '',
            content: Object.prototype.hasOwnProperty.call(item, 'content') ? item.content : '',
            decoded_content: Object.prototype.hasOwnProperty.call(item, 'decoded_content') ? item.decoded_content : '',
            include_rules: Object.prototype.hasOwnProperty.call(item, 'include_rules') ? item.include_rules : '',
            bypass_rules: Object.prototype.hasOwnProperty.call(item, 'bypass_rules') ? item.bypass_rules : '',
            include_lines: Object.prototype.hasOwnProperty.call(item, 'include_lines') ? item.include_lines : 0,
            bypass_lines: Object.prototype.hasOwnProperty.call(item, 'bypass_lines') ? item.bypass_lines : 0,
            refresh_interval: Object.prototype.hasOwnProperty.call(item, 'refresh_interval') ? item.refresh_interval : 0,
            reverse: Object.prototype.hasOwnProperty.call(item, 'reverse') ? item.reverse : false,
            last_fetch_time: Object.prototype.hasOwnProperty.call(item, 'last_fetch_time') ? item.last_fetch_time : null
          };
        }
      });

      subscription = {
        enabled: enabled,
        current: current,
        lists: lists
      };
    }

    return {
      enabled: enabled,
      id: p.id || generateProxyId(),
      name: p.name || "",
      protocol: cleanProtocol(p.protocol || p.type),
      ip: p.ip || "",
      port: p.port || "",
      username: p.username || "",
      password: p.password || "",
      bypass_rules: p.bypass_rules || p.bypass_urls || "",
      include_rules: p.include_rules || p.include_urls || "",
      fallback_policy: p.fallback_policy || "direct",
      subscription: subscription
    };
  };

  // Migrate scenarios
  if (config.scenarios && typeof config.scenarios === 'object' && !Array.isArray(config.scenarios)) {
    // New format: scenarios is { current, lists } object
    const newScenarios = config.scenarios;
    const currentId = newScenarios.current || 'default';
    v4.scenarios.lists = (newScenarios.lists || []).map(s => ({
      id: s.id || generateScenarioId(),
      name: s.name || I18n.t('scenario_default'),
      proxies: (s.proxies || []).map(migrateProxy)
    }));
    v4.scenarios.current = currentId;
  } else if (config.scenarios && Array.isArray(config.scenarios)) {
    // Old format: scenarios is array
    v4.scenarios.lists = config.scenarios.map(s => ({
      id: s.id || generateScenarioId(),
      name: s.name || I18n.t('scenario_default'),
      proxies: (s.proxies || []).map(migrateProxy)
    }));
    v4.scenarios.current = config.currentScenarioId || v4.scenarios.lists[0]?.id || 'default';
  } else if (config.proxies && Array.isArray(config.proxies)) {
    v4.scenarios.lists = [{
      id: generateScenarioId(),
      name: I18n.t('scenario_default'),
      proxies: config.proxies.map(migrateProxy)
    }];
    v4.scenarios.current = v4.scenarios.lists[0].id;
  } else if (Array.isArray(config)) {
    v4.scenarios.lists = [{
      id: generateScenarioId(),
      name: I18n.t('scenario_default'),
      proxies: config.map(migrateProxy)
    }];
    v4.scenarios.current = v4.scenarios.lists[0].id;
  }

  // Ensure currentScenarioId is valid
  if (!v4.scenarios.lists.find(s => s.id === v4.scenarios.current)) {
    v4.scenarios.current = v4.scenarios.lists[0]?.id || 'default';
  }

  // Migrate system settings
  const sourceSystem = config.system || {};
  const sourceSettings = config.settings || {};

  const applyIf = (val, targetObj, targetKey) => {
    if (val !== undefined) targetObj[targetKey] = val;
  };

  // Migrate settings from various possible sources
  applyIf(sourceSettings.appLanguage || sourceSettings.app_language, v4.system, 'app_language');
  applyIf(sourceSettings.themeMode || sourceSettings.theme_mode, v4.system, 'theme_mode');
  applyIf(sourceSettings.nightModeStart || sourceSettings.night_mode_start, v4.system, 'night_mode_start');
  applyIf(sourceSettings.nightModeEnd || sourceSettings.night_mode_end, v4.system, 'night_mode_end');

  applyIf(config.appLanguage || config.app_language, v4.system, 'app_language');

  if (config.themeSettings) {
    applyIf(config.themeSettings.mode, v4.system, 'theme_mode');
    applyIf(config.themeSettings.startTime || config.themeSettings.start_time, v4.system, 'night_mode_start');
    applyIf(config.themeSettings.endTime || config.themeSettings.end_time, v4.system, 'night_mode_end');
  }

  if (config.sync_config) {
    if (config.sync_config.type) v4.system.sync.type = config.sync_config.type;
    if (config.sync_config.gist) v4.system.sync.gist = { ...v4.system.sync.gist, ...config.sync_config.gist };
  }

  applyIf(sourceSystem.appLanguage || sourceSystem.app_language, v4.system, 'app_language');
  applyIf(sourceSystem.themeMode || sourceSystem.theme_mode, v4.system, 'theme_mode');
  applyIf(sourceSystem.nightModeStart || sourceSystem.night_mode_start, v4.system, 'night_mode_start');
  applyIf(sourceSystem.nightModeEnd || sourceSystem.night_mode_end, v4.system, 'night_mode_end');

  if (sourceSystem.sync) {
    if (sourceSystem.sync.type) v4.system.sync.type = sourceSystem.sync.type;
    if (sourceSystem.sync.gist) v4.system.sync.gist = { ...v4.system.sync.gist, ...sourceSystem.sync.gist };
  }

  if (sourceSystem.settings) {
    applyIf(sourceSystem.settings.appLanguage || sourceSystem.settings.app_language, v4.system, 'app_language');
    applyIf(sourceSystem.settings.themeMode || sourceSystem.settings.theme_mode, v4.system, 'theme_mode');
    applyIf(sourceSystem.settings.nightModeStart || sourceSystem.settings.night_mode_start, v4.system, 'night_mode_start');
    applyIf(sourceSystem.settings.nightModeEnd || sourceSystem.settings.night_mode_end, v4.system, 'night_mode_end');
  }

  return v4;
}

function getDefaultConfig() {
  const defaultScenarioId = generateScenarioId();
  return {
    version: 4,
    system: {
      app_language: I18n.getCurrentLanguage ? I18n.getCurrentLanguage() : 'zh-CN',
      theme_mode: 'light',
      night_mode_start: '22:00',
      night_mode_end: '06:00',
      sync: {
        type: 'native',
        gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
      }
    },
    scenarios: {
      current: defaultScenarioId,
      lists: [{
        id: defaultScenarioId,
        name: I18n.t('scenario_default'),
        proxies: []
      }]
    }
  };
}

function normalizeConfig(config) {
  // Ensure config format is correct
  if (!config.scenarios) {
    config.scenarios = { current: 'default', lists: [] };
  }
  if (!config.scenarios.lists) {
    config.scenarios.lists = [];
  }
  if (!config.system) {
    config.system = getDefaultConfig().system;
  }

  // Ensure all proxies have unique IDs
  config.scenarios.lists.forEach(scenario => {
    if (scenario.proxies) {
      scenario.proxies.forEach(proxy => {
        if (!proxy.id) {
          proxy.id = generateProxyId();
        }
      });
    }
  });

  return config;
}

// ==========================================
// Build Config Data (for export/sync)
// ==========================================

function buildConfigData(includeInternalState = false) {
  const config = StorageModule ? StorageModule.getConfig() : getDefaultConfig();

  const syncConfig = window.SyncModule ? window.SyncModule.getSyncConfig() : null;
  var syncForExport = {
    type: syncConfig?.type || 'native',
    gist: {
      token: '',
      filename: syncConfig?.gist?.filename || 'proxy_assistant_config.json',
      gist_id: ''
    }
  };

  const themeModule = window.ThemeModule || {};
  const currentThemeMode = themeModule.getThemeMode ? themeModule.getThemeMode() : (config.system?.theme_mode || 'light');
  const nightTimes = themeModule.getNightModeTimes ? themeModule.getNightModeTimes() : {
    start: config.system?.night_mode_start || '22:00',
    end: config.system?.night_mode_end || '06:00'
  };

  // Process proxy list - filter out internal state variables
  const processProxies = (proxies) => {
    return (proxies || []).map(p => {
      const newP = {};

      // Process enabled field
      if (p.enabled === undefined) {
        newP.enabled = p.disabled !== true;
      } else {
        newP.enabled = p.enabled;
      }

      // Add export fields in order
      PROXY_EXPORT_KEYS.forEach(k => {
        if (Object.prototype.hasOwnProperty.call(p, k)) {
          newP[k] = p[k];
        } else if (k === 'enabled') {
          newP[k] = (newP.enabled !== undefined) ? newP.enabled : true;
        }
      });

      // Include internal state if requested
      if (includeInternalState) {
        PROXY_STATE_KEYS.forEach(k => {
          if (Object.prototype.hasOwnProperty.call(p, k)) {
            newP[k] = p[k];
          }
        });
      }

      // Process subscription
      if (newP.subscription) {
        const lists = {};
        Object.keys(newP.subscription.lists || {}).forEach(key => {
          const item = newP.subscription.lists[key];
          lists[key] = {
            url: item.url || '',
            content: item.content || '',
            refresh_interval: item.refresh_interval || 0,
            reverse: item.reverse || false,
            last_fetch_time: item.last_fetch_time !== undefined ? item.last_fetch_time : null
          };
          if (key === 'pac' && item.process_rule) {
            lists[key].process_rule = item.process_rule;
          }
        });

        if (Object.keys(lists).length > 0) {
          newP.subscription = {
            enabled: newP.subscription.enabled !== false,
            current: newP.subscription.current,
            lists: lists
          };
        } else {
          delete newP.subscription;
        }
      }

      return newP;
    });
  };

  const formattedScenarios = config.scenarios.lists.map(s => ({
    id: s.id,
    name: s.name,
    proxies: processProxies(s.proxies)
  }));

  return {
    version: 4,
    system: {
      app_language: I18n.getCurrentLanguage ? I18n.getCurrentLanguage() : (config.system?.app_language || 'zh-CN'),
      theme_mode: currentThemeMode,
      night_mode_start: nightTimes.start,
      night_mode_end: nightTimes.end,
      sync: syncForExport
    },
    scenarios: {
      current: config.scenarios.current,
      lists: formattedScenarios
    }
  };
}

// ==========================================
// Export Config
// ==========================================

function getLocalTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return year + month + day + hours + minutes + seconds;
}

function exportConfig() {
  var configBundle = buildConfigData(false); // Do not include internal state
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configBundle, null, 4));
  var downloadAnchorNode = document.createElement('a');
  var timestamp = getLocalTimestamp();
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "proxy_assistant_config_" + timestamp + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// ==========================================
// Import Config
// ==========================================

function importConfig(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var rawData = JSON.parse(e.target.result);
      if (rawData) {
        const data = migrateConfig(rawData);

        // Parse subscription content
        if (window.SubscriptionModule && window.SubscriptionModule.parseProxyListSubscriptions) {
          SubscriptionModule.parseProxyListSubscriptions(
            data.scenarios?.lists?.flatMap(s => s.proxies) || []
          );
        }

        // Preserve local sync config
        const syncConfig = window.SyncModule ? window.SyncModule.getSyncConfig() : null;
        const localSyncConfig = syncConfig || {
          type: 'native',
          gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
        };

        // Merge sync config
        if (data.system && data.system.sync) {
          const remoteSync = data.system.sync;
          data.system.sync = {
            type: remoteSync.type || localSyncConfig.type,
            gist: {
              token: remoteSync.gist?.token || localSyncConfig.gist?.token || '',
              filename: remoteSync.gist?.filename || localSyncConfig.gist?.filename || 'proxy_assistant_config.json',
              gist_id: remoteSync.gist?.gist_id || localSyncConfig.gist?.gist_id || ''
            }
          };
        } else {
          data.system = data.system || {};
          data.system.sync = localSyncConfig;
        }

        // Save to storage
        if (window.StorageModule) {
          StorageModule.setConfig(data);
          StorageModule.save().then(() => {
            applyImportedSettings(data);

            if (window.SubscriptionModule && window.SubscriptionModule.scheduleAllBackgroundRefreshes) {
              window.SubscriptionModule.scheduleAllBackgroundRefreshes(data);
            }

            UtilsModule.showTip(I18n.t('save_success'), false);
          });
        } else {
          // Fallback
          chrome.storage.local.set({ config: data }, function () {
            applyImportedSettings(data);
            UtilsModule.showTip(I18n.t('save_success'), false);
          });
        }
      }
    } catch (err) {
      alert(I18n.t('alert_parse_error') + ': ' + err.message);
    }
    $("#json-file-input").val("");
  };
  reader.readAsText(file);
}

function applyImportedSettings(data) {
  const systemData = data.system;
  if (systemData) {
    if (systemData.app_language && typeof I18n !== 'undefined' && I18n.setLanguage) {
      I18n.setLanguage(systemData.app_language);
      $('#current-language-display').text($(`#language-options li[data-value="${systemData.app_language}"]`).text());
    }
    if (systemData.theme_mode && window.ThemeModule) {
      window.ThemeModule.setThemeMode(systemData.theme_mode);
      window.ThemeModule.setNightModeTimes(
        systemData.night_mode_start || '22:00',
        systemData.night_mode_end || '06:00'
      );
      window.ThemeModule.updateThemeUI();
    }
    if (systemData.sync && window.SyncModule) {
      window.SyncModule.setSyncConfig(systemData.sync);
    }
  }

  // Refresh UI
  if (window.ScenariosModule) {
    window.ScenariosModule.renderScenarioSelector();
  }
  if (window.ProxyModule) {
    window.ProxyModule.renderList();
  }
  if (window.SyncModule) {
    window.SyncModule.updateSyncUI();
  }
}

// Helper function (ensure it's available)
function cleanProtocol(protocol) {
  if (!protocol) return 'http';
  const clean = protocol.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean === 'socks5') return 'socks5';
  if (clean === 'https') return 'https';
  return 'http';
}

function generateId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function generateProxyId() {
  return generateId('proxy_');
}

function generateScenarioId() {
  return generateId('scenario_');
}

window.ConfigModule = {
  migrateConfig,
  buildConfigData,
  exportConfig,
  importConfig,
  getDefaultConfig,
  generateProxyId,
  generateScenarioId,
  PROXY_STATE_KEYS,
  PROXY_EXPORT_KEYS
};
