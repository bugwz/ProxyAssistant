// Proxy Assistant - Background Service Worker
// Implements Manifest V3 proxy functionality for Chrome and Firefox

// Browser detection
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;
const isChrome = !isFirefox && typeof chrome !== 'undefined';

// Global variable to store current proxy authentication credentials
let currentProxyAuth = {
  username: '',
  password: ''
};

// Track in-progress subscription fetches to prevent duplicates
const inProgressFetches = new Set();
const SUBSCRIPTION_ALARM_PREFIX = 'subscription___';
const LEGACY_SUBSCRIPTION_ALARM_PREFIX = 'subscription_';
const SCENARIO_AUTOMATION_ALARM = 'scenario-automation-next';
const CLOUD_SYNC_ALARM = 'cloud-sync-schedule';
const CLOUD_SYNC_SERVICES = ['native', 'gist'];
const CLOUD_SYNC_CHUNK_SIZE = 7 * 1024;
const CONFIG_FILE_OPTIONS_STORAGE_KEY = 'config_file_options';
const RUNTIME_LOG_STORAGE_KEY = 'runtime_logs';
const RUNTIME_LOG_LIMIT = 200;
const RUNTIME_LOG_LEVELS = ['info', 'warning', 'error'];
const CLOUD_SYNC_PROXY_KEYS = [
  'enabled', 'id', 'name', 'protocol', 'ip', 'port', 'username', 'password',
  'bypass_rules', 'include_rules', 'fallback_policy', 'color', 'subscription_ids'
];
const CLOUD_SYNC_SUBSCRIPTION_CACHE_KEYS = [
  'content', 'decoded_content', 'include_rules', 'bypass_rules',
  'include_lines', 'bypass_lines', 'last_fetch_time'
];
const MAX_PROXY_RULES_PER_PROXY = 20000;
const MAX_PROXY_REGEX_LENGTH = 512;
let scenarioAutomationEvaluation = null;
let cloudSyncQueue = Promise.resolve();
let runtimeLogQueue = Promise.resolve();

function sanitizeRuntimeLogValue(value, key = '', depth = 0) {
  if (/password|token|secret|authorization|credential/i.test(key)) return '[redacted]';
  if (depth > 3) return '[truncated]';
  if (typeof value === 'string') return value.slice(0, 500);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map(item => sanitizeRuntimeLogValue(item, '', depth + 1));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).slice(0, 20).reduce((safeValue, childKey) => {
      safeValue[childKey] = sanitizeRuntimeLogValue(value[childKey], childKey, depth + 1);
      return safeValue;
    }, {});
  }
  return String(value || '');
}

function appendRuntimeLog(level, category, event, details = {}) {
  const normalizedLevel = RUNTIME_LOG_LEVELS.includes(level) ? level : 'info';
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toISOString(),
    level: normalizedLevel,
    category: String(category || 'system').slice(0, 40),
    event: String(event || 'unknown').slice(0, 80),
    details: sanitizeRuntimeLogValue(details)
  };

  runtimeLogQueue = runtimeLogQueue
    .then(() => getStorageValues([RUNTIME_LOG_STORAGE_KEY]))
    .then(result => {
      const logs = Array.isArray(result[RUNTIME_LOG_STORAGE_KEY])
        ? result[RUNTIME_LOG_STORAGE_KEY].slice(-(RUNTIME_LOG_LIMIT - 1))
        : [];
      logs.push(entry);
      return setStorageValues({ [RUNTIME_LOG_STORAGE_KEY]: logs });
    })
    .catch(error => {
      console.info('[Worker] Failed to save runtime log:', error);
    });

  return runtimeLogQueue;
}

function getRuntimeLogs() {
  return runtimeLogQueue.then(() => getStorageValues([RUNTIME_LOG_STORAGE_KEY])).then(result => (
    Array.isArray(result[RUNTIME_LOG_STORAGE_KEY]) ? result[RUNTIME_LOG_STORAGE_KEY] : []
  ));
}

function clearRuntimeLogs() {
  const clearOperation = runtimeLogQueue.then(() => setStorageValues({ [RUNTIME_LOG_STORAGE_KEY]: [] }));
  runtimeLogQueue = clearOperation.catch(() => {});
  return clearOperation;
}

function runtimeLogValuesEqual(left, right) {
  return JSON.stringify(left === undefined ? null : left)
    === JSON.stringify(right === undefined ? null : right);
}

function getRuntimeLogEntityMap(items) {
  return new Map((Array.isArray(items) ? items : []).map(item => [String(item.id), item]));
}

function appendEntityChangeLogs(category, oldItems, newItems, options) {
  const oldMap = getRuntimeLogEntityMap(oldItems);
  const newMap = getRuntimeLogEntityMap(newItems);
  let changeCount = 0;

  newMap.forEach((item, id) => {
    const oldItem = oldMap.get(id);
    if (!oldItem) {
      appendRuntimeLog('info', category, options.addedEvent, { name: item.name || id });
      changeCount += 1;
      return;
    }
    if (!runtimeLogValuesEqual(options.comparable(oldItem), options.comparable(item))) {
      appendRuntimeLog('info', category, options.updatedEvent, { name: item.name || oldItem.name || id });
      changeCount += 1;
    }
  });

  oldMap.forEach((item, id) => {
    if (!newMap.has(id)) {
      appendRuntimeLog('info', category, options.deletedEvent, { name: item.name || id });
      changeCount += 1;
    }
  });

  const oldOrder = (Array.isArray(oldItems) ? oldItems : []).map(item => String(item.id));
  const newOrder = (Array.isArray(newItems) ? newItems : []).map(item => String(item.id));
  if (oldOrder.length === newOrder.length
    && oldOrder.every(id => newMap.has(id))
    && !runtimeLogValuesEqual(oldOrder, newOrder)) {
    appendRuntimeLog('info', category, options.reorderedEvent, { count: newOrder.length });
    changeCount += 1;
  }
  return changeCount;
}

function getProxyComparable(proxy) {
  const copy = { ...proxy };
  delete copy.id;
  delete copy.show_password;
  return copy;
}

function getScenarioComparable(scenario) {
  return {
    name: scenario.name,
    defaultProxyId: scenario.defaultProxyId,
    automation: scenario.automation
  };
}

function getSubscriptionComparable(subscription) {
  const copy = { ...subscription };
  delete copy.id;
  delete copy.order;
  return copy;
}

function auditRuntimeConfigChanges(oldConfig, newConfig) {
  if (!oldConfig || !newConfig) return;
  let changeCount = 0;

  const oldScenarios = oldConfig.scenarios?.lists || [];
  const newScenarios = newConfig.scenarios?.lists || [];
  changeCount += appendEntityChangeLogs('scenario', oldScenarios, newScenarios, {
    addedEvent: 'scenario_added',
    updatedEvent: 'scenario_updated',
    deletedEvent: 'scenario_deleted',
    reorderedEvent: 'scenario_reordered',
    comparable: getScenarioComparable
  });

  const oldScenarioMap = getRuntimeLogEntityMap(oldScenarios);
  const newScenarioMap = getRuntimeLogEntityMap(newScenarios);
  newScenarioMap.forEach((scenario, scenarioId) => {
    if (!oldScenarioMap.has(scenarioId)) return;
    changeCount += appendEntityChangeLogs('proxy', oldScenarioMap.get(scenarioId).proxies, scenario.proxies, {
      addedEvent: 'proxy_added',
      updatedEvent: 'proxy_updated',
      deletedEvent: 'proxy_deleted',
      reorderedEvent: 'proxy_reordered',
      comparable: getProxyComparable
    });
  });

  changeCount += appendEntityChangeLogs('subscription', oldConfig.subscriptions, newConfig.subscriptions, {
    addedEvent: 'subscription_added',
    updatedEvent: 'subscription_updated',
    deletedEvent: 'subscription_deleted',
    reorderedEvent: 'subscription_reordered',
    comparable: getSubscriptionComparable
  });

  if (!runtimeLogValuesEqual(oldConfig.system, newConfig.system)) {
    appendRuntimeLog('info', 'system', 'system_settings_updated');
    changeCount += 1;
  }

  if (!runtimeLogValuesEqual(oldConfig.scenarios?.current, newConfig.scenarios?.current)) {
    // Scenario activation already records its success or failure with richer context.
    changeCount += 1;
  }

  const oldComparable = { ...oldConfig };
  const newComparable = { ...newConfig };
  delete oldComparable.updated_at;
  delete newComparable.updated_at;
  if (changeCount === 0 && !runtimeLogValuesEqual(oldComparable, newComparable)) {
    appendRuntimeLog('info', 'system', 'configuration_updated');
  }
}

function recordProxyResult(mode, result, proxyInfo) {
  if (result?.success) {
    const event = mode === 'auto'
      ? 'proxy_auto_enabled'
      : (mode === 'disabled' ? 'proxy_disabled' : 'proxy_manual_enabled');
    appendRuntimeLog('info', 'proxy', event, {
      proxyName: proxyInfo?.name || ''
    });
    return;
  }
  appendRuntimeLog('error', 'proxy', 'proxy_apply_failed', {
    error: result?.error || 'Unknown error'
  });
}

function getStorageValues(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to read storage'));
        return;
      }
      resolve(result || {});
    });
  });
}

function setStorageValues(values) {
  return new Promise((resolve, reject) => {
    if (Object.prototype.hasOwnProperty.call(values, 'config')) {
      const updatedAt = new Date().toISOString();
      values.config.updated_at = updatedAt;
      values.config_updated_at = updatedAt;
    }
    chrome.storage.local.set(values, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to write storage'));
        return;
      }
      resolve();
    });
  });
}

function callStorageArea(area, method, value) {
  return new Promise((resolve, reject) => {
    area[method](value, result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || `Sync storage ${method} failed`));
        return;
      }
      resolve(result);
    });
  });
}

function calculateCloudSyncChecksum(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash &= hash;
  }
  return `crc:${Math.abs(hash).toString(16)}`;
}

function normalizeWorkerSyncConfig(sync) {
  const source = sync && typeof sync === 'object' ? sync : {};
  const normalizeService = (service, defaults = {}) => {
    const serviceSource = service && typeof service === 'object' ? service : {};
    return {
      ...defaults,
      ...serviceSource,
      auto_mode: ['push', 'pull'].includes(serviceSource.auto_mode) ? serviceSource.auto_mode : 'off',
      interval_minutes: [15, 30, 60, 360, 720, 1440].includes(Number(serviceSource.interval_minutes))
        ? Number(serviceSource.interval_minutes)
        : 360
    };
  };

  if (source.native || source.gist?.auto_mode !== undefined) {
    return {
      native: normalizeService(source.native),
      gist: normalizeService(source.gist, {
        token: '',
        filename: 'proxy_assistant_config.json',
        gist_id: ''
      })
    };
  }

  const legacyType = source.type === 'gist' ? 'gist' : 'native';
  const legacyService = {
    auto_mode: source.auto_mode,
    interval_minutes: source.interval_minutes,
    last_sync_at: source.last_sync_at,
    last_sync_direction: source.last_sync_direction
  };
  return {
    native: normalizeService(legacyType === 'native' ? legacyService : {}),
    gist: normalizeService(legacyType === 'gist' ? { ...source.gist, ...legacyService } : source.gist, {
      token: '',
      filename: 'proxy_assistant_config.json',
      gist_id: ''
    })
  };
}

function buildCloudSyncPayload(config, options = {}) {
  const includeSubscriptions = options.includeSubscriptions !== false;
  const includeSubscriptionCache = options.includeSubscriptionCache === true;
  const source = JSON.parse(JSON.stringify(config || {}));
  const system = source.system || {};
  const theme = system.theme || {
    mode: system.theme_mode || 'light',
    automation: {
      night: {
        start: system.night_mode_start || '22:00',
        end: system.night_mode_end || '06:00'
      }
    }
  };
  if (!system.theme && system.custom_theme) theme.custom = system.custom_theme;
  const payload = {
    version: 5,
    updated_at: typeof source.updated_at === 'string' ? source.updated_at : null,
    system: {
      ...system,
      language: system.app_language || system.language || 'zh-CN',
      theme: theme
    },
    proxies: [],
    scenarios: {
      current: source.scenarios?.current || null,
      lists: []
    }
  };
  delete payload.system.app_language;
  delete payload.system.theme_mode;
  delete payload.system.custom_theme;
  delete payload.system.night_mode_start;
  delete payload.system.night_mode_end;
  delete payload.system.sync;

  payload.scenarios.lists = (source.scenarios?.lists || []).map((scenario, scenarioOrder) => {
    const scenarioData = {};
    Object.entries(scenario).forEach(([key, value]) => {
      if (key === 'proxies') return;
      scenarioData[key] = value;
      if (key === 'name') scenarioData.order = scenarioOrder;
    });
    if (!Object.prototype.hasOwnProperty.call(scenarioData, 'order')) scenarioData.order = scenarioOrder;

    (scenario.proxies || []).forEach((proxy, proxyOrder) => {
      const proxyData = {};
      CLOUD_SYNC_PROXY_KEYS.forEach(key => {
        if (key === 'enabled') {
          proxyData.enabled = proxy.enabled !== undefined ? proxy.enabled : proxy.disabled !== true;
        } else if (Object.prototype.hasOwnProperty.call(proxy, key)) {
          proxyData[key] = proxy[key];
        }
      });
      proxyData.order = proxyOrder;
      proxyData.scenarioId = scenarioData.id;
      payload.proxies.push(proxyData);
    });
    return scenarioData;
  });
  payload.scenarios.lists.sort((left, right) => String(left.id || '').localeCompare(String(right.id || '')));
  payload.proxies.sort((left, right) => String(left.id || '').localeCompare(String(right.id || '')));

  if (includeSubscriptions) {
    payload.subscriptions = (source.subscriptions || []).map((subscription, subscriptionOrder) => {
      const type = subscription.current || 'autoproxy';
      const config = JSON.parse(JSON.stringify(subscription.lists?.[type] || {}));
      const cache = {};
      CLOUD_SYNC_SUBSCRIPTION_CACHE_KEYS.forEach(key => {
        if (includeSubscriptionCache && Object.prototype.hasOwnProperty.call(config, key)) cache[key] = config[key];
        delete config[key];
      });
      delete config.cache;
      const item = {
        enabled: subscription.enabled !== false,
        id: subscription.id,
        name: subscription.name,
        order: Number.isInteger(subscription.order) && subscription.order >= 0
          ? subscription.order
          : subscriptionOrder,
        type,
        url: config.url || '',
        reverse: config.reverse === true,
        refresh_interval: Number(config.refresh_interval) || 0
      };
      delete config.url;
      delete config.reverse;
      delete config.refresh_interval;
      Object.assign(item, config);
      if (includeSubscriptionCache && Object.keys(cache).length) item.cache = cache;
      return item;
    });
    payload.subscriptions.sort((left, right) => String(left.id || '').localeCompare(String(right.id || '')));
  }

  const orderedPayload = {
    version: payload.version,
    proxies: payload.proxies,
    scenarios: payload.scenarios
  };
  if (Object.prototype.hasOwnProperty.call(payload, 'subscriptions')) {
    orderedPayload.subscriptions = payload.subscriptions;
  }
  orderedPayload.system = payload.system;
  orderedPayload.updated_at = payload.updated_at;
  return orderedPayload;
}

function inflateCloudSyncPayload(remoteConfig, localConfig) {
  const data = JSON.parse(JSON.stringify(remoteConfig || {}));
  const system = data.system || {};
  if (Object.prototype.hasOwnProperty.call(system, 'language')) {
    system.app_language = system.language || 'zh-CN';
    delete system.language;
  }
  if (system.theme) {
    const night = system.theme.automation?.night || {};
    system.theme_mode = system.theme.mode || 'light';
    system.custom_theme = system.theme.custom || system.custom_theme;
    system.night_mode_start = night.start || '22:00';
    system.night_mode_end = night.end || '06:00';
    delete system.theme;
  }
  data.system = system;

  if (Array.isArray(data.proxies)) {
    const scenarios = data.scenarios?.lists || [];
    scenarios.sort((left, right) => (left.order || 0) - (right.order || 0));
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
      const order = Number.isInteger(item.order) ? item.order : Number.MAX_SAFE_INTEGER;
      delete item.order;
      delete item.scenarioId;
      scenario.proxies.push({ item, order });
    });
    scenarios.forEach(scenario => {
      scenario.proxies = scenario.proxies
        .sort((left, right) => left.order - right.order)
        .map(entry => entry.item);
    });
    delete data.proxies;
  }

  if (Array.isArray(data.subscriptions)) {
    data.subscriptions = data.subscriptions.map(subscription => {
      if (!subscription.type || subscription.lists) return subscription;
      const type = subscription.type;
      const list = {};
      Object.entries(subscription).forEach(([key, value]) => {
        if (!['id', 'name', 'order', 'type', 'enabled'].includes(key)) list[key] = value;
      });
      if (list.cache && typeof list.cache === 'object') {
        Object.assign(list, list.cache);
        delete list.cache;
      }
      return {
        id: subscription.id,
        name: subscription.name,
        order: subscription.order,
        enabled: subscription.enabled !== false,
        current: type,
        lists: { [type]: list }
      };
    });
  } else {
    data.subscriptions = JSON.parse(JSON.stringify(localConfig?.subscriptions || []));
  }
  data.system.sync = normalizeWorkerSyncConfig(localConfig?.system?.sync);
  return data;
}

async function pushNativeCloudConfig(config, options) {
  const json = JSON.stringify(buildCloudSyncPayload(config, options));
  const chunks = [];
  for (let index = 0; index < json.length; index += CLOUD_SYNC_CHUNK_SIZE) {
    chunks.push(json.substring(index, index + CLOUD_SYNC_CHUNK_SIZE));
  }

  const values = {
    meta: {
      version: 4,
      chunks: { start: 0, end: chunks.length - 1 },
      totalSize: json.length,
      checksum: calculateCloudSyncChecksum(json)
    }
  };
  chunks.forEach((chunk, index) => {
    values[`data.${index}`] = chunk;
  });

  const existing = await callStorageArea(chrome.storage.sync, 'get', null) || {};
  await callStorageArea(chrome.storage.sync, 'set', values);
  const staleKeys = Object.keys(existing).filter(key => (
    /^data\.\d+$/.test(key) && !Object.prototype.hasOwnProperty.call(values, key)
  ));
  if (staleKeys.length) await callStorageArea(chrome.storage.sync, 'remove', staleKeys);
}

async function pullNativeCloudConfig() {
  const metaResult = await callStorageArea(chrome.storage.sync, 'get', 'meta') || {};
  const meta = metaResult.meta;
  if (!meta?.chunks || typeof meta.chunks.start !== 'number' || typeof meta.chunks.end !== 'number') {
    throw new Error('Invalid or missing cloud sync metadata');
  }

  const keys = [];
  for (let index = meta.chunks.start; index <= meta.chunks.end; index += 1) {
    keys.push(`data.${index}`);
  }
  const values = await callStorageArea(chrome.storage.sync, 'get', keys) || {};
  const chunks = keys.map(key => {
    if (typeof values[key] !== 'string') throw new Error(`Missing cloud sync chunk: ${key}`);
    return values[key];
  });
  const json = chunks.join('');
  if (calculateCloudSyncChecksum(json) !== meta.checksum) {
    throw new Error('Cloud sync checksum mismatch');
  }
  return JSON.parse(json);
}

async function findCloudSyncGist(token, filename) {
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(`https://api.github.com/gists?page=${page}&per_page=100`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!response.ok) throw new Error(`GitHub Gist lookup failed (${response.status})`);
    const gists = await response.json();
    const match = gists.find(gist => gist.files?.[filename]);
    if (match) return match.id;
    if (!gists.length) break;
  }
  return '';
}

async function pushGistCloudConfig(config, options) {
  const sync = config.system?.sync || {};
  const token = sync.gist?.token;
  const filename = sync.gist?.filename || 'proxy_assistant_config.json';
  if (!token) throw new Error('GitHub Gist token is required');

  let gistId = sync.gist?.gist_id || '';
  if (!gistId) gistId = await findCloudSyncGist(token, filename);
  const files = { [filename]: { content: JSON.stringify(buildCloudSyncPayload(config, options), null, 2) } };
  const response = await fetch(gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists', {
    method: gistId ? 'PATCH' : 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(gistId ? { files } : {
      description: 'Proxy Assistant Configuration',
      public: false,
      files
    })
  });
  if (!response.ok) throw new Error(`GitHub Gist push failed (${response.status})`);
  const result = await response.json();
  sync.gist.gist_id = result.id || gistId;
}

async function pullGistCloudConfig(config) {
  const sync = config.system?.sync || {};
  const token = sync.gist?.token;
  const filename = sync.gist?.filename || 'proxy_assistant_config.json';
  if (!token) throw new Error('GitHub Gist token is required');

  let gistId = sync.gist?.gist_id || '';
  if (!gistId) gistId = await findCloudSyncGist(token, filename);
  if (!gistId) throw new Error('GitHub Gist configuration was not found');
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok) throw new Error(`GitHub Gist pull failed (${response.status})`);
  const result = await response.json();
  const content = result.files?.[filename]?.content;
  if (!content) throw new Error('GitHub Gist configuration file was not found');
  sync.gist.gist_id = gistId;
  return JSON.parse(content);
}

async function executeScheduledCloudSync(type) {
  try {
    const stored = await getStorageValues(['config', CONFIG_FILE_OPTIONS_STORAGE_KEY]);
    const localConfig = stored.config;
    const configFileOptions = stored[CONFIG_FILE_OPTIONS_STORAGE_KEY] || {};
    const sync = normalizeWorkerSyncConfig(localConfig?.system?.sync);
    if (localConfig?.system) localConfig.system.sync = sync;
    const service = sync?.[type];
    const direction = service?.auto_mode;
    if (!localConfig || !['push', 'pull'].includes(direction)) return false;

    if (direction === 'push') {
      if (type === 'gist') await pushGistCloudConfig(localConfig, configFileOptions);
      else await pushNativeCloudConfig(localConfig, configFileOptions);
      service.last_sync_at = new Date().toISOString();
      service.last_sync_direction = 'push';
      await setStorageValues({ config: localConfig });
    } else {
      const remoteConfig = type === 'gist'
        ? await pullGistCloudConfig(localConfig)
        : await pullNativeCloudConfig();
      if (!remoteConfig || typeof remoteConfig !== 'object') {
        throw new Error('Remote cloud configuration is invalid');
      }

      service.last_sync_at = new Date().toISOString();
      service.last_sync_direction = 'pull';
      const inflatedConfig = inflateCloudSyncPayload(remoteConfig, localConfig);
      inflatedConfig.system.sync = sync;
      await setStorageValues({ config: inflatedConfig });
      scheduleAllBackgroundRefreshes(inflatedConfig);
      evaluateScenarioAutomation(inflatedConfig);
    }

    console.log(`[Worker] Scheduled cloud ${direction} completed`);
    return true;
  } catch (error) {
    console.info('[Worker] Scheduled cloud sync failed:', error);
    return false;
  }
}

function runScheduledCloudSync(type = 'native') {
  if (!CLOUD_SYNC_SERVICES.includes(type)) return Promise.resolve(false);
  const task = cloudSyncQueue.then(() => executeScheduledCloudSync(type));
  cloudSyncQueue = task.catch(() => false);
  return task;
}

function scheduleCloudSync(config) {
  const sync = normalizeWorkerSyncConfig(config?.system?.sync);
  chrome.alarms.clear(CLOUD_SYNC_ALARM);

  CLOUD_SYNC_SERVICES.forEach(type => {
    const service = sync[type] || {};
    const intervalMinutes = Number(service.interval_minutes);
    const alarmName = `${CLOUD_SYNC_ALARM}-${type}`;
    const shouldSchedule = ['push', 'pull'].includes(service.auto_mode)
      && [15, 30, 60, 360, 720, 1440].includes(intervalMinutes);

    if (!shouldSchedule) {
      chrome.alarms.clear(alarmName);
      return;
    }

    chrome.alarms.get(alarmName, existingAlarm => {
      if (existingAlarm?.periodInMinutes === intervalMinutes) return;
      const createAlarm = () => chrome.alarms.create(alarmName, {
        delayInMinutes: intervalMinutes,
        periodInMinutes: intervalMinutes
      });
      if (existingAlarm) chrome.alarms.clear(alarmName, createAlarm);
      else createAlarm();
    });
  });
}

function getTimeRules(scenario) {
  const rules = scenario?.automation?.rules;
  return Array.isArray(rules) ? rules.filter(rule => rule?.type === 'time') : [];
}

function parseTimeMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function isTimeRuleActive(rule, now = new Date()) {
  if (!rule || !Array.isArray(rule.weekdays) || !rule.weekdays.length) return false;
  const start = parseTimeMinutes(rule.start);
  const end = parseTimeMinutes(rule.end);
  if (start === null || end === null || start === end) return false;

  const weekdays = new Set(rule.weekdays.map(Number));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDay = now.getDay();

  if (start < end) {
    return weekdays.has(currentDay) && currentMinutes >= start && currentMinutes < end;
  }

  const previousDay = (currentDay + 6) % 7;
  return (weekdays.has(currentDay) && currentMinutes >= start)
    || (weekdays.has(previousDay) && currentMinutes < end);
}

function isScenarioAutomationActive(scenario, now = new Date()) {
  const rules = getTimeRules(scenario);
  if (!rules.length) return false;
  const matches = rules.map(rule => isTimeRuleActive(rule, now));
  return rules[1]?.operator === 'and' ? matches.every(Boolean) : matches.some(Boolean);
}

function findScheduledScenario(config, now = new Date()) {
  const scenarios = config?.scenarios?.lists || [];
  return scenarios.find(scenario => (
    scenario?.automation?.enabled === true && isScenarioAutomationActive(scenario, now)
  )) || null;
}

function getNextScenarioAutomationBoundary(config, now = new Date()) {
  const scenarios = config?.scenarios?.lists || [];
  let nextBoundary = null;

  scenarios.forEach(scenario => {
    if (scenario?.automation?.enabled !== true) return;
    getTimeRules(scenario).forEach(rule => {
      const startMinutes = parseTimeMinutes(rule?.start);
      const endMinutes = parseTimeMinutes(rule?.end);
      if (!Array.isArray(rule?.weekdays) || !rule.weekdays.length
        || startMinutes === null || endMinutes === null || startMinutes === endMinutes) return;

      const weekdays = new Set(rule.weekdays.map(Number));
      for (let offset = -1; offset <= 7; offset += 1) {
        const day = new Date(now);
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() + offset);
        if (!weekdays.has(day.getDay())) continue;

        const start = new Date(day);
        start.setMinutes(startMinutes);
        const end = new Date(day);
        end.setMinutes(endMinutes);
        if (endMinutes <= startMinutes) end.setDate(end.getDate() + 1);

        [start, end].forEach(boundary => {
          if (boundary.getTime() > now.getTime()
            && (nextBoundary === null || boundary.getTime() < nextBoundary)) {
            nextBoundary = boundary.getTime();
          }
        });
      }
    });
  });

  return nextBoundary;
}

function scheduleScenarioAutomation(config, now = new Date()) {
  const nextBoundary = getNextScenarioAutomationBoundary(config, now);
  if (nextBoundary === null) {
    chrome.alarms.clear(SCENARIO_AUTOMATION_ALARM);
    return null;
  }

  chrome.alarms.create(SCENARIO_AUTOMATION_ALARM, {
    when: Math.max(nextBoundary + 1000, Date.now() + 1000)
  });
  return nextBoundary;
}

function getProxySubscriptions(proxy, config = currentConfig) {
  const ids = Array.isArray(proxy?.subscription_ids) ? proxy.subscription_ids : [];
  const subscriptions = config?.subscriptions || [];
  return ids.map(id => subscriptions.find(item => item.id === id))
    .filter(subscription => subscription && subscription.enabled !== false);
}

function getMergedProxySubscription(proxy, config = currentConfig) {
  const subscriptions = getProxySubscriptions(proxy, config);
  if (!subscriptions.length) return null;

  const includeRules = [];
  const bypassRules = [];
  subscriptions.forEach(subscription => {
    const item = subscription.lists?.[subscription.current];
    if (item?.include_rules) includeRules.push(item.include_rules);
    if (item?.bypass_rules) bypassRules.push(item.bypass_rules);
  });

  return {
    enabled: true,
    current: 'autoproxy',
    lists: {
      autoproxy: {
        include_rules: includeRules.join('\n'),
        bypass_rules: bypassRules.join('\n')
      }
    }
  };
}
const SUBSCRIPTION_FORMATS = ['autoproxy', 'switchy_omega', 'switchy_legacy', 'pac'];

// Helper to sync auth to session storage (MV3 state safety)
function updateSessionAuth(auth) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    chrome.storage.session.set({ currentProxyAuth: auth });
  }
}

// Firefox-specific state management
// FoxyProxy implementation uses internal state + onRequest instead of settings API
let firefoxProxyState = {
  mode: 'disabled', // disabled, manual, auto
  currentProxy: null,
  list: [],
  testMode: false,
  testProxy: null
};

// Global config cache for Firefox auto mode
let currentConfig = null;
const firefoxProxyRuleCache = new WeakMap();

// Helper to sync Firefox state to session storage
function updateFirefoxSessionState() {
  if (isFirefox && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    chrome.storage.session.set({ firefoxProxyState: firefoxProxyState });
  }
}

// State loading promise for async handling
let stateLoaded = false;
let stateLoadedResolve = null;
const stateLoadedPromise = new Promise(resolve => {
  stateLoadedResolve = resolve;
});

// Listener for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Proxy Assistant installed/updated');
  appendRuntimeLog('info', 'system', details.reason === 'install' ? 'extension_installed' : 'extension_updated');

  if (details.reason === 'install') {
    turnOffProxy();
  }

  if (details.reason === 'update' || details.reason === 'install') {
    restoreProxySettings();
  }
});

// Helper function: validate subscription format
function isSubscriptionFormatValid(content, format) {
  if (!content) return false;
  const trimmed = content.trim();

  switch (format) {
    case 'autoproxy':
      return trimmed.startsWith('[AutoProxy') || trimmed.startsWith('W0F1dG9Qcm94');
    case 'switchy_legacy':
      return !trimmed.startsWith('[SwitchyOmega Conditions]') && trimmed.includes('#BEGIN') && trimmed.includes('#END');
    case 'switchy_omega':
      return trimmed.startsWith('[SwitchyOmega Conditions]');
    case 'pac':
      return trimmed.includes('FindProxyForURL');
    default:
      return true;
  }
}

// ==========================================
// Subscription Rule Parsing Functions
// ==========================================

function isValidManualBypassPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') return false;

  const trimmed = pattern.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
    return false;
  }

  if (trimmed.startsWith('|') && !trimmed.startsWith('||')) {
    return false;
  }

  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(trimmed)) {
    return true;
  }

  if (trimmed.includes('/')) {
    const ipv4CidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/(8|9|1\d|2\d|3[0-2])$/;
    if (ipv4CidrPattern.test(trimmed)) {
      return true;
    }
    return false;
  }

  const portPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?:[1-9]\d{0,4}$/;
  if (portPattern.test(trimmed)) {
    return true;
  }

  const ipPortPattern = /^(\d{1,3}\.){3}\d{1,3}:[1-9]\d{0,4}$/;
  if (ipPortPattern.test(trimmed)) {
    return true;
  }

  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (domainPattern.test(trimmed)) {
    return true;
  }

  return false;
}

function extractDomainInfo(pattern) {
  if (!pattern) return null;

  let domain = pattern
    .replace(/^\*\:?\/?\/?(\*\.)?/, '')
    .replace(/\/\*.*$/, '')
    .trim();

  if (!domain) return null;

  const domainParts = domain.split('.');
  const segmentCount = domainParts.filter(Boolean).length;

  const secondLastPart = domainParts[domainParts.length - 2];
  return {
    domain: domainParts.length >= 2 && secondLastPart
      ? domainParts.slice(-2).join('.')
      : domain,
    segmentCount: segmentCount
  };
}

function classifyOmegaPattern(pattern) {
  const IP_RANGE_PATTERN = /^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/;
  if (IP_RANGE_PATTERN.test(pattern)) {
    return 'ip_range';
  }

  const segments = pattern.split('.');
  const hasWildcard = pattern.includes('*');
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  if (!hasWildcard) {
    return segments.length >= 2 ? 'domain' : 'single_segment';
  }

  if (segments.length === 2 && firstSegment === '*') {
    return 'single_wildcard';
  }

  if (firstSegment === '*' && lastSegment === '*') {
    return 'complex_wildcard';
  }

  if (firstSegment === '*' && segments.length >= 3) {
    return 'wildcard_domain';
  }

  return 'unknown';
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function convertIPRangeToCIDR(pattern) {
  const parts = pattern.split('.');
  if (parts.length !== 4) return null;

  const firstWildcard = parts.indexOf('*');
  const hasWildcard = firstWildcard !== -1;

  if (!hasWildcard) {
    const isValidIp = parts.every(part => {
      const value = parseInt(part, 10);
      return /^\d{1,3}$/.test(part) && value >= 0 && value <= 255;
    });
    return isValidIp ? pattern : null;
  }

  const hasNonTrailingWildcard = parts
    .slice(firstWildcard)
    .some(part => part !== '*');
  if (hasNonTrailingWildcard) return null;

  const cidrParts = parts.map(part => part === '*' ? '0' : part);
  const hasInvalidOctet = cidrParts.some(part => {
    const value = parseInt(part, 10);
    return !/^\d{1,3}$/.test(part) || value < 0 || value > 255;
  });
  if (hasInvalidOctet) return null;

  return `${cidrParts.join('.')}/${firstWildcard * 8}`;
}

function convertOmegaToProxyRule(pattern, type) {
  const domainWithoutWildcard = pattern.replace(/^\*\./, '');

  switch (type) {
    case 'ip_range':
      return convertIPRangeToCIDR(pattern);

    case 'single_wildcard':
      return `/^[a-z0-9-]+\.${escapeRegExp(domainWithoutWildcard)}$/`;

    case 'complex_wildcard':
      return `/.*\\.${escapeRegExp(pattern.substring(2, pattern.length - 1))}\\..*/`;

    case 'wildcard_domain':
      return domainWithoutWildcard;

    case 'domain':
      return pattern;

    case 'single_segment':
      return null;

    default:
      return pattern;
  }
}

function convertOmegaToBypassRule(pattern, type) {
  switch (type) {
    case 'ip_range':
      return convertIPRangeToCIDR(pattern);

    case 'wildcard_domain':
      return pattern.replace(/^\*\./, '');

    case 'domain':
      return pattern;

    case 'single_wildcard':
    case 'complex_wildcard':
    case 'single_segment':
      return null;

    default:
      return pattern;
  }
}

function extractDomainFromWildcard(pattern) {
  if (!pattern) return null;

  let domain = pattern
    .replace(/^\*\:\/\/\*\./, '')
    .replace(/^\*\:\/\//, '')
    .replace(/^\*\./, '')
    .replace(/\/\*$/, '')
    .replace(/\/\*.*$/, '')
    .trim();

  if (!domain) return null;

  const domainParts = domain.split('.');
  const segmentCount = domainParts.filter(part => part && part.trim()).length;

  if (domainParts.length >= 2 && domainParts[domainParts.length - 2]) {
    return {
      domain: domainParts.slice(-2).join('.'),
      segmentCount: segmentCount
    };
  }

  return {
    domain: domain,
    segmentCount: segmentCount
  };
}

function extractHostname(url) {
  url = url.replace(/^[^:]+:\/\//, '').replace(/\/.*$/, '').replace(/\?.*$/, '').replace(/#.*$/, '');
  const atIndex = url.indexOf('@');
  if (atIndex !== -1) {
    url = url.substring(atIndex + 1);
  }
  url = url.replace(/:\d+$/, '');
  return url;
}

function normalizeAutoproxyPattern(pattern) {
  if (pattern.startsWith('/') && pattern.endsWith('/')) {
    return pattern;
  }

  if (pattern.startsWith('|') && (pattern.includes('://') || pattern.endsWith('|'))) {
    let url = pattern.replace(/^\|+|\|+$/g, '');
    const hostname = extractHostname(url);
    const extractedIP = extractIPFromURL(hostname);
    if (extractedIP) {
      return extractedIP;
    }
    const extracted = extractDomainFromWildcard(hostname);
    return extracted || null;
  }

  if (pattern.startsWith('||')) {
    const domainPart = pattern.substring(2);
    const hostname = extractHostname(domainPart);
    if (hostname.includes('*')) {
      const extracted = extractDomainFromWildcard(hostname);
      return extracted || null;
    }
    return hostname;
  }

  if (pattern.startsWith('.')) {
    return pattern.includes('*') ? null : pattern.substring(1);
  }

  if (pattern.includes('/')) {
    const hostname = extractHostname(pattern);
    if (hostname.includes('*')) {
      const extracted = extractDomainFromWildcard(hostname);
      return extracted || null;
    }
    return hostname;
  }

  if (pattern.includes('*')) {
    const extracted = extractDomainFromWildcard(pattern);
    return extracted || null;
  }

  return pattern;
}

function extractIPFromURL(url) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}/;
  const match = url.match(ipv4Pattern);
  if (match) {
    return match[0];
  }
  return null;
}

function normalizeAutoproxyLine(line, reverse) {
  if (line.startsWith('[') && line.endsWith(']')) return null;
  if (line.startsWith('!')) return null;

  let isException = false;
  let normalizedLine = line;
  if (line.startsWith('@@')) {
    isException = true;
    normalizedLine = line.substring(2);
  }

  const finalActionIsDirect = isException ? !reverse : reverse;
  const normalizedPattern = normalizeAutoproxyPattern(normalizedLine);

  if (!normalizedPattern) return null;
  if (!isValidManualBypassPattern(normalizedPattern) && finalActionIsDirect) return null;

  return {
    pattern: normalizedPattern,
    isDirect: finalActionIsDirect
  };
}

function normalizeSwitchyOmegaLine(line, reverse) {
  if (line.startsWith('[SwitchyOmega Conditions]') || line.startsWith(';') || line.startsWith('@')) {
    return null;
  }

  let pattern = line;
  let isDirectRule = false;

  const plusMatch = line.match(/^(.+?)[\t ]\+(.+)$/);
  if (plusMatch) {
    pattern = plusMatch[1].trim();
    if (plusMatch[2].trim().toLowerCase() === 'direct') {
      isDirectRule = true;
    }
  } else if (line.startsWith('!')) {
    isDirectRule = true;
    pattern = line.substring(1);
  }

  if (pattern.includes(': ')) {
    const parts = pattern.split(': ');
    const type = parts[0].toLowerCase();
    const validTypes = ['host', 'wildcard', 'hostwildcard', 'url', 'urlwildcard'];
    if (validTypes.some(t => type.includes(t))) {
      const domainInfo = extractDomainInfo(parts[1].trim());
      pattern = domainInfo ? domainInfo.domain : null;
    } else {
      return null;
    }
  }

  if (pattern.startsWith(': ')) {
    pattern = pattern.substring(2).trim();
  }

  if (!pattern) return null;

  const shouldBeDirect = isDirectRule ? !reverse : reverse;
  const patternType = classifyOmegaPattern(pattern);

  const finalPattern = shouldBeDirect
    ? convertOmegaToBypassRule(pattern, patternType)
    : convertOmegaToProxyRule(pattern, patternType);

  if (finalPattern === null) return null;
  if (shouldBeDirect && !isValidManualBypassPattern(finalPattern)) return null;

  return {
    pattern: finalPattern,
    isDirect: shouldBeDirect
  };
}

function normalizeSwitchyLegacyLine(line, reverse, section) {
  if (line.startsWith(';') || line.startsWith('#') || line.startsWith('@')) return null;

  let pattern = line;
  let isDirectRule = false;

  const plusMatch = line.match(/^(.+?)[\t ]\+(.+)$/);
  if (plusMatch) {
    pattern = plusMatch[1].trim();
    if (plusMatch[2].trim().toLowerCase() === 'direct') {
      isDirectRule = true;
    }
  } else if (line.startsWith('!')) {
    isDirectRule = true;
    pattern = line.substring(1);
  }

  if (pattern.includes(': ')) {
    const parts = pattern.split(': ');
    const type = parts[0].toLowerCase();
    const validTypes = ['host', 'wildcard', 'hostwildcard', 'url', 'urlwildcard'];
    if (validTypes.some(t => type.includes(t))) {
      pattern = parts[1].trim();
    } else {
      return null;
    }
  }

  if (pattern.startsWith(': ')) {
    pattern = pattern.substring(2).trim();
  }

  if (!pattern) return null;

  const shouldBeDirect = isDirectRule ? !reverse : reverse;

  if (section === 'regexp' && reverse) {
    return null;
  }

  let finalPattern = pattern;

  const wildcardSections = ['wildcard', 'host_wildcard', 'url_wildcard'];
  if (wildcardSections.includes(section)) {
    const extracted = extractDomainInfo(pattern);
    if (!extracted) return null;

    if (extracted.segmentCount === 1 && !(shouldBeDirect && reverse)) {
      finalPattern = '/.*' + extracted.domain + '.*/';
    } else {
      finalPattern = extracted.domain;
    }
  } else if (section === 'regexp') {
    finalPattern = shouldBeDirect ? pattern : '/.*' + pattern + '.*/';
  }

  return {
    pattern: finalPattern,
    isDirect: shouldBeDirect
  };
}

// Helper function: parse subscription content
function parseSubscriptionContent(content, format, reverse, processRule) {
  const result = {
    include_rules: [],
    bypass_rules: [],
    decoded: null
  };

  if (!content) return result;

  try {
    let contentToParse = content;
    const sectionRegex = /^\[(Wildcard|Host Wildcard|URL Wildcard|RegExp)\]$/i;

    if (format === 'pac') {
      const pacResult = parsePacContent(contentToParse, processRule, reverse);
      result.include_rules = pacResult.include;
      result.bypass_rules = pacResult.bypass;
    } else {
      if (format === 'autoproxy') {
        const trimmed = content.trim();
        if (trimmed.startsWith('W0F1dG9Qcm94')) {
          try {
            result.decoded = atob(trimmed);
            contentToParse = result.decoded;
          } catch (e) {
            result.decoded = content;
          }
        }
      }

      const lines = contentToParse.split('\n');
      let currentSection = 'wildcard';

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const sectionMatch = line.match(sectionRegex);
        if (sectionMatch) {
          currentSection = sectionMatch[1].toLowerCase().replace(/\s+/g, '_');
          continue;
        }

        let normalized = null;
        if (format === 'autoproxy') {
          normalized = normalizeAutoproxyLine(line, reverse);
        } else if (format === 'switchy_omega') {
          normalized = normalizeSwitchyOmegaLine(line, reverse);
        } else if (format === 'switchy_legacy') {
          normalized = normalizeSwitchyLegacyLine(line, reverse, currentSection);
        }

        if (normalized) {
          if (normalized.isDirect) {
            result.bypass_rules.push(normalized.pattern);
          } else {
            result.include_rules.push(normalized.pattern);
          }
        }
      }
    }
  } catch (e) {
    console.info('[Worker] Parse subscription error:', e);
  }

  const uniqueInclude = [...new Set(result.include_rules)];
  const uniqueBypass = [...new Set(result.bypass_rules)];

  return {
    include_rules: uniqueInclude.join('\n'),
    bypass_rules: uniqueBypass.join('\n'),
    decoded: result.decoded
  };
}

function parsePacContent(rawContent, processRule, reverse = false) {
  if (!rawContent || !processRule) {
    return { include: [], bypass: [] };
  }

  let config;
  try {
    config = JSON.parse(processRule);
  } catch (error) {
    console.info('[Worker] PAC content parse failed:', error);
    return { include: [], bypass: [] };
  }

  const content = rawContent.replace(/\s+/g, '');

  const { left: bypassLeft = '', right: bypassRight = '' } = config.bypass || {};
  const { left: includeLeft = '', right: includeRight = '' } = config.include || {};

  const isValidItem = item => item && typeof item === 'string' && !item.includes('*');

  function extractByBounds(content, left, right) {
    if (!left || !right) return [];
    const results = [];
    let start = 0;
    while (true) {
      const leftIdx = content.indexOf(left, start);
      if (leftIdx === -1) break;
      const rightIdx = content.indexOf(right, leftIdx + left.length);
      if (rightIdx === -1) break;
      results.push(content.substring(leftIdx + left.length, rightIdx));
      start = rightIdx + right.length;
    }
    return results;
  }

  function extractItems(targetArray, left, right) {
    if (!left || !right) return;
    const items = extractByBounds(content, left, right)
      .flatMap(item => item.replace(/["']/g, '').split(',')
        .map(part => part.trim())
        .filter(Boolean));
    targetArray.push(...items);
  }

  const extractedInclude = [];
  const extractedBypass = [];

  extractItems(extractedBypass, bypassLeft, bypassRight);
  extractItems(extractedInclude, includeLeft, includeRight);

  const include = [...new Set(extractedInclude.filter(isValidItem))];
  const bypass = [...new Set(extractedBypass.filter(isValidItem))];

  if (reverse) {
    return { include: bypass, bypass: include };
  }

  return { include, bypass };
}

// Fetch with timeout and retry support
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Background fetch for subscription with retry
async function fetchSubscriptionBackground(proxyId, format, url, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Worker] Background fetch started (attempt ${attempt}/${maxRetries}): ${url}`);

      const response = await fetchWithTimeout(url, {}, 30000);
      if (!response.ok) {
        console.info(`[Worker] HTTP error: ${response.status} ${response.statusText} for URL: ${url}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const content = await response.text();

      if (!isSubscriptionFormatValid(content, format)) {
        console.info(`[Worker] Invalid subscription format: ${format} for proxy: ${proxyId}`);
        throw new Error('Invalid format after fetch');
      }

      let updated = false;

      const result = await new Promise((resolve, reject) => {
        chrome.storage.local.get(['config'], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Storage get error: ${chrome.runtime.lastError.message}`));
            return;
          }
          resolve(result);
        });
      });

      const config = result.config;
      if (!config?.subscriptions) {
        console.warn(`[Worker] No subscriptions found for: ${proxyId}`);
        return;
      }

      const subscription = config.subscriptions.find(item => item.id === proxyId);
      const proxyFound = subscription?.current === format && subscription?.lists?.[format];
      if (proxyFound) {
            const listConfig = subscription.lists[format];
            const oldContent = listConfig.content;

            if (oldContent !== content) {
              listConfig.content = content;
              listConfig.last_fetch_time = Date.now();

              const reverse = listConfig.reverse || false;
              const processRule = format === 'pac' ? listConfig.process_rule : undefined;
              const parsed = parseSubscriptionContent(content, format, reverse, processRule);
              listConfig.decoded_content = parsed.decoded || '';
              listConfig.include_rules = parsed.include_rules || '';
              listConfig.bypass_rules = parsed.bypass_rules || '';
              listConfig.include_lines = parsed.include_rules ? parsed.include_rules.split(/\r\n|\r|\n/).length : 0;
              listConfig.bypass_lines = parsed.bypass_rules ? parsed.bypass_rules.split(/\r\n|\r|\n/).length : 0;

              updated = true;
              console.log(`[Worker] Updated subscription: ${subscription.name || proxyId}`);
            } else {
              listConfig.last_fetch_time = Date.now();
              console.log(`[Worker] No changes for subscription: ${subscription.name || proxyId}, content unchanged`);
            }
      }

      if (!proxyFound) {
        console.warn(`[Worker] Proxy ${proxyId} with format ${format} not found in config`);
      }

      await new Promise((resolve, reject) => {
        config.updated_at = new Date().toISOString();
        chrome.storage.local.set({ config: config }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Storage set error: ${chrome.runtime.lastError.message}`));
            return;
          }
          resolve();
        });
      });

      console.log(`[Worker] Background fetch saved: ${proxyId}`);

      if (updated) {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'subscriptionUpdated',
            proxyId: proxyId,
            format: format
          }, () => {
            if (chrome.runtime.lastError) {
              console.info(`[Worker] Send message error: ${chrome.runtime.lastError.message} for proxy: ${proxyId}`);
            }
            resolve();
          });
        });
      }

      console.log(`[Worker] Background fetch completed for proxy: ${proxyId}, updated: ${updated}`);
      appendRuntimeLog('info', 'subscription', 'subscription_refreshed', {
        subscriptionName: subscription?.name || proxyId,
        updated: updated
      });
      return;
    } catch (error) {
      lastError = error;
      console.info(`[Worker] Background fetch attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Worker] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.info(`[Worker] All ${maxRetries} attempts failed for proxy: ${proxyId}, last error: ${lastError?.message}`);
  appendRuntimeLog('error', 'subscription', 'subscription_refresh_failed', {
    subscriptionName: proxyId,
    error: lastError?.message || 'Unknown error'
  });
}

// Unified function to schedule or clear subscription alarm
function getSubscriptionAlarmName(proxyId, format) {
  return `${SUBSCRIPTION_ALARM_PREFIX}${proxyId}___${format}`;
}

function getLegacySubscriptionAlarmName(proxyId, format) {
  return `${LEGACY_SUBSCRIPTION_ALARM_PREFIX}${proxyId}_${format}`;
}

function isSubscriptionAlarmName(alarmName) {
  if (alarmName.startsWith(SUBSCRIPTION_ALARM_PREFIX)) return true;

  return alarmName.startsWith(LEGACY_SUBSCRIPTION_ALARM_PREFIX) &&
    SUBSCRIPTION_FORMATS.some(format => alarmName.endsWith(`_${format}`));
}

function scheduleOrClearSubscriptionAlarm(proxyId, format, refreshInterval, url) {
  const alarmName = getSubscriptionAlarmName(proxyId, format);
  const shouldSchedule = refreshInterval > 0 && !!url;

  SUBSCRIPTION_FORMATS.forEach(oldFormat => {
    const oldAlarmName = getSubscriptionAlarmName(proxyId, oldFormat);
    if (!shouldSchedule || oldAlarmName !== alarmName) {
      chrome.alarms.clear(oldAlarmName);
    }
    chrome.alarms.clear(getLegacySubscriptionAlarmName(proxyId, oldFormat));
  });

  if (!shouldSchedule) {
    console.log(`[Worker] Alarm cleared: ${alarmName}`);
    return;
  }

  chrome.alarms.get(alarmName, (existingAlarm) => {
    if (existingAlarm) {
      const existingInterval = existingAlarm.periodInMinutes;
      if (existingInterval !== refreshInterval) {
        chrome.alarms.clear(alarmName, () => {
          chrome.alarms.create(alarmName, {
            delayInMinutes: refreshInterval,
            periodInMinutes: refreshInterval
          });
          console.log(`[Worker] Alarm updated: ${alarmName}, interval: ${refreshInterval}min`);
        });
      } else {
        console.log(`[Worker] Alarm already exists with same interval: ${alarmName}`);
      }
    } else {
      chrome.alarms.create(alarmName, {
        delayInMinutes: refreshInterval,
        periodInMinutes: refreshInterval
      });
      console.log(`[Worker] Alarm created: ${alarmName}, interval: ${refreshInterval}min`);
    }
  });
}

// Schedule background refresh for all subscriptions
function scheduleAllBackgroundRefreshes(config) {
  console.log('[Worker] Scheduling subscription alarms for all enabled subscriptions');
  const desiredAlarmNames = new Set();
  const subscriptions = config?.subscriptions || [];

  subscriptions.forEach(subscription => {
      if (!subscription.id) return;

      if (subscription.enabled !== false) {
        const format = subscription.current;
        const subConfig = subscription.lists?.[format];
        if (subConfig?.refresh_interval > 0 && subConfig?.url) {
          desiredAlarmNames.add(getSubscriptionAlarmName(subscription.id, format));
        }
        scheduleOrClearSubscriptionAlarm(
          subscription.id,
          format,
          subConfig?.refresh_interval,
          subConfig?.url
        );
      }
  });

  chrome.alarms.getAll((alarms) => {
    (alarms || []).forEach(alarm => {
      if (isSubscriptionAlarmName(alarm.name) && !desiredAlarmNames.has(alarm.name)) {
        chrome.alarms.clear(alarm.name);
        console.log(`[Worker] Removed stale alarm: ${alarm.name}`);
      }
    });
  });
}

function getScenarioDefaultProxy(scenario) {
  const proxies = scenario?.proxies || [];
  const isSelectable = proxy => proxy && proxy.enabled !== false && proxy.ip && proxy.port;
  return proxies.find(proxy => proxy.id === scenario.defaultProxyId && isSelectable(proxy))
    || proxies.find(proxy => proxy.id === scenario.lastProxyId && isSelectable(proxy))
    || proxies.find(isSelectable)
    || null;
}

async function rememberCurrentScenarioProxy(proxy) {
  if (!proxy?.id) return;
  try {
    const stored = await getStorageValues(['config']);
    const config = stored.config;
    const scenario = config?.scenarios?.lists?.find(item => item.id === config.scenarios.current);
    if (!scenario?.proxies?.some(item => item.id === proxy.id)) return;
    scenario.lastProxyId = proxy.id;
    await setStorageValues({ config });
  } catch (error) {
    console.info('Failed to remember the scenario proxy:', error);
  }
}

async function restorePreviousProxyState(previousState) {
  const mode = previousState?.proxy?.mode || 'disabled';
  if (mode === 'disabled') {
    await turnOffProxy();
    return;
  }
  await applyProxySettings(previousState?.proxy?.current || null, mode);
}

async function activateScenario(scenarioId, source = 'manual') {
  let stored;
  try {
    stored = await getStorageValues(['config', 'state']);
  } catch (error) {
    return { success: false, error: error.message };
  }

  const config = stored.config;
  const previousState = stored.state || { proxy: { mode: 'disabled', current: null } };
  const scenarios = config?.scenarios?.lists || [];
  const scenario = scenarios.find(item => item.id === scenarioId);
  if (!scenario) return { success: false, error: 'Scenario not found' };

  const previousScenarioId = config.scenarios.current;
  const previousScenario = scenarios.find(item => item.id === previousScenarioId);
  const previousProxyId = previousState.proxy?.current?.id;
  if (previousProxyId && previousScenario?.proxies?.some(proxy => proxy.id === previousProxyId)) {
    previousScenario.lastProxyId = previousProxyId;
  }
  const defaultProxy = getScenarioDefaultProxy(scenario);
  const activationMode = source === 'automation'
    ? 'manual'
    : (previousState.proxy?.mode || 'disabled');

  if (source === 'automation' && !defaultProxy) {
    return { success: false, error: 'Default proxy is unavailable' };
  }

  const persistTargetScenario = async () => {
    config.scenarios.current = scenarioId;
    await setStorageValues({ config });
  };

  try {
    if (activationMode === 'auto') {
      await persistTargetScenario();
      const result = await applyProxySettings(null, 'auto');
      if (!result?.success) throw new Error(result?.error || 'Failed to apply automatic proxy mode');
    } else if (activationMode === 'manual') {
      if (defaultProxy) {
        const result = await applyProxySettings(defaultProxy, 'manual');
        if (!result?.success) throw new Error(result?.error || 'Failed to apply default proxy');
      } else {
        await turnOffProxy();
      }
      await persistTargetScenario();
      if (defaultProxy) {
        scenario.lastProxyId = defaultProxy.id;
        await setStorageValues({ config });
      }
    } else {
      await persistTargetScenario();
    }
  } catch (error) {
    config.scenarios.current = previousScenarioId;
    try {
      await setStorageValues({ config });
      await restorePreviousProxyState(previousState);
    } catch (rollbackError) {
      console.info('Scenario activation rollback failed:', rollbackError);
    }
    return { success: false, error: error.message || 'Failed to activate scenario' };
  }

  const currentProxy = activationMode === 'manual' ? defaultProxy : null;
  return {
    success: true,
    scenarioId,
    source,
    mode: defaultProxy || activationMode !== 'manual' ? activationMode : 'disabled',
    currentProxy
  };
}

async function evaluateScenarioAutomation(config, now = new Date()) {
  if (scenarioAutomationEvaluation) return scenarioAutomationEvaluation;

  scenarioAutomationEvaluation = (async () => {
    const targetScenario = findScheduledScenario(config, now);
    let result = { success: true, switched: false };

    if (targetScenario && config?.scenarios?.current !== targetScenario.id) {
      const activation = await activateScenario(targetScenario.id, 'automation');
      result = { ...activation, switched: activation.success === true };
      if (!activation.success) {
        console.info('Scheduled scenario activation failed:', activation.error);
      }
    }

    scheduleScenarioAutomation(config, now);
    return result;
  })();

  try {
    return await scenarioAutomationEvaluation;
  } finally {
    scenarioAutomationEvaluation = null;
  }
}

// Schedule background refresh for single subscription (called from frontend)
function scheduleSubscriptionRefresh(proxyId, format, refreshInterval, url) {
  scheduleOrClearSubscriptionAlarm(proxyId, format, refreshInterval, url);
}

// Alarm listener for subscription refresh
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCENARIO_AUTOMATION_ALARM) {
    chrome.storage.local.get(['config'], result => {
      if (result.config) evaluateScenarioAutomation(result.config);
    });
  } else if (alarm.name.startsWith(`${CLOUD_SYNC_ALARM}-`)) {
    runScheduledCloudSync(alarm.name.substring(CLOUD_SYNC_ALARM.length + 1));
  } else if (alarm.name.startsWith(SUBSCRIPTION_ALARM_PREFIX)) {
    const alarmName = alarm.name.replace(SUBSCRIPTION_ALARM_PREFIX, '');
    const lastSeparatorIndex = alarmName.lastIndexOf('___');
    const proxyId = alarmName.substring(0, lastSeparatorIndex);
    const format = alarmName.substring(lastSeparatorIndex + 3);
    const fetchKey = `${proxyId}_${format}`;

    if (inProgressFetches.has(fetchKey)) {
      console.log(`[Worker] Skipped duplicate alarm: ${alarm.name}`);
      return;
    }

    console.log(`[Worker] Subscription alarm triggered: ${alarm.name}`);

    chrome.storage.local.get(['config'], (result) => {
      const config = result.config;
      if (!config?.subscriptions) return;

      for (const subscription of config.subscriptions) {
          if (subscription.id === proxyId &&
            subscription.current === format &&
            subscription.enabled !== false) {

            const subConfig = subscription.lists?.[format];
            if (subConfig?.url) {
              inProgressFetches.add(fetchKey);
              fetchSubscriptionBackground(proxyId, format, subConfig.url).finally(() => {
                inProgressFetches.delete(fetchKey);
              });
            }
            return;
          }
      }
    });
  }
});

// Storage change listener for subscription config updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.config) {
    const newConfig = changes.config.newValue;
    const oldConfig = changes.config.oldValue;

    auditRuntimeConfigChanges(oldConfig, newConfig);

    if (newConfig) {
      console.log('[Worker] Config changed, scheduling alarms...');
      setTimeout(() => {
        scheduleAllBackgroundRefreshes(newConfig);
        evaluateScenarioAutomation(newConfig);
        scheduleCloudSync(newConfig);
      }, 1000);
    }
  }
});

// Restore previous proxy settings
function restoreProxySettings() {
  console.log('Checking for saved proxy settings');

  // Load both local (persistent) and session (runtime) settings
  const storagePromise = new Promise(resolve => {
    chrome.storage.local.get(['state', 'config'], (localResult) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get(['firefoxProxyState'], (sessionResult) => {
          resolve({ local: localResult, session: sessionResult });
        });
      } else {
        resolve({ local: localResult, session: {} });
      }
    });
  });

  storagePromise.then(({ local: result, session: sessionResult }) => {
    if (isFirefox) {
      // Load config for Firefox auto mode
      currentConfig = result.config || {};

      // Sync local state for Firefox
      if (result.state?.proxy?.current) firefoxProxyState.currentProxy = result.state.proxy.current;
      // If enabled, restore mode
      if (result.state?.proxy?.mode && result.state.proxy.mode !== 'disabled') {
        firefoxProxyState.mode = result.state.proxy.mode || 'manual';
      } else {
        firefoxProxyState.mode = 'disabled';
      }

      // OVERRIDE: If we have session state (e.g. recovered from suspension during test), restore it
      if (sessionResult.firefoxProxyState) {
        console.log("Restoring Firefox runtime state from session");
        const savedState = sessionResult.firefoxProxyState;

        // Restore test mode if it was active
        if (savedState.testMode) {
          firefoxProxyState.testMode = true;
          firefoxProxyState.testProxy = savedState.testProxy;
        }

        // Restore mode if valid (session takes precedence for runtime consistency if needed)
        // But generally we trust local storage for the main mode, session for transient states
        if (savedState.mode && savedState.mode !== firefoxProxyState.mode) {
          console.log(`Session mode ${savedState.mode} differs from local mode ${firefoxProxyState.mode}, keeping local`);
        }
      }

      // Ensure settings are cleared and listeners are active
      setupFirefoxProxy();

      if (firefoxProxyState.mode !== 'disabled') {
        console.log('Restoring saved proxy settings');
      } else {
        // Clear badge for disabled
        updateBadge();
      }
    } else {
      // Chrome
      if (result.state?.proxy?.mode && result.state.proxy.mode !== 'disabled') {
        console.log('Restoring saved proxy settings');
        applyProxySettings(result.state.proxy.current);
      } else {
        // Clear badge for disabled
        updateBadge();
      }
    }

    // Mark state as loaded
    if (!stateLoaded) {
      stateLoaded = true;
      if (stateLoadedResolve) stateLoadedResolve();
    }

    // Restore subscription alarms after state is loaded
    chrome.storage.local.get(['config'], (configResult) => {
      if (configResult.config) {
        scheduleAllBackgroundRefreshes(configResult.config);
        evaluateScenarioAutomation(configResult.config);
        scheduleCloudSync(configResult.config);
      }
    });
  });
}

// Hook into startup event
chrome.runtime.onStartup.addListener(restoreProxySettings);

// Also run immediately on script load to handle Service Worker wakeups
restoreProxySettings();

// Helper function to get proxy settings with browser-specific implementation
function getProxySettings() {
  return new Promise((resolve) => {
    try {
      if (isFirefox) {
        // Firefox API - we return our internal state because we use onRequest
        // We mock the Chrome API structure for compatibility with UI
        let config = { value: { mode: "system" }, levelOfControl: "controlled_by_this_extension" };

        if (firefoxProxyState.mode === 'manual') {
          config.value = {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                host: firefoxProxyState.currentProxy?.ip,
                port: parseInt(firefoxProxyState.currentProxy?.port || 0, 10)
              }
            }
          };
        } else if (firefoxProxyState.mode === 'auto') {
          config.value = { mode: "pac_script" };
        }

        resolve(config);
      } else {
        // Chrome API
        chrome.proxy.settings.get({ incognito: false }, (config) => {
          if (chrome.runtime.lastError) {
            console.log("Chrome proxy.settings.get error:", chrome.runtime.lastError);
            resolve({ value: null, levelOfControl: "unknown" });
          } else {
            resolve(config || { value: null, levelOfControl: "unknown" });
          }
        });
      }
    } catch (error) {
      console.log("Exception getting proxy settings:", error);
      resolve({ value: null, levelOfControl: "unknown" });
    }
  });
}

// List of URLs to preconnect to warm up proxy connection
const TEST_URLS = [
  'https://www.baidu.com/favicon.ico',
];

// Set extension icon badge
function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color: color });
  }
}

// Monitor storage changes to keep badge updated
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.state) {
      updateBadge();
    }

    // Sync Firefox config on storage changes
    if (isFirefox && changes.config) {
      currentConfig = changes.config.newValue || {};
    }

    // Sync Firefox state on storage changes
    if (isFirefox) {
      if (changes.state?.proxy?.current) firefoxProxyState.currentProxy = changes.state.proxy.current.newValue;
    }
  }
});

// Update badge based on current state and requirements
function updateBadge() {
  chrome.storage.local.get(['state'], (result) => {
    const mode = result.state?.proxy?.mode || 'disabled';

    if (mode === 'manual') {
      setBadge("ᴍ", "#4164f5");
    } else if (mode === 'auto') {
      setBadge("ᴀ", "#28a745");
    } else {
      setBadge("");
    }
  });
}

// Handle different types of proxy settings
function applyProxySettings(proxyInfo, requestedMode) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['state'], async (result) => {
    const mode = requestedMode || result.state?.proxy?.mode || 'manual';

    if (!['disabled', 'manual', 'auto'].includes(mode)) {
      resolve({ success: false, error: "Invalid proxy mode" });
      return;
    }

    if (isFirefox) {
      // Update Firefox state
      if (mode === 'disabled') {
        firefoxProxyState.mode = 'disabled';
        firefoxProxyState.currentProxy = null;
      } else if (mode === 'auto') {
        firefoxProxyState.mode = 'auto';
        firefoxProxyState.currentProxy = null;
      } else {
        // Manual
        firefoxProxyState.mode = 'manual';
        // Use provided info or fallback to storage
        firefoxProxyState.currentProxy = proxyInfo || result.state?.proxy?.current;
      }
      updateFirefoxSessionState();

      // Update UI
      chrome.storage.local.set({
        state: { proxy: { mode: firefoxProxyState.mode, current: firefoxProxyState.currentProxy } }
      }, () => {
        updateBadge();
        setupFirefoxProxy(); // Activate the proxy logic
        resolve({ success: true });
      });
    } else {
      // Chrome
      const chromeMode = mode;

      if (chromeMode === 'auto') {
        resolve(await applyAutoProxySettings());
      } else if (chromeMode === 'disabled') {
        // If mode is disabled, always turn off proxy regardless of proxyInfo
        await turnOffProxy();
        resolve({ success: true });
      } else {
        // Manual mode
        // If manual mode and no proxyInfo provided (e.g. from refreshProxy), use the one from storage
        const infoToApply = proxyInfo || result.state?.proxy?.current;
        if (infoToApply) {
          resolve(await applyManualProxySettings(infoToApply));
        } else {
          await turnOffProxy();
          resolve({ success: false, error: "No proxy information provided" });
        }
      }
    }
    });
  });
}

// Protocol field cleaning function - prevents protocol value corruption
function cleanProtocol(protocol) {
  if (!protocol || typeof protocol !== 'string') return 'http';
  // Remove potential URL prefixes (http://, https://, http:, https:, etc.)
  let cleaned = protocol.replace(/^(https?:\/?\/?)/i, '').trim();
  // Normalize to lowercase
  cleaned = cleaned.toLowerCase();
  // Validate against known protocols
  const validProtocols = ['http', 'https', 'socks4', 'socks5', 'socks'];
  if (!validProtocols.includes(cleaned)) {
    return 'http';
  }
  return cleaned;
}

// Helper function to validate proxy configuration
function validateProxyConfig(ip, port) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

  if (!ipv4Regex.test(ip) && !hostnameRegex.test(ip)) {
    return { valid: false, error: "Invalid IP address or hostname format" };
  }

  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { valid: false, error: "Invalid port number (must be 1-65535)" };
  }

  return { valid: true };
}

// ==========================================
// Subscription Functions for Service Worker
// ==========================================

function scheduleBackgroundRefresh(proxyId, subscription) {
  if (!subscription) return;

  const format = subscription.current;
  const config = subscription.lists?.[format];

  scheduleOrClearSubscriptionAlarm(
    proxyId,
    format,
    subscription.enabled === false ? 0 : config?.refresh_interval,
    subscription.enabled === false ? null : config?.url
  );
}

// -----------------------------------------------------------------------------
// Chrome Implementation Section
// -----------------------------------------------------------------------------

// Manual mode: Apply fixed server configuration (Chrome only)
async function applyManualProxySettings(proxyInfo) {
  if (!proxyInfo) {
    console.log("No proxy info provided, turning off proxy");
    turnOffProxy();
    return { success: false, error: "No proxy information provided" };
  }

  // Clean protocol field to prevent corruption
  const type = cleanProtocol(proxyInfo.protocol || proxyInfo.type || "http");
  const ip = proxyInfo.ip;
  const port = proxyInfo.port;
  const username = proxyInfo.username;
  const password = proxyInfo.password;
  const proxyName = proxyInfo.name || "";
  const bypassUrls = proxyInfo.bypass_rules || "";

  if (!type || !ip || !port) {
    console.log("Missing required proxy information", proxyInfo);
    return { success: false, error: "Missing proxy IP, port, or protocol" };
  }

  // Validate IP and port format before applying
  const validation = validateProxyConfig(ip, port);
  if (!validation.valid) {
    console.log("Invalid proxy configuration:", validation.error);
    return { success: false, error: validation.error };
  }

  let proxyScheme = type === "socks5" ? "socks5" : (type === "socks4" ? "socks4" : "http");
  if (type === "https") proxyScheme = "https";

  let portNumber = parseInt(port, 10);

  // Parse bypassUrls
  let bypassList = ["localhost", "127.0.0.1", "<local>"];
  if (bypassUrls) {
    const customBypass = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    bypassList = [...new Set([...bypassList, ...customBypass])];
  }

  // Merge subscription bypass rules (DIRECT) for Manual Mode
  const proxySubscription = typeof getMergedProxySubscription === 'function'
    ? getMergedProxySubscription(proxyInfo)
    : proxyInfo.subscription;
  if (proxySubscription) {
    try {
      const format = proxySubscription.current;
      const subConfig = proxySubscription.lists[format];

      if (subConfig && subConfig.bypass_rules) {
        const reverse = subConfig.reverse || false;
        const rules = parseSubscriptionRules(subConfig.bypass_rules, format, 'PROXY', '0.0.0.0:0', reverse);

        // Filter for DIRECT rules (exceptions/bypass)
        const directRules = rules.filter(r => r.action === 'DIRECT');
        let addedCount = 0;

        for (const rule of directRules) {
          if (rule.type === 'domain') {
            let pattern = rule.pattern.replace(/^\|\|/, '');
            if (!pattern) continue;

            if (pattern.startsWith('*.')) {
              pattern = pattern.substring(2);
            }

            if (pattern.includes('/')) {
              const ipv4CidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/(8|9|1\d|2\d|3[0-2])$/;
              if (ipv4CidrPattern.test(pattern)) {
                if (!bypassList.includes(pattern)) {
                  bypassList.push(pattern);
                  addedCount++;
                }
              }
              continue;
            }

            if (pattern.includes(':')) {
              const ipPortPattern = /^(\d{1,3}\.){3}\d{1,3}:[1-9]\d{0,4}$/;
              const portPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?:[1-9]\d{0,4}$/;
              if (ipPortPattern.test(pattern) || portPattern.test(pattern)) {
                if (!bypassList.includes(pattern)) {
                  bypassList.push(pattern);
                  addedCount++;
                }
              }
              continue;
            }

            const isIpPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (isIpPattern.test(pattern)) continue;

            if (pattern && !bypassList.includes(pattern)) {
              bypassList.push(pattern);
              addedCount++;
            }
          } else if (rule.type === 'wildcard') {
            let pattern = rule.pattern;
            if (!pattern) continue;

            if (pattern.startsWith('*.')) {
              const domain = pattern.substring(2);
              if (domain.includes('/')) continue;
              const isIpPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
              if (!isIpPattern.test(domain)) {
                pattern = domain;
              }
            }

            if (pattern && !bypassList.includes(pattern)) {
              bypassList.push(pattern);
              addedCount++;
            }
          } else if (rule.type === 'start') {
            console.log(`Skipping URL prefix bypass rule: ${rule.pattern} (not supported by Chrome bypassList)`);
          }
        }
        console.log(`Merged ${addedCount} bypass rules from subscription (Manual Mode)`);
      }
    } catch (e) {
      console.info("Error merging subscription bypass rules:", e);
    }
  }

  const config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: proxyScheme, host: ip, port: portNumber },
      bypassList: bypassList
    }
  };

  // Check if we have control over proxy settings
  const controlStatus = await getProxySettings();

  if (controlStatus.levelOfControl === "controlled_by_other_extensions") {
    console.warn("Cannot apply proxy - controlled by other extension");
    return {
      success: false,
      error: "Proxy settings are controlled by another extension. Please disable other proxy/VPN extensions."
    };
  }

  currentProxyAuth = { username: username || '', password: password || '' };
  updateSessionAuth(currentProxyAuth);
  setupAuthListener();

  const storedProxyInfo = { ...proxyInfo, type: type, ip: ip, port: port, name: proxyName };

  const applyResult = await new Promise((resolve) => {
    chrome.proxy.settings.set({ value: config, scope: "regular" }, async () => {
      if (chrome.runtime.lastError) {
        console.log("Error setting proxy:", chrome.runtime.lastError);
        resolve({ success: false, error: chrome.runtime.lastError.message || "Failed to apply proxy settings" });
        return;
      }

      console.log("Manual proxy enabled:", proxyName);
      preconnectToTestUrls();
      resolve({ success: true });
    });
  });

  if (!applyResult.success) {
    return applyResult;
  }

  await new Promise((resolve) => {
    chrome.storage.local.set({
      state: { proxy: { mode: 'manual', current: storedProxyInfo } }
    }, () => {
      updateBadge();
      resolve();
    });
  });

  return { success: true };
}

// Flag to track if legacy fields have been cleaned up
let legacyFieldsCleaned = false;

// Auto mode: Generate and apply PAC script (Chrome only)
async function applyAutoProxySettings() {
  // Read from new config format (unified storage)
  const result = await new Promise(resolve => {
    chrome.storage.local.get(['config'], resolve);
  });

  const config = result.config || {};
  const scenarios = config.scenarios?.lists || [];
  const currentScenarioId = config.scenarios?.current || 'default';
  const currentScenario = scenarios.find(s => s.id === currentScenarioId);
  const list = currentScenario?.proxies || [];

  const pacScript = generatePacScript(list);

  console.log('Generated PAC script summary:', {
    proxyCount: list.length,
    characterCount: pacScript.length
  });

  const pacConfig = {
    mode: "pac_script",
    pacScript: {
      data: pacScript
    }
  };

  setupAuthListener();

  return new Promise((resolve) => {
    chrome.proxy.settings.set({ value: pacConfig, scope: "regular" }, () => {
      if (chrome.runtime.lastError) {
        console.log("Error setting auto proxy:", chrome.runtime.lastError);
        resolve({ success: false, error: chrome.runtime.lastError.message || "Failed to apply auto proxy settings" });
      } else {
        console.log("Auto proxy (PAC) enabled");
        chrome.storage.local.set({ state: { proxy: { mode: 'auto', current: null } } }, () => {
          updateBadge();
          resolve({ success: true });
        });
      }
    });
  });
}

// Helper function to check if pattern is an IP address
function isIpPattern(pattern) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/([0-9]|[12][0-9]|3[0-2]))?$/;
  return ipv4Pattern.test(pattern);
}

function isSafeProxyRegexSource(source) {
  if (!source || source.length > MAX_PROXY_REGEX_LENGTH) return false;
  if (/\\[1-9]/.test(source)) return false;

  const normalized = source
    .replace(/\\./g, 'x')
    .replace(/\[(?:\\.|[^\]])*\]/g, 'x');
  const nestedQuantifier = /\((?:[^()]|\([^()]*\))*(?:[+*]|\{\d+,?\d*\}|\|)(?:[^()]|\([^()]*\))*\)(?:[+*]|\{\d+,?\d*\})/;
  return !nestedQuantifier.test(normalized);
}

function parseProxyRegexPattern(pattern, defaultFlags = '') {
  if (!pattern.startsWith('/') || pattern.length <= 2) return null;
  const lastSlash = pattern.lastIndexOf('/');
  if (lastSlash <= 0) return null;
  const flags = pattern.slice(lastSlash + 1);
  if (!/^[gimsuy]*$/.test(flags)) return null;
  const source = pattern.slice(1, lastSlash);
  if (!isSafeProxyRegexSource(source)) return null;

  try {
    new RegExp(source, flags || defaultFlags);
    return { source, flags: flags || defaultFlags };
  } catch (error) {
    return null;
  }
}

function getProxyRulePatterns(proxy, ruleType) {
  const field = ruleType === 'bypass' ? 'bypass_rules' : 'include_rules';
  const patterns = [];
  const seen = new Set();
  const appendRules = value => {
    if (!value || patterns.length >= MAX_PROXY_RULES_PER_PROXY) return;
    const values = value.split(/[\n,]+/);
    for (const item of values) {
      const pattern = item.trim();
      if (!pattern || seen.has(pattern)) continue;
      seen.add(pattern);
      patterns.push(pattern);
      if (patterns.length >= MAX_PROXY_RULES_PER_PROXY) break;
    }
  };

  appendRules(proxy?.[field]);
  const proxySubscription = typeof getMergedProxySubscription === 'function'
    ? getMergedProxySubscription(proxy)
    : proxy?.subscription;
  if (proxySubscription) {
    const format = proxySubscription.current;
    appendRules(proxySubscription.lists?.[format]?.[field]);
  }

  return patterns;
}

// Generate PAC script logic (Chrome only)
function generatePacScript(list) {
  const declarations = [];
  const body = [];
  let proxyIndex = 0;
  let regexIndex = 0;

  body.push(`function FindProxyForURL(url, host) {
  function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  function isInCidrRange(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

  function domainMatches(domainMap) {
    var candidate = host.toLowerCase();
    while (candidate) {
      if (domainMap[candidate] === 1) return true;
      var separator = candidate.indexOf('.');
      if (separator === -1) break;
      candidate = candidate.substring(separator + 1);
    }
    return false;
  }

`);

  // Check include_rules in proxy list order, use first match
  for (const proxy of list) {
    // Skip disabled proxies
    if (proxy.enabled === false) continue;
    if (!proxy.ip || !proxy.port) continue;

    const type = (proxy.protocol || "HTTP").toUpperCase();
    let proxyType = "PROXY";
    if (type.startsWith("SOCKS")) proxyType = "SOCKS5";
    const proxyStr = `${proxyType} ${proxy.ip}:${proxy.port}`;

    // Determine fallback behavior based on fallback_policy
    const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
    const returnVal = JSON.stringify(proxyStr + fallback);

    const allIncludeUrls = getProxyRulePatterns(proxy, 'include');
    const domainMap = {};
    const complexConditions = [];

    for (const pattern of allIncludeUrls) {
      // Support regex pattern: /pattern/ or /pattern/flags
      if (pattern.startsWith('/') && pattern.length > 2) {
        const parsedRegex = parseProxyRegexPattern(pattern);
        if (parsedRegex) {
          const variableName = `proxyAssistantRegex${regexIndex}`;
          regexIndex += 1;
          declarations.push(`var ${variableName} = new RegExp(${JSON.stringify(parsedRegex.source)}, ${JSON.stringify(parsedRegex.flags)});`);
          complexConditions.push(`(${variableName}.lastIndex = 0, ${variableName}.test(url))`);
        } else {
          console.warn('Unsafe or invalid regex pattern skipped in PAC generation:', pattern);
        }
      } else if (pattern.includes('*')) {
        const matchTarget = pattern.includes('/') ? 'url' : 'host';
        complexConditions.push(`shExpMatch(${matchTarget}, ${JSON.stringify(pattern)})`);
      } else if (isIpPattern(pattern)) {
        // IP address or CIDR range
        if (pattern.includes('/')) {
          complexConditions.push(`isInCidrRange(host, ${JSON.stringify(pattern)})`);
        } else {
          domainMap[pattern.toLowerCase()] = 1;
        }
      } else {
        domainMap[pattern.toLowerCase()] = 1;
      }
    }

    if (Object.keys(domainMap).length) {
      const variableName = `proxyAssistantDomains${proxyIndex}`;
      declarations.push(`var ${variableName} = ${JSON.stringify(domainMap)};`);
      body.push(`  if (domainMatches(${variableName})) return ${returnVal};\n`);
    }
    complexConditions.forEach(condition => {
      body.push(`  if (${condition}) return ${returnVal};\n`);
    });
    proxyIndex += 1;
  }

  body.push("  return \"DIRECT\";\n}");
  return declarations.concat(body).join('\n');
}

// -----------------------------------------------------------------------------
// Firefox Implementation Section
// -----------------------------------------------------------------------------

function setupFirefoxProxy() {
  if (typeof browser === 'undefined' || !browser.proxy) {
    console.warn("Firefox proxy API not available");
    return;
  }

  browser.proxy.settings.clear({});

  registerFirefoxListener();

  setupAuthListener();
}

// Firefox proxy listener registration - will be called after handleFirefoxRequest is defined
function registerFirefoxListener() {
  if (isFirefox && typeof browser !== 'undefined' && browser.proxy && browser.proxy.onRequest) {
    if (!browser.proxy.onRequest.hasListener(handleFirefoxRequest)) {
      browser.proxy.onRequest.addListener(handleFirefoxRequest, { urls: ["<all_urls>"] });
      console.log("Firefox proxy.onRequest listener registered");
    }
  }
}

async function handleFirefoxRequest(details) {
  // Wait for state to be loaded from storage
  if (!stateLoaded) {
    await stateLoadedPromise;
  }

  // Test Mode Override
  if (firefoxProxyState.testMode && firefoxProxyState.testProxy) {
    return createFirefoxProxyObject(firefoxProxyState.testProxy);
  }

  // Disabled
  if (firefoxProxyState.mode === 'disabled') {
    return null; // Fallthrough to system
  }

  // Manual Mode
  if (firefoxProxyState.mode === 'manual') {
    if (firefoxProxyState.currentProxy) {
      const proxy = firefoxProxyState.currentProxy;
      const urlParts = getUrlParts(details.url);
      if (urlParts && matchesCompiledFirefoxRules(
        getCachedFirefoxRuleMatcher(proxy, 'bypass'),
        details.url,
        urlParts
      )) {
        return { type: "direct" };
      }
      return createFirefoxProxyObject(proxy);
    }
    return null; // No config -> System
  }

  // Auto Mode
  if (firefoxProxyState.mode === 'auto') {
    return findProxyForRequestFirefox(details.url);
  }

  return { type: "direct" };
}

function checkBypass(bypassUrls, url) {
  if (!bypassUrls) return false;

  const urlParts = getUrlParts(url);
  if (!urlParts) return false;

  // Standard bypass for localhost
  const host = urlParts.host;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;

  const matcher = compileFirefoxRulePatterns(
    bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
  );
  return matchesCompiledFirefoxRules(matcher, url, urlParts);
}

function findProxyForRequestFirefox(url) {
  const urlParts = getUrlParts(url);
  if (!urlParts) return { type: "direct" };

  // Get proxy list from config
  const config = currentConfig || {};
  const scenarios = config.scenarios?.lists || [];
  const currentScenarioId = config.scenarios?.current || 'default';
  const currentScenario = scenarios.find(s => s.id === currentScenarioId);
  const proxyList = currentScenario?.proxies || [];

  // Check proxy list in order, use first matching include_rules
  for (const proxy of proxyList) {
    if (proxy.enabled === false) continue;
    if (!proxy.ip || !proxy.port) continue;

    const matcher = getCachedFirefoxRuleMatcher(proxy, 'include');
    if (matchesCompiledFirefoxRules(matcher, url, urlParts)) {
      return createFirefoxProxyObject(proxy);
    }
  }

  return { type: "direct" }; // No match, direct connection
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isInCidrRange(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  return (ipNum & mask) === (rangeNum & mask);
}

function getUrlParts(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return null;
    return {
      host: parsed.hostname,
      port: parsed.port
    };
  } catch (e) {
    return null;
  }
}

function isIPv4Address(value) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
}

function compileFirefoxRulePatterns(patterns) {
  const domainPatterns = new Set();
  const cidrPatterns = [];
  const hostRegexes = [];
  const urlRegexes = [];

  patterns.slice(0, MAX_PROXY_RULES_PER_PROXY).forEach(pattern => {
    const parsedRegex = parseProxyRegexPattern(pattern, 'i');
    if (parsedRegex) {
      hostRegexes.push(new RegExp(parsedRegex.source, parsedRegex.flags));
      return;
    }
    if (pattern.startsWith('/')) return;

    if (isIpPattern(pattern) && pattern.includes('/')) {
      cidrPatterns.push(pattern);
      return;
    }

    if (pattern.includes('*')) {
      const regexSource = pattern
        .replace(/[+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexSource}$`, 'i');
      if (pattern.includes('/')) urlRegexes.push(regex);
      else hostRegexes.push(regex);
      return;
    }

    domainPatterns.add(pattern.toLowerCase());
  });

  return { domainPatterns, cidrPatterns, hostRegexes, urlRegexes };
}

function getCachedFirefoxRuleMatcher(proxy, ruleType) {
  let cache = firefoxProxyRuleCache.get(proxy);
  if (!cache || cache.config !== currentConfig) {
    cache = { config: currentConfig, include: null, bypass: null };
    firefoxProxyRuleCache.set(proxy, cache);
  }
  if (!cache[ruleType]) {
    cache[ruleType] = compileFirefoxRulePatterns(getProxyRulePatterns(proxy, ruleType));
  }
  return cache[ruleType];
}

function matchesCompiledFirefoxRules(matcher, url, urlParts) {
  const host = urlParts.host.toLowerCase();
  let candidate = host;
  while (candidate) {
    if (matcher.domainPatterns.has(candidate)) return true;
    const separator = candidate.indexOf('.');
    if (separator === -1) break;
    candidate = candidate.substring(separator + 1);
  }

  if (isIPv4Address(host) && matcher.cidrPatterns.some(cidr => isInCidrRange(host, cidr))) {
    return true;
  }
  const testRegex = (regex, value) => {
    regex.lastIndex = 0;
    return regex.test(value);
  };
  if (matcher.hostRegexes.some(regex => testRegex(regex, host))) return true;
  return matcher.urlRegexes.some(regex => testRegex(regex, url));
}

function matchesPattern(url, pattern) {
  const urlParts = getUrlParts(url);
  if (!urlParts) return false;
  return matchesCompiledFirefoxRules(compileFirefoxRulePatterns([pattern]), url, urlParts);
}

function createFirefoxProxyObject(proxy) {
  const type = cleanProtocol(proxy.protocol || proxy.type || "http");

  let proxyType = "http";
  let proxyDNS = false;
  let socksVersion = undefined;

  if (type === "socks5") {
    proxyType = "socks";
    proxyDNS = true; // Default to remote DNS for SOCKS5
  } else if (type === "socks4") {
    proxyType = "socks";
    socksVersion = 4;
  } else if (type === "https") {
    proxyType = "https";
  }

  const result = {
    type: proxyType,
    host: proxy.ip,
    port: parseInt(proxy.port, 10),
    username: proxy.username || undefined,
    password: proxy.password || undefined,
    proxyDNS: proxyDNS
  };

  if (socksVersion) {
    result.socksVersion = socksVersion;
  }

  // Include Auth header for HTTP/HTTPS to potentially skip onAuthRequired
  if ((proxyType === 'http' || proxyType === 'https') && proxy.username && proxy.password) {
    result.proxyAuthorizationHeader = 'Basic ' + btoa(unescape(encodeURIComponent(proxy.username + ':' + proxy.password)));
  }

  return result;
}

// -----------------------------------------------------------------------------
// End Browser-Specific Implementation Sections
// -----------------------------------------------------------------------------

// Preconnect to test URLs to warm up proxy connection and avoid auth popups
function preconnectToTestUrls() {
  console.log("Preconnecting to test URLs to warm up proxy connection");

  // Create a hidden iframe to load test URLs
  TEST_URLS.forEach(url => {
    fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    }).catch(err => {
      // Ignore errors, this is just to warm up the connection
      console.log(`Preconnect to ${url} completed (errors are expected)`);
    });
  });
}

// Set up authentication listener
function setupAuthListener() {
  // Remove previous auth listener first
  try {
    chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
  } catch (e) {
    console.log("No previous auth listener to remove");
  }

  // Add new auth listener - using asyncBlocking in Manifest V3
  chrome.webRequest.onAuthRequired.addListener(
    handleAuthRequest,
    { urls: ["<all_urls>"] },
    ["asyncBlocking"]
  );

  console.log("Auth listener set up with asyncBlocking");
}

// Authentication callback function - handles auth requests
function handleAuthRequest(details, callback) {
  console.log("Auth request received for: " + details.url);

  // Only handle proxy authentication requests
  if (details.isProxy) {
    console.log("Handling proxy auth request");

    if (currentProxyAuth.username && currentProxyAuth.password) {
      console.log("Providing auth credentials for proxy");

      // Direct callback for better performance and reliability with fetch
      callback({
        authCredentials: {
          username: currentProxyAuth.username,
          password: currentProxyAuth.password
        }
      });
    } else {
      // Helper for local storage fallback
      const checkLocalStorage = () => {
        chrome.storage.local.get(['state'], (result) => {
          if (result.state?.proxy?.current &&
            result.state.proxy.current.username &&
            result.state.proxy.current.password) {

            // Update global variables
            currentProxyAuth.username = result.state.proxy.current.username;
            currentProxyAuth.password = result.state.proxy.current.password;
            // Note: We don't updateSessionAuth here because local storage is the source of truth for persisted settings

            console.log("Retrieved auth credentials from storage");

            setTimeout(() => {
              callback({
                authCredentials: {
                  username: result.state.proxy.current.username,
                  password: result.state.proxy.current.password
                }
              });
            }, 0);
          } else {
            console.log("No auth credentials available");
            callback({ cancel: false });
          }
        });
      };

      // If no auth info in global var, try session storage first (MV3 state safety)
      // This is crucial for testProxyConnection scenarios where credentials are temporary
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get(['currentProxyAuth'], (sessionResult) => {
          if (sessionResult.currentProxyAuth && sessionResult.currentProxyAuth.username) {
            currentProxyAuth = sessionResult.currentProxyAuth;
            console.log("Retrieved auth credentials from session storage");
            callback({
              authCredentials: {
                username: currentProxyAuth.username,
                password: currentProxyAuth.password
              }
            });
          } else {
            checkLocalStorage();
          }
        });
      } else {
        checkLocalStorage();
      }
    }
  } else {
    console.log("Not a proxy auth request");
    callback({ cancel: false });
  }
}

// Turn off proxy
async function turnOffProxy() {
  if (isFirefox) {
    firefoxProxyState.mode = 'disabled';
    updateFirefoxSessionState();
    chrome.storage.local.set({ state: { proxy: { mode: 'disabled', current: null } } }, () => {
      updateBadge();
    });
    browser.proxy.settings.clear({});
  } else {
    // Chrome
    return new Promise(async (resolve) => {
      try {
        // First check current proxy control status
        const currentConfig = await getProxySettings();

        // Check if controlled by other extensions
        if (currentConfig.levelOfControl === "controlled_by_other_extensions") {
          console.warn("Proxy is controlled by other extensions, cannot turn off");
        }

        const config = {
          mode: "system"
        };

        // Clear auth info
        currentProxyAuth = {
          username: '',
          password: ''
        };
        updateSessionAuth(currentProxyAuth);

        // Mark proxy as disabled
        chrome.storage.local.set({ state: { proxy: { mode: 'disabled', current: null } } }, () => {
          updateBadge();
        });

        // Remove auth listener
        try {
          chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
        } catch (e) {
          console.log("No auth listener to remove");
        }

        chrome.proxy.settings.set(
          { value: config, scope: "regular" },
          async () => {
            if (chrome.runtime.lastError) {
              console.log("Error turning off proxy:", chrome.runtime.lastError);
            } else {
              console.log("Proxy turned off (mode: system)");
            }
            resolve();
          }
        );
      } catch (error) {
        console.log("Error in turnOffProxy:", error);
        resolve();
      }
    });
  }
}

// Listen for messages from popup or settings page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message.action);

  try {
    if (message.action === "applyProxy") {
      applyProxySettings(message.proxyInfo)
        .then(result => {
          recordProxyResult('manual', result, message.proxyInfo);
          sendResponse(result);
          if (result?.success) rememberCurrentScenarioProxy(message.proxyInfo);
        })
        .catch((error) => {
          appendRuntimeLog('error', 'proxy', 'proxy_apply_failed', { error: error.message });
          sendResponse({ success: false, error: error.message });
        });
      return true;
    } else if (message.action === "setProxyMode") {
      applyProxySettings(message.proxyInfo, message.mode)
        .then(result => {
          recordProxyResult(message.mode, result, message.proxyInfo);
          sendResponse(result);
          if (result?.success && message.mode === 'manual') {
            rememberCurrentScenarioProxy(message.proxyInfo);
          }
        })
        .catch((error) => {
          appendRuntimeLog('error', 'proxy', 'proxy_apply_failed', { error: error.message });
          sendResponse({ success: false, error: error.message });
        });
      return true;
    } else if (message.action === 'activateScenario') {
      activateScenario(message.scenarioId, message.source || 'manual')
        .then(result => {
          appendRuntimeLog(result?.success ? 'info' : 'error', 'scenario', result?.success ? 'scenario_activated' : 'scenario_activation_failed', {
            scenarioId: message.scenarioId,
            error: result?.error || ''
          });
          sendResponse(result);
        })
        .catch(error => {
          appendRuntimeLog('error', 'scenario', 'scenario_activation_failed', {
            scenarioId: message.scenarioId,
            error: error.message
          });
          sendResponse({ success: false, error: error.message });
        });
      return true;
    } else if (message.action === "refreshProxy") {
      applyProxySettings()
        .then(sendResponse)
        .catch((error) => {
          appendRuntimeLog('error', 'proxy', 'proxy_apply_failed', { error: error.message });
          sendResponse({ success: false, error: error.message });
        });
      return true;
    } else if (message.action === "turnOffProxy") {
      turnOffProxy()
        .then(() => {
          appendRuntimeLog('info', 'proxy', 'proxy_disabled');
          sendResponse({ success: true });
        })
        .catch((error) => {
          appendRuntimeLog('error', 'proxy', 'proxy_apply_failed', { error: error.message });
          sendResponse({ success: false, error: error.message });
        });
      return true;
    } else if (message.action === "getProxyStatus") {
      chrome.storage.local.get(['state'], (result) => {
        sendResponse({
          enabled: result.state?.proxy?.mode && result.state.proxy.mode !== 'disabled',
          proxyInfo: result.state?.proxy?.current || null
        });
      });
      return true; // Keep message channel open for async response
    } else if (message.action === 'getRuntimeLogs') {
      getRuntimeLogs()
        .then(logs => sendResponse({ success: true, logs: logs }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    } else if (message.action === 'clearRuntimeLogs') {
      clearRuntimeLogs()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    } else if (message.action === 'recordRuntimeLog') {
      appendRuntimeLog(
        message.level,
        message.category,
        message.event,
        message.details
      )
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    } else if (message.action === "testProxyConnection") {
      testProxyConnection(message.proxyInfo, sendResponse);
      return true;
    } else if (message.action === "getPacScript") {
      (async () => {
        try {
          const result = await new Promise(resolve => {
            chrome.storage.local.get(['config'], resolve);
          });

          const config = result.config || {};
          const scenarios = config.scenarios?.lists || [];
          const currentScenarioId = config.scenarios?.current || 'default';
          const currentScenario = scenarios.find(s => s.id === currentScenarioId);
          const list = currentScenario?.proxies || [];

          const script = generatePacScript(list);
          sendResponse({ success: true, script: script });
        } catch (e) {
          console.info("Error generating PAC script:", e);
          sendResponse({ success: false, error: e.message });
        }
      })();
      return true;
    } else if (message.action === "subscriptionUpdated") {
      console.log(`[Worker] Subscription updated: ${message.proxyId}, format: ${message.format}`);
      applyProxySettings();
      sendResponse({ success: true });
    } else if (message.action === "scheduleSubscriptionRefresh") {
      scheduleSubscriptionRefresh(
        message.proxyId,
        message.format,
        message.refreshInterval,
        message.url
      );
      sendResponse({ success: true });
    } else {
      console.warn("Unknown action:", message.action);
      sendResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.log("Error handling message:", error);
    appendRuntimeLog('error', 'system', 'worker_error', { error: error.message });
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

async function testProxyConnection(proxyInfo, sendResponse) {
  // Validate before replacing the active proxy credentials or listeners.
  const ipValidation = validateProxyConfig(proxyInfo?.ip, proxyInfo?.port);
  if (!ipValidation.valid) {
    sendResponse({ success: false, error: `Invalid proxy configuration: ${ipValidation.error}` });
    return;
  }

  const previousAuth = { ...currentProxyAuth };

  // Set test auth
  currentProxyAuth = {
    username: proxyInfo.username || '',
    password: proxyInfo.password || ''
  };
  updateSessionAuth(currentProxyAuth);

  // Ensure listener is active
  setupAuthListener();

  // Clean protocol field to prevent corruption
  const type = cleanProtocol(proxyInfo.protocol || "http");

  if (isFirefox) {
    // -------------------------
    // Firefox Test Implementation
    // -------------------------
    // Backup state
    const previousMode = firefoxProxyState.mode;

    // Set Test Mode
    firefoxProxyState.testMode = true;
    firefoxProxyState.testProxy = proxyInfo;
    updateFirefoxSessionState();

    // In Firefox, we rely on onRequest which reads the state
    // We don't need to "set" anything other than the state variables
    console.log("Firefox: Enabled Test Mode for connectivity check");

    try {
      // Wait a bit for state to be picked up
      await new Promise(resolve => setTimeout(resolve, 500));

      const testResult = await runConnectivityTest(proxyInfo);
      sendResponse(testResult);

    } catch (error) {
      sendResponse({ success: false, error: error.message || "Connection failed" });
    } finally {
      // Restore state
      firefoxProxyState.testMode = false;
      firefoxProxyState.testProxy = null;
      firefoxProxyState.mode = previousMode;
      currentProxyAuth = previousAuth;
      updateSessionAuth(currentProxyAuth);
      updateFirefoxSessionState();
    }
  } else {
    // -------------------------
    // Chrome Test Implementation
    // -------------------------
    let proxyScheme = type === "socks5" ? "socks5" : (type === "socks4" ? "socks4" : "http");
    if (type === "https") proxyScheme = "https";

    // Config for test
    const config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: proxyScheme,
          host: proxyInfo.ip,
          port: parseInt(proxyInfo.port, 10)
        },
        bypassList: ["<local>"]
      }
    };

    try {
      // Apply test proxy
      await new Promise((resolve, reject) => {
        chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // Wait a bit for proxy settings to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      const testResult = await runConnectivityTest(proxyInfo);
      sendResponse(testResult);

    } catch (error) {
      sendResponse({ success: false, error: error.message || "Connection failed" });
    } finally {
      // Restore previous settings
      currentProxyAuth = previousAuth;
      updateSessionAuth(currentProxyAuth);
      applyProxySettings(); // Re-apply whatever was in storage
    }
  }
}

// Shared connectivity test logic
async function runConnectivityTest(proxyInfo) {
  // First test: Try to connect to a URL that should fail if proxy is invalid
  const invalidTargetTest = await testProxyConnectivity(proxyInfo);
  if (!invalidTargetTest.success) {
    return { success: false, error: invalidTargetTest.error };
  }

  // Phase 2: Test with actual URLs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 8000); // 8s timeout

  const startTime = Date.now();

  const testUrls = [
    "https://www.baidu.com/favicon.ico?_t=" + Date.now(),
    "https://httpbin.org/status/200?_t=" + Date.now()
  ];

  let testResult = null;
  let lastError = null;

  // Try each URL until one succeeds
  for (const testUrl of testUrls) {
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok && response.status === 200) {
        const latency = Date.now() - startTime;
        testResult = { success: true, latency: latency, url: testUrl };
        break;
      } else {
        lastError = `HTTP ${response.status} from ${testUrl}`;
      }
    } catch (error) {
      lastError = `${error.message} for ${testUrl}`;
      continue; // Try next URL
    }
  }

  clearTimeout(timeoutId);

  if (testResult && testResult.success) {
    return { success: true, latency: testResult.latency, testUrl: testResult.url };
  } else {
    return { success: false, error: lastError || "All test URLs failed" };
  }
}

// Helper function to test if proxy is actually being used
async function testProxyConnectivity(proxyInfo) {
  const testHost = "invalid-test-host-12345.com";
  const testUrl = `https://${testHost}/test`;

  let timeoutId;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(testUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      return {
        success: false,
        error: "Proxy connectivity test failed - request did not go through proxy"
      };
    }
    return { success: true };

  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error.name === 'TypeError' && error.message.includes('fetch')) return { success: true };
    if (error.name === 'AbortError') return { success: true };
    return { success: false, error: `Proxy connectivity test failed: ${error.message}` };
  }
}

// Subscription rules parser for worker context
function parseSubscriptionRuleLine(line, format, defaultType, defaultAddress, reverse) {
  let isException = false;
  let actionType = defaultType;
  let isDirect = false;

  if (format === 'autoproxy') {
    if (line.startsWith('[') && line.endsWith(']')) return null;
    if (line.startsWith('!')) return null;
    if (line.startsWith('@@')) {
      isException = true;
      line = line.substring(2);
    }
    const finalActionIsDirect = reverse ? !isException : isException;
    isDirect = finalActionIsDirect;
  } else if (format === 'switchy_omega') {
    if (line.startsWith('[SwitchyOmega Conditions]')) return null;
    if (line.startsWith(';')) return null;
    if (line.startsWith('@')) return null;
    if (line.includes(' +')) {
      const parts = line.split(' +');
      line = parts[0].trim();
      const res = parts[1].trim().toLowerCase();
      if (res === 'direct') isDirect = true;
    }
    if (line.startsWith('!')) {
      isException = true;
      line = line.substring(1).trim();
    }
    if (isException) isDirect = true;
    if (reverse) isDirect = !isDirect;
  } else if (format === 'switchy_legacy') {
    if (line.startsWith(';')) return null;
    if (line === '#BEGIN' || line === '#END') return null;
    if (line.startsWith('[') && line.endsWith(']')) return null;
    if (line.startsWith('!')) {
      isException = true;
      line = line.substring(1);
    }
    const finalActionIsDirect = reverse ? !isException : isException;
    isDirect = finalActionIsDirect;
  }

  const result = isDirect ? 'DIRECT' : defaultType;
  const addressPart = defaultAddress ? ` ${defaultAddress}` : '';
  const returnVal = isDirect ? '"DIRECT"' : `"${defaultType}${addressPart}"`;

  if (format === 'switchy_omega' && line === '*') {
    return { type: 'all', pattern: '*', action: result, js: `return ${returnVal};` };
  }

  let js = '';
  let pattern = line;
  let ruleType = 'keyword';

  if (line.startsWith('||')) {
    pattern = line.substring(2);
    js = `if (host.endsWith('.${pattern}') || host === '${pattern}') return ${returnVal};`;
    ruleType = 'domain';
  } else if (line.startsWith('|')) {
    pattern = line.substring(1);
    js = `if (url.startsWith('${pattern}')) return ${returnVal};`;
    ruleType = 'start';
  } else if (line.startsWith('/') && line.endsWith('/')) {
    pattern = line.substring(1, line.length - 1);
    js = `if (/${pattern}/.test(url)) return ${returnVal};`;
    ruleType = 'regex';
  } else if (isIpPattern(line)) {
    if (line.includes('/')) {
      js = `if (isInCidrRange(host, "${line}")) return ${returnVal};`;
      ruleType = 'cidr';
    } else {
      js = `if (host === "${line}") return ${returnVal};`;
      ruleType = 'ip';
    }
  } else if (format === 'switchy_omega' && line.startsWith(':')) {
    pattern = line.substring(1).trim();
    js = `if (host.endsWith('.${pattern}') || host === '${pattern}') return ${returnVal};`;
    ruleType = 'domain';
  } else if (format === 'switchy_omega') {
    js = `if (host.endsWith('.${line}') || host === '${line}') return ${returnVal};`;
    ruleType = 'domain';
  } else {
    js = `if (url.indexOf('${line}') >= 0) return ${returnVal};`;
  }

  return { type: ruleType, pattern, action: result, js };
}

function parseSubscriptionRules(content, format, proxyType, proxyAddress, reverse = false) {
  if (!content) return [];

  let decoded = content;
  let actualFormat = format;

  if (format === 'autoproxy' && (content.startsWith('W0F1dG9Qcm94') || content.trim().startsWith('[AutoProxy'))) {
    if (content.startsWith('W0F1dG9Qcm94')) {
      try {
        decoded = atob(content);
      } catch (e) {
        console.info("Base64 decode failed", e);
      }
    }
  }

  const lines = decoded.split(/[\r\n]+/);
  const rules = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const rule = parseSubscriptionRuleLine(line, actualFormat, proxyType, proxyAddress, reverse);
    if (rule) {
      rules.push(rule);
    }
  }

  return rules;
}

// Register Firefox proxy listener after all functions are defined
registerFirefoxListener();
