const fs = require('fs');
const path = require('path');

const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const iconsJsPath = path.join(__dirname, '../../src/js/icons.js');
const mainJsPath = path.join(__dirname, '../../src/js/main.js');
const scenariosJsPath = path.join(__dirname, '../../src/js/scenarios.js');
const proxyJsPath = path.join(__dirname, '../../src/js/proxy.js');

function loadJQuery() {
  window.eval(fs.readFileSync(jqueryPath, 'utf8'));
  global.$ = window.$;
  global.jQuery = window.jQuery;
}

function loadMainIcons() {
  window.eval(fs.readFileSync(iconsJsPath, 'utf8'));
  global.MainIcons = window.MainIcons;
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
  delete global.MainIcons;
  delete global.isFirefox;
  delete global.generateProxyId;
  delete global.onScenarioSwitch;
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
    <div class="delete-tip-content"></div>
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
    loadMainIcons();

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
      escapeHtml: jest.fn((value) => String(value)),
      normalizeProxyColor: jest.fn((value) => {
        if (typeof value !== 'string') return '';
        const normalized = value.trim().toUpperCase();
        return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : '';
      })
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
      loadVersionInfo: jest.fn(() => Promise.resolve()),
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
      save: jest.fn(() => Promise.resolve()),
      reload: jest.fn(() => Promise.resolve()),
      isSubscriptionOnlyChange: jest.fn(() => false),
      mergeSubscriptionChanges: jest.fn()
    };
    global.ProxyModule = {
      setList: jest.fn(),
      renderList: jest.fn(),
      init: jest.fn(),
      confirmDelete: jest.fn(),
      updateSubscriptionLinesDisplay: jest.fn()
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

  test('subscription-only storage updates merge without reloading the form', () => {
    global.StorageModule.isSubscriptionOnlyChange.mockReturnValue(true);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.initDropdowns();

    const listener = global.chrome.storage.onChanged.addListener.mock.calls[0][0];
    const oldConfig = { version: 4, scenarios: { lists: [] } };
    const newConfig = { version: 4, scenarios: { lists: [] } };
    listener({ config: { oldValue: oldConfig, newValue: newConfig } }, 'local');

    expect(global.StorageModule.mergeSubscriptionChanges).toHaveBeenCalledWith(newConfig);
    expect(global.ProxyModule.updateSubscriptionLinesDisplay).toHaveBeenCalledTimes(1);
    expect(global.StorageModule.reload).not.toHaveBeenCalled();
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

  test('scenario management expands, edits, switches, and adds scenario cards', async () => {
    document.body.innerHTML = `
      <button id="open-add-scenario-btn"></button>
      <button id="scenario-expand-collapse-btn"></button>
      <div id="scenario-manage-list"></div>
      <ul class="main-scenario-dropdown"></ul>
      <button class="main-scenario-btn"></button>
      <div id="current-scenario-indicator"></div>
      <div class="add-scenario-tip">
        <button class="add-scenario-close-btn"></button>
        <button class="add-scenario-cancel-btn"></button>
        <input id="new-scenario-name">
        <button id="add-scenario-btn"></button>
      </div>
      <div class="edit-scenario-tip"></div>
      <div class="delete-scenario-tip"></div>
      <div class="alert-scenario-tip"></div>
    `;

    const scenarios = [
      { id: 'scenario-a', name: 'Home', proxies: [{ name: 'Proxy A' }] },
      { id: 'scenario-b', name: 'Work', proxies: [{ name: 'Proxy B' }, { name: 'Proxy C' }] }
    ];
    let currentScenarioId = 'scenario-a';
    const onScenarioSwitch = jest.fn();
    const onScenarioAdd = jest.fn();
    const onScenarioRename = jest.fn();

    global.StorageModule = {
      getScenarios: jest.fn(() => scenarios),
      getCurrentScenarioId: jest.fn(() => currentScenarioId),
      setCurrentScenarioId: jest.fn((id) => {
        currentScenarioId = id;
      }),
      getCurrentScenario: jest.fn(() => scenarios.find(scenario => scenario.id === currentScenarioId)),
      addScenario: jest.fn((scenario) => scenarios.push(scenario)),
      updateScenario: jest.fn((id, updates) => {
        Object.assign(scenarios.find(scenario => scenario.id === id), updates);
      }),
      save: jest.fn(() => Promise.resolve())
    };
    global.ConfigModule = {
      generateScenarioId: jest.fn(() => 'scenario-new')
    };

    const scenariosModule = loadScenariosModule({
      StorageModule: global.StorageModule,
      ProxyModule: global.ProxyModule,
      UtilsModule: global.UtilsModule,
      I18n: global.I18n,
      ConfigModule: global.ConfigModule,
      onScenarioSwitch,
      onScenarioAdd,
      onScenarioRename
    });

    scenariosModule.init();
    scenariosModule.renderScenarioManagementList();

    expect($('.scenario-card')).toHaveLength(2);
    expect($('.scenario-card.collapsed')).toHaveLength(2);
    expect($('.scenario-card .proxy-index').map((index, node) => $(node).text()).get()).toEqual(['#1', '#2']);
    expect($('.scenario-card.is-current').data('id')).toBe('scenario-a');

    $('#scenario-expand-collapse-btn').trigger('click');
    expect($('.scenario-card.collapsed')).toHaveLength(0);

    $('.scenario-card[data-id="scenario-a"] .scenario-card-name-input').val('HomeOffice');
    $('.scenario-card[data-id="scenario-a"] .scenario-card-save').trigger('click');
    expect(onScenarioRename).toHaveBeenCalledWith('scenario-a', 'HomeOffice');

    $('.scenario-switch-btn[data-id="scenario-b"]').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(onScenarioSwitch).toHaveBeenCalledWith('scenario-b', scenarios[1].proxies);
    expect($('.scenario-card.is-current').data('id')).toBe('scenario-b');

    $('#open-add-scenario-btn').trigger('click');
    expect($('.add-scenario-tip').hasClass('show')).toBe(true);
    $('#new-scenario-name').val('Travel').trigger($.Event('keydown', { key: 'Enter' }));

    expect(global.StorageModule.addScenario).toHaveBeenCalledWith({
      id: 'scenario-new',
      name: 'Travel',
      proxies: []
    });
    expect(onScenarioAdd).toHaveBeenCalledWith('scenario-new', 'Travel');
    expect($('.scenario-card')).toHaveLength(3);
    expect($('.scenario-card[data-id="scenario-new"]').hasClass('collapsed')).toBe(false);
    expect($('.add-scenario-tip').hasClass('show')).toBe(false);
  });

  test('subscription badge delegated click handler is not duplicated across renders', () => {
    global.isFirefox = false;
    const subscriptions = [{
      id: 'subscription-1',
      name: 'Shared Rules',
      enabled: true,
      current: 'autoproxy',
      lists: {
        autoproxy: {
          include_rules: 'sub.example.com',
          bypass_rules: '127.0.0.1'
        }
      }
    }];
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
        fallback_policy: 'direct',
        subscription_ids: ['subscription-1']
      }
    ];
    global.StorageModule = {
      getProxies: jest.fn(() => proxies),
      getSubscriptions: jest.fn(() => subscriptions),
      getSubscription: jest.fn(id => subscriptions.find(item => item.id === id)),
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
      getCurrentScenario: jest.fn(() => ({ id: 'scenario-a', name: 'Scenario A' }))
    };
    global.SubscriptionModule = {
      getSubscriptionLineCounts: jest.fn(() => ({ include_lines: 1, bypass_lines: 1 })),
      getProxySubscriptions: jest.fn(proxy => proxy.subscription_ids.map(id => subscriptions.find(item => item.id === id))),
      getProxySubscriptionLineCounts: jest.fn(() => ({ include_lines: 1, bypass_lines: 1 })),
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

    expect($('.proxy-subscription-search')).toHaveLength(1);
    expect($('.proxy-subscription-option input:checked').val()).toBe('subscription-1');
    $('.proxy-subscription-trigger').trigger('click');
    $('.proxy-subscription-search').val('missing').trigger('input');
    expect($('.proxy-subscription-option').css('display')).toBe('none');
    $('.proxy-subscription-search').val('shared').trigger('input');
    expect($('.proxy-subscription-option').css('display')).not.toBe('none');
    $('.proxy-subscription-option input').prop('checked', false).trigger('change');
    expect(proxies[0].subscription_ids).toEqual([]);

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
        fallback_policy: 'direct',
        color: '#ff0000'
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
      getCurrentScenario: jest.fn(() => ({ id: 'scenario-a', name: 'Scenario A' }))
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

    expect($('.proxy-card').hasClass('collapsed')).toBe(true);
    expect($('.proxy-card-collapse')).toHaveLength(1);
    expect($('.proxy-card-collapse').attr('aria-expanded')).toBe('false');
    expect($('.proxy-card-collapse svg')).toHaveLength(1);

    $('.proxy-card-collapse').trigger('click');

    expect($('.proxy-card').hasClass('collapsed')).toBe(false);
    expect($('.proxy-card-collapse').attr('aria-expanded')).toBe('true');

    $('.proxy-card-collapse').trigger('click');

    expect($('.proxy-card').hasClass('collapsed')).toBe(true);
    expect($('.proxy-card-collapse').attr('aria-expanded')).toBe('false');

    expect($('.proxy-color-tag')).toHaveLength(1);
    expect($('.proxy-color-tag').css('--proxy-color')).toBe('#FF0000');
    expect($('.proxy-color-tag svg')).toHaveLength(1);
    expect($('.proxy-color-input').val()).toBe('#FF0000');

    $('.proxy-color-input').val('#00aaee').trigger('input');
    expect($('.proxy-color-input').val()).toBe('#00AAEE');
    expect(proxies[0].color).toBe('#00AAEE');
    expect($('.proxy-color-tag').css('--proxy-color')).toBe('#00AAEE');

    $('.proxy-color-input').val('00AAEE').trigger('blur');
    expect($('.proxy-color-input').hasClass('input-error')).toBe(true);
    expect(proxies[0].color).toBe('#00AAEE');

    $('.item-save-btn').trigger('click');
    expect(global.StorageModule.save).not.toHaveBeenCalled();
    expect(global.UtilsModule.showTip).toHaveBeenCalledWith(
      'save_failedproxy_color_invalid',
      true
    );

    $('.proxy-color-option[data-value="#8B5CF6"]').trigger('click');
    expect($('.proxy-color-input').val()).toBe('#8B5CF6');
    expect($('.proxy-color-input').hasClass('input-error')).toBe(false);
    expect(proxies[0].color).toBe('#8B5CF6');
    expect($('.proxy-color-tag').css('--proxy-color')).toBe('#8B5CF6');

    $('.proxy-color-input').val('').trigger('input');
    expect(proxies[0].color).toBe('');
    expect($('.proxy-color-tag')).toHaveLength(0);

    $('#proxy-list').after(`
      <div id="subscription-manage-list">
        <div class="proxy-card subscription-card collapsed"></div>
      </div>
    `);

    $('#expand-collapse-btn').trigger('click');
    proxyModule.renderList();

    expect($('#expand-collapse-btn').hasClass('expanded')).toBe(true);
    expect($('.proxy-color-tag')).toHaveLength(0);
    expect($('#expand-collapse-btn').html()).toContain('icon-collapse');
    expect($('#expand-collapse-btn').html()).toContain('data-i18n="collapse_all"');
    expect($('#expand-collapse-btn').html()).toContain('M9 4v5H4');
    expect($('#proxy-list .proxy-card.collapsed')).toHaveLength(0);
    expect($('#subscription-manage-list .subscription-card').hasClass('collapsed')).toBe(true);

    $('#subscription-manage-list .subscription-card').removeClass('collapsed');
    $('#expand-collapse-btn').trigger('click');

    expect($('#proxy-list .proxy-card').hasClass('collapsed')).toBe(true);
    expect($('#subscription-manage-list .subscription-card').hasClass('collapsed')).toBe(false);
  });

  test('groups every proxy by scenario and moves proxies with the association field or dragging', async () => {
    global.isFirefox = false;
    const createProxy = (id, name) => ({
      id: id,
      enabled: true,
      name: name,
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080',
      username: '',
      password: '',
      bypass_rules: '',
      include_rules: '',
      fallback_policy: 'direct'
    });
    const scenarios = [
      { id: 'scenario-a', name: 'Home', proxies: [createProxy('proxy-a', 'Proxy A')] },
      { id: 'scenario-b', name: 'Office', proxies: [createProxy('proxy-b', 'Proxy B')] }
    ];

    global.StorageModule = {
      getScenarios: jest.fn(() => scenarios),
      getCurrentScenarioId: jest.fn(() => 'scenario-a'),
      getProxies: jest.fn(id => scenarios.find(scenario => scenario.id === (id || 'scenario-a')).proxies),
      getSubscriptions: jest.fn(() => []),
      moveProxy: jest.fn((proxyIndex, fromId, toId) => {
        const from = scenarios.find(scenario => scenario.id === fromId);
        const to = scenarios.find(scenario => scenario.id === toId);
        to.proxies.push(from.proxies.splice(proxyIndex, 1)[0]);
        return true;
      }),
      reorderProxies: jest.fn((proxies, scenarioId) => {
        scenarios.find(scenario => scenario.id === scenarioId).proxies = proxies;
      }),
      addProxy: jest.fn(),
      updateProxy: jest.fn(),
      deleteProxy: jest.fn(),
      save: jest.fn(() => Promise.resolve())
    };
    global.ConfigModule = { generateProxyId: jest.fn(() => 'proxy-new') };
    global.ValidatorModule = {
      validateIPAddress: jest.fn(() => ({ isValid: true })),
      isValidHost: jest.fn(() => true),
      checkIncludeUrlsConflict: jest.fn(() => ({ hasConflict: false })),
      validateProxy: jest.fn()
    };
    global.ScenariosModule = {
      checkNameGlobalUniqueness: jest.fn(() => ({ isDuplicate: false })),
      getCurrentScenarioId: jest.fn(() => 'scenario-a'),
      renderScenarioViews: jest.fn()
    };
    global.SubscriptionModule = {
      getSubscriptionLineCounts: jest.fn(() => ({ include_lines: 0, bypass_lines: 0 }))
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

    expect($('.proxy-scenario-divider span').map((index, node) => $(node).text()).get()).toEqual(['Home', 'Office']);
    expect($('.proxy-scenario-group').map((index, group) => $(group).find('.proxy-card').length).get()).toEqual([1, 1]);
    expect($('.proxy-card .proxy-index').map((index, node) => $(node).text()).get()).toEqual(['#1', '#1']);
    expect($('.proxy-scenario-association').map((index, node) => $(node).val()).get()).toEqual(['scenario-a', 'scenario-b']);
    expect($('.move-proxy-btn')).toHaveLength(0);

    $('.proxy-card[data-proxy-id="proxy-a"] .proxy-scenario-association').val('scenario-b').trigger('change');
    await Promise.resolve();

    expect(scenarios[0].proxies).toHaveLength(0);
    expect(scenarios[1].proxies.map(proxy => proxy.id)).toEqual(['proxy-b', 'proxy-a']);
    expect($('.proxy-scenario-group[data-scenario-id="scenario-b"] .proxy-index').map((index, node) => $(node).text()).get()).toEqual(['#1', '#2']);
    expect($('.proxy-card[data-proxy-id="proxy-a"] .proxy-scenario-association').val()).toBe('scenario-b');
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'refreshProxy' });

    const originalAnimate = $.fn.animate;
    $.fn.animate = function (properties, duration, callback) {
      if (callback) callback.call(this);
      return this;
    };
    const groups = $('.proxy-scenario-group').toArray();
    groups[0].getBoundingClientRect = () => ({ bottom: 200 });
    groups[1].getBoundingClientRect = () => ({ bottom: 400 });
    global.StorageModule.save.mockClear();
    global.StorageModule.reorderProxies.mockClear();
    global.chrome.runtime.sendMessage.mockClear();

    $('.proxy-card[data-proxy-id="proxy-b"] .drag-handle').trigger($.Event('mousedown', {
      button: 0,
      clientX: 100,
      clientY: 250
    }));
    $(document).trigger($.Event('mousemove', { clientX: 100, clientY: 100 }));
    await new Promise(resolve => setTimeout(resolve, 20));
    $(document).trigger('mouseup');
    await Promise.resolve();
    $.fn.animate = originalAnimate;

    expect(scenarios[0].proxies.map(proxy => proxy.id)).toEqual(['proxy-b']);
    expect(scenarios[1].proxies.map(proxy => proxy.id)).toEqual(['proxy-a']);
    expect($('.proxy-card[data-proxy-id="proxy-b"] .proxy-scenario-association').val()).toBe('scenario-a');
    expect(global.StorageModule.reorderProxies).toHaveBeenCalledTimes(2);
    expect(global.StorageModule.save).toHaveBeenCalledTimes(1);
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'refreshProxy' });
  });

  test('delete confirmation escapes proxy preview text', () => {
    global.isFirefox = false;
    const proxies = [
      {
        id: 'proxy-1',
        enabled: true,
        name: '<img src=x onerror=alert(1)>',
        protocol: 'http',
        ip: '127.0.0.1',
        port: '8080',
        username: '',
        password: '',
        bypass_rules: '',
        include_rules: '',
        fallback_policy: 'direct'
      }
    ];

    global.UtilsModule.escapeHtml = jest.fn((value) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;'));
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
      getCurrentScenario: jest.fn(() => ({ id: 'scenario-a', name: 'Scenario A' }))
    };
    global.SubscriptionModule = {
      getSubscriptionLineCounts: jest.fn(() => ({ include_lines: 0, bypass_lines: 0 })),
      openModal: jest.fn()
    };

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
    $('.del[data-index="0"]').trigger('click');

    expect($('.delete-tip-content').html()).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect($('.delete-tip-content').html()).not.toContain('<img src=x onerror=alert(1)>');
  });
});
