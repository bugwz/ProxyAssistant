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
        get: jest.fn((name, callback) => callback(null)),
        getAll: jest.fn((callback) => callback([])),
        onAlarm: { addListener: jest.fn() }
      },
      tabs: {
        query: jest.fn((query, callback) => callback([]))
      }
    },
    browser: overrides.browser || undefined,
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

  test('applies an explicitly requested proxy mode before responding', async () => {
    const context = loadWorkerContext();
    const response = { success: true };
    const proxyInfo = { ip: '127.0.0.1', port: '8080' };
    const sendResponse = jest.fn();
    let resolveApply;

    context.applyProxySettings = jest.fn(() => new Promise((resolve) => {
      resolveApply = () => resolve(response);
    }));

    const returnValue = context.__onMessageListener(
      { action: 'setProxyMode', mode: 'manual', proxyInfo },
      {},
      sendResponse
    );

    expect(returnValue).toBe(true);
    expect(context.applyProxySettings).toHaveBeenCalledWith(proxyInfo, 'manual');
    expect(sendResponse).not.toHaveBeenCalled();

    resolveApply();
    await Promise.resolve();

    expect(sendResponse).toHaveBeenCalledWith(response);
  });

  test('rejects invalid proxy tests without replacing active authentication', async () => {
    const context = loadWorkerContext();
    const existingAuth = { username: 'existing-user', password: 'existing-password' };
    const initialAuthCallback = jest.fn();

    context.chrome.storage.session.get.mockImplementation((keys, callback) => {
      callback({ currentProxyAuth: existingAuth });
    });
    context.handleAuthRequest(
      { isProxy: true, url: 'https://example.com' },
      initialAuthCallback
    );
    expect(initialAuthCallback).toHaveBeenCalledWith({ authCredentials: existingAuth });

    context.chrome.storage.session.set.mockClear();
    context.chrome.webRequest.onAuthRequired.addListener.mockClear();
    context.chrome.webRequest.onAuthRequired.removeListener.mockClear();
    context.chrome.proxy.settings.set.mockClear();

    const sendResponse = jest.fn();
    await context.testProxyConnection({
      ip: 'invalid host',
      port: '8080',
      username: 'test-user',
      password: 'test-password'
    }, sendResponse);

    const authCallback = jest.fn();
    context.handleAuthRequest(
      { isProxy: true, url: 'https://example.com' },
      authCallback
    );

    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid proxy configuration: Invalid IP address or hostname format'
    });
    expect(authCallback).toHaveBeenCalledWith({ authCredentials: existingAuth });
    expect(context.chrome.storage.session.set).not.toHaveBeenCalled();
    expect(context.chrome.webRequest.onAuthRequired.addListener).not.toHaveBeenCalled();
    expect(context.chrome.webRequest.onAuthRequired.removeListener).not.toHaveBeenCalled();
    expect(context.chrome.proxy.settings.set).not.toHaveBeenCalled();
  });

  test('removes stale and legacy subscription alarms after config changes', () => {
    const context = loadWorkerContext();
    context.chrome.alarms.clear.mockClear();
    context.chrome.alarms.getAll.mockImplementation((callback) => callback([
      { name: 'subscription___deleted-proxy___pac' },
      { name: 'subscription_deleted-proxy_pac' },
      { name: 'unrelated_alarm' }
    ]));

    context.scheduleAllBackgroundRefreshes({ scenarios: { lists: [] } });

    expect(context.chrome.alarms.clear).toHaveBeenCalledWith('subscription___deleted-proxy___pac');
    expect(context.chrome.alarms.clear).toHaveBeenCalledWith('subscription_deleted-proxy_pac');
    expect(context.chrome.alarms.clear).not.toHaveBeenCalledWith('unrelated_alarm');
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

  test('handles Firefox special URLs without throwing', async () => {
    const context = loadWorkerContext({
      browser: {
        runtime: { getBrowserInfo: jest.fn() },
        proxy: {
          settings: { clear: jest.fn() },
          onRequest: {
            addListener: jest.fn(),
            hasListener: jest.fn(() => false)
          }
        }
      }
    });

    await context.applyProxySettings({
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080',
      bypass_rules: 'example.com'
    }, 'manual');

    await expect(context.handleFirefoxRequest({ url: 'about:config' }))
      .resolves.toBe(null);

    await context.applyProxySettings(null, 'auto');

    await expect(context.handleFirefoxRequest({ url: 'moz-extension://extension-id/page.html' }))
      .resolves.toEqual({ type: 'direct' });
  });
});
