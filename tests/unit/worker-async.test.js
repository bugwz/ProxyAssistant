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
  test('stores bounded redacted runtime logs and exposes message actions', async () => {
    const storedValues = {};
    const context = loadWorkerContext({
      chrome: {
        storage: {
          local: {
            get: jest.fn((keys, callback) => {
              const result = {};
              keys.forEach(key => { result[key] = storedValues[key]; });
              callback(result);
            }),
            set: jest.fn((values, callback) => {
              Object.assign(storedValues, values);
              if (callback) callback();
            })
          }
        }
      }
    });

    for (let index = 0; index < 205; index += 1) {
      await context.appendRuntimeLog('error', 'proxy', 'proxy_apply_failed', {
        index,
        password: 'private-password',
        nested: { token: 'private-token' }
      });
    }

    const logs = JSON.parse(JSON.stringify(await context.getRuntimeLogs()));
    expect(logs).toHaveLength(200);
    expect(logs[0].details.index).toBe(5);
    expect(logs[199].details.index).toBe(204);
    expect(logs[199].details.password).toBe('[redacted]');
    expect(logs[199].details.nested.token).toBe('[redacted]');

    const getResponse = await new Promise(resolve => {
      context.__onMessageListener({ action: 'getRuntimeLogs' }, {}, resolve);
    });
    expect(getResponse.success).toBe(true);
    expect(getResponse.logs).toHaveLength(200);

    const clearResponse = await new Promise(resolve => {
      context.__onMessageListener({ action: 'clearRuntimeLogs' }, {}, resolve);
    });
    expect(clearResponse).toEqual({ success: true });
    expect(storedValues.runtime_logs).toEqual([]);
  });

  test('audits configuration writes by entity and ignores navigation-only state', async () => {
    const storedValues = {};
    const context = loadWorkerContext({
      chrome: {
        storage: {
          local: {
            get: jest.fn((keys, callback) => {
              const result = {};
              keys.forEach(key => { result[key] = storedValues[key]; });
              callback(result);
            }),
            set: jest.fn((values, callback) => {
              Object.assign(storedValues, values);
              if (callback) callback();
            })
          }
        }
      }
    });
    const oldConfig = {
      system: { theme_mode: 'light' },
      scenarios: {
        current: 'scenario-1',
        lists: [{
          id: 'scenario-1',
          name: 'Default',
          proxies: [
            { id: 'proxy-1', name: 'One', ip: '127.0.0.1', port: 8080 },
            { id: 'proxy-2', name: 'Two', ip: '127.0.0.2', port: 8080 }
          ]
        }]
      },
      subscriptions: [{ id: 'sub-1', name: 'Rules', order: 0, enabled: true }]
    };
    const newConfig = JSON.parse(JSON.stringify(oldConfig));
    newConfig.system.theme_mode = 'dark';
    newConfig.scenarios.lists[0].proxies.reverse();
    newConfig.scenarios.lists[0].proxies[0].name = 'Two renamed';
    newConfig.subscriptions.push({ id: 'sub-2', name: 'Extra rules', order: 1, enabled: true });

    context.auditRuntimeConfigChanges(oldConfig, newConfig);
    await context.getRuntimeLogs();

    const events = storedValues.runtime_logs.map(log => log.event);
    expect(events).toEqual(expect.arrayContaining([
      'proxy_updated',
      'proxy_reordered',
      'subscription_added',
      'system_settings_updated'
    ]));
    expect(events).not.toContain('navigation_changed');

    await context.clearRuntimeLogs();
    context.auditRuntimeConfigChanges(
      { version: 5, updated_at: 'old' },
      { version: 6, updated_at: 'new' }
    );
    await context.getRuntimeLogs();
    expect(storedValues.runtime_logs.map(log => log.event)).toEqual(['configuration_updated']);
  });

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

  test('schedules refreshes from the shared subscription collection', () => {
    const context = loadWorkerContext();
    context.chrome.alarms.create.mockClear();

    context.scheduleAllBackgroundRefreshes({
      subscriptions: [{
        id: 'subscription-1',
        enabled: true,
        current: 'autoproxy',
        lists: {
          autoproxy: {
            url: 'https://example.com/rules.txt',
            refresh_interval: 360
          }
        }
      }]
    });

    expect(context.chrome.alarms.create).toHaveBeenCalledWith(
      'subscription___subscription-1___autoproxy',
      { delayInMinutes: 360, periodInMinutes: 360 }
    );
  });

  test('schedules native and Gist cloud sync independently', () => {
    const context = loadWorkerContext();
    context.chrome.alarms.create.mockClear();
    context.chrome.alarms.clear.mockClear();

    context.scheduleCloudSync({
      system: {
        sync: {
          native: { auto_mode: 'pull', interval_minutes: 30 },
          gist: { auto_mode: 'push', interval_minutes: 360 }
        }
      }
    });

    expect(context.chrome.alarms.create).toHaveBeenCalledWith('cloud-sync-schedule-native', {
      delayInMinutes: 30,
      periodInMinutes: 30
    });
    expect(context.chrome.alarms.create).toHaveBeenCalledWith('cloud-sync-schedule-gist', {
      delayInMinutes: 360,
      periodInMinutes: 360
    });

    context.chrome.alarms.create.mockClear();
    context.scheduleCloudSync({
      system: { sync: { type: 'gist', auto_mode: 'pull', interval_minutes: 30, gist: {} } }
    });
    expect(context.chrome.alarms.create).toHaveBeenCalledWith('cloud-sync-schedule-gist', {
      delayInMinutes: 30,
      periodInMinutes: 30
    });

    context.scheduleCloudSync({
      system: { sync: { native: { auto_mode: 'off' }, gist: { auto_mode: 'off' } } }
    });
    expect(context.chrome.alarms.clear).toHaveBeenCalledWith('cloud-sync-schedule-native');
    expect(context.chrome.alarms.clear).toHaveBeenCalledWith('cloud-sync-schedule-gist');
  });

  test('stores the configuration update time inside every background config write', async () => {
    const context = loadWorkerContext();
    await context.setStorageValues({ config: { version: 5 } });

    const payload = context.chrome.storage.local.set.mock.calls.at(-1)[0];
    expect(payload.config.updated_at).toEqual(expect.any(String));
    expect(payload.config_updated_at).toBe(payload.config.updated_at);
  });

  test('applies configuration file rules to scheduled cloud push payloads', () => {
    const context = loadWorkerContext();
    const config = {
      version: 5,
      system: {
        app_language: 'zh-CN',
        theme_mode: 'dark',
        custom_theme: {
          name: 'Ocean',
          base: 'dark',
          colors: { accent: '#506070' }
        },
        night_mode_start: '21:00',
        night_mode_end: '07:00',
        sync: {
          gist: { token: 'local-secret', filename: 'shared.json' }
        }
      },
      scenarios: {
        current: 'scenario-a',
        lists: [{
          id: 'scenario-a',
          name: 'Scenario A',
          proxies: [{
            id: 'proxy-a',
            name: 'Proxy A',
            enabled: true,
            ip: '127.0.0.1',
            port: '8080',
            is_new: true
          }]
        }]
      },
      subscriptions: [{
        id: 'subscription-a',
        name: 'Rules',
        current: 'autoproxy',
        lists: {
          autoproxy: {
            url: 'https://example.com/rules.txt',
            content: 'downloaded rules',
            last_fetch_time: 123
          }
        }
      }]
    };

    const compact = context.buildCloudSyncPayload(config, {
      includeSubscriptions: true,
      includeSubscriptionCache: false
    });
    const complete = context.buildCloudSyncPayload(config, {
      includeSubscriptions: true,
      includeSubscriptionCache: true
    });
    const withoutSubscriptions = context.buildCloudSyncPayload(config, {
      includeSubscriptions: false
    });

    expect(compact.system).toEqual({
      language: 'zh-CN',
      theme: {
        mode: 'dark',
        custom: {
          name: 'Ocean',
          base: 'dark',
          colors: { accent: '#506070' }
        },
        automation: { night: { start: '21:00', end: '07:00' } }
      }
    });
    expect(Object.keys(compact)).toEqual([
      'version',
      'proxies',
      'scenarios',
      'subscriptions',
      'system',
      'updated_at'
    ]);
    expect(compact.proxies[0]).not.toHaveProperty('is_new');
    expect(compact.proxies[0]).toMatchObject({
      id: 'proxy-a',
      scenarioId: 'scenario-a',
      order: 0
    });
    expect(compact.subscriptions[0]).not.toHaveProperty('cache');
    expect(complete.subscriptions[0].cache).toEqual({
      content: 'downloaded rules',
      last_fetch_time: 123
    });
    expect(withoutSubscriptions).not.toHaveProperty('subscriptions');
  });

  test('scheduled pull replaces local configuration while preserving local sync access settings', async () => {
    const localConfig = {
      version: 5,
      system: {
        theme_mode: 'light',
        sync: {
          native: { auto_mode: 'pull', interval_minutes: 30 },
          gist: {
            token: 'local-secret',
            filename: 'local.json',
            gist_id: 'local-id',
            auto_mode: 'push',
            interval_minutes: 1440
          }
        }
      },
      scenarios: { current: 'local', lists: [{ id: 'local', proxies: [] }] },
      subscriptions: [{ id: 'local-subscription' }]
    };
    const remoteConfig = {
      version: 5,
      system: {
        language: 'en',
        theme: {
          mode: 'dark',
          automation: { night: { start: '21:00', end: '07:00' } }
        }
      },
      proxies: [{
        id: 'remote-proxy',
        name: 'Remote Proxy',
        scenarioId: 'remote',
        order: 0
      }],
      scenarios: {
        current: 'remote',
        lists: [{ id: 'remote', name: 'Remote', order: 0 }]
      },
      subscriptions: [{
        id: 'remote-subscription',
        name: 'Remote Rules',
        enabled: true,
        order: 0,
        type: 'autoproxy',
        url: 'https://example.com/rules.txt',
        cache: { content: 'remote rules' }
      }]
    };
    const context = loadWorkerContext();
    const remoteJson = JSON.stringify(remoteConfig);
    const storageSet = jest.fn((payload, callback) => callback && callback());
    context.chrome.storage.local.get = jest.fn((keys, callback) => callback({ config: localConfig }));
    context.chrome.storage.local.set = storageSet;
    context.chrome.storage.sync = {
      get: jest.fn((keys, callback) => {
        if (keys === 'meta') {
          callback({
            meta: {
              chunks: { start: 0, end: 0 },
              checksum: context.calculateCloudSyncChecksum(remoteJson)
            }
          });
        } else {
          callback({ 'data.0': remoteJson });
        }
      })
    };

    await expect(context.runScheduledCloudSync()).resolves.toBe(true);

    const savedConfig = storageSet.mock.calls.at(-1)[0].config;
    expect(savedConfig.system.theme_mode).toBe('dark');
    expect(savedConfig.system.app_language).toBe('en');
    expect(savedConfig.scenarios.lists[0].proxies).toEqual([{
      id: 'remote-proxy',
      name: 'Remote Proxy'
    }]);
    expect(savedConfig.subscriptions[0]).toMatchObject({
      id: 'remote-subscription',
      current: 'autoproxy',
      lists: {
        autoproxy: {
          url: 'https://example.com/rules.txt',
          content: 'remote rules'
        }
      }
    });
    expect(savedConfig.system.sync).toMatchObject({
      native: {
        auto_mode: 'pull',
        interval_minutes: 30,
        last_sync_direction: 'pull'
      },
      gist: {
        token: 'local-secret',
        filename: 'local.json',
        gist_id: 'local-id',
        auto_mode: 'push',
        interval_minutes: 1440
      }
    });
    expect(savedConfig.system.sync.native.last_sync_at).toEqual(expect.any(String));
    expect(savedConfig.updated_at).toEqual(expect.any(String));
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

  test('matches daytime and overnight scenario schedules', () => {
    const context = loadWorkerContext();
    const workRule = { type: 'time', weekdays: [1], start: '09:00', end: '18:00' };
    const nightRule = { type: 'time', weekdays: [1], start: '22:00', end: '06:00' };

    expect(context.isTimeRuleActive(workRule, new Date('2026-08-17T10:00:00'))).toBe(true);
    expect(context.isTimeRuleActive(workRule, new Date('2026-08-17T18:00:00'))).toBe(false);
    expect(context.isTimeRuleActive(nightRule, new Date('2026-08-17T23:00:00'))).toBe(true);
    expect(context.isTimeRuleActive(nightRule, new Date('2026-08-18T05:59:00'))).toBe(true);
    expect(context.isTimeRuleActive(nightRule, new Date('2026-08-18T06:00:00'))).toBe(false);
  });

  test('selects the first matching scenario and calculates its next boundary', () => {
    const context = loadWorkerContext();
    const config = {
      scenarios: {
        current: 'scenario-home',
        lists: [
          {
            id: 'scenario-low',
            automation: {
              enabled: true,
              rules: [{ type: 'time', operator: 'if', weekdays: [1], start: '09:00', end: '18:00' }]
            }
          },
          {
            id: 'scenario-high',
            automation: {
              enabled: true,
              rules: [{ type: 'time', operator: 'if', weekdays: [1], start: '08:00', end: '17:00' }]
            }
          }
        ]
      }
    };
    const now = new Date('2026-08-17T10:00:00');

    expect(context.findScheduledScenario(config, now).id).toBe('scenario-low');
    expect(new Date(context.getNextScenarioAutomationBoundary(config, now)).toISOString())
      .toBe(new Date('2026-08-17T17:00:00').toISOString());
  });

  test('combines multiple automation conditions with OR and AND', () => {
    const context = loadWorkerContext();
    const mondayMorning = { type: 'time', operator: 'if', weekdays: [1], start: '09:00', end: '12:00' };
    const weekdays = { type: 'time', operator: 'and', weekdays: [1, 2, 3, 4, 5], start: '08:00', end: '18:00' };
    const now = new Date('2026-08-17T10:00:00');

    expect(context.isScenarioAutomationActive({
      automation: { rules: [mondayMorning, weekdays] }
    }, now)).toBe(true);
    expect(context.isScenarioAutomationActive({
      automation: {
        rules: [mondayMorning, { type: 'time', operator: 'and', weekdays: [0], start: '09:00', end: '12:00' }]
      }
    }, now)).toBe(false);
    expect(context.isScenarioAutomationActive({
      automation: {
        rules: [mondayMorning, { type: 'time', operator: 'or', weekdays: [0], start: '09:00', end: '12:00' }]
      }
    }, now)).toBe(true);
  });

  test('scheduled activation applies the configured default proxy before changing scenario', async () => {
    const context = loadWorkerContext();
    const defaultProxy = {
      id: 'proxy-work',
      name: 'Work Proxy',
      protocol: 'http',
      ip: '10.0.0.2',
      port: '8080',
      enabled: true
    };
    let stored = {
      config: {
        scenarios: {
          current: 'scenario-home',
          lists: [
            { id: 'scenario-home', proxies: [] },
            { id: 'scenario-work', defaultProxyId: defaultProxy.id, proxies: [defaultProxy] }
          ]
        }
      },
      state: { proxy: { mode: 'disabled', current: null } }
    };

    context.chrome.storage.local.get = jest.fn((keys, callback) => callback(stored));
    context.chrome.storage.local.set = jest.fn((payload, callback) => {
      stored = { ...stored, ...payload };
      if (callback) callback();
    });
    context.applyProxySettings = jest.fn(() => Promise.resolve({ success: true }));

    const result = await context.activateScenario('scenario-work', 'automation');

    expect(result).toEqual(expect.objectContaining({
      success: true,
      scenarioId: 'scenario-work',
      mode: 'manual',
      currentProxy: defaultProxy
    }));
    expect(context.applyProxySettings).toHaveBeenCalledWith(defaultProxy, 'manual');
    expect(stored.config.scenarios.current).toBe('scenario-work');
  });

  test('restores the target scenario last-used proxy when no fixed default is selected', async () => {
    const context = loadWorkerContext();
    const homeProxy = { id: 'proxy-home', name: 'Home', protocol: 'http', ip: '10.0.0.1', port: '8080', enabled: true };
    const firstWorkProxy = { id: 'proxy-work-1', name: 'Work 1', protocol: 'http', ip: '10.0.0.2', port: '8080', enabled: true };
    const lastWorkProxy = { id: 'proxy-work-2', name: 'Work 2', protocol: 'http', ip: '10.0.0.3', port: '8080', enabled: true };
    let stored = {
      config: {
        scenarios: {
          current: 'scenario-home',
          lists: [
            { id: 'scenario-home', proxies: [homeProxy] },
            { id: 'scenario-work', defaultProxyId: null, lastProxyId: lastWorkProxy.id, proxies: [firstWorkProxy, lastWorkProxy] }
          ]
        }
      },
      state: { proxy: { mode: 'manual', current: homeProxy } }
    };

    context.chrome.storage.local.get = jest.fn((keys, callback) => callback(stored));
    context.chrome.storage.local.set = jest.fn((payload, callback) => {
      stored = { ...stored, ...payload };
      if (callback) callback();
    });
    context.applyProxySettings = jest.fn(() => Promise.resolve({ success: true }));

    const result = await context.activateScenario('scenario-work', 'manual');

    expect(context.applyProxySettings).toHaveBeenCalledWith(lastWorkProxy, 'manual');
    expect(result.currentProxy).toEqual(lastWorkProxy);
    expect(stored.config.scenarios.lists[0].lastProxyId).toBe(homeProxy.id);
    expect(stored.config.scenarios.lists[1].defaultProxyId).toBeNull();
  });
});
