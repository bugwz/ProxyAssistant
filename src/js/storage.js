// ==========================================
// Storage Module - Unified Config Storage
// ==========================================

const StorageModule = (function () {
  // In-memory config cache
  let configCache = null;
  let configUpdatedAt = null;
  let isInitialized = false;

  // Storage key name
  const STORAGE_KEY = 'config';
  const CONFIG_UPDATED_AT_KEY = 'config_updated_at';

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
      chrome.storage.local.get([STORAGE_KEY, CONFIG_UPDATED_AT_KEY], function (result) {
        if (chrome.runtime.lastError) {
          console.info('Storage load error:', chrome.runtime.lastError);
          configCache = getDefaultConfig();
          resolve(configCache);
          return;
        }

        let storedConfigSnapshot = null;
        if (result.config) {
          storedConfigSnapshot = JSON.stringify(result.config);
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

        configUpdatedAt = typeof configCache.updated_at === 'string'
          ? configCache.updated_at
          : (typeof result[CONFIG_UPDATED_AT_KEY] === 'string' ? result[CONFIG_UPDATED_AT_KEY] : null);
        configCache.updated_at = configUpdatedAt;
        const shouldPersistMigration = storedConfigSnapshot !== null
          && storedConfigSnapshot !== JSON.stringify(configCache);
        if (!shouldPersistMigration) {
          resolve(configCache);
          return;
        }

        const migratedAt = new Date().toISOString();
        configCache.updated_at = migratedAt;
        configUpdatedAt = migratedAt;
        chrome.storage.local.set({
          [STORAGE_KEY]: configCache,
          [CONFIG_UPDATED_AT_KEY]: migratedAt
        }, function () {
          if (chrome.runtime.lastError) {
            console.info('Storage migration save error:', chrome.runtime.lastError);
          }
          resolve(configCache);
        });
      });
    });
  }

  function getDefaultConfig() {
    if (window.ConfigModule && window.ConfigModule.getDefaultConfig) {
      return window.ConfigModule.getDefaultConfig();
    }

    const defaultId = window.ConfigModule.generateScenarioId();
    return {
      version: 5,
      updated_at: null,
      system: {
        app_language: 'zh-CN',
        theme_mode: 'light',
        night_mode_start: '22:00',
        night_mode_end: '06:00',
        sync: {
          type: 'native',
          auto_mode: 'off',
          interval_minutes: 360,
          last_sync_at: null,
          last_sync_direction: null,
          gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
        }
      },
      scenarios: {
        current: defaultId,
        lists: [{
          id: defaultId,
          name: 'Default',
          proxies: [],
          defaultProxyId: null,
          lastProxyId: null,
          automation: {
            enabled: false,
            rules: [{ type: 'time', operator: 'if', weekdays: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }]
          }
        }]
      },
      subscriptions: []
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

      const previousUpdatedAt = configCache.updated_at;
      const updatedAt = new Date().toISOString();
      configCache.updated_at = updatedAt;
      chrome.storage.local.set({
        [STORAGE_KEY]: configCache,
        [CONFIG_UPDATED_AT_KEY]: updatedAt
      }, function () {
        if (chrome.runtime.lastError) {
          configCache.updated_at = previousUpdatedAt;
          console.info('Storage save error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        configUpdatedAt = updatedAt;

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

  function getConfigUpdatedAt() {
    return typeof configCache?.updated_at === 'string' ? configCache.updated_at : configUpdatedAt;
  }

  function setConfig(newConfig) {
    configCache = newConfig;
  }

  function isCurrentConfig(config) {
    if (!configCache || !config) return false;
    return JSON.stringify(configCache) === JSON.stringify(config);
  }

  function stripSubscriptions(config) {
    if (!config) return config;

    const copy = JSON.parse(JSON.stringify(config));
    delete copy.subscriptions;
    const scenarios = copy.scenarios?.lists || [];
    scenarios.forEach(scenario => {
      (scenario.proxies || []).forEach(proxy => {
        delete proxy.subscription;
      });
    });
    return copy;
  }

  function isSubscriptionOnlyChange(oldConfig, newConfig) {
    if (!oldConfig || !newConfig) return false;
    return JSON.stringify(stripSubscriptions(oldConfig)) === JSON.stringify(stripSubscriptions(newConfig));
  }

  function mergeSubscriptionChanges(newConfig) {
    if (!configCache || !newConfig) return;
    configCache.subscriptions = normalizeSubscriptionOrder(newConfig.subscriptions || []);
    if (typeof newConfig.updated_at === 'string') {
      configCache.updated_at = newConfig.updated_at;
      configUpdatedAt = newConfig.updated_at;
    }
  }

  function getSubscriptions() {
    if (!configCache) return [];
    configCache.subscriptions = normalizeSubscriptionOrder(configCache.subscriptions || []);
    return configCache.subscriptions;
  }

  function normalizeSubscriptionOrder(subscriptions) {
    return subscriptions.map((subscription, index) => ({
      subscription: subscription,
      order: Number.isInteger(subscription.order) && subscription.order >= 0 ? subscription.order : index,
      index: index
    })).sort((left, right) => left.order - right.order || left.index - right.index)
      .map((entry, order) => {
        entry.subscription.order = order;
        return entry.subscription;
      });
  }

  function getSubscription(id) {
    return getSubscriptions().find(item => item.id === id);
  }

  function addSubscription(subscription) {
    if (!configCache.subscriptions) configCache.subscriptions = [];
    subscription.order = configCache.subscriptions.length;
    configCache.subscriptions.push(subscription);
    return subscription;
  }

  function updateSubscription(id, updates) {
    const subscription = getSubscription(id);
    if (subscription) Object.assign(subscription, updates);
    return subscription;
  }

  function deleteSubscription(id) {
    if (!configCache) return;
    configCache.subscriptions = normalizeSubscriptionOrder(getSubscriptions().filter(item => item.id !== id));
    getScenarios().forEach(scenario => {
      (scenario.proxies || []).forEach(proxy => {
        proxy.subscription_ids = (proxy.subscription_ids || []).filter(subscriptionId => subscriptionId !== id);
      });
    });
  }

  function reorderSubscriptions(newOrder) {
    if (!configCache) return;
    configCache.subscriptions = newOrder.map((subscription, order) => {
      subscription.order = order;
      return subscription;
    });
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
      const defaultProxy = scenario.proxies.find(proxy => proxy?.id === scenario.defaultProxyId);
      if (!defaultProxy || defaultProxy.enabled === false || !defaultProxy.ip || !defaultProxy.port) {
        scenario.defaultProxyId = null;
      }
      const lastProxy = scenario.proxies.find(proxy => proxy?.id === scenario.lastProxyId);
      if (!lastProxy || lastProxy.enabled === false || !lastProxy.ip || !lastProxy.port) {
        scenario.lastProxyId = null;
      }
    }
  }

  function deleteProxy(proxyIndex, scenarioId) {
    const scenarios = configCache?.scenarios?.lists || [];
    const id = scenarioId || getCurrentScenarioId();
    const scenario = scenarios.find(s => s.id === id);
    if (scenario && scenario.proxies) {
      const deletedProxy = scenario.proxies[proxyIndex];
      scenario.proxies.splice(proxyIndex, 1);
      if (deletedProxy?.id === scenario.defaultProxyId) {
        scenario.defaultProxyId = null;
      }
      if (deletedProxy?.id === scenario.lastProxyId) {
        scenario.lastProxyId = null;
      }
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

      if (proxy.id === fromScenario.defaultProxyId) {
        fromScenario.defaultProxyId = null;
      }
      if (proxy.id === fromScenario.lastProxyId) {
        fromScenario.lastProxyId = null;
      }

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
    return getSystemSetting('sync') || {
      type: 'native',
      auto_mode: 'off',
      interval_minutes: 360,
      last_sync_at: null,
      last_sync_direction: null,
      gist: { token: '', filename: 'proxy_assistant_config.json', gist_id: '' }
    };
  }

  function setSyncConfig(syncConfig) {
    setSystemSetting('sync', syncConfig);
  }

  // ==========================================
  // Clear Cache
  // ==========================================

  function clearCache() {
    configCache = null;
    configUpdatedAt = null;
    isInitialized = false;
  }

  // ==========================================
  // Force Reload
  // ==========================================

  function reload() {
    return loadFromStorage();
  }

  // ==========================================
  // Export
  // ==========================================

  return {
    init,
    save,
    getConfig,
    getConfigUpdatedAt,
    setConfig,
    isCurrentConfig,
    isSubscriptionOnlyChange,
    mergeSubscriptionChanges,
    getSubscriptions,
    getSubscription,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    reorderSubscriptions,
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
    STORAGE_KEY,
    CONFIG_UPDATED_AT_KEY
  };
})();

// Export for use
window.StorageModule = StorageModule;
