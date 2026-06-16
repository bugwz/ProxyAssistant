const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadWorkerContext(overrides = {}) {
  const workerPath = path.join(__dirname, '../../src/js/worker.js');
  const source = fs.readFileSync(workerPath, 'utf8');

  const storageGet = jest.fn((keys, callback) => {
    callback({ state: { proxy: { mode: 'disabled', current: null } }, config: {} });
  });
  const storageSet = jest.fn((payload, callback) => {
    if (callback) callback();
  });
  const sessionSet = jest.fn();
  const proxySettingsGet = jest.fn((options, callback) => {
    callback({
      value: { mode: 'system' },
      levelOfControl: 'controlled_by_this_extension'
    });
  });
  const proxySettingsSet = jest.fn((config, callback) => {
    if (callback) callback();
  });
  const onMessage = {
    addListener: jest.fn()
  };

  const context = {
    console,
    setTimeout,
    clearTimeout,
    URL,
    fetch: jest.fn(() => Promise.resolve()),
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
    btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
    chrome: {
      runtime: {
        lastError: null,
        id: 'test-extension',
        onInstalled: { addListener: jest.fn() },
        onStartup: { addListener: jest.fn() },
        onMessage,
        onConnect: { addListener: jest.fn() },
        sendMessage: jest.fn()
      },
      storage: {
        local: {
          get: storageGet,
          set: storageSet
        },
        session: {
          set: sessionSet,
          get: jest.fn((keys, callback) => callback({}))
        },
        onChanged: { addListener: jest.fn() }
      },
      proxy: {
        settings: {
          get: proxySettingsGet,
          set: proxySettingsSet
        }
      },
      webRequest: {
        onAuthRequired: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      action: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn()
      },
      alarms: {
        create: jest.fn(),
        clear: jest.fn(),
        getAll: jest.fn((callback) => callback([])),
        onAlarm: { addListener: jest.fn() }
      },
      tabs: {
        query: jest.fn((query, callback) => callback([]))
      }
    },
    browser: undefined,
    self: {}
  };

  if (overrides.chrome) {
    context.chrome = {
      ...context.chrome,
      ...overrides.chrome,
      runtime: {
        ...context.chrome.runtime,
        ...(overrides.chrome.runtime || {})
      },
      storage: {
        ...context.chrome.storage,
        ...(overrides.chrome.storage || {}),
        local: {
          ...context.chrome.storage.local,
          ...((overrides.chrome.storage && overrides.chrome.storage.local) || {})
        },
        session: {
          ...context.chrome.storage.session,
          ...((overrides.chrome.storage && overrides.chrome.storage.session) || {})
        },
        onChanged: {
          ...context.chrome.storage.onChanged,
          ...((overrides.chrome.storage && overrides.chrome.storage.onChanged) || {})
        }
      },
      proxy: {
        ...context.chrome.proxy,
        ...(overrides.chrome.proxy || {}),
        settings: {
          ...context.chrome.proxy.settings,
          ...((overrides.chrome.proxy && overrides.chrome.proxy.settings) || {})
        }
      },
      webRequest: {
        ...context.chrome.webRequest,
        ...(overrides.chrome.webRequest || {}),
        onAuthRequired: {
          ...context.chrome.webRequest.onAuthRequired,
          ...((overrides.chrome.webRequest && overrides.chrome.webRequest.onAuthRequired) || {})
        }
      }
    };
  }

  vm.createContext(context);
  vm.runInContext(source, context);
  context.__onMessageListener = onMessage.addListener.mock.calls[0][0];
  return context;
}

describe('Worker applyProxy async handling', () => {
  test('responds to applyProxy only after async apply completes', async () => {
    const context = loadWorkerContext();
    const response = { success: true };
    const sendResponse = jest.fn();
    let resolveApply;

    context.applyProxySettings = jest.fn(() => new Promise((resolve) => {
      resolveApply = () => resolve(response);
    }));

    const returnValue = context.__onMessageListener(
      { action: 'applyProxy', proxyInfo: { ip: '127.0.0.1', port: '8080' } },
      {},
      sendResponse
    );

    expect(returnValue).toBe(true);
    expect(sendResponse).not.toHaveBeenCalled();

    resolveApply();
    await Promise.resolve();

    expect(sendResponse).toHaveBeenCalledWith(response);
  });

  test('waits for proxy.settings.set before persisting manual state', async () => {
    let applySettingsCallback = null;
    const storageSet = jest.fn((payload, callback) => {
      if (callback) callback();
    });
    const context = loadWorkerContext();
    context.chrome.storage.local.set = storageSet;
    context.chrome.proxy.settings.get = jest.fn((options, callback) => {
      callback({
        value: { mode: 'system' },
        levelOfControl: 'controlled_by_this_extension'
      });
    });
    context.chrome.proxy.settings.set = jest.fn((config, callback) => {
      applySettingsCallback = callback;
    });

    const applyPromise = context.applyManualProxySettings({
      name: 'Proxy A',
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080'
    });

    await Promise.resolve();

    expect(storageSet).not.toHaveBeenCalled();
    expect(typeof applySettingsCallback).toBe('function');

    applySettingsCallback();
    const result = await applyPromise;

    expect(result).toEqual({ success: true });
    expect(storageSet).toHaveBeenCalledWith(
      {
        state: {
          proxy: {
            mode: 'manual',
            current: expect.objectContaining({
              name: 'Proxy A',
              type: 'http',
              ip: '127.0.0.1',
              port: '8080'
            })
          }
        }
      },
      expect.any(Function)
    );
  });

  test('does not persist manual state when another extension controls proxy settings', async () => {
    const storageSet = jest.fn((payload, callback) => {
      if (callback) callback();
    });
    const context = loadWorkerContext();
    context.chrome.storage.local.set = storageSet;
    context.chrome.proxy.settings.get = jest.fn((options, callback) => {
      callback({
        value: { mode: 'system' },
        levelOfControl: 'controlled_by_other_extensions'
      });
    });
    context.chrome.proxy.settings.set = jest.fn();

    const result = await context.applyManualProxySettings({
      name: 'Proxy A',
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080'
    });

    expect(result.success).toBe(false);
    expect(storageSet).not.toHaveBeenCalled();
  });
});
