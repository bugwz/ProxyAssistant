// ==========================================
// Storage Module - Unified Config Storage
// ==========================================

const StorageModule = (function () {
  // In-memory config cache
  let configCache = null;
  let isInitialized = false;

  // Storage key name
  const STORAGE_KEY = 'config';

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    if (isInitialized) return Promise.resolve();

    return new Promise((resolve, reject) => {
      loadFromStorage().then(() => {
        isInitialized = true;
        resolve();
      }).catch(reject);
    });
  }

  // ==========================================
  // Load from Chrome Storage
  // ==========================================

  function loadFromStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        if (chrome.runtime.lastError) {
          console.error('Storage load error:', chrome.runtime.lastError);
          configCache = getDefaultConfig();
          resolve(configCache);
          return;
        }

        if (result.config) {
          // Use migrateConfig to ensure correct format
          if (window.ConfigModule && window.ConfigModule.migrateConfig) {
            configCache = window.ConfigModule.migrateConfig(result.config);
          } else {
            configCache = result.config;
          }
        } else {
          // No config found, use default config
          configCache = getDefaultConfig();
        }

        resolve(configCache);
      });
    });
  }

  function getDefaultConfig() {
    if (window.ConfigModule && window.ConfigModule.getDefaultConfig) {
      return window.ConfigModule.getDefaultConfig();
    }

    const defaultId = window.ConfigModule.generateScenarioId();
    return {
      version: 4,
      system: {
        app_language: 'zh-CN',
        theme_mode: 'light',
        night_mode_start: '22:00',
        night_mode_end: '06:00',
        sync: {
          type: 'native',
          gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
        }
      },
      scenarios: {
        current: defaultId,
        lists: [{
          id: defaultId,
          name: 'Default',
          proxies: []
        }]
      }
    };
  }

  // ==========================================
  // Save to Chrome Storage
  // ==========================================

  function save() {
    return new Promise((resolve, reject) => {
      if (!configCache) {
        reject(new Error('No config to save'));
        return;
      }

      chrome.storage.local.set({ [STORAGE_KEY]: configCache }, function () {
        if (chrome.runtime.lastError) {
          console.error('Storage save error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        // Notify worker to refresh proxy
        chrome.runtime.sendMessage({ action: "refreshProxy" }, function () {
          // Ignore errors
          resolve(configCache);
        });
      });
    });
  }

  // ==========================================
  // Get/Set Config
  // ==========================================

  function getConfig() {
    if (!configCache) {
      return getDefaultConfig();
    }
    return configCache;
  }

  function setConfig(newConfig) {
    configCache = newConfig;
  }

  // ==========================================
  // Scenarios Operations
  // ==========================================

  function getScenarios() {
    if (!configCache) return [];
    return configCache.scenarios?.lists || [];
  }

  function getCurrentScenarioId() {
    if (!configCache) return 'default';
    return configCache.scenarios?.current || 'default';
  }

  function setCurrentScenarioId(id) {
    if (!configCache) return;
    if (!configCache.scenarios) configCache.scenarios = {};
    configCache.scenarios.current = id;
  }

  function getCurrentScenario() {
    const scenarios = getScenarios();
    const currentId = getCurrentScenarioId();
    return scenarios.find(s => s.id === currentId);
  }

  function addScenario(scenario) {
    if (!configCache) return;
    if (!configCache.scenarios) configCache.scenarios = { lists: [] };
    if (!configCache.scenarios.lists) configCache.scenarios.lists = [];
    configCache.scenarios.lists.push(scenario);
  }

  function updateScenario(id, updates) {
    if (!configCache) return;
    const scenarios = configCache.scenarios?.lists || [];
    const index = scenarios.findIndex(s => s.id === id);
    if (index !== -1) {
      scenarios[index] = { ...scenarios[index], ...updates };
    }
  }

  function deleteScenario(id) {
    if (!configCache) return;
    if (!configCache.scenarios || !configCache.scenarios.lists) return;
    configCache.scenarios.lists = configCache.scenarios.lists.filter(s => s.id !== id);
  }

  function setScenarios(scenarios) {
    if (!configCache) return;
    if (!configCache.scenarios) configCache.scenarios = {};
    configCache.scenarios.lists = scenarios;
  }

  function reorderScenarios(newOrder) {
    if (!configCache || !configCache.scenarios) return;
    configCache.scenarios.lists = newOrder;
  }

  // ==========================================
  // Proxy Operations
  // ==========================================

  function getProxies(scenarioId) {
    const scenarios = getScenarios();
    const id = scenarioId || getCurrentScenarioId();
    const scenario = scenarios.find(s => s.id === id);
    return scenario?.proxies || [];
  }

  function getProxy(scenarioId, proxyIndex) {
    const proxies = getProxies(scenarioId);
    return proxies[proxyIndex];
  }

  function addProxy(proxy, scenarioId) {
    const scenarios = configCache?.scenarios?.lists || [];
    const id = scenarioId || getCurrentScenarioId();
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      if (!scenario.proxies) scenario.proxies = [];
      scenario.proxies.push(proxy);
      return scenario.proxies.length - 1;
    }
    return -1;
  }

  function updateProxy(proxyIndex, updates, scenarioId) {
    const scenarios = configCache?.scenarios?.lists || [];
    const id = scenarioId || getCurrentScenarioId();
    const scenario = scenarios.find(s => s.id === id);
    if (scenario && scenario.proxies && scenario.proxies[proxyIndex]) {
      Object.assign(scenario.proxies[proxyIndex], updates);
    }
  }

  function deleteProxy(proxyIndex, scenarioId) {
    const scenarios = configCache?.scenarios?.lists || [];
    const id = scenarioId || getCurrentScenarioId();
    const scenario = scenarios.find(s => s.id === id);
    if (scenario && scenario.proxies) {
      scenario.proxies.splice(proxyIndex, 1);
    }
  }

  function reorderProxies(newOrder, scenarioId) {
    const scenarios = configCache?.scenarios?.lists || [];
    const id = scenarioId || getCurrentScenarioId();
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      scenario.proxies = newOrder;
    }
  }

  function moveProxy(proxyIndex, fromScenarioId, toScenarioId) {
    const scenarios = configCache?.scenarios?.lists || [];
    const fromScenario = scenarios.find(s => s.id === fromScenarioId);
    const toScenario = scenarios.find(s => s.id === toScenarioId);

    if (fromScenario && toScenario && fromScenario.proxies && fromScenario.proxies[proxyIndex]) {
      const proxy = fromScenario.proxies[proxyIndex];
      fromScenario.proxies.splice(proxyIndex, 1);

      if (!toScenario.proxies) toScenario.proxies = [];
      toScenario.proxies.push(proxy);
      return true;
    }
    return false;
  }

  // ==========================================
  // System Settings Operations
  // ==========================================

  function getSystemSetting(key) {
    if (!configCache || !configCache.system) return undefined;
    return configCache.system[key];
  }

  function setSystemSetting(key, value) {
    if (!configCache) return;
    if (!configCache.system) configCache.system = {};
    configCache.system[key] = value;
  }

  function getSyncConfig() {
    return getSystemSetting('sync') || { type: 'native', gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' } };
  }

  function setSyncConfig(syncConfig) {
    setSystemSetting('sync', syncConfig);
  }

  // ==========================================
  // Clear Cache
  // ==========================================

  function clearCache() {
    configCache = null;
    isInitialized = false;
  }

  // ==========================================
  // Force Reload
  // ==========================================

  function reload() {
    clearCache();
    return loadFromStorage();
  }

  // ==========================================
  // Export
  // ==========================================

  return {
    init,
    save,
    getConfig,
    setConfig,
    getScenarios,
    getCurrentScenarioId,
    setCurrentScenarioId,
    getCurrentScenario,
    addScenario,
    updateScenario,
    deleteScenario,
    setScenarios,
    reorderScenarios,
    getProxies,
    getProxy,
    addProxy,
    updateProxy,
    deleteProxy,
    reorderProxies,
    moveProxy,
    getSystemSetting,
    setSystemSetting,
    getSyncConfig,
    setSyncConfig,
    clearCache,
    reload,
    STORAGE_KEY
  };
})();

// Export for use
window.StorageModule = StorageModule;
