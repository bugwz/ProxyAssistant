const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../../src/js/utils.js');
const configPath = path.join(__dirname, '../../src/js/config.js');

function setupModules(config) {
  document.documentElement.innerHTML = '<html><head></head><body></body></html>';

  window.I18n = {
    t: jest.fn((key) => key),
    getCurrentLanguage: jest.fn(() => 'en'),
    setLanguage: jest.fn()
  };
  window.ThemeModule = {
    getThemeMode: jest.fn(() => 'light'),
    getNightModeTimes: jest.fn(() => ({ start: '22:00', end: '06:00' })),
    setThemeMode: jest.fn(),
    setNightModeTimes: jest.fn(),
    updateThemeUI: jest.fn()
  };
  window.SyncModule = {
    getSyncConfig: jest.fn(() => ({
      native: { auto_mode: 'pull', interval_minutes: 30 },
      gist: {
        token: 'local-secret',
        filename: 'proxy_assistant_config.json',
        gist_id: 'local-gist',
        auto_mode: 'off',
        interval_minutes: 360
      }
    })),
    setSyncConfig: jest.fn(),
    updateSyncUI: jest.fn()
  };
  window.StorageModule = {
    getConfig: jest.fn(() => config),
    setConfig: jest.fn(),
    save: jest.fn(() => Promise.resolve())
  };
  window.$ = jest.fn(() => ({
    find: jest.fn().mockReturnThis(),
    html: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    fadeIn: jest.fn().mockReturnThis(),
    delay: jest.fn().mockReturnThis(),
    fadeOut: jest.fn().mockReturnThis()
  }));
  window.MainIcons = { render: jest.fn(() => '') };

  window.eval(fs.readFileSync(utilsPath, 'utf8'));
  window.eval(fs.readFileSync(configPath, 'utf8'));

  return {
    UtilsModule: window.UtilsModule,
    ConfigModule: window.ConfigModule
  };
}

describe('proxy color configuration', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete window.I18n;
    delete window.ThemeModule;
    delete window.SyncModule;
    delete window.StorageModule;
    delete window.UtilsModule;
    delete window.ConfigModule;
    delete window.$;
    delete window.MainIcons;
  });

  test('normalizes only colors in #RRGGBB format', () => {
    const { UtilsModule } = setupModules(null);

    expect(UtilsModule.normalizeProxyColor('#ff00aa')).toBe('#FF00AA');
    expect(UtilsModule.normalizeProxyColor('FF00AA')).toBe('');
    expect(UtilsModule.normalizeProxyColor('#FFF')).toBe('');
    expect(UtilsModule.normalizeProxyColor('#FF00AAGG')).toBe('');
    expect(UtilsModule.normalizeProxyColor('')).toBe('');
  });

  test('normalizes imported colors and clears invalid values', () => {
    const config = {
      version: 4,
      system: {},
      scenarios: {
        current: 'scenario-a',
        lists: [{
          id: 'scenario-a',
          name: 'Scenario A',
          proxies: [
            { id: 'proxy-a', color: '#ff0000' },
            { id: 'proxy-b', color: '00FF00' },
            { id: 'proxy-c' }
          ]
        }]
      }
    };
    const { ConfigModule } = setupModules(config);

    const migrated = ConfigModule.migrateConfig(config);

    expect(migrated.scenarios.lists[0].proxies.map((proxy) => proxy.color)).toEqual([
      '#FF0000',
      '',
      ''
    ]);
  });

  test('extracts embedded proxy subscriptions into the shared collection', () => {
    const config = {
      version: 4,
      system: {},
      scenarios: {
        current: 'scenario-a',
        lists: [{
          id: 'scenario-a',
          name: 'Scenario A',
          proxies: [{
            id: 'proxy-a',
            name: 'Proxy A',
            subscription: {
              enabled: true,
              current: 'autoproxy',
              lists: { autoproxy: { url: 'https://example.com/rules.txt' } }
            }
          }]
        }]
      }
    };
    const { ConfigModule } = setupModules(config);

    const migrated = ConfigModule.migrateConfig(config);
    const proxy = migrated.scenarios.lists[0].proxies[0];

    expect(migrated.subscriptions).toHaveLength(1);
    expect(migrated.subscriptions[0].id).toMatch(/^subscription_\d{14}$/);
    expect(proxy.subscription_ids).toEqual([migrated.subscriptions[0].id]);
  });

  test('generates timestamp IDs for proxies, scenarios, and subscriptions', () => {
    const { ConfigModule } = setupModules(null);
    const proxyId = ConfigModule.generateProxyId();
    const scenarioId = ConfigModule.generateScenarioId();
    const firstSubscriptionId = ConfigModule.generateSubscriptionId();
    const secondSubscriptionId = ConfigModule.generateSubscriptionId();

    expect(proxyId).toMatch(/^proxy_\d{14}$/);
    expect(scenarioId).toMatch(/^scenario_\d{14}$/);
    expect(firstSubscriptionId).toMatch(/^subscription_\d{14}$/);
    expect(secondSubscriptionId).toMatch(/^subscription_\d{14}$/);
    expect(secondSubscriptionId).not.toBe(firstSubscriptionId);
  });

  test('does not consume scenario IDs while normalizing an existing configuration', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 20, 1, 2, 3));
    const config = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: {
        current: 'scenario_20250213134422',
        lists: [{ id: 'scenario_20250213134422', name: 'Default', proxies: [] }]
      },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);

    ConfigModule.migrateConfig(config);
    ConfigModule.migrateConfig(config);

    expect(ConfigModule.getDefaultConfig().scenarios.current).toBe('scenario_20260820010203');
    expect(config.scenarios.current).toBe('scenario_20250213134422');
  });

  test('uses the simplified prefix for exported configuration files', () => {
    const { ConfigModule } = setupModules(null);
    window.StorageModule.getConfig.mockReturnValue(ConfigModule.getDefaultConfig());
    const originalCreateElement = document.createElement.bind(document);
    let downloadAnchor;

    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 20, 1, 2, 3));
    jest.spyOn(document, 'createElement').mockImplementation(tagName => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        downloadAnchor = element;
        element.click = jest.fn();
        element.remove = jest.fn();
      }
      return element;
    });

    ConfigModule.exportConfig();

    expect(downloadAnchor.getAttribute('download')).toBe('proxyassistant_20260820010203.json');
    expect(downloadAnchor.click).toHaveBeenCalledTimes(1);
  });

  test('migrates existing entity IDs and keeps every reference connected', () => {
    const config = {
      version: 5,
      system: {},
      scenarios: {
        current: 'scenario-old',
        lists: [{
          id: 'scenario-old',
          name: 'Default',
          defaultProxyId: 'proxy-old',
          lastProxyId: 'proxy-old',
          proxies: [{
            id: 'proxy-old',
            name: 'Proxy',
            enabled: true,
            ip: '127.0.0.1',
            port: '8080',
            subscription_ids: ['subscription-old']
          }]
        }]
      },
      subscriptions: [{
        id: 'subscription-old',
        name: 'Rules',
        current: 'autoproxy',
        lists: { autoproxy: { url: 'https://example.com/rules.txt' } }
      }]
    };
    const { ConfigModule } = setupModules(config);

    const migrated = ConfigModule.migrateConfig(config);
    const scenario = migrated.scenarios.lists[0];
    const proxy = scenario.proxies[0];
    const subscription = migrated.subscriptions[0];

    expect(scenario.id).toMatch(/^scenario_\d{14}$/);
    expect(proxy.id).toMatch(/^proxy_\d{14}$/);
    expect(subscription.id).toMatch(/^subscription_\d{14}$/);
    expect(migrated.scenarios.current).toBe(scenario.id);
    expect(scenario.defaultProxyId).toBe(proxy.id);
    expect(scenario.lastProxyId).toBe(proxy.id);
    expect(proxy.subscription_ids).toEqual([subscription.id]);
  });

  test('migrates the released v4 sync selection into one v5 service schedule', () => {
    const config = {
      version: 4,
      system: {
        sync: {
          type: 'gist',
          auto_mode: 'pull',
          interval_minutes: 30,
          gist: { token: 'legacy-token', filename: 'legacy.json', gist_id: 'legacy-id' }
        }
      },
      scenarios: { current: 'default', lists: [] },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);

    const migrated = ConfigModule.migrateConfig(config);

    expect(migrated.version).toBe(5);
    expect(migrated.system.sync).toMatchObject({
      native: { auto_mode: 'off', interval_minutes: 360 },
      gist: {
        token: 'legacy-token',
        filename: 'legacy.json',
        gist_id: 'legacy-id',
        auto_mode: 'pull',
        interval_minutes: 30
      }
    });
  });

  test('preserves color when building export and sync data', () => {
    const config = {
      version: 4,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: {
        current: 'scenario-a',
        lists: [{
          id: 'scenario-a',
          name: 'Scenario A',
          proxies: [{
            enabled: true,
            id: 'proxy-a',
            name: 'Proxy A',
            color: '#FF0000'
          }]
        }]
      }
    };
    const { ConfigModule } = setupModules(config);

    const exported = ConfigModule.buildConfigData();

    expect(Object.keys(exported)).toEqual([
      'version',
      'scenarios',
      'subscriptions',
      'system',
      'updated_at'
    ]);
    expect(exported.scenarios.lists[0].proxies[0].color).toBe('#FF0000');
    expect(exported.system.sync).toEqual({
      native: { auto_mode: 'pull', interval_minutes: 30 },
      gist: {
        token: '',
        filename: 'proxy_assistant_config.json',
        gist_id: '',
        auto_mode: 'off',
        interval_minutes: 360
      }
    });
    expect(ConfigModule.PROXY_EXPORT_KEYS).toContain('color');
  });

  test('round-trips a custom theme through the v5 system configuration', () => {
    const customTheme = {
      name: 'Ocean',
      base: 'dark',
      colors: {
        background: '#102030',
        surface: '#203040',
        surface_alt: '#304050',
        text: '#F0F1F2',
        muted_text: '#A0A1A2',
        border: '#405060',
        accent: '#506070',
        accent_text: '#FFFFFF',
        input_background: '#607080',
        selection_background: '#708090'
      }
    };
    const config = {
      version: 5,
      system: {
        app_language: 'en',
        theme_mode: 'custom',
        custom_theme: customTheme,
        night_mode_start: '22:00',
        night_mode_end: '06:00'
      },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);
    window.ThemeModule.getThemeMode.mockReturnValue('custom');
    window.ThemeModule.getCustomTheme = jest.fn(() => customTheme);

    const exported = ConfigModule.buildConfigFileData();
    const imported = ConfigModule.migrateConfig(exported);

    expect(exported.system.theme.mode).toBe('custom');
    expect(exported.system.theme.custom).toEqual(customTheme);
    expect(imported.system.theme_mode).toBe('custom');
    expect(imported.system.custom_theme).toEqual(customTheme);
  });

  test('preserves scenario defaults and multi-condition automation', () => {
    const config = {
      version: 4,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: {
        current: 'scenario-a',
        lists: [{
          id: 'scenario-a',
          name: 'Work',
          proxies: [
            { id: 'proxy-disabled', enabled: false, ip: '10.0.0.1', port: '8080' },
            { id: 'proxy-default', enabled: true, ip: '10.0.0.2', port: '8080' }
          ],
          automation: {
            enabled: true,
            rules: [
              { type: 'time', operator: 'if', weekdays: [1, 2, 3, 4, 5], start: '08:30', end: '17:45' },
              { type: 'time', operator: 'and', weekdays: [1], start: '09:00', end: '12:00' }
            ]
          }
        }]
      }
    };
    const { ConfigModule } = setupModules(config);

    const migrated = ConfigModule.migrateConfig(config);
    const exported = ConfigModule.buildConfigData();

    expect(migrated.version).toBe(5);
    expect(migrated.scenarios.lists[0].defaultProxyId).toBeNull();
    expect(exported.scenarios.lists[0]).toEqual(expect.objectContaining({
      defaultProxyId: null,
      lastProxyId: null,
      automation: {
        enabled: true,
        rules: [
          { type: 'time', operator: 'if', weekdays: [1, 2, 3, 4, 5], start: '08:30', end: '17:45' },
          { type: 'time', operator: 'and', weekdays: [1], start: '09:00', end: '12:00' }
        ]
      }
    }));
  });

  test('applies edited configuration while preserving local cloud sync settings', async () => {
    const config = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);
    const edited = {
      version: 5,
      system: {
        language: 'en',
        theme: {
          mode: 'dark',
          automation: {
            night: {
              start: '21:30',
              end: '07:15'
            }
          }
        },
        sync: { native: { auto_mode: 'off' }, gist: { token: 'remote-secret', auto_mode: 'push' } }
      },
      scenarios: { current: 'scenario-b', lists: [] },
      subscriptions: []
    };

    const applied = await ConfigModule.applyConfigData(edited);

    expect(window.StorageModule.setConfig).toHaveBeenCalledWith(applied);
    expect(window.StorageModule.save).toHaveBeenCalledTimes(1);
    expect(applied.system.sync).toEqual({
      native: {
        auto_mode: 'pull',
        interval_minutes: 30,
        last_sync_at: null,
        last_sync_direction: null
      },
      gist: {
        token: 'local-secret',
        filename: 'proxy_assistant_config.json',
        gist_id: 'local-gist',
        auto_mode: 'off',
        interval_minutes: 360,
        last_sync_at: null,
        last_sync_direction: null
      }
    });
    expect(window.ThemeModule.setThemeMode).toHaveBeenCalledWith('dark');
    expect(window.ThemeModule.setNightModeTimes).toHaveBeenCalledWith('21:30', '07:15');
    expect(window.I18n.setLanguage).toHaveBeenCalledWith('en', { persist: false });
  });

  test('round-trips flattened proxies without changing their scenario ID', async () => {
    const config = {
      version: 5,
      updated_at: null,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: {
        current: 'scenario_20260820103413',
        lists: [{
          id: 'scenario_20260820103413',
          name: 'Default',
          proxies: [{
            id: 'proxy_20260820103414',
            name: 'Office',
            enabled: true,
            protocol: 'http',
            ip: '10.0.0.1',
            port: '8080'
          }]
        }]
      },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);
    const editable = ConfigModule.buildEditableConfigData();

    const applied = await ConfigModule.applyConfigData(editable);
    window.StorageModule.getConfig.mockReturnValue(applied);
    const rendered = ConfigModule.buildEditableConfigData();

    expect(rendered.scenarios.current).toBe('scenario_20260820103413');
    expect(rendered.scenarios.lists[0].id).toBe('scenario_20260820103413');
    expect(rendered.proxies).toHaveLength(1);
    expect(rendered.proxies[0]).toEqual(expect.objectContaining({
      id: 'proxy_20260820103414',
      scenarioId: 'scenario_20260820103413',
      name: 'Office',
      ip: '10.0.0.1',
      port: '8080'
    }));
  });

  test('does not save or update metadata when editable content is unchanged', async () => {
    const config = {
      version: 5,
      updated_at: '2026-08-20T02:18:49.092Z',
      system: {
        app_language: 'en',
        theme_mode: 'light',
        night_mode_start: '22:00',
        night_mode_end: '06:00',
        sync: {
          native: {
            auto_mode: 'pull',
            interval_minutes: 30,
            last_sync_at: null,
            last_sync_direction: null
          },
          gist: {
            token: 'local-secret',
            filename: 'proxy_assistant_config.json',
            gist_id: 'local-gist',
            auto_mode: 'off',
            interval_minutes: 360,
            last_sync_at: null,
            last_sync_direction: null
          }
        }
      },
      scenarios: {
        current: 'scenario_20260820103413',
        lists: [{
          id: 'scenario_20260820103413',
          name: 'Default',
          proxies: [{
            id: 'proxy_20260820103414',
            name: 'Office',
            enabled: true,
            protocol: 'http',
            ip: '10.0.0.1',
            port: '8080'
          }]
        }]
      },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);
    const normalized = ConfigModule.migrateConfig(config);
    window.StorageModule.getConfig.mockReturnValue(normalized);
    const editable = ConfigModule.buildEditableConfigData();
    window.StorageModule.setConfig.mockClear();
    window.StorageModule.save.mockClear();

    const applied = await ConfigModule.applyConfigData(editable);

    expect(applied).toBe(normalized);
    expect(applied.updated_at).toBe('2026-08-20T02:18:49.092Z');
    expect(window.StorageModule.setConfig).not.toHaveBeenCalled();
    expect(window.StorageModule.save).not.toHaveBeenCalled();
  });

  test('builds the editable project configuration without local cloud sync settings', () => {
    const config = {
      version: 5,
      updated_at: '2026-08-20T06:30:00.000Z',
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: {
        current: 'scenario-a',
        lists: [
          { id: 'scenario-b', name: 'Work', proxies: [] },
          {
            id: 'scenario-a',
            name: 'Default',
            proxies: [
              { id: 'proxy-b', name: 'B', enabled: true, ip: '10.0.0.2', port: '8080' },
              { id: 'proxy-a', name: 'A', enabled: true, ip: '10.0.0.1', port: '8080' }
            ]
          }
        ]
      },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);

    const editable = ConfigModule.buildEditableConfigData();

    expect(editable.version).toBe(5);
    expect(editable.updated_at).toBe('2026-08-20T06:30:00.000Z');
    expect(Object.keys(editable)).toEqual([
      'version',
      'proxies',
      'scenarios',
      'subscriptions',
      'system',
      'updated_at'
    ]);
    expect(Object.keys(editable.scenarios.lists[0])).toEqual([
      'id',
      'name',
      'order',
      'defaultProxyId',
      'lastProxyId',
      'automation'
    ]);
    expect(editable.scenarios.lists.map(scenario => scenario.id)).toEqual(['scenario-a', 'scenario-b']);
    expect(editable.scenarios.lists.find(scenario => scenario.id === 'scenario-a').order).toBe(1);
    expect(editable.scenarios.lists.find(scenario => scenario.id === 'scenario-b').order).toBe(0);
    expect(editable.proxies.map(proxy => proxy.id)).toEqual(['proxy-a', 'proxy-b']);
    expect(editable.proxies.find(proxy => proxy.id === 'proxy-a')).toEqual(expect.objectContaining({
      scenarioId: 'scenario-a',
      order: 1
    }));
    expect(editable.proxies.find(proxy => proxy.id === 'proxy-b')).toEqual(expect.objectContaining({
      scenarioId: 'scenario-a',
      order: 0
    }));
    editable.proxies.forEach(proxy => {
      const keys = Object.keys(proxy);
      expect(keys.indexOf('order')).toBe(keys.indexOf('name') + 1);
    });
    expect(editable.system).toEqual(expect.objectContaining({
      language: 'en',
      theme: {
        mode: 'light',
        automation: {
          night: {
            start: '22:00',
            end: '06:00'
          }
        }
      }
    }));
    expect(editable.system).not.toHaveProperty('app_language');
    expect(editable.system).not.toHaveProperty('sync');
    expect(editable.system).not.toHaveProperty('theme_mode');
    expect(editable.system).not.toHaveProperty('night_mode_start');
    expect(editable.system).not.toHaveProperty('night_mode_end');
    expect(editable.system.theme).not.toHaveProperty('night_mode_start');
    expect(editable.system.theme).not.toHaveProperty('night_mode_end');
  });

  test('keeps subscription definitions compact unless cached content is requested', () => {
    const config = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: [{
        id: 'subscription-a',
        name: 'Rules',
        enabled: true,
        current: 'autoproxy',
        lists: {
          autoproxy: {
            url: 'https://example.com/rules.txt',
            refresh_interval: 360,
            reverse: false,
            content: 'large downloaded content',
            decoded_content: 'decoded content',
            include_rules: 'example.com',
            bypass_rules: 'localhost',
            include_lines: 1,
            bypass_lines: 1,
            last_fetch_time: 123456
          },
          pac: {
            url: 'https://example.com/unused.pac',
            refresh_interval: 360,
            reverse: false,
            process_rule: '{}'
          }
        }
      }]
    };
    const { ConfigModule } = setupModules(config);

    const compact = ConfigModule.buildConfigFileData({
      includeSubscriptions: true,
      includeSubscriptionCache: false
    });
    const complete = ConfigModule.buildConfigFileData({
      includeSubscriptions: true,
      includeSubscriptionCache: true
    });
    const withoutSubscriptions = ConfigModule.buildConfigFileData({ includeSubscriptions: false });

    expect(compact.subscriptions[0]).toEqual({
      enabled: true,
      id: 'subscription-a',
      name: 'Rules',
      order: 0,
      type: 'autoproxy',
      url: 'https://example.com/rules.txt',
      reverse: false,
      refresh_interval: 360
    });
    expect(Object.keys(compact.subscriptions[0])).toEqual([
      'enabled',
      'id',
      'name',
      'order',
      'type',
      'url',
      'reverse',
      'refresh_interval'
    ]);
    expect(compact.subscriptions[0]).not.toHaveProperty('current');
    expect(compact.subscriptions[0]).not.toHaveProperty('lists');
    expect(complete.subscriptions[0].cache).toEqual({
      content: 'large downloaded content',
      decoded_content: 'decoded content',
      include_rules: 'example.com',
      bypass_rules: 'localhost',
      include_lines: 1,
      bypass_lines: 1,
      last_fetch_time: 123456
    });
    expect(complete.subscriptions[0]).not.toHaveProperty('content');
    expect(withoutSubscriptions).not.toHaveProperty('subscriptions');
  });

  test('sorts subscriptions by ID in the configuration file while preserving display order', () => {
    const config = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: [
        {
          enabled: true,
          id: 'subscription_20250213134423',
          name: 'First in UI',
          order: 0,
          current: 'autoproxy',
          lists: { autoproxy: { url: 'https://example.com/first.txt' } }
        },
        {
          enabled: true,
          id: 'subscription_20250213134422',
          name: 'Second in UI',
          order: 1,
          current: 'autoproxy',
          lists: { autoproxy: { url: 'https://example.com/second.txt' } }
        }
      ]
    };
    const { ConfigModule } = setupModules(config);

    const editable = ConfigModule.buildConfigFileData({ includeSubscriptions: true });

    expect(editable.subscriptions.map(subscription => subscription.id)).toEqual([
      'subscription_20250213134422',
      'subscription_20250213134423'
    ]);
    expect(editable.subscriptions.map(subscription => subscription.order)).toEqual([1, 0]);
  });

  test('expands structured subscription cache data when applying configuration', async () => {
    const config = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);
    const edited = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: [{
        id: 'subscription-a',
        name: 'Rules',
        type: 'autoproxy',
        enabled: true,
        url: 'https://example.com/rules.txt',
        refresh_interval: 360,
        cache: {
          content: 'downloaded content',
          decoded_content: 'decoded content',
          include_rules: 'example.com',
          include_lines: 1,
          last_fetch_time: 123456
        }
      }]
    };

    const applied = await ConfigModule.applyConfigData(edited, {
      preserveOmittedSubscriptionCache: false
    });
    const list = applied.subscriptions[0].lists.autoproxy;

    expect(list.content).toBe('downloaded content');
    expect(list.decoded_content).toBe('decoded content');
    expect(list.include_rules).toBe('example.com');
    expect(list.include_lines).toBe(1);
    expect(list.last_fetch_time).toBe(123456);
    expect(list).not.toHaveProperty('cache');
    expect(applied.subscriptions[0].current).toBe('autoproxy');
  });

  test('restores flattened proxies to their scenario order when applying configuration', async () => {
    const config = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [{ id: 'scenario-a', name: 'Default', proxies: [] }] },
      subscriptions: []
    };
    const { ConfigModule } = setupModules(config);
    const edited = {
      version: 5,
      updated_at: '2026-08-20T06:30:00.000Z',
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: {
        current: 'scenario-a',
        lists: [
          { id: 'scenario-a', name: 'Default', defaultProxyId: null, lastProxyId: null, automation: {}, order: 1 },
          { id: 'scenario-b', name: 'Work', defaultProxyId: null, lastProxyId: null, automation: {}, order: 0 }
        ]
      },
      proxies: [
        { id: 'proxy-a', scenarioId: 'scenario-a', order: 1, enabled: true, ip: '10.0.0.1', port: '8080' },
        { id: 'proxy-b', scenarioId: 'scenario-a', order: 0, enabled: true, ip: '10.0.0.2', port: '8080' }
      ],
      subscriptions: []
    };

    const applied = await ConfigModule.applyConfigData(edited);

    expect(applied.scenarios.lists.map(scenario => scenario.name)).toEqual(['Work', 'Default']);
    expect(applied.scenarios.lists.every(scenario => /^scenario_\d{14}$/.test(scenario.id))).toBe(true);
    expect(applied.scenarios.lists[1].proxies.map(proxy => proxy.ip)).toEqual(['10.0.0.2', '10.0.0.1']);
    expect(applied.scenarios.lists[1].proxies.every(proxy => /^proxy_\d{14}$/.test(proxy.id))).toBe(true);
    expect(applied.scenarios.lists[1]).not.toHaveProperty('order');
    expect(applied.scenarios.lists[1].proxies[0]).not.toHaveProperty('scenarioId');
    expect(applied.scenarios.lists[1].proxies[0]).not.toHaveProperty('order');
  });

  test('preserves omitted local subscription data when applying a compact configuration', async () => {
    const localSubscription = {
      id: 'subscription_20250213134422',
      name: 'Rules',
      lists: {
        autoproxy: {
          url: 'https://example.com/old.txt',
          refresh_interval: 360,
          content: 'cached content',
          include_rules: 'example.com',
          include_lines: 1,
          last_fetch_time: 123456
        }
      }
    };
    const config = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: [localSubscription]
    };
    const { ConfigModule } = setupModules(config);
    const compact = {
      version: 5,
      system: { app_language: 'en', theme_mode: 'light' },
      scenarios: { current: 'scenario-a', lists: [] },
      subscriptions: [{
        id: 'subscription_20250213134422',
        name: 'Rules Renamed',
        lists: { autoproxy: { url: 'https://example.com/new.txt', refresh_interval: 60 } }
      }]
    };

    const applied = await ConfigModule.applyConfigData(compact);

    expect(applied.subscriptions[0].name).toBe('Rules Renamed');
    expect(applied.subscriptions[0].lists.autoproxy).toEqual(expect.objectContaining({
      url: 'https://example.com/new.txt',
      refresh_interval: 60,
      content: 'cached content',
      include_rules: 'example.com',
      include_lines: 1,
      last_fetch_time: 123456
    }));
  });
});
