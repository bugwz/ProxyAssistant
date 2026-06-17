const fs = require('fs');
const path = require('path');

const popupHtmlPath = path.join(__dirname, '../../src/popup.html');
const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const iconsJsPath = path.join(__dirname, '../../src/js/icons.js');
const popupJsPath = path.join(__dirname, '../../src/js/popup.js');

function setupPopupDom({ config, state, tabUrl = 'https://example.com/' }) {
  jest.resetModules();
  document.documentElement.innerHTML = fs.readFileSync(popupHtmlPath, 'utf8');

  window.eval(fs.readFileSync(jqueryPath, 'utf8'));
  window.eval(fs.readFileSync(iconsJsPath, 'utf8'));
  global.$ = window.$;
  global.jQuery = window.jQuery;
  global.MainIcons = window.MainIcons;

  global.I18n = {
    init: jest.fn((callback) => callback()),
    t: jest.fn((key) => key)
  };
  global.UtilsModule = {
    escapeHtml: jest.fn((value) => String(value))
  };
  global.ConfigModule = {
    generateScenarioId: jest.fn(() => 'generated-scenario')
  };
  global.window.ConfigModule = global.ConfigModule;

  global.chrome = {
    runtime: {
      lastError: null,
      getManifest: jest.fn(() => ({ version: 'test-version' })),
      sendMessage: jest.fn((message, callback) => {
        if (callback) {
          callback({ success: true });
        }
      })
    },
    storage: {
      onChanged: {
        addListener: jest.fn()
      },
      local: {
        get: jest.fn((keys, callback) => {
          const requested = Array.isArray(keys) ? keys : [keys];
          const result = {};

          if (requested.includes('config')) {
            result.config = config;
          }
          if (requested.includes('state')) {
            result.state = state;
          }

          callback(result);
        }),
        set: jest.fn((payload, callback) => {
          if (payload.config) {
            config = payload.config;
          }
          if (payload.state) {
            state = payload.state;
          }
          if (callback) {
            callback();
          }
        })
      }
    },
    tabs: {
      query: jest.fn((queryInfo, callback) => {
        callback([{ url: tabUrl }]);
      })
    }
  };

  window.eval(fs.readFileSync(popupJsPath, 'utf8'));
  document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

  return {
    chrome: global.chrome
  };
}

describe('popup DOM interactions', () => {
  afterEach(() => {
    document.documentElement.innerHTML = '<html><head></head><body></body></html>';
    delete global.chrome;
    delete global.$;
    delete global.jQuery;
    delete global.I18n;
    delete global.UtilsModule;
    delete global.ConfigModule;
    delete global.MainIcons;
  });

  test('clicking an empty manual scenario clears the browser proxy', () => {
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: [
          {
            id: 'scenario-a',
            name: 'Scenario A',
            proxies: [{ name: 'Proxy A', ip: '127.0.0.1', port: '8080', enabled: true }]
          },
          {
            id: 'scenario-b',
            name: 'Scenario B',
            proxies: []
          }
        ]
      },
      system: {
        theme_mode: 'light'
      }
    };
    const state = {
      proxy: {
        mode: 'manual',
        current: { name: 'Proxy A', ip: '127.0.0.1', port: '8080', enabled: true }
      }
    };

    const { chrome } = setupPopupDom({ config, state });

    $('#popup-scenario-options li[data-value="scenario-b"]').trigger('click');

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'turnOffProxy' },
      expect.any(Function)
    );
  });

  test('auto mode highlights proxies matched by subscription rules', () => {
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: [
          {
            id: 'scenario-a',
            name: 'Scenario A',
            proxies: [
              {
                name: 'Subscription Proxy',
                ip: '127.0.0.1',
                port: '8080',
                enabled: true,
                include_rules: '',
                subscription: {
                  enabled: true,
                  current: 'autoproxy',
                  lists: {
                    autoproxy: {
                      include_rules: 'service.example.com'
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      system: {
        theme_mode: 'light'
      }
    };
    const state = {
      proxy: {
        mode: 'auto',
        current: null
      }
    };

    setupPopupDom({ config, state, tabUrl: 'https://service.example.com/path' });

    expect($('.proxy-item-card.selected')).toHaveLength(1);
    expect($('#status-display').text()).toBe('Subscription Proxy');
  });

  test('scenario switch button reuses the main page shared icon', () => {
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: [
          {
            id: 'scenario-a',
            name: 'Scenario A',
            proxies: []
          }
        ]
      },
      system: {
        theme_mode: 'light'
      }
    };
    const state = {
      proxy: {
        mode: 'disabled',
        current: null
      }
    };

    setupPopupDom({ config, state });

    expect($('.scenario-btn').html()).toContain('M12 3 4 7l8 4 8-4-8-4Z');
    expect($('.scenario-btn').html()).toContain('m4 12 8 4 8-4');
    expect($('.scenario-btn').html()).toContain('m4 17 8 4 8-4');
  });
});
