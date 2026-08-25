const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPopupContext() {
  const popupPath = path.join(__dirname, '../../src/js/popup.js');
  const source = fs.readFileSync(popupPath, 'utf8');

  const proxyList = {
    attr: jest.fn().mockReturnThis(),
    html: jest.fn().mockReturnThis(),
    show: jest.fn().mockReturnThis(),
    hide: jest.fn().mockReturnThis(),
    removeClass: jest.fn().mockReturnThis(),
    addClass: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    data: jest.fn(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis()
  };
  const proxyListContainer = {
    removeClass: jest.fn().mockReturnThis(),
    addClass: jest.fn().mockReturnThis(),
    hasClass: jest.fn(() => false)
  };
  const proxyItemCards = {
    removeClass: jest.fn().mockReturnThis()
  };
  const statusDisplay = {
    text: jest.fn().mockReturnThis(),
    removeAttr: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    css: jest.fn().mockReturnThis()
  };
  const defaultChainableJquery = {
    attr: jest.fn().mockReturnThis(),
    html: jest.fn().mockReturnThis(),
    show: jest.fn().mockReturnThis(),
    hide: jest.fn().mockReturnThis(),
    removeClass: jest.fn().mockReturnThis(),
    addClass: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    data: jest.fn(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    hasClass: jest.fn(() => false)
  };

  const context = {
    console,
    I18n: {
      init: jest.fn(),
      t: jest.fn(key => key)
    },
    document: {
      addEventListener: jest.fn()
    },
    window: {
      ConfigModule: {
        generateScenarioId: jest.fn(() => 'scenario-default')
      },
      open: jest.fn()
    },
    chrome: {
      runtime: {
        lastError: null,
        sendMessage: jest.fn(),
        getManifest: jest.fn(() => ({ version: 'test' }))
      },
      storage: {
        onChanged: {
          addListener: jest.fn()
        },
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      tabs: {
        query: jest.fn()
      }
    },
    $: jest.fn((selector) => {
      if (selector === '.proxy-list') return proxyList;
      if (selector === '.proxy-list-container') return proxyListContainer;
      if (selector === '.proxy-item-card') return proxyItemCards;
      if (selector === '#status-display') return statusDisplay;
      if (selector === context.document) return defaultChainableJquery;
      if (selector && typeof selector === 'object') return selector;
      return defaultChainableJquery;
    })
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  vm.runInContext(`
    this.__popupTestApi = {
      setState: function (nextState) {
        if (Object.prototype.hasOwnProperty.call(nextState, 'scenarios')) {
          scenarios = nextState.scenarios;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, 'currentScenarioId')) {
          currentScenarioId = nextState.currentScenarioId;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, 'list')) {
          list = nextState.list;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, 'themeMode')) {
          themeMode = nextState.themeMode;
        }
      },
      getState: function () {
        return {
          scenarios: scenarios,
          currentScenarioId: currentScenarioId,
          list: list,
          themeMode: themeMode
        };
      }
    };
  `, context);
  context.__jqueryMocks = {
    proxyList,
    proxyListContainer,
    proxyItemCards,
    statusDisplay,
    defaultChainableJquery
  };
  return context;
}

describe('popup scenario switching', () => {
  test('keeps light GitHub and custom-theme scenario controls visible', () => {
    const popupCss = fs.readFileSync(path.join(__dirname, '../../src/css/popup.css'), 'utf8');
    const themeCss = fs.readFileSync(path.join(__dirname, '../../src/css/theme.css'), 'utf8');

    expect(popupCss).toMatch(/\.version-info\s*\{[^}]*color:\s*var\(--text-secondary\);/s);
    expect(popupCss).toMatch(/\.github-link\s*\{[^}]*color:\s*var\(--text-secondary\);/s);
    expect(themeCss).toMatch(/body\[data-custom-theme="true"\] \.github-link\s*\{[^}]*color:\s*var\(--custom-theme-muted-text\);/s);
    expect(themeCss).toMatch(/body\[data-custom-theme="true"\] \.header-scenario-selector\s*\{[^}]*background-color:\s*transparent;[^}]*border-color:\s*transparent;/s);
  });

  test('uses the diagnostics disabled color for disabled popup status', () => {
    const context = loadPopupContext();
    const popupCssPath = path.join(__dirname, '../../src/css/popup.css');
    const popupCss = fs.readFileSync(popupCssPath, 'utf8');

    context.updateStatusDisplay('disabled', null);

    expect(context.__jqueryMocks.statusDisplay.css).toHaveBeenCalledWith('color', 'var(--disabled-status-color)');
    expect(popupCss).toMatch(/--disabled-status-color:\s*#94a3b8;/);
    expect(popupCss).toMatch(/\.mode-btn\[data-mode="disabled"\]\.active\s*{\s*color:\s*var\(--disabled-status-color\);/);
  });

  test('keeps the manual mode status blue in light and dark themes', () => {
    const popupCss = fs.readFileSync(path.join(__dirname, '../../src/css/popup.css'), 'utf8');
    const themeCss = fs.readFileSync(path.join(__dirname, '../../src/css/theme.css'), 'utf8');

    expect(popupCss).toMatch(/--manual-mode-color:\s*#4164f5;/);
    expect(popupCss).toMatch(/\.mode-btn\[data-mode="manual"\]\.active\s*{\s*color:\s*var\(--manual-mode-color\);/);
    expect(themeCss).toMatch(/--manual-mode-color:\s*#4164f5;/);
  });

  test('applies the previous manual proxy without prewriting state', () => {
    const context = loadPopupContext();
    const previousManualProxy = { name: 'Previous', ip: '127.0.0.1', port: '8080' };
    const fallbackProxy = { name: 'Fallback', ip: '10.0.0.2', port: '3128' };
    const clickedModeButton = {
      data: jest.fn((key) => (key === 'mode' ? 'manual' : undefined))
    };
    const storedState = {
      proxy: {
        mode: 'auto',
        current: previousManualProxy
      }
    };

    context.__popupTestApi.setState({ list: [fallbackProxy] });
    context.list_init = jest.fn();
    context.updateBypassButton = jest.fn();
    context.updateCurrentSiteDisplay = jest.fn();
    context.updateScenarioVisibility = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ state: storedState });
    });
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
    });

    context.bindGlobalEvents();

    const modeClickHandler = context.__jqueryMocks.defaultChainableJquery.on.mock.calls[2][1];
    modeClickHandler.call(clickedModeButton);

    expect(context.chrome.storage.local.set).not.toHaveBeenCalled();
    expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'setProxyMode', mode: 'manual', proxyInfo: previousManualProxy },
      expect.any(Function)
    );
    expect(context.chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      { action: 'setProxyMode', mode: 'manual', proxyInfo: fallbackProxy },
      expect.any(Function)
    );
  });

  test('restores the previous popup mode when applying a new mode fails', () => {
    const context = loadPopupContext();
    const fallbackProxy = { name: 'Fallback', ip: '10.0.0.2', port: '3128' };
    const clickedModeButton = {
      data: jest.fn((key) => (key === 'mode' ? 'manual' : undefined))
    };

    context.__popupTestApi.setState({ list: [fallbackProxy] });
    context.updateModeUI = jest.fn();
    context.refreshPopupForMode = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ state: { proxy: { mode: 'disabled', current: null } } });
    });
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback({ success: false, error: 'Proxy settings rejected' });
    });

    context.bindGlobalEvents();

    const modeClickHandler = context.__jqueryMocks.defaultChainableJquery.on.mock.calls[2][1];
    modeClickHandler.call(clickedModeButton);

    expect(context.chrome.storage.local.set).not.toHaveBeenCalled();
    expect(context.updateModeUI).toHaveBeenCalledWith('disabled');
    expect(context.refreshPopupForMode).toHaveBeenCalledWith('disabled', null);
  });

  test('delegates scenario activation without prewriting proxy state', () => {
    const context = loadPopupContext();
    const existingState = {
      proxy: {
        mode: 'auto',
        current: { name: 'Previous', ip: '127.0.0.1', port: '8080' }
      }
    };
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: []
      }
    };

    context.__popupTestApi.setState({ scenarios: [
      { id: 'scenario-a', name: 'Scenario A', proxies: [] },
      { id: 'scenario-b', name: 'Scenario B', proxies: [] }
    ], currentScenarioId: 'scenario-a', list: [] });
    context.list_init = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ config, state: existingState });
    });
    context.chrome.storage.local.set.mockImplementation((payload, callback) => {
      callback();
    });
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback({ success: false, error: 'activation failed' });
    });

    context.switchScenario('scenario-b');

    expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'activateScenario', scenarioId: 'scenario-b', source: 'manual' },
      expect.any(Function)
    );
    expect(context.chrome.storage.local.set).not.toHaveBeenCalled();
    expect(context.__popupTestApi.getState().currentScenarioId).toBe('scenario-a');
  });

  test('uses worker activation when switching scenario in auto mode', () => {
    const context = loadPopupContext();
    const existingState = {
      proxy: {
        mode: 'auto',
        current: { name: 'Previous', ip: '127.0.0.1', port: '8080' }
      }
    };
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: []
      }
    };

    context.__popupTestApi.setState({ scenarios: [
      { id: 'scenario-a', name: 'Scenario A', proxies: [] },
      { id: 'scenario-b', name: 'Scenario B', proxies: [] }
    ], currentScenarioId: 'scenario-a', list: [] });
    context.list_init = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ config, state: existingState });
    });
    context.chrome.storage.local.set.mockImplementation((payload, callback) => {
      callback();
    });
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
    });

    context.switchScenario('scenario-b');

    expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'activateScenario', scenarioId: 'scenario-b', source: 'manual' },
      expect.any(Function)
    );
    expect(context.chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('lets worker handle an empty manual scenario atomically', () => {
    const context = loadPopupContext();
    const existingState = {
      proxy: {
        mode: 'manual',
        current: { name: 'Previous', ip: '127.0.0.1', port: '8080' }
      }
    };
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: []
      }
    };

    context.__popupTestApi.setState({ scenarios: [
      { id: 'scenario-a', name: 'Scenario A', proxies: [{ name: 'Old', ip: '127.0.0.1', port: '8080' }] },
      { id: 'scenario-b', name: 'Scenario B', proxies: [{ name: 'Disabled', ip: '10.0.0.1', port: '3128', enabled: false }] }
    ], currentScenarioId: 'scenario-a', list: [{ name: 'Old', ip: '127.0.0.1', port: '8080' }] });
    context.list_init = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ config, state: existingState });
    });
    context.chrome.storage.local.set.mockImplementation((payload, callback) => {
      callback();
    });
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
    });

    context.switchScenario('scenario-b');

    expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'activateScenario', scenarioId: 'scenario-b', source: 'manual' },
      expect.any(Function)
    );
    expect(context.chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('persists config when adding current site to bypass rules', () => {
    const context = loadPopupContext();
    const proxy = { name: 'Proxy A', ip: '127.0.0.1', port: '8080', bypass_rules: 'existing.com' };
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: [
          { id: 'scenario-a', name: 'Scenario A', proxies: [proxy] }
        ]
      }
    };
    const button = {
      prop: jest.fn().mockReturnThis(),
      removeClass: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      addClass: jest.fn().mockReturnThis()
    };

    context.updateBypassButton = jest.fn();
    context.updateCurrentSiteDisplay = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        state: { proxy: { mode: 'manual', current: proxy } },
        config
      });
    });
    context.chrome.storage.local.set.mockImplementation((payload, callback) => {
      callback();
    });
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
    });

    context.handleAddToBypass('example.com', button);

    expect(context.chrome.storage.local.set).toHaveBeenCalledWith(
      {
        config,
        state: {
          proxy: {
            mode: 'manual',
            current: expect.objectContaining({
              bypass_rules: 'existing.com\nexample.com'
            })
          }
        }
      },
      expect.any(Function)
    );
    expect(config.scenarios.lists[0].proxies[0].bypass_rules).toBe('existing.com\nexample.com');
  });

  test('persists config when removing current site from bypass rules', () => {
    const context = loadPopupContext();
    const proxy = { name: 'Proxy A', ip: '127.0.0.1', port: '8080', bypass_rules: 'example.com\nkeep.com' };
    const config = {
      scenarios: {
        current: 'scenario-a',
        lists: [
          { id: 'scenario-a', name: 'Scenario A', proxies: [proxy] }
        ]
      }
    };
    const button = {
      prop: jest.fn().mockReturnThis(),
      removeClass: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      addClass: jest.fn().mockReturnThis()
    };

    context.updateBypassButton = jest.fn();
    context.updateCurrentSiteDisplay = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        state: { proxy: { mode: 'manual', current: proxy } },
        config
      });
    });
    context.chrome.storage.local.set.mockImplementation((payload, callback) => {
      callback();
    });
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
    });

    context.handleRemoveFromBypass('example.com', button);

    expect(context.chrome.storage.local.set).toHaveBeenCalledWith(
      {
        config,
        state: {
          proxy: {
            mode: 'manual',
            current: expect.objectContaining({
              bypass_rules: 'keep.com'
            })
          }
        }
      },
      expect.any(Function)
    );
    expect(config.scenarios.lists[0].proxies[0].bypass_rules).toBe('keep.com');
  });

  test('does not update popup selection before applyProxy succeeds', () => {
    const context = loadPopupContext();
    const info = { name: 'Proxy A', ip: '127.0.0.1', port: '8080' };
    const clickedItem = {
      data: jest.fn((key) => (key === 'index' ? 0 : undefined)),
      addClass: jest.fn().mockReturnThis()
    };
    let applyProxyCallback = null;

    context.__popupTestApi.setState({ list: [info] });
    context.list_init = jest.fn();
    context.updateBypassButton = jest.fn();
    context.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      applyProxyCallback = callback;
    });

    context.bindListEvents();

    const clickHandler = context.__jqueryMocks.proxyList.on.mock.calls[0][2];
    clickHandler.call(clickedItem, {});

    expect(context.__jqueryMocks.proxyItemCards.removeClass).not.toHaveBeenCalled();
    expect(clickedItem.addClass).not.toHaveBeenCalled();
    expect(context.__jqueryMocks.statusDisplay.text).not.toHaveBeenCalled();
    expect(context.chrome.storage.local.set).not.toHaveBeenCalled();
    expect(context.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'applyProxy', proxyInfo: info },
      expect.any(Function)
    );

    applyProxyCallback({ success: true });

    expect(context.list_init).toHaveBeenCalled();
  });

  test('matches auto proxy from subscription include rules', () => {
    const context = loadPopupContext();
    const proxy = {
      name: 'Subscription Proxy',
      ip: '127.0.0.1',
      port: '8080',
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
    };

    expect(context.getAutoProxy([proxy], 'service.example.com')).toBe(proxy);
  });

  test('declares popup state variables explicitly', () => {
    const popupPath = path.join(__dirname, '../../src/js/popup.js');
    const source = fs.readFileSync(popupPath, 'utf8');

    expect(source).toMatch(/let scenarios = \[\];/);
    expect(source).toMatch(/let currentScenarioId = null;/);
    expect(source).toMatch(/let list = \[\];/);
    expect(source).toMatch(/let themeMode = 'light';/);
  });
});
