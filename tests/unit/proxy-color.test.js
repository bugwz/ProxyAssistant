const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../../src/js/utils.js');
const configPath = path.join(__dirname, '../../src/js/config.js');

function setupModules(config) {
  document.documentElement.innerHTML = '<html><head></head><body></body></html>';

  window.I18n = {
    t: jest.fn((key) => key),
    getCurrentLanguage: jest.fn(() => 'en')
  };
  window.ThemeModule = {
    getThemeMode: jest.fn(() => 'light'),
    getNightModeTimes: jest.fn(() => ({ start: '22:00', end: '06:00' }))
  };
  window.SyncModule = {
    getSyncConfig: jest.fn(() => ({
      type: 'native',
      gist: { filename: 'proxy_assistant_config.json' }
    }))
  };
  window.StorageModule = {
    getConfig: jest.fn(() => config)
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
    expect(migrated.subscriptions[0].id).toBe('subscription-proxy-a');
    expect(proxy.subscription_ids).toEqual(['subscription-proxy-a']);
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

    expect(exported.scenarios.lists[0].proxies[0].color).toBe('#FF0000');
    expect(ConfigModule.PROXY_EXPORT_KEYS).toContain('color');
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
});
