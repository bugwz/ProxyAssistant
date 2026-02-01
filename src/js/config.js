// ==========================================
// Config Module - Configuration Import/Export
// ==========================================

// ==========================================
// Config Migration
// ==========================================

function migrateConfig(config) {
  if (!config) return null;

  const v4 = {
    version: 4,
    system: {
      appLanguage: I18n.getCurrentLanguage(),
      themeMode: 'light',
      nightModeStart: '22:00',
      nightModeEnd: '06:00',
      sync: {
        type: 'native',
        gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
      }
    },
    currentScenarioId: 'default',
    scenarios: []
  };

  const migrateProxy = (p) => {
    let enabled = true;
    if (p.enabled !== undefined) enabled = p.enabled;
    else if (p.disabled !== undefined) enabled = p.disabled !== true;

    let subscription = null;

    if (p.subscription) {
      const current = p.subscription.current || p.subscription.activeFormat || 'pac';
      const enabled = p.subscription.enabled !== false;
      const lists = {};
      const sourceLists = p.subscription.lists || p.subscription.formats || {};
      const FORMATS = ['pac', 'autoproxy', 'switchy_legacy', 'switchy_omega'];

      FORMATS.forEach(f => {
        if (sourceLists[f]) {
          const item = sourceLists[f];
          lists[f] = {
            url: item.url || '',
            content: item.content || '',
            decodedContent: item.decodedContent || item.decodedContent || '',
            includeRules: item.includeRules || '',
            bypassRules: item.bypassRules || '',
            includeLines: item.includeLines || 0,
            bypassLines: item.bypassLines || 0,
            refreshInterval: item.refreshInterval || 0,
            reverse: item.reverse || false,
            lastFetchTime: item.lastFetchTime || null
          };
        }
      });

      subscription = {
        enabled: enabled,
        current: current,
        lists: lists
      };
    } else if (p.subscription_config) {
      const old = p.subscription_config;
      const fmt = old.format || 'pac';
      let content = old.lastContent || '';

      if (fmt === 'autoproxy' && content && content.trim().startsWith('W0F1dG9Qcm94')) {
        try { content = atob(content.trim()); } catch (e) { }
      }

      subscription = {
        current: fmt,
        lists: {
          [fmt]: {
            url: old.url || '',
            content: content,
            reverse: old.reverse || false,
            refreshInterval: old.refreshInterval || 0,
            lastFetchTime: old.lastFetchTime || null
          }
        }
      };
    }

    return {
      enabled: enabled,
      name: p.name || "",
      protocol: cleanProtocol(p.protocol || p.type),
      ip: p.ip || "",
      port: p.port || "",
      username: p.username || "",
      password: p.password || "",
      bypassUrls: p.bypass_urls || p.bypassUrls || "",
      includeUrls: p.include_urls || p.includeUrls || "",
      fallback_policy: p.fallback_policy || "direct",
      subscription: subscription
    };
  };

  if (config.version === 4) {
    if (config.scenarios && typeof config.scenarios === 'object' && !Array.isArray(config.scenarios)) {
      const newScenarios = config.scenarios;
      const currentId = newScenarios.current || 'default';
      v4.scenarios = (newScenarios.lists || []).map(s => ({
        id: s.id || ('scenario_' + Date.now() + Math.random().toString(36).substr(2, 9)),
        name: s.name || I18n.t('scenario_default'),
        proxies: (s.proxies || []).map(migrateProxy)
      }));
      v4.currentScenarioId = currentId;
    } else {
      v4.scenarios = (config.scenarios || []).map(s => ({
        id: s.id || ('scenario_' + Date.now() + Math.random().toString(36).substr(2, 9)),
        name: s.name || I18n.t('scenario_default'),
        proxies: (s.proxies || []).map(migrateProxy)
      }));
      v4.currentScenarioId = config.currentScenarioId || v4.scenarios[0]?.id || 'default';
    }
  } else if (config.scenarios && Array.isArray(config.scenarios)) {
    v4.scenarios = config.scenarios.map(s => ({
      id: s.id || ('scenario_' + Date.now() + Math.random().toString(36).substr(2, 9)),
      name: s.name || I18n.t('scenario_default'),
      proxies: (s.proxies || []).map(migrateProxy)
    }));
    v4.currentScenarioId = config.currentScenarioId || v4.scenarios[0]?.id || 'default';
  } else if (config.list && Array.isArray(config.list)) {
    v4.scenarios = [{
      id: 'default',
      name: I18n.t('scenario_default'),
      proxies: config.list.map(migrateProxy)
    }];
    v4.currentScenarioId = 'default';
  } else if (config.proxies && Array.isArray(config.proxies)) {
    v4.scenarios = [{
      id: 'default',
      name: I18n.t('scenario_default'),
      proxies: config.proxies.map(migrateProxy)
    }];
    v4.currentScenarioId = 'default';
  } else if (Array.isArray(config)) {
    v4.scenarios = [{
      id: 'default',
      name: I18n.t('scenario_default'),
      proxies: config.map(migrateProxy)
    }];
    v4.currentScenarioId = 'default';
  } else {
    v4.scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: [] }];
    v4.currentScenarioId = 'default';
  }

  if (!v4.scenarios.find(s => s.id === v4.currentScenarioId)) {
    v4.currentScenarioId = v4.scenarios[0]?.id || 'default';
  }

  const sourceSystem = config.system || {};
  const sourceSettings = config.settings || {};
  const sourceSync = config.sync || {};

  const applyIf = (val, targetObj, targetKey) => {
    if (val !== undefined) targetObj[targetKey] = val;
  };

  applyIf(sourceSettings.appLanguage, v4.system, 'appLanguage');
  applyIf(sourceSettings.themeMode, v4.system, 'themeMode');
  applyIf(sourceSettings.nightModeStart, v4.system, 'nightModeStart');
  applyIf(sourceSettings.nightModeEnd, v4.system, 'nightModeEnd');

  applyIf(config.appLanguage, v4.system, 'appLanguage');
  applyIf(config.auto_sync, v4.system, 'auto_sync');

  if (config.themeSettings) {
    applyIf(config.themeSettings.mode, v4.system, 'themeMode');
    applyIf(config.themeSettings.startTime, v4.system, 'nightModeStart');
    applyIf(config.themeSettings.endTime, v4.system, 'nightModeEnd');
  }

  if (config.sync_config) {
    if (config.sync_config.type) v4.system.sync.type = config.sync_config.type;
    if (config.sync_config.gist) v4.system.sync.gist = { ...v4.system.sync.gist, ...config.sync_config.gist };
  }

  applyIf(sourceSystem.appLanguage, v4.system, 'appLanguage');
  applyIf(sourceSystem.themeMode, v4.system, 'themeMode');
  applyIf(sourceSystem.nightModeStart, v4.system, 'nightModeStart');
  applyIf(sourceSystem.nightModeEnd, v4.system, 'nightModeEnd');

  if (sourceSystem.sync) {
    if (sourceSystem.sync.type) v4.system.sync.type = sourceSystem.sync.type;
    if (sourceSystem.sync.gist) v4.system.sync.gist = { ...v4.system.sync.gist, ...sourceSystem.sync.gist };
  }

  if (sourceSystem.settings) {
    applyIf(sourceSystem.settings.appLanguage, v4.system, 'appLanguage');
    applyIf(sourceSystem.settings.themeMode, v4.system, 'themeMode');
    applyIf(sourceSystem.settings.nightModeStart, v4.system, 'nightModeStart');
    applyIf(sourceSystem.settings.nightModeEnd, v4.system, 'nightModeEnd');
  }

  return v4;
}

// ==========================================
// Build Config Data
// ==========================================

function buildConfigData() {
  const scenarios = ScenariosModule.getScenarios();
  const currentScenarioId = ScenariosModule.getCurrentScenarioId();
  const list = ProxyModule.getList();

  const syncConfig = window.SyncModule ? window.SyncModule.getSyncConfig() : window.syncConfig;
  var syncForExport = {
    type: syncConfig.type,
    gist: {
      token: '',
      filename: syncConfig.gist.filename || 'proxy_assistant_config.json',
      gist_id: ''
    }
  };

  const themeModule = window.ThemeModule || {};
  const currentThemeMode = themeModule.getThemeMode ? themeModule.getThemeMode() : window.themeMode;
  const nightTimes = themeModule.getNightModeTimes ? themeModule.getNightModeTimes() : { start: window.nightModeStart, end: window.nightModeEnd };

  const orderedKeys = [
    'enabled', 'name', 'protocol', 'ip', 'port', 'username', 'password',
    'bypassUrls', 'includeUrls', 'fallbackPolicy'
  ];

  const excludedKeys = ['show_password', 'open', 'disabled'];

  const processProxies = (proxies) => {
    return (proxies || []).map(p => {
      const newP = {};

      if (p.enabled === undefined) {
        newP.enabled = p.disabled !== true;
      } else {
        newP.enabled = p.enabled;
      }

      orderedKeys.forEach(k => {
        if (Object.prototype.hasOwnProperty.call(p, k)) {
          newP[k] = p[k];
        } else if (k === 'enabled') {
          newP[k] = (newP.enabled !== undefined) ? newP.enabled : true;
        }
      });

      Object.keys(p).forEach(k => {
        if (!orderedKeys.includes(k) && !excludedKeys.includes(k)) {
          newP[k] = p[k];
        }
      });

      if (newP.subscription) {
        const lists = {};
        Object.keys(newP.subscription.lists || {}).forEach(key => {
          const item = newP.subscription.lists[key];
          lists[key] = {
            url: item.url || '',
            content: item.content || '',
            refreshInterval: item.refreshInterval || 0,
            reverse: item.reverse || false,
            lastFetchTime: item.lastFetchTime || null
          };
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

  const formattedScenarios = scenarios.map(s => ({
    ...s,
    proxies: processProxies(s.proxies)
  }));

  return {
    version: 4,
    system: {
      appLanguage: I18n.getCurrentLanguage(),
      themeMode: currentThemeMode,
      nightModeStart: nightTimes.start,
      nightModeEnd: nightTimes.end,
      sync: syncForExport
    },
    scenarios: {
      current: currentScenarioId,
      lists: formattedScenarios
    }
  };
}

// ==========================================
// Export Config
// ==========================================

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

        const syncConfig = window.SyncModule ? window.SyncModule.getSyncConfig() : window.syncConfig;
        const localSyncConfig = syncConfig || {
          type: 'native',
          gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
        };

        ScenariosModule.setScenarios(data.scenarios);
        ScenariosModule.setCurrentScenarioId(data.currentScenarioId);
        const list = ScenariosModule.updateCurrentListFromScenario();
        ProxyModule.setList(list);

        const systemData = data.system;
        if (systemData) {
          if (systemData.appLanguage) {
            I18n.setLanguage(systemData.appLanguage);
            $('#current-language-display').text($(`#language-options li[data-value="${systemData.appLanguage}"]`).text());
          }
          if (systemData.themeMode) {
            const themeModule = window.ThemeModule;
            if (themeModule) {
              themeModule.setThemeMode(systemData.themeMode);
              themeModule.setNightModeTimes(
                systemData.nightModeStart || '22:00',
                systemData.nightModeEnd || '06:00'
              );
            }
            if (typeof saveThemeSettings === 'function') saveThemeSettings();
            if (themeModule && themeModule.updateThemeUI) themeModule.updateThemeUI();
          }
          if (systemData.sync) {
            const remoteSync = systemData.sync;
            const newSyncConfig = {
              type: remoteSync.type || localSyncConfig.type,
              gist: {
                token: remoteSync.gist?.token || localSyncConfig.gist?.token || '',
                filename: remoteSync.gist?.filename || localSyncConfig.gist?.filename || 'proxy_assistant_config.json',
                gist_id: remoteSync.gist?.gist_id || localSyncConfig.gist?.gist_id || ''
              }
            };
            if (window.SyncModule) {
              window.SyncModule.setSyncConfig(newSyncConfig);
            }
          } else {
            if (window.SyncModule) {
              window.SyncModule.setSyncConfig(localSyncConfig);
            }
          }
          chrome.storage.local.set({ sync_config: window.SyncModule ? window.SyncModule.getSyncConfig() : localSyncConfig });
          if (typeof updateSyncUI === 'function') updateSyncUI();
        } else {
          if (window.SyncModule) {
            window.SyncModule.setSyncConfig(localSyncConfig);
          }
          chrome.storage.local.set({ sync_config: window.SyncModule ? window.SyncModule.getSyncConfig() : localSyncConfig });
          if (typeof updateSyncUI === 'function') updateSyncUI();
        }

        ProxyModule.saveData();
        ProxyModule.renderList();
        ScenariosModule.renderScenarioSelector();
        if (typeof showTip === 'function') showTip(I18n.t('save_success'), false);
      }
    } catch (err) {
      alert(I18n.t('alert_parse_error') + ': ' + err.message);
    }
    $("#json-file-input").val("");
  };
  reader.readAsText(file);
}

// Export for use
window.ConfigModule = {
  migrateConfig,
  buildConfigData,
  exportConfig,
  importConfig
};
