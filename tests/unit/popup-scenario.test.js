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
    hasClass: jest.fn(() => false)
  };
  const proxyItemCards = {
    removeClass: jest.fn().mockReturnThis()
  };
  const statusDisplay = {
    text: jest.fn().mockReturnThis()
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
      if (selector && typeof selector === 'object') return selector;
      return defaultChainableJquery;
    })
  };

  vm.createContext(context);
  vm.runInContext(source, context);
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
  test('does not write null state when switching scenario outside manual mode', () => {
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

    context.scenarios = [
      { id: 'scenario-a', name: 'Scenario A', proxies: [] },
      { id: 'scenario-b', name: 'Scenario B', proxies: [] }
    ];
    context.currentScenarioId = 'scenario-a';
    context.list = [];
    context.list_init = jest.fn();
    context.chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ config, state: existingState });
    });
    context.chrome.storage.local.set.mockImplementation((payload, callback) => {
      callback();
    });

    context.switchScenario('scenario-b');

    expect(context.chrome.storage.local.set).toHaveBeenCalledWith(
      { config },
      expect.any(Function)
    );
    expect(context.chrome.storage.local.set.mock.calls[0][0]).not.toHaveProperty('state');
  });

  test('refreshes PAC when switching scenario in auto mode', () => {
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

    context.scenarios = [
      { id: 'scenario-a', name: 'Scenario A', proxies: [] },
      { id: 'scenario-b', name: 'Scenario B', proxies: [] }
    ];
    context.currentScenarioId = 'scenario-a';
    context.list = [];
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
      { action: 'refreshProxy' },
      expect.any(Function)
    );
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

    context.list = [info];
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
});
