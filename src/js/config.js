// ==========================================
// Config Module - Configuration Import/Export
// ==========================================

// ==========================================
// Constants
// ==========================================

const PROXY_STATE_KEYS = ['show_password', 'is_new', 'open'];
const PROXY_EXPORT_KEYS = [
  'enabled', 'id', 'name', 'protocol', 'ip', 'port', 'username', 'password',
  'bypass_rules', 'include_rules', 'fallback_policy', 'color', 'subscription_ids'
];
const DEFAULT_SCENARIO_WEEKDAYS = [1, 2, 3, 4, 5];
const CONFIG_FILE_VERSION = 6;
const SUBSCRIPTION_CACHE_KEYS = [
  'content', 'decoded_content', 'include_rules', 'bypass_rules',
  'include_lines', 'bypass_lines', 'last_fetch_time'
];

function normalizeScenarioAutomation(automation) {
  const source = automation && typeof automation === 'object' ? automation : {};
  const sourceRules = Array.isArray(source.rules) ? source.rules : [];
  const isTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const sourceTimeRules = sourceRules.filter(rule => rule?.type === 'time');
  const operatorMode = sourceTimeRules[1]?.operator === 'and' ? 'and' : 'or';
  const timeRules = sourceTimeRules.map((rule, index) => {
    const weekdays = Array.isArray(rule.weekdays)
      ? [...new Set(rule.weekdays.map(Number).filter(day => day >= 0 && day <= 6))]
      : DEFAULT_SCENARIO_WEEKDAYS.slice();

    return {
      type: 'time',
      operator: index === 0 ? 'if' : operatorMode,
      weekdays: weekdays.length ? weekdays : DEFAULT_SCENARIO_WEEKDAYS.slice(),
      start: isTime(rule.start) ? rule.start : '09:00',
      end: isTime(rule.end) ? rule.end : '18:00'
    };
  });

  return {
    enabled: source.enabled === true,
    rules: timeRules.length ? timeRules : [{
      type: 'time',
      operator: 'if',
      weekdays: DEFAULT_SCENARIO_WEEKDAYS.slice(),
      start: '09:00',
      end: '18:00'
    }]
  };
}

function normalizeScenarioSettings(scenario) {
  const proxies = Array.isArray(scenario.proxies) ? scenario.proxies : [];
  const selectableProxies = proxies.filter(proxy => proxy && proxy.enabled !== false && proxy.ip && proxy.port);
  const hasConfiguredDefault = selectableProxies.some(proxy => proxy.id === scenario.defaultProxyId);
  const hasLastProxy = selectableProxies.some(proxy => proxy.id === scenario.lastProxyId);

  scenario.proxies = proxies;
  scenario.defaultProxyId = hasConfiguredDefault ? scenario.defaultProxyId : null;
  scenario.lastProxyId = hasLastProxy ? scenario.lastProxyId : null;
  scenario.automation = normalizeScenarioAutomation(scenario.automation);
  return scenario;
}

function normalizeConfigProxyColor(color) {
  if (window.UtilsModule && typeof window.UtilsModule.normalizeProxyColor === 'function') {
    return window.UtilsModule.normalizeProxyColor(color);
  }
  if (typeof color !== 'string') return '';
  const normalized = color.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : '';
}

// ==========================================
// Config Migration
// ==========================================

function migrateConfig(config) {
  if (!config) return getDefaultConfig();
  config = inflateConfigFileSystem(config);

  // If already in new format (with version and system), return directly
  if ([4, 5, CONFIG_FILE_VERSION].includes(config.version) && config.system && config.scenarios) {
    return normalizeConfig(config);
  }

  // Migrate from old format
  const v5 = getDefaultConfig();
  if (typeof config.updated_at === 'string') v5.updated_at = config.updated_at;

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
      color: normalizeConfigProxyColor(p.color),
      subscription: subscription
    };
  };

  // Migrate scenarios
  if (config.scenarios && typeof config.scenarios === 'object' && !Array.isArray(config.scenarios)) {
    // New format: scenarios is { current, lists } object
    const newScenarios = config.scenarios;
    const currentId = newScenarios.current || 'default';
    v5.scenarios.lists = (newScenarios.lists || []).map(s => ({
      id: s.id || generateScenarioId(),
      name: s.name || I18n.t('scenario_default'),
      proxies: (s.proxies || []).map(migrateProxy),
      defaultProxyId: s.defaultProxyId || null,
      lastProxyId: s.lastProxyId || null,
      automation: s.automation
    }));
    v5.scenarios.current = currentId;
  } else if (config.scenarios && Array.isArray(config.scenarios)) {
    // Old format: scenarios is array
    v5.scenarios.lists = config.scenarios.map(s => ({
      id: s.id || generateScenarioId(),
      name: s.name || I18n.t('scenario_default'),
      proxies: (s.proxies || []).map(migrateProxy),
      defaultProxyId: s.defaultProxyId || null,
      lastProxyId: s.lastProxyId || null,
      automation: s.automation
    }));
    v5.scenarios.current = config.currentScenarioId || v5.scenarios.lists[0]?.id || 'default';
  } else if (config.proxies && Array.isArray(config.proxies)) {
    v5.scenarios.lists = [{
      id: generateScenarioId(),
      name: I18n.t('scenario_default'),
      proxies: config.proxies.map(migrateProxy)
    }];
    v5.scenarios.current = v5.scenarios.lists[0].id;
  } else if (Array.isArray(config)) {
    v5.scenarios.lists = [{
      id: generateScenarioId(),
      name: I18n.t('scenario_default'),
      proxies: config.map(migrateProxy)
    }];
    v5.scenarios.current = v5.scenarios.lists[0].id;
  }

  // Ensure currentScenarioId is valid
  if (!v5.scenarios.lists.find(s => s.id === v5.scenarios.current)) {
    v5.scenarios.current = v5.scenarios.lists[0]?.id || 'default';
  }

  // Migrate system settings
  const sourceSystem = config.system || {};
  const sourceSettings = config.settings || {};

  const applyIf = (val, targetObj, targetKey) => {
    if (val !== undefined) targetObj[targetKey] = val;
  };

  // Migrate settings from various possible sources
  applyIf(sourceSettings.appLanguage || sourceSettings.app_language, v5.system, 'app_language');
  applyIf(sourceSettings.themeMode || sourceSettings.theme_mode, v5.system, 'theme_mode');
  applyIf(sourceSettings.nightModeStart || sourceSettings.night_mode_start, v5.system, 'night_mode_start');
  applyIf(sourceSettings.nightModeEnd || sourceSettings.night_mode_end, v5.system, 'night_mode_end');

  applyIf(config.appLanguage || config.app_language, v5.system, 'app_language');

  if (config.themeSettings) {
    applyIf(config.themeSettings.mode, v5.system, 'theme_mode');
    applyIf(config.themeSettings.startTime || config.themeSettings.start_time, v5.system, 'night_mode_start');
    applyIf(config.themeSettings.endTime || config.themeSettings.end_time, v5.system, 'night_mode_end');
  }

  if (config.sync_config) {
    if (config.sync_config.type) v5.system.sync.type = config.sync_config.type;
    if (config.sync_config.gist) v5.system.sync.gist = { ...v5.system.sync.gist, ...config.sync_config.gist };
    applyIf(config.sync_config.auto_mode, v5.system.sync, 'auto_mode');
    applyIf(config.sync_config.interval_minutes, v5.system.sync, 'interval_minutes');
    applyIf(config.sync_config.last_sync_at, v5.system.sync, 'last_sync_at');
    applyIf(config.sync_config.last_sync_direction, v5.system.sync, 'last_sync_direction');
  }

  applyIf(sourceSystem.appLanguage || sourceSystem.app_language, v5.system, 'app_language');
  applyIf(sourceSystem.themeMode || sourceSystem.theme_mode, v5.system, 'theme_mode');
  applyIf(sourceSystem.nightModeStart || sourceSystem.night_mode_start, v5.system, 'night_mode_start');
  applyIf(sourceSystem.nightModeEnd || sourceSystem.night_mode_end, v5.system, 'night_mode_end');

  if (sourceSystem.sync) {
    if (sourceSystem.sync.type) v5.system.sync.type = sourceSystem.sync.type;
    if (sourceSystem.sync.gist) v5.system.sync.gist = { ...v5.system.sync.gist, ...sourceSystem.sync.gist };
    applyIf(sourceSystem.sync.auto_mode, v5.system.sync, 'auto_mode');
    applyIf(sourceSystem.sync.interval_minutes, v5.system.sync, 'interval_minutes');
    applyIf(sourceSystem.sync.last_sync_at, v5.system.sync, 'last_sync_at');
    applyIf(sourceSystem.sync.last_sync_direction, v5.system.sync, 'last_sync_direction');
  }

  if (sourceSystem.settings) {
    applyIf(sourceSystem.settings.appLanguage || sourceSystem.settings.app_language, v5.system, 'app_language');
    applyIf(sourceSystem.settings.themeMode || sourceSystem.settings.theme_mode, v5.system, 'theme_mode');
    applyIf(sourceSystem.settings.nightModeStart || sourceSystem.settings.night_mode_start, v5.system, 'night_mode_start');
    applyIf(sourceSystem.settings.nightModeEnd || sourceSystem.settings.night_mode_end, v5.system, 'night_mode_end');
  }

  return normalizeConfig(v5);
}

function getDefaultConfig() {
  const defaultScenarioId = generateScenarioId();
  return {
    version: 5,
    updated_at: null,
    system: {
      app_language: I18n.getCurrentLanguage ? I18n.getCurrentLanguage() : 'zh-CN',
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
      current: defaultScenarioId,
      lists: [{
        id: defaultScenarioId,
        name: I18n.t('scenario_default'),
        proxies: [],
        defaultProxyId: null,
        lastProxyId: null,
        automation: normalizeScenarioAutomation()
      }]
    },
    subscriptions: []
  };
}

function normalizeConfigEntityIds(config) {
  const scenarios = config.scenarios?.lists || [];
  const subscriptions = config.subscriptions || [];
  const scenarioIdMap = new Map();
  const proxyIdMap = new Map();
  const subscriptionIdMap = new Map();
  const usedScenarioIds = new Set();
  const usedProxyIds = new Set();
  const usedSubscriptionIds = new Set();
  const isExpectedId = (id, prefix) => new RegExp(`^${prefix}_\\d{14}$`).test(id || '');

  const orderedSubscriptions = subscriptions.map((subscription, index) => ({
    subscription: subscription,
    order: Number.isInteger(subscription.order) && subscription.order >= 0 ? subscription.order : index,
    index: index
  }));
  orderedSubscriptions.sort((left, right) => left.order - right.order || left.index - right.index);
  subscriptions.splice(0, subscriptions.length, ...orderedSubscriptions.map((entry, order) => {
    entry.subscription.order = order;
    return entry.subscription;
  }));

  subscriptions.forEach(subscription => {
    const oldId = subscription.id;
    const newId = isExpectedId(oldId, 'subscription') && !usedSubscriptionIds.has(oldId)
      ? oldId
      : generateSubscriptionId();
    subscription.id = newId;
    usedSubscriptionIds.add(newId);
    if (oldId !== undefined && !subscriptionIdMap.has(oldId)) subscriptionIdMap.set(oldId, newId);
  });

  scenarios.forEach(scenario => {
    const oldId = scenario.id;
    const newId = isExpectedId(oldId, 'scenario') && !usedScenarioIds.has(oldId)
      ? oldId
      : generateScenarioId();
    scenario.id = newId;
    usedScenarioIds.add(newId);
    if (oldId !== undefined && !scenarioIdMap.has(oldId)) scenarioIdMap.set(oldId, newId);

    (scenario.proxies || []).forEach(proxy => {
      const oldProxyId = proxy.id;
      const newProxyId = isExpectedId(oldProxyId, 'proxy') && !usedProxyIds.has(oldProxyId)
        ? oldProxyId
        : generateProxyId();
      proxy.id = newProxyId;
      usedProxyIds.add(newProxyId);
      if (oldProxyId !== undefined && !proxyIdMap.has(oldProxyId)) proxyIdMap.set(oldProxyId, newProxyId);
    });
  });

  if (scenarioIdMap.has(config.scenarios.current)) {
    config.scenarios.current = scenarioIdMap.get(config.scenarios.current);
  }

  scenarios.forEach(scenario => {
    if (proxyIdMap.has(scenario.defaultProxyId)) {
      scenario.defaultProxyId = proxyIdMap.get(scenario.defaultProxyId);
    }
    if (proxyIdMap.has(scenario.lastProxyId)) {
      scenario.lastProxyId = proxyIdMap.get(scenario.lastProxyId);
    }
    (scenario.proxies || []).forEach(proxy => {
      proxy.subscription_ids = (proxy.subscription_ids || []).map(subscriptionId => (
        subscriptionIdMap.get(subscriptionId) || subscriptionId
      ));
    });
  });
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
  const defaultSync = getDefaultConfig().system.sync;
  const sourceSync = config.system.sync || {};
  const intervalMinutes = Number(sourceSync.interval_minutes);
  config.system.sync = {
    ...defaultSync,
    ...sourceSync,
    type: sourceSync.type === 'gist' ? 'gist' : 'native',
    auto_mode: ['push', 'pull'].includes(sourceSync.auto_mode) ? sourceSync.auto_mode : 'off',
    interval_minutes: [15, 30, 60, 360, 720, 1440].includes(intervalMinutes) ? intervalMinutes : 360,
    last_sync_at: typeof sourceSync.last_sync_at === 'string' ? sourceSync.last_sync_at : null,
    last_sync_direction: ['push', 'pull'].includes(sourceSync.last_sync_direction)
      ? sourceSync.last_sync_direction
      : null,
    gist: { ...defaultSync.gist, ...(sourceSync.gist || {}) }
  };
  if (!Array.isArray(config.subscriptions)) {
    config.subscriptions = [];
  }
  normalizeConfigEntityIds(config);
  config.updated_at = typeof config.updated_at === 'string' ? config.updated_at : null;
  config.version = 5;

  const knownSubscriptionIds = new Set(config.subscriptions.map(item => item.id));

  // Ensure all proxies have unique IDs
  config.scenarios.lists.forEach(scenario => {
    if (scenario.proxies) {
      scenario.proxies.forEach(proxy => {
        if (!proxy.id) {
          proxy.id = generateProxyId();
        }
        proxy.color = normalizeConfigProxyColor(proxy.color);
        if (!Array.isArray(proxy.subscription_ids)) proxy.subscription_ids = [];
        if (proxy.subscription) {
          const subscriptionId = generateSubscriptionId();
          if (!knownSubscriptionIds.has(subscriptionId)) {
            config.subscriptions.push({
              ...proxy.subscription,
              id: subscriptionId,
              name: proxy.name || I18n.t('subscription_config_title'),
              order: config.subscriptions.length
            });
            knownSubscriptionIds.add(subscriptionId);
          }
          if (!proxy.subscription_ids.includes(subscriptionId)) proxy.subscription_ids.push(subscriptionId);
          delete proxy.subscription;
        }
      });
    }
    normalizeScenarioSettings(scenario);
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
    auto_mode: syncConfig?.auto_mode || 'off',
    interval_minutes: syncConfig?.interval_minutes || 360,
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
    defaultProxyId: s.defaultProxyId || null,
    lastProxyId: s.lastProxyId || null,
    automation: normalizeScenarioAutomation(s.automation),
    proxies: processProxies(s.proxies)
  }));

  const formattedSubscriptions = (config.subscriptions || []).map(subscription => {
    const current = subscription.current || 'autoproxy';
    const currentList = subscription.lists?.[current];
    return {
      ...subscription,
      current: current,
      lists: currentList ? { [current]: JSON.parse(JSON.stringify(currentList)) } : {}
    };
  });

  return {
    version: 5,
    updated_at: typeof config.updated_at === 'string' ? config.updated_at : null,
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
    },
    subscriptions: formattedSubscriptions
  };
}

function buildConfigFileData(options = {}) {
  const includeSubscriptions = options.includeSubscriptions !== false;
  const includeSubscriptionCache = options.includeSubscriptionCache === true;
  const data = buildConfigData(false);
  data.version = CONFIG_FILE_VERSION;
  if (data.system) delete data.system.sync;
  if (data.system) {
    const system = data.system;
    data.system = {
      ...system,
      language: system.app_language || 'zh-CN',
      theme: {
        mode: system.theme_mode || 'light',
        automation: {
          night: {
            start: system.night_mode_start || '22:00',
            end: system.night_mode_end || '06:00'
          }
        }
      }
    };
    delete data.system.app_language;
    delete data.system.theme_mode;
    delete data.system.night_mode_start;
    delete data.system.night_mode_end;
  }

  const proxies = [];
  data.scenarios.lists = (data.scenarios.lists || []).map((scenario, scenarioOrder) => {
    const scenarioData = {};
    Object.entries(scenario).forEach(([key, value]) => {
      if (key === 'proxies') return;
      scenarioData[key] = value;
      if (key === 'name') scenarioData.order = scenarioOrder;
    });
    if (!Object.prototype.hasOwnProperty.call(scenarioData, 'order')) {
      scenarioData.order = scenarioOrder;
    }
    (scenario.proxies || []).forEach((proxy, order) => {
      const proxyData = {};
      Object.entries(proxy).forEach(([key, value]) => {
        proxyData[key] = value;
        if (key === 'name') proxyData.order = order;
      });
      if (!Object.prototype.hasOwnProperty.call(proxyData, 'order')) proxyData.order = order;
      proxyData.scenarioId = scenarioData.id;
      proxies.push(proxyData);
    });
    return scenarioData;
  });
  data.scenarios.lists.sort((left, right) => {
    const leftId = String(left.id || '');
    const rightId = String(right.id || '');
    if (leftId === rightId) return 0;
    return leftId < rightId ? -1 : 1;
  });
  proxies.sort((left, right) => {
    const leftId = String(left.id || '');
    const rightId = String(right.id || '');
    if (leftId === rightId) return 0;
    return leftId < rightId ? -1 : 1;
  });

  const subscriptions = data.subscriptions;
  const scenarios = data.scenarios;
  delete data.subscriptions;
  delete data.scenarios;
  data.proxies = proxies;
  data.scenarios = scenarios;

  if (!includeSubscriptions) {
    return data;
  }

  data.subscriptions = (subscriptions || []).map((subscription, subscriptionOrder) => {
    const type = subscription.current || 'autoproxy';
    const config = JSON.parse(JSON.stringify(subscription.lists?.[type] || {}));
    const cache = {};
    SUBSCRIPTION_CACHE_KEYS.forEach(key => {
      if (includeSubscriptionCache && Object.prototype.hasOwnProperty.call(config, key)) {
        cache[key] = config[key];
      }
      delete config[key];
    });
    delete config.cache;
    const remainingConfig = { ...config };
    delete remainingConfig.url;
    delete remainingConfig.reverse;
    delete remainingConfig.refresh_interval;

    const item = {
      enabled: subscription.enabled !== false,
      id: subscription.id,
      name: subscription.name,
      order: Number.isInteger(subscription.order) && subscription.order >= 0
        ? subscription.order
        : subscriptionOrder,
      type: type,
      url: config.url || '',
      reverse: config.reverse === true,
      refresh_interval: Number(config.refresh_interval) || 0,
      ...remainingConfig
    };
    if (includeSubscriptionCache && Object.keys(cache).length) item.cache = cache;
    return item;
  });
  data.subscriptions.sort((left, right) => {
    const leftId = String(left.id || '');
    const rightId = String(right.id || '');
    if (leftId === rightId) return 0;
    return leftId < rightId ? -1 : 1;
  });

  return data;
}

function buildEditableConfigData(options = {}) {
  return buildConfigFileData(options);
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

function exportConfig(options = {}) {
  var configBundle = buildConfigFileData(options);
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

function getLocalSyncConfig() {
  const config = StorageModule ? StorageModule.getConfig() : getDefaultConfig();
  const localSync = window.SyncModule && window.SyncModule.getSyncConfig
    ? window.SyncModule.getSyncConfig()
    : config.system?.sync;
  return JSON.parse(JSON.stringify(localSync || getDefaultConfig().system.sync));
}

function expandSubscriptionCache(rawData) {
  if (!rawData || typeof rawData !== 'object') return rawData;
  const data = JSON.parse(JSON.stringify(rawData));
  (data.subscriptions || []).forEach(subscription => {
    Object.values(subscription.lists || {}).forEach(list => {
      const cache = list.cache;
      if (!cache || typeof cache !== 'object') return;
      SUBSCRIPTION_CACHE_KEYS.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(cache, key)) {
          list[key] = cache[key];
        }
      });
      delete list.cache;
    });
  });
  return data;
}

function inflateConfigFileSystem(rawData) {
  if (!rawData || typeof rawData !== 'object' || !rawData.system) return rawData;
  const hasLanguage = Object.prototype.hasOwnProperty.call(rawData.system, 'language');
  if (!hasLanguage && !rawData.system.theme) return rawData;
  const data = JSON.parse(JSON.stringify(rawData));
  if (hasLanguage) {
    data.system.app_language = data.system.language || data.system.app_language || 'zh-CN';
    delete data.system.language;
  }
  if (data.system.theme) {
    const theme = data.system.theme;
    const night = theme.automation?.night || {};
    data.system.theme_mode = theme.mode || data.system.theme_mode || 'light';
    data.system.night_mode_start = night.start || data.system.night_mode_start || '22:00';
    data.system.night_mode_end = night.end || data.system.night_mode_end || '06:00';
    delete data.system.theme;
  }
  return data;
}

function inflateConfigFileProxies(rawData) {
  if (!rawData || typeof rawData !== 'object' || !Array.isArray(rawData.proxies)) return rawData;
  const data = JSON.parse(JSON.stringify(rawData));
  const scenarios = data.scenarios?.lists || [];
  const orderedScenarios = scenarios.map((scenario, index) => ({
    scenario: scenario,
    order: Number.isInteger(scenario.order) && scenario.order >= 0 ? scenario.order : index,
    index: index
  }));
  orderedScenarios.sort((left, right) => left.order - right.order || left.index - right.index);
  data.scenarios.lists = orderedScenarios.map(entry => entry.scenario);
  const scenarioMap = new Map(scenarios.map(scenario => {
    delete scenario.order;
    scenario.proxies = [];
    return [scenario.id, scenario];
  }));
  const fallbackScenario = scenarioMap.get(data.scenarios?.current) || scenarios[0];

  data.proxies.forEach(proxy => {
    const scenario = scenarioMap.get(proxy.scenarioId) || fallbackScenario;
    if (!scenario) return;
    const item = { ...proxy };
    const order = Number.isInteger(item.order) && item.order >= 0 ? item.order : Number.MAX_SAFE_INTEGER;
    delete item.scenarioId;
    delete item.order;
    scenario.proxies.push({ item: item, order: order });
  });

  scenarios.forEach(scenario => {
    scenario.proxies = scenario.proxies
      .sort((left, right) => left.order - right.order || String(left.item.id || '').localeCompare(String(right.item.id || '')))
      .map(entry => entry.item);
  });
  delete data.proxies;
  return data;
}

function inflateConfigFileSubscriptions(rawData) {
  if (!rawData || typeof rawData !== 'object' || !Array.isArray(rawData.subscriptions)) return rawData;
  const data = JSON.parse(JSON.stringify(rawData));
  data.subscriptions = data.subscriptions.map(subscription => {
    if (!subscription.type || subscription.lists) return subscription;
    const type = subscription.type;
    const config = {};
    Object.entries(subscription).forEach(([key, value]) => {
      if (!['id', 'name', 'order', 'type', 'enabled'].includes(key)) config[key] = value;
    });
    return {
      id: subscription.id,
      name: subscription.name,
      order: subscription.order,
      enabled: subscription.enabled !== false,
      current: type,
      lists: { [type]: config }
    };
  });
  return data;
}

function prepareConfigForApply(rawData, options = {}) {
  const expandedData = expandSubscriptionCache(
    inflateConfigFileSubscriptions(inflateConfigFileProxies(rawData))
  );
  const sourceHasSubscriptions = Object.prototype.hasOwnProperty.call(expandedData || {}, 'subscriptions');
  const preserveOmittedSubscriptionCache = options.preserveOmittedSubscriptionCache !== false;
  const localConfig = StorageModule ? StorageModule.getConfig() : getDefaultConfig();
  const data = migrateConfig(expandedData);

  if (window.SubscriptionModule && window.SubscriptionModule.parseProxyListSubscriptions) {
    SubscriptionModule.parseProxyListSubscriptions(
      data.scenarios?.lists?.flatMap(s => s.proxies) || []
    );
  }

  data.system = data.system || {};
  data.system.sync = getLocalSyncConfig();

  if (!sourceHasSubscriptions) {
    data.subscriptions = JSON.parse(JSON.stringify(localConfig.subscriptions || []));
  } else if (preserveOmittedSubscriptionCache) {
    const localSubscriptions = new Map(
      (localConfig.subscriptions || []).map(subscription => [subscription.id, subscription])
    );
    const localSubscriptionsByIdentity = new Map(
      (localConfig.subscriptions || []).map(subscription => [
        `${subscription.name || ''}\u0000${subscription.current || ''}`,
        subscription
      ])
    );
    data.subscriptions = (data.subscriptions || []).map(subscription => {
      const localSubscription = localSubscriptions.get(subscription.id)
        || localSubscriptionsByIdentity.get(`${subscription.name || ''}\u0000${subscription.current || ''}`);
      if (!localSubscription) return subscription;

      Object.entries(subscription.lists || {}).forEach(([format, list]) => {
        const localList = localSubscription.lists?.[format];
        if (!localList) return;
        SUBSCRIPTION_CACHE_KEYS.forEach(key => {
          if (!Object.prototype.hasOwnProperty.call(list, key) && Object.prototype.hasOwnProperty.call(localList, key)) {
            list[key] = localList[key];
          }
        });
      });
      return subscription;
    });
  }
  return data;
}

function applyConfigData(rawData, options = {}) {
  const data = prepareConfigForApply(rawData, options);

  if (window.StorageModule) {
    StorageModule.setConfig(data);
    return StorageModule.save().then(() => {
      applyImportedSettings(data);

      if (window.SubscriptionModule && window.SubscriptionModule.scheduleAllBackgroundRefreshes) {
        window.SubscriptionModule.scheduleAllBackgroundRefreshes(data);
      }

      return data;
    });
  }

  return new Promise((resolve, reject) => {
    data.updated_at = new Date().toISOString();
    chrome.storage.local.set({ config: data }, function () {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to save configuration'));
        return;
      }
      applyImportedSettings(data);
      resolve(data);
    });
  });
}

function importConfig(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var rawData = JSON.parse(e.target.result);
      if (rawData) {
        applyConfigData(rawData).then(() => {
          UtilsModule.showTip(I18n.t('save_success'), false);
        }).catch(err => {
          UtilsModule.showTip(I18n.t('save_failed') + ': ' + err.message, true);
        });
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

const lastGeneratedIdTimes = {};

function formatIdTimestamp(date) {
  const pad = value => String(value).padStart(2, '0');
  return date.getFullYear()
    + pad(date.getMonth() + 1)
    + pad(date.getDate())
    + pad(date.getHours())
    + pad(date.getMinutes())
    + pad(date.getSeconds());
}

function generateId(prefix) {
  const currentSecond = Math.floor(Date.now() / 1000) * 1000;
  const timestamp = Math.max(currentSecond, (lastGeneratedIdTimes[prefix] || 0) + 1000);
  lastGeneratedIdTimes[prefix] = timestamp;
  return prefix + formatIdTimestamp(new Date(timestamp));
}

function generateProxyId() {
  return generateId('proxy_');
}

function generateScenarioId() {
  return generateId('scenario_');
}

function generateSubscriptionId() {
  return generateId('subscription_');
}

window.ConfigModule = {
  migrateConfig,
  buildConfigData,
  buildConfigFileData,
  buildEditableConfigData,
  applyConfigData,
  exportConfig,
  importConfig,
  getDefaultConfig,
  generateProxyId,
  generateScenarioId,
  generateSubscriptionId,
  PROXY_STATE_KEYS,
  PROXY_EXPORT_KEYS
};
