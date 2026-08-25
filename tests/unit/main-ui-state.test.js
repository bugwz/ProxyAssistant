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
    <button id="pac-copy-btn"></button>
    <button id="pac-toggle-btn" data-action="collapse" aria-expanded="true"></button>
    <div id="pac-script-content"></div>
    <div id="pac-script-wrapper"></div>
    <button id="native-save-sync-config" class="save-sync-config" data-sync-service="native"></button>
    <button id="gist-save-sync-config" class="save-sync-config" data-sync-service="gist"></button>
    <button id="native-sync-pull-btn" data-sync-service="native" data-sync-action="pull"></button>
    <button id="native-sync-push-btn" data-sync-service="native" data-sync-action="push"></button>
    <button id="gist-sync-pull-btn" data-sync-service="gist" data-sync-action="pull"></button>
    <button id="gist-sync-push-btn" data-sync-service="gist" data-sync-action="push"></button>
    <button id="native-test-sync-connection" class="test-sync-connection" data-sync-service="native"><span>Test</span></button>
    <button id="gist-test-sync-connection" class="test-sync-connection" data-sync-service="gist"><span>Test</span></button>
    <div id="gist-token-eye"><input type="checkbox"></div>
    <input id="gist-token" />
    <input id="gist-filename" />
    <select id="native-sync-auto-mode" class="sync-auto-mode" data-sync-service="native"><option value="off">Off</option><option value="push">Push</option><option value="pull">Pull</option></select>
    <select id="native-sync-interval" class="sync-interval" data-sync-service="native"><option value="30">30</option><option value="360">360</option></select>
    <select id="gist-sync-auto-mode" class="sync-auto-mode" data-sync-service="gist"><option value="off">Off</option><option value="push">Push</option><option value="pull">Pull</option></select>
    <select id="gist-sync-interval" class="sync-interval" data-sync-service="gist"><option value="30">30</option><option value="360">360</option></select>
    <div class="export-btn"></div>
    <div class="import-json-btn"></div>
    <button id="refresh-config-json-btn"></button>
    <input id="json-file-input" />
    <textarea id="config-json-editor" readonly></textarea>
    <button id="toggle-config-json-fold-btn" data-action="collapse"></button>
    <button id="copy-config-json-btn"></button>
    <span id="config-json-version"></span>
    <span id="config-json-size"></span>
    <span id="config-json-updated-at"></span>
    <span id="config-json-last-fetched-at"></span>
    <div id="config-json-code-wrapper">
      <div id="config-json-loading" aria-hidden="true"><span>config_fetching</span></div>
      <div id="config-json-code"></div>
    </div>
    <div class="config-file-options">
      <input type="checkbox" id="config-include-subscriptions" checked />
      <input type="checkbox" id="config-include-subscription-cache" />
    </div>
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
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-config-options-initializing');
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
      getSyncConfig: jest.fn(() => ({ native: {}, gist: {} })),
      updateNativeQuotaInfo: jest.fn(),
      manualPull: jest.fn(),
      manualPush: jest.fn(),
      testNativeConnection: jest.fn(),
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
      getConfig: jest.fn(() => ({ system: { app_language: 'zh-CN', sync: { native: {}, gist: {} } } })),
      getConfigUpdatedAt: jest.fn(() => '2026-08-20T06:30:00.000Z'),
      getProxies: jest.fn(() => []),
      save: jest.fn(() => Promise.resolve()),
      reload: jest.fn(() => Promise.resolve()),
      isCurrentConfig: jest.fn(() => false),
      isSubscriptionOnlyChange: jest.fn(() => false),
      mergeSubscriptionChanges: jest.fn(),
      setSyncConfig: jest.fn()
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
      importConfig: jest.fn(),
      buildConfigData: jest.fn(() => ({ version: 5, scenarios: { lists: [] } })),
      buildEditableConfigData: jest.fn(() => ({ version: 5, scenarios: { lists: [] } })),
      applyConfigData: jest.fn(() => Promise.resolve())
    };
    global.generateProxyId = jest.fn(() => 'generated-proxy-id');
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn(() => Promise.resolve()) }
    });
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

  test('does not reload a configuration saved by the current page', () => {
    global.StorageModule.isCurrentConfig.mockReturnValue(true);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.initDropdowns();

    const listener = global.chrome.storage.onChanged.addListener.mock.calls[0][0];
    const savedConfig = { version: 5, updated_at: '2026-08-20T06:30:00.000Z' };
    listener({
      config: { oldValue: {}, newValue: savedConfig },
      config_updated_at: { newValue: savedConfig.updated_at }
    }, 'local');

    expect(global.StorageModule.reload).not.toHaveBeenCalled();
    expect(global.ConfigModule.buildEditableConfigData).not.toHaveBeenCalled();
  });

  test('refreshes both cloud sync service settings after a background configuration update', async () => {
    const updatedSync = {
      native: {
        auto_mode: 'pull',
        interval_minutes: 30,
        last_sync_at: '2026-08-19T08:00:00.000Z'
      },
      gist: { auto_mode: 'push', interval_minutes: 360 }
    };
    global.StorageModule.getConfig.mockReturnValue({ system: { sync: updatedSync } });
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.initDropdowns();

    const listener = global.chrome.storage.onChanged.addListener.mock.calls[0][0];
    listener({ config: { oldValue: {}, newValue: { system: { sync: updatedSync } } } }, 'local');
    await Promise.resolve();
    await Promise.resolve();

    expect(global.SyncModule.setSyncConfig).toHaveBeenCalledWith(updatedSync);
    expect(global.SyncModule.updateSyncUI).toHaveBeenCalled();
  });

  test('saves each cloud sync service from its own card', async () => {
    let currentSyncConfig = { native: {}, gist: {} };
    global.SyncModule.getSyncConfig.mockImplementation(() => currentSyncConfig);
    global.SyncModule.setSyncConfig.mockImplementation(config => {
      currentSyncConfig = config;
    });
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();

    $('#gist-token').val('test-token');
    $('#gist-filename').val('shared-config.json');
    $('#native-sync-auto-mode').val('push');
    $('#native-sync-interval').val('360');
    $('#gist-sync-auto-mode').val('pull');
    $('#gist-sync-interval').val('30');
    $('#native-save-sync-config').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(global.StorageModule.setSyncConfig).toHaveBeenCalledWith({
      native: { auto_mode: 'push', interval_minutes: 360 },
      gist: {}
    });

    $('#gist-save-sync-config').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(global.StorageModule.setSyncConfig).toHaveBeenLastCalledWith({
      native: { auto_mode: 'push', interval_minutes: 360 },
      gist: {
        token: 'test-token',
        filename: 'shared-config.json',
        auto_mode: 'pull',
        interval_minutes: 30
      }
    });
    expect(global.StorageModule.save).toHaveBeenCalledTimes(2);
    expect(global.SyncModule.updateSyncUI).toHaveBeenCalled();
  });

  test('runs push and pull for each cloud sync service independently', () => {
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();

    $('#native-sync-push-btn').trigger('click');
    $('#gist-sync-push-btn').trigger('click');
    $('#native-sync-pull-btn').trigger('click');
    $('#gist-sync-pull-btn').trigger('click');

    const configFileOptions = {
      includeSubscriptions: true,
      includeSubscriptionCache: false
    };
    expect(global.SyncModule.manualPush).toHaveBeenNthCalledWith(1, 'native', configFileOptions);
    expect(global.SyncModule.manualPush).toHaveBeenNthCalledWith(2, 'gist', configFileOptions);
    expect(global.SyncModule.manualPull).toHaveBeenNthCalledWith(1, 'native');
    expect(global.SyncModule.manualPull).toHaveBeenNthCalledWith(2, 'gist');
  });

  test('tests the connection for the service card that was clicked', async () => {
    global.SyncModule.testNativeConnection.mockResolvedValue('native-connected');
    global.SyncModule.testGistConnection.mockResolvedValue('gist-connected');
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();

    $('#native-test-sync-connection').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(global.SyncModule.testNativeConnection).toHaveBeenCalledTimes(1);
    expect(global.SyncModule.testGistConnection).not.toHaveBeenCalled();
    expect($('#native-test-sync-connection').prop('disabled')).toBe(false);

    $('#gist-token').val('test-token');
    $('#gist-filename').val('shared-config.json');
    $('#gist-test-sync-connection').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(global.SyncModule.testGistConnection).toHaveBeenCalledTimes(1);
    expect(global.SyncModule.setSyncConfig).toHaveBeenCalledWith(expect.objectContaining({
      gist: expect.objectContaining({ token: 'test-token', filename: 'shared-config.json' })
    }));
    expect($('#gist-test-sync-connection').prop('disabled')).toBe(false);
  });

  test('renders the current JSON configuration as read-only content', () => {
    const config = { version: 5, scenarios: { current: 'a', lists: [] } };
    global.ConfigModule.buildEditableConfigData.mockReturnValue(config);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();
    window.refreshConfigEditor(true);

    expect($('#config-json-editor').prop('readonly')).toBe(true);
    expect(JSON.parse($('#config-json-editor').val())).toEqual(config);
    expect($('#config-json-code .config-json-line-content')).not.toHaveLength(0);
    expect($('#config-json-code .config-json-line-content').toArray().every(element => (
      element.getAttribute('contenteditable') === 'false'
    ))).toBe(true);
    expect(global.ConfigModule.applyConfigData).not.toHaveBeenCalled();
  });

  test('shows configuration version, file size, update time, and fetch time in the editor header', () => {
    const config = { version: 5, name: '代理配置' };
    global.ConfigModule.buildEditableConfigData.mockReturnValue(config);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.refreshConfigEditor(true);

    const formatted = JSON.stringify(config, null, 2);
    const compact = JSON.stringify(config);
    expect($('#config-json-version').text()).toBe('v5');
    expect($('#config-json-size').text()).toBe(`${new Blob([formatted]).size} B / ${new Blob([compact]).size} B`);
    expect($('#config-json-size').attr('title')).toBe('config_file_size_details');
    expect($('#config-json-updated-at').text()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect($('#config-json-last-fetched-at').text()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test('shows fetching feedback before refreshing the current configuration', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 22, 8, 0, 0));
    global.ConfigModule.buildEditableConfigData.mockReturnValue({ version: 5, refreshed: true });
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();
    $('#config-json-code-wrapper')[0].getBoundingClientRect = jest.fn(() => ({ height: 486 }));

    $('#refresh-config-json-btn').trigger('click');

    expect($('#refresh-config-json-btn').prop('disabled')).toBe(true);
    expect($('#config-json-editor').val()).toBe('');
    expect($('#config-json-code').text()).toBe('');
    expect($('#config-json-code-wrapper').hasClass('is-refreshing')).toBe(true);
    expect($('#config-json-code-wrapper').attr('aria-busy')).toBe('true');
    expect($('#config-json-loading').attr('aria-hidden')).toBe('false');
    expect($('#config-json-loading').text()).toBe('config_fetching');
    expect($('#config-json-code-wrapper')[0].style.height).toBe('486px');

    await jest.advanceTimersByTimeAsync(599);
    expect($('#refresh-config-json-btn').prop('disabled')).toBe(true);

    await jest.advanceTimersByTimeAsync(1);
    await Promise.resolve();

    expect($('#refresh-config-json-btn').prop('disabled')).toBe(false);
    expect(JSON.parse($('#config-json-editor').val())).toEqual({ version: 5, refreshed: true });
    expect($('#config-json-code-wrapper').hasClass('is-refreshing')).toBe(false);
    expect($('#config-json-code-wrapper').attr('aria-busy')).toBe('false');
    expect($('#config-json-loading').attr('aria-hidden')).toBe('true');
    expect($('#config-json-code-wrapper')[0].style.height).toBe('');
    expect($('#config-json-last-fetched-at').text()).not.toBe('config_never_updated');
    jest.useRealTimers();
  });

  test('keeps the version refresh icon in place and blocks repeated clicks', async () => {
    let resolveRefresh;
    global.VersionModule.checkGitHubVersion.mockImplementation(() => new Promise(resolve => {
      resolveRefresh = resolve;
    }));
    document.body.insertAdjacentHTML('beforeend', `
      <div id="github-version-value">
        <button type="button" class="version-row-retry-btn" data-source="github">
          <svg class="version-refresh-icon"></svg>
        </button>
      </div>
    `);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();

    const $button = $('.version-row-retry-btn');
    $button.trigger('click');
    $button.trigger('click');

    expect(global.VersionModule.checkGitHubVersion).toHaveBeenCalledTimes(1);
    expect(global.VersionModule.checkGitHubVersion).toHaveBeenCalledWith('test-version', true);
    expect($button.prop('disabled')).toBe(true);
    expect($button.hasClass('is-refreshing')).toBe(true);
    expect($button.find('.version-refresh-icon')).toHaveLength(1);

    resolveRefresh();
    await Promise.resolve();
    await Promise.resolve();

    expect($button.prop('disabled')).toBe(false);
    expect($button.hasClass('is-refreshing')).toBe(false);
  });

  test('returns to the first line after refreshing the configuration editor', () => {
    const config = {
      version: 5,
      system: { app_language: 'zh-CN' },
      scenarios: { current: 'default', lists: [] }
    };
    global.ConfigModule.buildEditableConfigData.mockReturnValue(config);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.refreshConfigEditor(true);

    const $code = $('#config-json-code');
    $code.scrollTop(160).scrollLeft(80);
    window.refreshConfigEditor(true);

    expect($code.scrollTop()).toBe(0);
    expect($code.scrollLeft()).toBe(0);
    expect($code.find('.config-json-line-number').first().text()).toBe('1');
    expect($code.find('.config-json-line-content').first().text()).toBe('{');
  });

  test('controls subscription definitions and cached content in the configuration file', () => {
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();

    $('#config-include-subscription-cache').prop('checked', true).trigger('change');
    expect(global.ConfigModule.buildEditableConfigData).toHaveBeenLastCalledWith({
      includeSubscriptions: true,
      includeSubscriptionCache: true
    });
    expect(global.UtilsModule.showTip).toHaveBeenLastCalledWith('config_options_updated', false);

    $('#config-include-subscriptions').prop('checked', false).trigger('change');
    expect($('#config-include-subscription-cache').prop('disabled')).toBe(true);
    expect(global.ConfigModule.buildEditableConfigData).toHaveBeenLastCalledWith({
      includeSubscriptions: false,
      includeSubscriptionCache: false
    });
    expect(global.SyncModule.updateNativeQuotaInfo).toHaveBeenLastCalledWith({
      includeSubscriptions: false,
      includeSubscriptionCache: false
    });
    expect(global.UtilsModule.showTip).toHaveBeenLastCalledWith('config_options_updated', false);
    expect(global.UtilsModule.showTip).toHaveBeenCalledTimes(2);

    $('.export-btn').trigger('click');
    expect(global.ConfigModule.exportConfig).toHaveBeenCalledWith({
      includeSubscriptions: false,
      includeSubscriptionCache: false
    });
  });

  test('hydrates configuration switches before revealing their saved state', () => {
    window.localStorage.setItem('proxyAssistant.config.includeSubscriptions', 'false');
    window.localStorage.setItem('proxyAssistant.config.includeSubscriptionCache', 'true');
    document.documentElement.setAttribute('data-config-options-initializing', '');
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));

    window.initConfigFileOptions();

    expect($('#config-include-subscriptions').prop('checked')).toBe(false);
    expect($('#config-include-subscription-cache').prop('checked')).toBe(true);
    expect($('#config-include-subscription-cache').prop('disabled')).toBe(true);
    expect(document.documentElement.hasAttribute('data-config-options-initializing')).toBe(false);
  });

  test('folds and expands read-only JSON structures', () => {
    const config = {
      version: 5,
      system: { app_language: 'zh-CN' },
      scenarios: { current: 'default', lists: [] }
    };
    global.ConfigModule.buildEditableConfigData.mockReturnValue(config);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();
    window.refreshConfigEditor(true);

    const $rootLine = $('#config-json-code .config-json-line').first();
    expect($rootLine.find('.config-json-fold')).toHaveLength(1);

    expect($('#toggle-config-json-fold-btn').attr('data-action')).toBe('collapse');
    $('#toggle-config-json-fold-btn').trigger('click');
    expect($('#config-json-code .config-json-line').eq(1).prop('hidden')).toBe(true);

    expect($('#toggle-config-json-fold-btn').attr('data-action')).toBe('expand');
    $('#toggle-config-json-fold-btn').trigger('click');
    expect($('#config-json-code .config-json-line').eq(1).prop('hidden')).toBe(false);
    expect($('#toggle-config-json-fold-btn').attr('data-action')).toBe('collapse');

    $('#config-json-code .config-json-line').first().find('.config-json-fold').trigger('click');
    expect($('#config-json-code .config-json-line').eq(1).prop('hidden')).toBe(true);
    expect(JSON.parse($('#config-json-editor').val())).toEqual(config);
    expect($('#config-json-code .config-json-line-content').first().attr('contenteditable')).toBe('false');
  });

  test('copies the complete JSON configuration when content is folded', async () => {
    const config = {
      version: 5,
      system: { app_language: 'zh-CN' },
      scenarios: { current: 'default', lists: [] }
    };
    global.ConfigModule.buildEditableConfigData.mockReturnValue(config);
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();
    window.refreshConfigEditor(true);
    $('#toggle-config-json-fold-btn').trigger('click');
    $('#copy-config-json-btn').trigger('click');
    await Promise.resolve();

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(config, null, 2));
    expect(global.UtilsModule.showTip).toHaveBeenCalledWith('copy_success', false);
  });

  test('copies the complete PAC script and toggles its code panel', async () => {
    const script = 'function FindProxyForURL(url, host) {\n  return "DIRECT";\n}';
    $('#pac-script-content')
      .data('script', script)
      .html('<div><span class="config-json-line-number">1</span><span>function FindProxyForURL(url, host) {</span></div>');
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.bindGlobalEvents();

    $('#pac-toggle-btn').trigger('click');
    expect($('#pac-script-wrapper').hasClass('collapsed')).toBe(true);
    expect($('#pac-toggle-btn').attr('data-action')).toBe('expand');
    expect($('#pac-toggle-btn').attr('aria-expanded')).toBe('false');
    expect($('#pac-toggle-btn').attr('title')).toBe('expand_all');

    $('#pac-copy-btn').trigger('click');
    await Promise.resolve();
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(script);
    expect(global.UtilsModule.showTip).toHaveBeenCalledWith('copy_success', false);

    $('#pac-toggle-btn').trigger('click');
    expect($('#pac-script-wrapper').hasClass('collapsed')).toBe(false);
    expect($('#pac-toggle-btn').attr('data-action')).toBe('collapse');
    expect($('#pac-toggle-btn').attr('aria-expanded')).toBe('true');
    expect($('#pac-toggle-btn').attr('title')).toBe('collapse_all');
  });

  test('switchScenario keeps the current scenario when worker activation fails', async () => {
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
      save: jest.fn(() => Promise.resolve())
    };
    global.ProxyModule = {
      setList: jest.fn(),
      renderList: jest.fn()
    };
    global.onScenarioSwitch = jest.fn();
    window.StorageModule = global.StorageModule;
    window.ProxyModule = global.ProxyModule;
    window.onScenarioSwitch = global.onScenarioSwitch;
    global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback({ success: false, error: 'apply failed' });
    });

    const scenariosModule = loadScenariosModule({
      StorageModule: global.StorageModule,
      ProxyModule: global.ProxyModule,
      UtilsModule: global.UtilsModule,
      I18n: global.I18n,
      ConfigModule: global.ConfigModule,
      onScenarioSwitch: global.onScenarioSwitch
    });

    await scenariosModule.switchScenario('scenario-b');

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'activateScenario', scenarioId: 'scenario-b', source: 'manual' },
      expect.any(Function)
    );
    expect(global.StorageModule.setCurrentScenarioId).not.toHaveBeenCalled();
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
      <div class="edit-scenario-tip"></div>
      <div class="delete-scenario-tip"></div>
      <div class="alert-scenario-tip"></div>
    `;

    const scenarios = [
      {
        id: 'scenario-a',
        name: 'Home',
        defaultProxyId: null,
        proxies: [{ id: 'proxy-a', name: 'Proxy A', ip: '127.0.0.1', port: '8080', enabled: true }],
        automation: {
          enabled: true,
          rules: [
            { type: 'time', operator: 'if', weekdays: [1, 2, 3, 4, 5], start: '08:00', end: '17:00' },
            { type: 'time', operator: 'or', weekdays: [6, 0], start: '10:00', end: '14:00' }
          ]
        }
      },
      {
        id: 'scenario-b',
        name: 'Work',
        defaultProxyId: 'proxy-b',
        proxies: [
          { id: 'proxy-b', name: 'Proxy B', ip: '10.0.0.1', port: '8080', enabled: true },
          { id: 'proxy-c', name: 'Proxy C', ip: '10.0.0.2', port: '8080', enabled: true }
        ]
      }
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

    global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback({ success: true, scenarioId: message.scenarioId });
    });

    scenariosModule.init();
    scenariosModule.renderScenarioManagementList();

    expect($('.scenario-card')).toHaveLength(2);
    expect($('.scenario-card.collapsed')).toHaveLength(2);
    expect($('.scenario-card .proxy-index').map((index, node) => $(node).text()).get()).toEqual(['#1', '#2']);
    expect($('.scenario-card.is-current').data('id')).toBe('scenario-a');
    expect($('.scenario-card-header .header-right').first().children()).toHaveLength(2);
    expect($('.scenario-card-actions').map((index, node) => $(node).children().length).get()).toEqual([2, 2]);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-default-proxy-select').val()).toBe('');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-default-proxy-select option').map((index, node) => $(node).text()).get()).toEqual([
      'scenario_last_used_proxy',
      'Proxy A - 127.0.0.1:8080'
    ]);
    expect($('.scenario-card[data-id="scenario-b"] .scenario-default-proxy-select').val()).toBe('proxy-b');
    expect($('.scenario-card[data-id="scenario-b"] .scenario-default-proxy-select option').eq(1).text()).toBe('Proxy B - 10.0.0.1:8080');
    scenarios[1].proxies[0].name = 'Updated Proxy';
    scenarios[1].proxies[0].ip = '10.0.1.1';
    scenarios[1].proxies[0].port = '9090';
    scenariosModule.renderScenarioManagementList();
    expect($('.scenario-card[data-id="scenario-b"] .scenario-default-proxy-select').val()).toBe('proxy-b');
    expect($('.scenario-card[data-id="scenario-b"] .scenario-default-proxy-select option').eq(1).text()).toBe('Updated Proxy - 10.0.1.1:9090');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-enabled').val()).toBe('on');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-panel').hasClass('hidden')).toBe(false);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-summary strong').text().trim()).toBe('scenario_conditions');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-strategy-info').attr('data-tooltip')).toBe('scenario_conditions_hint');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-strategy-info svg')).toHaveLength(1);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-row')).toHaveLength(2);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-columns span').slice(0, 3).map((index, node) => $(node).text()).get()).toEqual([
      'scenario_condition_relation',
      'scenario_strategy_type',
      'scenario_strategy_value'
    ]);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-row > .form-item > label')).toHaveLength(0);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-operator-select').eq(0).val()).toBe('if');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-operator-select').eq(0).prop('disabled')).toBe(true);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-operator-select').eq(1).val()).toBe('or');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-operator-select').eq(1).prop('disabled')).toBe(false);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-type-select').map((index, node) => $(node).val()).get()).toEqual(['time', 'time']);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-weekday-select')).toHaveLength(2);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-weekday-select').first().find('.scenario-weekday-option input')).toHaveLength(7);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-weekday-select').eq(1).find('.scenario-weekday-option input:checked').map((index, node) => Number($(node).val())).get()).toEqual([6, 0]);
    $('.scenario-card[data-id="scenario-a"] .scenario-weekday-trigger').first().trigger('click');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-weekday-select').first().hasClass('open')).toBe(true);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-weekday-select').first().find('.scenario-weekday-option')).toHaveLength(7);
    $('.scenario-card[data-id="scenario-a"] .scenario-weekday-select').first().find('.scenario-weekday-option input[value="0"]').prop('checked', true).trigger('change');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-weekday-value').first().text()).toContain('scenario_day_sunday');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-actions')).toHaveLength(2);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-remove').first().prop('disabled')).toBe(true);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-start').val()).toBe('08:00');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-start').attr('type')).toBe('text');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-start').attr('inputmode')).toBe('numeric');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-start').attr('maxlength')).toBe('5');
    $('.scenario-card[data-id="scenario-a"] .scenario-automation-enabled').val('off').trigger('change');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-panel').hasClass('hidden')).toBe(true);
    $('.scenario-card[data-id="scenario-a"] .scenario-automation-enabled').val('on').trigger('change');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-panel').hasClass('hidden')).toBe(false);

    $('#scenario-expand-collapse-btn').trigger('click');
    expect($('.scenario-card.collapsed')).toHaveLength(0);

    $('.scenario-card[data-id="scenario-a"] .scenario-card-name-input').val('HomeOffice');
    $('.scenario-card[data-id="scenario-a"] .scenario-condition-operator-select').eq(1).val('and').trigger('change');
    $('.scenario-card[data-id="scenario-a"] .scenario-condition-add').last().trigger('click');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-row')).toHaveLength(3);
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-operator-select').eq(2).val()).toBe('and');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-operator-select').eq(2).prop('disabled')).toBe(true);
    $('.scenario-card[data-id="scenario-a"] .scenario-condition-remove').last().trigger('click');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-condition-row')).toHaveLength(2);
    global.StorageModule.updateScenario.mockClear();
    $('.scenario-card[data-id="scenario-a"] .scenario-automation-start').first().val('24:00').trigger('blur');
    expect($('.scenario-card[data-id="scenario-a"] .scenario-automation-start').first().hasClass('input-error')).toBe(true);
    $('.scenario-card[data-id="scenario-a"] .scenario-card-save').trigger('click');
    expect(global.StorageModule.updateScenario).not.toHaveBeenCalled();
    $('.scenario-card[data-id="scenario-a"] .scenario-automation-start').first().val('08:00').trigger('input');
    $('.scenario-card[data-id="scenario-a"] .scenario-card-save').trigger('click');
    expect(onScenarioRename).toHaveBeenCalledWith('scenario-a', 'HomeOffice');
    expect(global.StorageModule.updateScenario).toHaveBeenCalledWith('scenario-a', expect.objectContaining({
      defaultProxyId: null,
      automation: expect.objectContaining({
        enabled: true,
        rules: expect.arrayContaining([expect.objectContaining({ operator: 'if' }), expect.objectContaining({ operator: 'and' })])
      })
    }));

    $('#open-add-scenario-btn').trigger('click');
    expect(global.StorageModule.addScenario).toHaveBeenCalledWith({
      id: 'scenario-new',
      name: '',
      proxies: [],
      defaultProxyId: null,
      lastProxyId: null,
      automation: {
        enabled: false,
        rules: [{ type: 'time', operator: 'if', weekdays: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }]
      }
    });
    expect($('.scenario-card')).toHaveLength(3);
    expect($('.scenario-card[data-id="scenario-new"]').hasClass('collapsed')).toBe(false);
    expect($('.scenario-card[data-id="scenario-new"] .scenario-card-name-input').val()).toBe('');
    expect(onScenarioAdd).not.toHaveBeenCalled();

    $('.scenario-card[data-id="scenario-new"] .scenario-card-name-input').val('Travel');
    $('.scenario-card[data-id="scenario-new"] .scenario-card-save').trigger('click');
    expect(onScenarioAdd).toHaveBeenCalledWith('scenario-new', 'Travel');
    expect(global.StorageModule.updateScenario).toHaveBeenCalledWith('scenario-new', expect.objectContaining({
      name: 'Travel',
      defaultProxyId: null
    }));
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
      getSubscriptionLineCounts: jest.fn(() => ({ include_lines: 12, bypass_lines: 3 })),
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
    expect($('.proxy-subscription-option-type').text()).toBe('AutoProxy');
    expect($('.proxy-subscription-option-type').hasClass('autoproxy')).toBe(true);
    expect($('.proxy-subscription-option-name').text()).toBe('Shared Rules');
    expect($('.proxy-subscription-option-counts strong').map(function () { return $(this).text(); }).get()).toEqual(['3', '12']);
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

  test('groups proxies, supports dragging, and stops auto-scroll when the window loses focus', async () => {
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
    expect($('.proxy-empty-state')).toHaveLength(0);
    expect($('.proxy-card .proxy-index').map((index, node) => $(node).text()).get()).toEqual(['#1', '#1']);
    expect($('.proxy-scenario-association').map((index, node) => $(node).val()).get()).toEqual(['scenario-a', 'scenario-b']);
    expect($('.proxy-association-form-item').first()[0].style.gridColumn).toBe('span 6');
    expect($('.proxy-subscriptions-form-item').first()[0].style.gridColumn).toBe('span 6');
    expect($('.proxy-association-form-item').first().parent()[0]).toBe($('.proxy-subscriptions-form-item').first().parent()[0]);
    expect($('.move-proxy-btn')).toHaveLength(0);

    $('.proxy-card[data-proxy-id="proxy-a"] .proxy-scenario-association').val('scenario-b').trigger('change');
    await Promise.resolve();

    expect(scenarios[0].proxies).toHaveLength(0);
    expect(scenarios[1].proxies.map(proxy => proxy.id)).toEqual(['proxy-b', 'proxy-a']);
    expect($('.proxy-scenario-group[data-scenario-id="scenario-a"] .proxy-empty-state')).toHaveLength(1);
    expect($('.proxy-scenario-group[data-scenario-id="scenario-a"] .proxy-empty-state span').text()).toBe('no_proxy_added');
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

    const originalScrollBy = window.scrollBy;
    window.scrollBy = jest.fn();
    $.fn.animate = function (properties, duration, callback) {
      if (callback) callback.call(this);
      return this;
    };
    $('.proxy-card .drag-handle').first().trigger($.Event('mousedown', {
      button: 0,
      clientX: 100,
      clientY: 100
    }));
    $(document).trigger($.Event('mousemove', { clientX: 100, clientY: 0 }));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(window.scrollBy).toHaveBeenCalled();

    $(window).triggerHandler('blur');
    const scrollCountAfterBlur = window.scrollBy.mock.calls.length;
    $(document).trigger($.Event('mousemove', { clientX: 100, clientY: 0 }));
    await new Promise(resolve => setTimeout(resolve, 40));

    expect(window.scrollBy).toHaveBeenCalledTimes(scrollCountAfterBlur);
    expect($('.proxy-card-clone')).toHaveLength(0);
    $.fn.animate = originalAnimate;
    window.scrollBy = originalScrollBy;
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
