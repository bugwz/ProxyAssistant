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
});
