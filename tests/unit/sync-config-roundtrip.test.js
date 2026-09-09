const fs = require('fs');
const path = require('path');

function loadModules() {
  let config = null;
  const items = {};
  const storage = {
    getConfig: () => config,
    setConfig: value => { config = value; },
    save: jest.fn(async () => config)
  };
  const chain = new Proxy({}, { get: () => () => chain });
  const scope = { StorageModule: storage };
  const chrome = {
    runtime: {},
    storage: { sync: {
      get: (keys, callback) => callback({ ...items }),
      set: (values, callback) => { Object.assign(items, values); callback(); },
      remove: (keys, callback) => { keys.forEach(key => delete items[key]); callback(); }
    } }
  };
  const source = file => fs.readFileSync(path.join(__dirname, '../../src/js', file), 'utf8');
  const run = new Function('window', 'StorageModule', 'I18n', '$', 'chrome', 'showTip',
    'SubscriptionModule', 'loadSettings', 'fetch',
    `${source('config.js')}\nconst ConfigModule = window.ConfigModule;\n${source('sync.js')}\nreturn window;`);
  const fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ files: { 'config.json': { content: JSON.stringify(items.remote) } } })
  }));
  run(scope, storage, { t: key => key }, () => chain, chrome, jest.fn(), null, jest.fn(), fetch);
  const subscriptionFactory = new Function('window', 'StorageModule', source('subscription.js') + '; return SubscriptionModule;');
  scope.SubscriptionModule = subscriptionFactory(scope, storage);
  config = scope.ConfigModule.getDefaultConfig();
  return { ...scope, storage, items, fetch };
}

describe('configuration file sync round trips', () => {
  test.each(['http', 'https', 'socks4', 'socks5'])('preserves %s during legacy migration', protocol => {
    const { ConfigModule } = loadModules();
    const result = ConfigModule.prepareConfigForApply({ scenarios: [{
      name: 'Legacy', proxies: [{ name: 'Proxy', protocol, ip: 'proxy.example', port: '8080' }]
    }] });
    expect(result.scenarios.lists[0].proxies[0].protocol).toBe(protocol);
  });

  test.each(['native', 'gist'])('%s pull restores exported proxies and subscriptions', async type => {
    const { ConfigModule, SyncModule, storage, items } = loadModules();
    const config = storage.getConfig();
    const scenario = config.scenarios.lists[0];
    const proxyId = ConfigModule.generateProxyId();
    const subscriptionId = ConfigModule.generateSubscriptionId();
    scenario.proxies = [{
      id: proxyId, enabled: true, name: 'Proxy', protocol: 'https',
      ip: 'proxy.example', port: '8443', subscription_ids: [subscriptionId]
    }];
    scenario.defaultProxyId = proxyId;
    config.subscriptions = [{
      id: subscriptionId, name: 'Rules', enabled: true, current: 'autoproxy',
      lists: { autoproxy: { url: 'https://rules.example/list', include_rules: 'example.com' } }
    }];
    SyncModule.setSyncConfig({ gist: { token: 'local-token', gist_id: 'id', filename: 'config.json', auto_mode: 'off' } });
    const file = ConfigModule.buildConfigFileData({ includeSubscriptions: true, includeSubscriptionCache: true });
    if (type === 'native') await SyncModule.nativePush(file);
    else items.remote = file;
    scenario.proxies = [];
    config.subscriptions = [];

    await SyncModule.manualPull(type);

    expect(storage.save).toHaveBeenCalled();
    const restored = storage.getConfig();
    expect(restored.scenarios.lists[0].proxies).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: proxyId, protocol: 'https', subscription_ids: [subscriptionId] })
    ]));
    expect(restored.scenarios.lists[0].defaultProxyId).toBe(proxyId);
    expect(restored.subscriptions[0]).toMatchObject({
      id: subscriptionId, current: 'autoproxy',
      lists: { autoproxy: { include_rules: 'example.com' } }
    });
    expect(restored.system.sync.gist.token).toBe('local-token');
    expect(restored.system.sync[type].last_sync_direction).toBe('pull');
  });
});


test.each(['autoproxy', 'pac'])('imports legacy top-level proxies with embedded %s subscriptions', format => {
  const { ConfigModule, storage } = loadModules();
  const localId = ConfigModule.generateSubscriptionId();
  storage.getConfig().subscriptions = [{ id: localId, name: 'Local', current: 'autoproxy', lists: {} }];
  const result = ConfigModule.prepareConfigForApply({ proxies: [{
    name: 'Legacy', ip: 'proxy.example', port: '8080', subscription: {
      current: format, enabled: true, lists: { [format]: {
        url: 'https://rules.example/', content: 'raw content', process_rule: '{"include":{}}'
      } }
    }
  }] });
  const proxy = result.scenarios.lists[0].proxies[0];
  const migrated = result.subscriptions.find(sub => sub.id === proxy.subscription_ids[0]);
  expect(migrated.lists[format]).toMatchObject({ url: 'https://rules.example/', content: 'raw content' });
  if (format === 'pac') expect(migrated.lists.pac.process_rule).toBe('{"include":{}}');
  expect(result.subscriptions.some(sub => sub.id === localId)).toBe(true);
  expect(result.version).toBe(5);
});


test.each(['url', 'reverse', 'process_rule'])('does not reuse subscription cache after %s changes', field => {
  const { ConfigModule, storage } = loadModules();
  const config = storage.getConfig();
  const id = ConfigModule.generateSubscriptionId();
  const list = { url: 'https://old.example/', reverse: false, process_rule: '{}', content: 'old', include_rules: 'old.example', last_fetch_time: 123 };
  config.subscriptions = [{ id, name: 'Rules', current: 'pac', lists: { pac: list } }];
  const imported = JSON.parse(JSON.stringify(config));
  imported.subscriptions[0].lists.pac = { url: list.url, reverse: list.reverse, process_rule: list.process_rule };
  imported.subscriptions[0].lists.pac[field] = field === 'reverse' ? true : 'changed';
  const result = ConfigModule.prepareConfigForApply(imported);
  expect(result.subscriptions[0].lists.pac.content).toBeUndefined();
  expect(result.subscriptions[0].lists.pac.last_fetch_time).toBeUndefined();
});

test('reparses imported subscription content without touching local caches', () => {
  const { ConfigModule, storage } = loadModules();
  const config = storage.getConfig();
  const id = ConfigModule.generateSubscriptionId();
  config.subscriptions = [{ id, current: 'autoproxy', lists: { autoproxy: {
    url: 'https://rules.example/', content: '[AutoProxy 0.2]\n||local.example', include_rules: 'local.example'
  } } }];
  const imported = JSON.parse(JSON.stringify(config));
  imported.subscriptions[0].lists.autoproxy.content = '[AutoProxy 0.2]\n||imported.example';
  imported.subscriptions[0].lists.autoproxy.include_rules = 'stale.example';
  const result = ConfigModule.prepareConfigForApply(imported);
  expect(result.subscriptions[0].lists.autoproxy.include_rules).toBe('imported.example');
  expect(config.subscriptions[0].lists.autoproxy.include_rules).toBe('local.example');
});


test('independent contexts generate distinct stable entity IDs at the same time', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-09-09T00:00:00Z'));
  try {
    const a = loadModules().ConfigModule;
    const b = loadModules().ConfigModule;
    const ids = [];
    for (let i = 0; i < 100; i += 1) ids.push(a.generateProxyId(), b.generateProxyId());
    expect(new Set(ids).size).toBe(200);
    const config = a.getDefaultConfig();
    const id = config.scenarios.current;
    expect(b.migrateConfig(config).scenarios.current).toBe(id);
    expect(a.migrateConfig(config).scenarios.current).toBe(id);
  } finally {
    jest.useRealTimers();
  }
});
