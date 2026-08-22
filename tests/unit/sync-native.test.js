const fs = require('fs');
const path = require('path');

function createChromeMock(initialItems = {}) {
  const items = JSON.parse(JSON.stringify(initialItems));
  let writeError = null;

  const chromeMock = {
    runtime: { lastError: null },
    storage: {
      sync: {
        get: jest.fn((keys, callback) => {
          if (keys === null) {
            callback(JSON.parse(JSON.stringify(items)));
            return;
          }

          const requestedKeys = Array.isArray(keys) ? keys : [keys];
          const result = {};
          requestedKeys.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(items, key)) result[key] = items[key];
          });
          callback(result);
        }),
        set: jest.fn((values, callback) => {
          if (writeError) {
            chromeMock.runtime.lastError = { message: writeError };
            callback();
            chromeMock.runtime.lastError = null;
            return;
          }

          Object.assign(items, JSON.parse(JSON.stringify(values)));
          callback();
        }),
        remove: jest.fn((keys, callback) => {
          keys.forEach(key => delete items[key]);
          callback();
        }),
        clear: jest.fn()
      }
    }
  };

  return {
    chromeMock,
    items,
    failWritesWith(message) {
      writeError = message;
    }
  };
}

function loadSyncModule(chromeMock, overrides = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/sync.js'), 'utf8');
  const factory = new Function('window', 'chrome', '$', 'I18n', 'Blob', 'console', `${source}\nreturn window.SyncModule;`);
  return factory(
    overrides.window || {},
    chromeMock,
    overrides.$ || jest.fn(),
    overrides.I18n || { t: key => key },
    Blob,
    console
  );
}

describe('native sync writes', () => {
  test('normalizes independent schedules and migrates the legacy selected service', () => {
    const { chromeMock } = createChromeMock();
    const syncModule = loadSyncModule(chromeMock);

    expect(syncModule.normalizeSyncConfig({
      type: 'gist',
      auto_mode: 'pull',
      interval_minutes: 30,
      gist: { token: 'token' }
    })).toEqual({
      native: {
        auto_mode: 'off',
        interval_minutes: 360,
        last_sync_at: null,
        last_sync_direction: null
      },
      gist: {
        token: 'token',
        filename: 'proxy_assistant_config.json',
        gist_id: '',
        auto_mode: 'pull',
        interval_minutes: 30,
        last_sync_at: null,
        last_sync_direction: null
      }
    });
    expect(syncModule.normalizeSyncConfig({
      native: { auto_mode: 'push', interval_minutes: 15 },
      gist: { auto_mode: 'pull', interval_minutes: 30 }
    })).toMatchObject({
      native: { auto_mode: 'push', interval_minutes: 15 },
      gist: { auto_mode: 'pull', interval_minutes: 30 }
    });
  });

  test('preserves the previous backup when writing fails', async () => {
    const previousItems = {
      meta: { version: 4, chunks: { start: 0, end: 0 }, checksum: 'crc:old' },
      'data.0': '{"old":true}'
    };
    const { chromeMock, items, failWritesWith } = createChromeMock(previousItems);
    const syncModule = loadSyncModule(chromeMock);
    failWritesWith('QUOTA_BYTES quota exceeded');

    await expect(syncModule.nativePush({ replacement: true })).rejects.toThrow('Write failed');

    expect(items).toEqual(previousItems);
    expect(chromeMock.storage.sync.clear).not.toHaveBeenCalled();
    expect(chromeMock.storage.sync.remove).not.toHaveBeenCalled();
  });

  test('removes stale chunks only after a successful write', async () => {
    const previousItems = {
      meta: { version: 4, chunks: { start: 0, end: 2 }, checksum: 'crc:old' },
      'data.0': 'old-0',
      'data.1': 'old-1',
      'data.2': 'old-2'
    };
    const { chromeMock, items } = createChromeMock(previousItems);
    const syncModule = loadSyncModule(chromeMock);
    const newData = { replacement: true };

    await syncModule.nativePush(newData);

    expect(chromeMock.storage.sync.set).toHaveBeenCalledTimes(1);
    expect(chromeMock.storage.sync.remove).toHaveBeenCalledWith(['data.1', 'data.2'], expect.any(Function));
    expect(items['data.1']).toBeUndefined();
    expect(items['data.2']).toBeUndefined();
    await expect(syncModule.nativePull()).resolves.toEqual(newData);
  });

  test('tests browser sync storage without writing configuration data', async () => {
    const { chromeMock } = createChromeMock({ meta: { version: 4 } });
    const syncModule = loadSyncModule(chromeMock);

    await expect(syncModule.testNativeConnection()).resolves.toBe('sync_native_connection_success');

    expect(chromeMock.storage.sync.get).toHaveBeenCalledWith(null, expect.any(Function));
    expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();
    expect(chromeMock.storage.sync.remove).not.toHaveBeenCalled();
  });

  test('reports browser sync storage connection errors', async () => {
    const { chromeMock } = createChromeMock();
    chromeMock.storage.sync.get.mockImplementationOnce((keys, callback) => {
      chromeMock.runtime.lastError = { message: 'Sync storage unavailable' };
      callback();
      chromeMock.runtime.lastError = null;
    });
    const syncModule = loadSyncModule(chromeMock);

    await expect(syncModule.testNativeConnection()).rejects.toThrow('Sync storage unavailable');
  });

  test('calculates native quota from the configuration file rules', () => {
    const { chromeMock } = createChromeMock();
    const options = {
      includeSubscriptions: false,
      includeSubscriptionCache: false
    };
    const buildConfigFileData = jest.fn(() => ({
      version: 5,
      scenarios: { current: 'default', lists: [] }
    }));
    const chain = {
      text: jest.fn().mockReturnThis(),
      css: jest.fn().mockReturnThis(),
      removeClass: jest.fn().mockReturnThis(),
      addClass: jest.fn().mockReturnThis(),
      show: jest.fn().mockReturnThis(),
      hide: jest.fn().mockReturnThis()
    };
    const syncModule = loadSyncModule(chromeMock, {
      window: {
        ConfigModule: { buildConfigFileData },
        getConfigFileOptions: jest.fn(() => options)
      },
      $: jest.fn(() => chain),
      I18n: { t: key => key }
    });

    syncModule.updateNativeQuotaInfo();

    expect(buildConfigFileData).toHaveBeenCalledWith(options);
  });
});
