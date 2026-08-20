const fs = require('fs');
const path = require('path');

function loadStorageModule(chromeMock) {
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/storage.js'), 'utf8');
  return new Function('window', 'chrome', `${source}\nreturn window.StorageModule;`)(window, chromeMock);
}

function createConfig(subscriptionContent) {
  return {
    version: 4,
    system: {},
    scenarios: {
      current: 'scenario-1',
      lists: [{
        id: 'scenario-1',
        name: 'Default',
        proxies: [{
          id: 'proxy-1',
          name: 'Saved name',
          subscription_ids: ['subscription-1']
        }]
      }]
    },
    subscriptions: [{
      id: 'subscription-1',
      name: 'Shared rules',
      enabled: true,
      current: 'autoproxy',
      lists: {
        autoproxy: { content: subscriptionContent }
      }
    }]
  };
}

describe('StorageModule subscription synchronization', () => {
  let chromeMock;
  let storageModule;

  beforeEach(() => {
    delete window.ConfigModule;
    chromeMock = {
      runtime: {
        lastError: null,
        sendMessage: jest.fn((message, callback) => callback())
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn((payload, callback) => callback())
        }
      }
    };
    storageModule = loadStorageModule(chromeMock);
  });

  afterEach(() => {
    delete window.ConfigModule;
  });

  test('persists a normalized configuration after loading migrated IDs', async () => {
    const storedConfig = createConfig('rules');
    const normalizedConfig = JSON.parse(JSON.stringify(storedConfig));
    normalizedConfig.scenarios.current = 'scenario_20250213134422';
    normalizedConfig.scenarios.lists[0].id = 'scenario_20250213134422';
    window.ConfigModule = {
      migrateConfig: jest.fn(() => normalizedConfig)
    };
    chromeMock.storage.local.get.mockImplementation((keys, callback) => callback({ config: storedConfig }));

    await storageModule.init();

    expect(chromeMock.storage.local.set).toHaveBeenCalledTimes(1);
    const payload = chromeMock.storage.local.set.mock.calls[0][0];
    expect(payload.config.scenarios.current).toBe('scenario_20250213134422');
    expect(payload.config.updated_at).toBe(payload.config_updated_at);
  });

  test('merges refreshed subscriptions without replacing local edits', async () => {
    const cachedConfig = createConfig('old content');
    const refreshedConfig = createConfig('new content');
    storageModule.setConfig(cachedConfig);

    cachedConfig.scenarios.lists[0].proxies[0].name = 'Unsaved draft';

    expect(storageModule.isSubscriptionOnlyChange(createConfig('old content'), refreshedConfig)).toBe(true);

    refreshedConfig.updated_at = '2026-08-20T06:30:00.000Z';
    storageModule.mergeSubscriptionChanges(refreshedConfig);
    expect(storageModule.getConfigUpdatedAt()).toBe('2026-08-20T06:30:00.000Z');
    await storageModule.save();

    const savedConfig = chromeMock.storage.local.set.mock.calls[0][0].config;
    const savedProxy = savedConfig.scenarios.lists[0].proxies[0];
    expect(savedProxy.name).toBe('Unsaved draft');
    expect(savedProxy.subscription_ids).toEqual(['subscription-1']);
    expect(savedConfig.subscriptions[0].lists.autoproxy.content).toBe('new content');
    expect(chromeMock.storage.local.set.mock.calls[0][0].config_updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(savedConfig.updated_at).toBe(chromeMock.storage.local.set.mock.calls[0][0].config_updated_at);
    expect(storageModule.getConfigUpdatedAt()).toBe(chromeMock.storage.local.set.mock.calls[0][0].config_updated_at);
  });

  test('does not classify general config edits as subscription-only', () => {
    const oldConfig = createConfig('same content');
    const newConfig = createConfig('same content');
    newConfig.scenarios.lists[0].proxies[0].name = 'Renamed';

    expect(storageModule.isSubscriptionOnlyChange(oldConfig, newConfig)).toBe(false);
  });

  test('reorders the shared subscription collection', () => {
    const config = createConfig('first');
    config.subscriptions.push({
      id: 'subscription-2',
      name: 'Second rules',
      enabled: true,
      current: 'autoproxy',
      lists: { autoproxy: { content: 'second' } }
    });
    storageModule.setConfig(config);

    storageModule.reorderSubscriptions([
      config.subscriptions[1],
      config.subscriptions[0]
    ]);

    expect(storageModule.getSubscriptions().map(item => item.id)).toEqual([
      'subscription-2',
      'subscription-1'
    ]);
    expect(storageModule.getSubscriptions().map(item => item.order)).toEqual([0, 1]);
  });

  test('falls back to the last-used strategy when a selected proxy is deleted or moved', () => {
    const config = createConfig('rules');
    const scenario = config.scenarios.lists[0];
    scenario.defaultProxyId = 'proxy-1';
    scenario.proxies = [
      { id: 'proxy-1', enabled: true, ip: '10.0.0.1', port: '8080' },
      { id: 'proxy-2', enabled: true, ip: '10.0.0.2', port: '8080' }
    ];
    config.scenarios.lists.push({ id: 'scenario-2', name: 'Work', proxies: [], defaultProxyId: null });
    storageModule.setConfig(config);

    storageModule.deleteProxy(0, 'scenario-1');
    expect(scenario.defaultProxyId).toBeNull();

    expect(storageModule.moveProxy(0, 'scenario-1', 'scenario-2')).toBe(true);
    expect(scenario.defaultProxyId).toBeNull();
    expect(config.scenarios.lists[1].defaultProxyId).toBeNull();
  });
});
