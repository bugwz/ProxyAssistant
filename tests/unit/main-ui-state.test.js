const fs = require('fs');
const path = require('path');

const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const mainJsPath = path.join(__dirname, '../../src/js/main.js');
const scenariosJsPath = path.join(__dirname, '../../src/js/scenarios.js');
const proxyJsPath = path.join(__dirname, '../../src/js/proxy.js');

function loadJQuery() {
  window.eval(fs.readFileSync(jqueryPath, 'utf8'));
  global.$ = window.$;
  global.jQuery = window.jQuery;
}

function resetGlobals() {
  delete global.$;
  delete global.jQuery;
  delete global.I18n;
  delete global.UtilsModule;
  delete global.StorageModule;
  delete global.ProxyModule;
  delete global.ScenariosModule;
  delete global.SubscriptionModule;
  delete global.SyncModule;
  delete global.DetectionModule;
  delete global.VersionModule;
  delete global.LanguageModule;
  delete global.ThemeModule;
  delete global.ConfigModule;
  delete global.ValidatorModule;
  delete global.isFirefox;
  delete global.generateProxyId;
  delete global.onScenarioSwitch;
  delete global.onProxyMove;
  delete global.window.ProxyModule;
  delete global.window.ScenariosModule;
  delete global.window.SubscriptionModule;
  delete global.window.StorageModule;
  delete global.window.ConfigModule;
}

function setupBaseDom() {
  document.body.innerHTML = `
    <div id="proxy-list"></div>
    <button id="expand-collapse-btn"></button>
    <button id="add-proxy-btn"></button>
    <button id="test-all-btn"></button>
    <div class="delete-tip"></div>
    <div class="delete-tip-close-btn"></div>
    <div class="delete-tip-cancel-btn"></div>
    <div class="delete-tip-confirm-btn"></div>
    <div class="proxy-detection-tip"></div>
    <div class="proxy-detection-close-btn"></div>
    <div class="pac-details-tip"></div>
    <div class="pac-details-close-btn"></div>
    <div class="pac-details-close-btn-secondary"></div>
    <div id="pac-copy-btn"></div>
    <div id="pac-toggle-btn"></div>
    <div id="pac-script-content"></div>
    <div id="pac-script-wrapper"></div>
    <div class="version-check-tip"></div>
    <div class="version-check-close-btn"></div>
    <div class="sync-config-tip"></div>
    <div class="sync-config-close-btn"></div>
    <button id="save-sync-config"></button>
    <button id="sync-pull-btn"></button>
    <button id="sync-push-btn"></button>
    <button id="test-sync-connection"></button>
    <button id="open-sync-config-btn"></button>
    <div id="gist-token-eye"><input type="checkbox"></div>
    <input id="gist-token" />
    <input id="gist-filename" />
    <div class="export-btn"></div>
    <div class="import-json-btn"></div>
    <input id="json-file-input" />
    <button id="detect-proxy-btn"></button>
    <button id="pac-details-btn"></button>
    <button id="check-version-btn"></button>
    <div id="language-options"><li data-value="zh-CN">简体中文</li></div>
    <div id="current-language-display"></div>
    <div id="current-scenario-indicator"></div>
    <ul class="main-scenario-dropdown"></ul>
  `;
}

function loadScenariosModule(deps) {
  const source = fs.readFileSync(scenariosJsPath, 'utf8');
  const factory = new Function(
    'window',
    'document',
    '$',
    'StorageModule',
    'ProxyModule',
    'UtilsModule',
    'I18n',
    'ConfigModule',
    'onScenarioSwitch',
    'onScenarioAdd',
    'onScenarioRename',
    'onScenarioDelete',
    'onScenariosReorder',
    'onProxyMove',
    'console',
    `${source}; return ScenariosModule;`
  );

  return factory(
    window,
    document,
    window.$,
    deps.StorageModule,
    deps.ProxyModule,
    deps.UtilsModule,
    deps.I18n,
    deps.ConfigModule,
    deps.onScenarioSwitch,
    deps.onScenarioAdd,
    deps.onScenarioRename,
    deps.onScenarioDelete,
    deps.onScenariosReorder,
    deps.onProxyMove,
    console
  );
}

function loadProxyModule(deps) {
  const source = fs.readFileSync(proxyJsPath, 'utf8');
  const factory = new Function(
    'window',
    'document',
    '$',
    'StorageModule',
    'ConfigModule',
    'ValidatorModule',
    'ScenariosModule',
    'SubscriptionModule',
    'UtilsModule',
    'I18n',
    'SyncModule',
    'chrome',
    'isFirefox',
    'generateProxyId',
    'navigator',
    'setTimeout',
    'clearTimeout',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'console',
    `${source}; return ProxyModule;`
  );

  return factory(
    window,
    document,
    window.$,
    deps.StorageModule,
    deps.ConfigModule,
    deps.ValidatorModule,
    deps.ScenariosModule,
    deps.SubscriptionModule,
    deps.UtilsModule,
    deps.I18n,
    deps.SyncModule,
    deps.chrome,
    deps.isFirefox,
    deps.generateProxyId,
    navigator,
    setTimeout,
    clearTimeout,
    requestAnimationFrame,
    cancelAnimationFrame,
    console
  );
}

describe('main UI state flow', () => {
  beforeEach(() => {
    jest.resetModules();
    resetGlobals();
    setupBaseDom();
    loadJQuery();

    global.I18n = {
      t: jest.fn((key) => key),
      init: jest.fn((callback) => callback()),
      getCurrentLanguage: jest.fn(() => 'zh-CN'),
      setLanguage: jest.fn()
    };
    global.UtilsModule = {
      showTip: jest.fn(),
      showProcessingTip: jest.fn(),
      cleanProtocol: jest.fn((value) => String(value).toLowerCase()),
      escapeHtml: jest.fn((value) => String(value))
    };
    global.SyncModule = {
      setSyncConfig: jest.fn(),
      updateSyncUI: jest.fn(),
      getSyncConfig: jest.fn(() => ({ type: 'native', gist: {} })),
      updateNativeQuotaInfo: jest.fn(),
      manualPull: jest.fn(),
      manualPush: jest.fn(),
      testGistConnection: jest.fn()
    };
    global.DetectionModule = {
      detectProxy: jest.fn(),
      showPacDetails: jest.fn(),
      closePacDetails: jest.fn()
    };
    global.VersionModule = {
      showVersionCheck: jest.fn(),
      checkGitHubVersion: jest.fn(() => Promise.resolve()),
      checkStoreVersion: jest.fn(() => Promise.resolve())
    };
    global.LanguageModule = { initLanguage: jest.fn() };
    global.ThemeModule = { initTheme: jest.fn(), setNightModeTimes: jest.fn() };
    global.SubscriptionModule = {
      parseProxyListSubscriptions: jest.fn(),
      getSubscriptionLineCounts: jest.fn(() => ({ include_lines: 1, bypass_lines: 2 })),
      init: jest.fn()
    };
    global.StorageModule = {
      init: jest.fn(() => Promise.resolve()),
      getConfig: jest.fn(() => ({ system: { app_language: 'zh-CN', sync: { type: 'native', gist: {} } } })),
      getProxies: jest.fn(() => []),
      save: jest.fn(() => Promise.resolve())
    };
    global.ProxyModule = {
      setList: jest.fn(),
      renderList: jest.fn(),
      init: jest.fn(),
      confirmDelete: jest.fn()
    };
    global.ScenariosModule = {
      init: jest.fn(),
      renderScenarioSelector: jest.fn(),
      switchScenario: jest.fn()
    };
    global.ConfigModule = {
      exportConfig: jest.fn(),
      importConfig: jest.fn()
    };
    global.generateProxyId = jest.fn(() => 'generated-proxy-id');
    global.chrome = {
      runtime: {
        lastError: null,
        getManifest: jest.fn(() => ({ version: 'test-version' })),
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      storage: {
        onChanged: {
          addListener: jest.fn()
        },
        local: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
          clear: jest.fn()
        },
        sync: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
          clear: jest.fn(),
          QUOTA_BYTES_PER_ITEM: 8000,
          QUOTA_BYTES: 102400
        }
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      }
    };

    window.I18n = global.I18n;
    window.UtilsModule = global.UtilsModule;
    window.SyncModule = global.SyncModule;
    window.DetectionModule = global.DetectionModule;
    window.VersionModule = global.VersionModule;
    window.LanguageModule = global.LanguageModule;
    window.ThemeModule = global.ThemeModule;
    window.SubscriptionModule = global.SubscriptionModule;
    window.StorageModule = global.StorageModule;
    window.ProxyModule = global.ProxyModule;
    window.ScenariosModule = global.ScenariosModule;
    window.ConfigModule = global.ConfigModule;
    window.generateProxyId = global.generateProxyId;
    window.chrome = global.chrome;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    resetGlobals();
  });

  test('scenario switch reparses subscription data before rendering', () => {
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));

    const list = [{ name: 'proxy-with-subscription', subscription: { lists: {} } }];

    window.onScenarioSwitch('scenario-b', list);

    expect(global.SubscriptionModule.parseProxyListSubscriptions).toHaveBeenCalledWith(list);
    expect(global.ProxyModule.setList).toHaveBeenCalledWith(list);
    expect(global.ProxyModule.renderList).toHaveBeenCalledTimes(1);
  });

  test('proxy move refreshes scenario selector counts', () => {
    global.StorageModule.getProxies.mockReturnValue([{ name: 'moved-proxy' }]);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));

    window.onProxyMove(0, 'scenario-b', { name: 'moved-proxy' });

    expect(global.ProxyModule.setList).toHaveBeenCalledWith([{ name: 'moved-proxy' }]);
    expect(global.ProxyModule.renderList).toHaveBeenCalledTimes(1);
    expect(global.ScenariosModule.renderScenarioSelector).toHaveBeenCalledTimes(1);
  });

  test('switchScenario rolls back when saving current scenario fails', async () => {
    const scenarios = [
      { id: 'scenario-a', name: 'Scenario A', proxies: [] },
      { id: 'scenario-b', name: 'Scenario B', proxies: [] }
    ];
    let currentScenarioId = 'scenario-a';

    global.StorageModule = {
      getScenarios: jest.fn(() => scenarios),
      getCurrentScenarioId: jest.fn(() => currentScenarioId),
      setCurrentScenarioId: jest.fn((id) => {
        currentScenarioId = id;
      }),
      getCurrentScenario: jest.fn(() => scenarios.find((scenario) => scenario.id === currentScenarioId)),
      save: jest.fn(() => Promise.reject(new Error('save failed')))
    };
    global.ProxyModule = {
      setList: jest.fn(),
      renderList: jest.fn()
    };
    global.onScenarioSwitch = jest.fn();
    window.StorageModule = global.StorageModule;
    window.ProxyModule = global.ProxyModule;
    window.onScenarioSwitch = global.onScenarioSwitch;

    const scenariosModule = loadScenariosModule({
      StorageModule: global.StorageModule,
      ProxyModule: global.ProxyModule,
      UtilsModule: global.UtilsModule,
      I18n: global.I18n,
      ConfigModule: global.ConfigModule,
      onScenarioSwitch: global.onScenarioSwitch
    });

    await scenariosModule.switchScenario('scenario-b');

    expect(global.StorageModule.setCurrentScenarioId).toHaveBeenNthCalledWith(1, 'scenario-b');
    expect(global.StorageModule.setCurrentScenarioId).toHaveBeenNthCalledWith(2, 'scenario-a');
    expect(global.onScenarioSwitch).not.toHaveBeenCalled();
    expect(currentScenarioId).toBe('scenario-a');
  });

  test('subscription badge delegated click handler is not duplicated across renders', () => {
    global.isFirefox = false;
    global.StorageModule = {
      getProxies: jest.fn(() => [
        {
          id: 'proxy-1',
          enabled: true,
          name: 'Proxy 1',
          protocol: 'http',
          ip: '127.0.0.1',
          port: '8080',
          username: '',
          password: '',
          bypass_rules: 'localhost',
          include_rules: 'example.com',
          fallback_policy: 'direct',
          subscription: {
            enabled: true,
            current: 'autoproxy',
            lists: {
              autoproxy: {
                include_rules: 'sub.example.com',
                bypass_rules: '127.0.0.1'
              }
            }
          }
        }
      ]),
      addProxy: jest.fn(),
      updateProxy: jest.fn(),
      deleteProxy: jest.fn(),
      reorderProxies: jest.fn(),
      save: jest.fn(() => Promise.resolve())
    };
    global.ConfigModule = {
      generateProxyId: jest.fn(() => 'proxy-new')
    };
    global.ValidatorModule = {
      validateIPAddress: jest.fn(() => ({ isValid: true })),
      isValidHost: jest.fn(() => true),
      checkIncludeUrlsConflict: jest.fn(() => ({ hasConflict: false })),
      validateProxy: jest.fn()
    };
    global.ScenariosModule = {
      checkNameGlobalUniqueness: jest.fn(() => ({ isDuplicate: false })),
      getCurrentScenarioId: jest.fn(() => 'scenario-a'),
      getCurrentScenario: jest.fn(() => ({ id: 'scenario-a', name: 'Scenario A' })),
      showMoveProxyDialog: jest.fn()
    };
    global.SubscriptionModule = {
      getSubscriptionLineCounts: jest.fn(() => ({ include_lines: 1, bypass_lines: 1 })),
      openModal: jest.fn()
    };
    global.chrome.runtime.sendMessage = jest.fn((message, callback) => {
      if (callback) callback({ success: true, latency: 10 });
    });
    window.StorageModule = global.StorageModule;
    window.ConfigModule = global.ConfigModule;
    window.ValidatorModule = global.ValidatorModule;
    window.ScenariosModule = global.ScenariosModule;
    window.SubscriptionModule = global.SubscriptionModule;
    window.chrome = global.chrome;
    window.isFirefox = global.isFirefox;

    const proxyModule = loadProxyModule({
      StorageModule: global.StorageModule,
      ConfigModule: global.ConfigModule,
      ValidatorModule: global.ValidatorModule,
      ScenariosModule: global.ScenariosModule,
      SubscriptionModule: global.SubscriptionModule,
      UtilsModule: global.UtilsModule,
      I18n: global.I18n,
      SyncModule: global.SyncModule,
      chrome: global.chrome,
      isFirefox: global.isFirefox,
      generateProxyId: global.generateProxyId
    });

    proxyModule.init();
    proxyModule.renderList();
    proxyModule.renderList();
    proxyModule.renderList();

    const clickHandlers = window.jQuery._data(document, 'events').click
      .filter((handler) => handler.selector === '.subscription-badge[data-type][data-mode]');

    expect(clickHandlers).toHaveLength(1);
  });

  test('expand all state survives list rerender', () => {
    global.isFirefox = false;
    const proxies = [
      {
        id: 'proxy-1',
        enabled: true,
        name: 'Proxy 1',
        protocol: 'http',
        ip: '127.0.0.1',
        port: '8080',
        username: '',
        password: '',
        bypass_rules: 'localhost',
        include_rules: 'example.com',
        fallback_policy: 'direct'
      }
    ];

    global.StorageModule = {
      getProxies: jest.fn(() => proxies),
      addProxy: jest.fn(),
      updateProxy: jest.fn(),
      deleteProxy: jest.fn(),
      reorderProxies: jest.fn(),
      save: jest.fn(() => Promise.resolve())
    };
    global.ConfigModule = {
      generateProxyId: jest.fn(() => 'proxy-new')
    };
    global.ValidatorModule = {
      validateIPAddress: jest.fn(() => ({ isValid: true })),
      isValidHost: jest.fn(() => true),
      checkIncludeUrlsConflict: jest.fn(() => ({ hasConflict: false })),
      validateProxy: jest.fn()
    };
    global.ScenariosModule = {
      checkNameGlobalUniqueness: jest.fn(() => ({ isDuplicate: false })),
      getCurrentScenarioId: jest.fn(() => 'scenario-a'),
      getCurrentScenario: jest.fn(() => ({ id: 'scenario-a', name: 'Scenario A' })),
      showMoveProxyDialog: jest.fn()
    };
    global.SubscriptionModule = {
      getSubscriptionLineCounts: jest.fn(() => ({ include_lines: 0, bypass_lines: 0 })),
      openModal: jest.fn()
    };
    window.StorageModule = global.StorageModule;
    window.ConfigModule = global.ConfigModule;
    window.ValidatorModule = global.ValidatorModule;
    window.ScenariosModule = global.ScenariosModule;
    window.SubscriptionModule = global.SubscriptionModule;
    window.isFirefox = global.isFirefox;

    const proxyModule = loadProxyModule({
      StorageModule: global.StorageModule,
      ConfigModule: global.ConfigModule,
      ValidatorModule: global.ValidatorModule,
      ScenariosModule: global.ScenariosModule,
      SubscriptionModule: global.SubscriptionModule,
      UtilsModule: global.UtilsModule,
      I18n: global.I18n,
      SyncModule: global.SyncModule,
      chrome: global.chrome,
      isFirefox: global.isFirefox,
      generateProxyId: global.generateProxyId
    });

    proxyModule.init();
    proxyModule.renderList();

    $('#expand-collapse-btn').trigger('click');
    proxyModule.renderList();

    expect($('#expand-collapse-btn').hasClass('expanded')).toBe(true);
    expect($('.proxy-card.collapsed')).toHaveLength(0);
  });
});
