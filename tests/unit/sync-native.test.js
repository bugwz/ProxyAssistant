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
  const factory = new Function(
    'window',
    'chrome',
    '$',
    'I18n',
    'Blob',
    'fetch',
    'AbortController',
    'setTimeout',
    'clearTimeout',
    'console',
    `${source}\nreturn window.SyncModule;`
  );
  return factory(
    overrides.window || {},
    chromeMock,
    overrides.$ || jest.fn(),
    overrides.I18n || { t: key => key },
    Blob,
    overrides.fetch || global.fetch,
    AbortController,
    setTimeout,
    clearTimeout,
    console
  );
}

describe('native sync writes', () => {
  test('aborts stalled Gist requests at the configured timeout', async () => {
    jest.useFakeTimers();
    const { chromeMock } = createChromeMock();
    const fetchMock = jest.fn((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }));
    const syncModule = loadSyncModule(chromeMock, { fetch: fetchMock });

    const request = syncModule.fetchGistWithTimeout('https://api.github.com/user', {}, null, 25);
    const assertion = expect(request).rejects.toMatchObject({ code: 'request_timeout' });
    jest.advanceTimersByTime(25);
    await assertion;
    jest.useRealTimers();
  });

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

  test('removes previously observed batch chunks after a successful write', async () => {
    const { chromeMock, items } = createChromeMock();
    const syncModule = loadSyncModule(chromeMock);
    await syncModule.nativePush({ previous: 'x'.repeat(18000) });
    const previousPrefix = items.meta.prefix;
    const previousKeys = Object.keys(items).filter(key => key.startsWith(previousPrefix));
    await syncModule.nativePush({ replacement: true });
    expect(chromeMock.storage.sync.remove).toHaveBeenCalledWith(previousKeys, expect.any(Function));
    await expect(syncModule.nativePull()).resolves.toEqual({ replacement: true });
  });

  test('delayed cleanup cannot remove another upload batch', async () => {
    const { chromeMock, items } = createChromeMock();
    const a = loadSyncModule(chromeMock);
    const b = loadSyncModule(chromeMock);
    await a.nativePush({ previous: 'x'.repeat(18000) });
    const originalSet = chromeMock.storage.sync.set.getMockImplementation();
    let release;
    let started;
    const firstWritten = new Promise(resolve => { started = resolve; });
    chromeMock.storage.sync.set.mockImplementationOnce((values, callback) => {
      originalSet(values, () => { release = callback; started(); });
    });
    const pending = a.nativePush({ small: true });
    await firstWritten;
    const latest = { large: 'y'.repeat(25000) };
    await b.nativePush(latest);
    release();
    await pending;
    expect(items.meta.version).toBe(5);
    await expect(a.nativePull()).resolves.toEqual(latest);
  });

  test('reads published version four sync data', async () => {
    const { chromeMock, items } = createChromeMock();
    const module = loadSyncModule(chromeMock);
    const data = JSON.stringify({ legacy: true });
    items.meta = { version: 4, chunks: { start: 0, end: 0 }, checksum: module.calculateChecksum(data) };
    items['data.0'] = data;
    await expect(module.nativePull()).resolves.toEqual({ legacy: true });
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
