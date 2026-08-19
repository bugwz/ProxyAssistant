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

  test('merges refreshed subscriptions without replacing local edits', async () => {
    const cachedConfig = createConfig('old content');
    const refreshedConfig = createConfig('new content');
    storageModule.setConfig(cachedConfig);

    cachedConfig.scenarios.lists[0].proxies[0].name = 'Unsaved draft';

    expect(storageModule.isSubscriptionOnlyChange(createConfig('old content'), refreshedConfig)).toBe(true);

    storageModule.mergeSubscriptionChanges(refreshedConfig);
    await storageModule.save();

    const savedConfig = chromeMock.storage.local.set.mock.calls[0][0].config;
    const savedProxy = savedConfig.scenarios.lists[0].proxies[0];
    expect(savedProxy.name).toBe('Unsaved draft');
    expect(savedProxy.subscription_ids).toEqual(['subscription-1']);
    expect(savedConfig.subscriptions[0].lists.autoproxy.content).toBe('new content');
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
  });
});
