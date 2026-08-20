const fs = require('fs');
const path = require('path');

const mainHtmlPath = path.join(__dirname, '../../src/main.html');
const mainJsPath = path.join(__dirname, '../../src/js/main.js');
const navigationBootstrapPath = path.join(__dirname, '../../src/js/main-navigation-bootstrap.js');
const mainCssPath = path.join(__dirname, '../../src/css/main.css');
const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');

function readMainCss() {
  const entryCss = fs.readFileSync(mainCssPath, 'utf8');
  const importedCss = Array.from(entryCss.matchAll(/@import url\(['"](.+?)['"]\);/g))
    .map(([, importPath]) => fs.readFileSync(path.join(path.dirname(mainCssPath), importPath), 'utf8'));

  return importedCss.join('\n');
}

describe('main sidebar layout', () => {
  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
    document.body.innerHTML = '';
    delete global.$;
    delete global.jQuery;
    delete global.ScenariosModule;
    delete global.VersionModule;
    delete global.chrome;
    delete window.ScenariosModule;
    delete window.VersionModule;
    delete window.chrome;
    delete window.enhanceNativeSelects;
    document.documentElement.removeAttribute('data-initial-main-page');
  });

  test('uses the project logo and maps navigation items to their pages', () => {
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const navItems = Array.from(pageDocument.querySelectorAll('.main-nav-item'));
    const pages = Array.from(pageDocument.querySelectorAll('.main-page'));

    expect(pageDocument.querySelector('.sidebar-logo img').getAttribute('src')).toBe('./images/icon-128.png');
    expect(pageDocument.querySelector('.sidebar-footer').textContent.trim()).toBe('');
    expect(pageDocument.querySelector('#sidebar-version')).not.toBeNull();
    expect(pageDocument.querySelector('.sidebar-github-link').getAttribute('href')).toBe('https://github.com/bugwz/ProxyAssistant');
    expect(pageDocument.querySelector('.sidebar-github-link').getAttribute('target')).toBe('_blank');
    expect(navItems.map(item => item.dataset.mainPage)).toEqual([
      'proxies',
      'scenarios',
      'subscriptions',
      'config',
      'sync',
      'diagnostics',
      'appearance',
      'about'
    ]);
    expect(navItems.slice(0, 5).map(item => item.textContent.trim())).toEqual([
      '代理节点',
      '代理场景',
      '规则订阅',
      '配置文件',
      '云同步'
    ]);
    navItems.forEach(item => {
      expect(pageDocument.getElementById(item.getAttribute('aria-controls'))).not.toBeNull();
    });
    expect(pages.map(page => page.dataset.page).sort()).toEqual(
      navItems.map(item => item.dataset.mainPage).sort()
    );
    expect(pageDocument.querySelectorAll('[id]').length).toBe(new Set(
      Array.from(pageDocument.querySelectorAll('[id]')).map(element => element.id)
    ).size);
    expect(pageDocument.querySelector('#add-subscription-btn')).not.toBeNull();
    expect(pageDocument.querySelector('#subscription-expand-collapse-btn')).not.toBeNull();
    expect(pageDocument.querySelector('#subscription-manage-list')).not.toBeNull();
    expect(pageDocument.querySelector('#add-subscription-btn [data-i18n="add_new"]')).not.toBeNull();
    expect(pageDocument.querySelector('#page-proxies .page-heading p').dataset.i18n).toBe('proxy_management_desc');
    expect(pageDocument.querySelector('#page-proxies .proxy-toolbar')).toBeNull();
    expect(pageDocument.querySelector('#page-scenarios .page-heading p').dataset.i18n).toBe('scenario_management_desc');
    expect(pageDocument.querySelector('#page-subscriptions .page-heading p').dataset.i18n).toBe('subscription_management_desc');
    const configPage = pageDocument.querySelector('#page-config');
    const configSections = configPage.querySelectorAll(':scope > .system-config-list');
    const configOptionsSection = configPage.querySelector('.config-options-section');
    const currentConfigSection = configPage.querySelector('.current-config-section');
    const syncPage = pageDocument.querySelector('#page-sync');
    const cloudSyncSection = syncPage.querySelector('.cloud-sync-section');
    expect(configSections).toHaveLength(2);
    expect(pageDocument.documentElement.hasAttribute('data-config-options-initializing')).toBe(true);
    expect(readMainCss()).toContain('html[data-config-options-initializing] .config-file-options');
    expect(configOptionsSection.querySelector('.config-row-title').textContent.trim()).toBe('配置选项');
    expect(configOptionsSection.querySelector('#config-include-subscriptions').checked).toBe(true);
    expect(configOptionsSection.querySelector('#config-include-subscription-cache').checked).toBe(false);
    expect(currentConfigSection.querySelector('.config-row-title').textContent.trim()).toBe('当前配置');
    expect(Array.from(currentConfigSection.querySelectorAll('.config-actions button')).map(button => button.id || button.className)).toEqual([
      'import-json-btn',
      'export-btn'
    ]);
    expect(currentConfigSection.querySelector('#config-json-editor').readOnly).toBe(true);
    expect(currentConfigSection.querySelector('#config-json-code')).not.toBeNull();
    expect(currentConfigSection.querySelector('#copy-config-json-btn svg')).not.toBeNull();
    expect(currentConfigSection.querySelector('#toggle-config-json-fold-btn').getAttribute('title')).toBe('全部折叠');
    expect(currentConfigSection.querySelector('#toggle-config-json-fold-btn svg')).not.toBeNull();
    const editorShell = currentConfigSection.querySelector('.config-json-editor-shell');
    const editorToolbar = editorShell.querySelector(':scope > .config-json-toolbar');
    expect(editorToolbar).not.toBeNull();
    expect(editorToolbar.querySelector('.config-json-meta')).not.toBeNull();
    expect(editorToolbar.querySelector('#config-json-version')).not.toBeNull();
    expect(editorToolbar.querySelector('#config-json-size')).not.toBeNull();
    expect(editorToolbar.querySelector('#config-json-updated-at')).not.toBeNull();
    expect(editorToolbar.querySelector('.config-json-toolbar-actions #copy-config-json-btn')).not.toBeNull();
    expect(editorToolbar.querySelector('.config-json-toolbar-actions #toggle-config-json-fold-btn')).not.toBeNull();
    expect(editorShell.querySelector(':scope > #config-json-code')).not.toBeNull();
    expect(currentConfigSection.querySelector('#config-json-code').getAttribute('role')).toBe('textbox');
    expect(currentConfigSection.querySelector('#config-json-code').getAttribute('aria-readonly')).toBe('true');
    expect(syncPage.querySelector('.page-heading h1').textContent.trim()).toBe('云同步');
    expect(cloudSyncSection.querySelector('.sync-config-panel')).not.toBeNull();
    expect(cloudSyncSection.querySelector('#sync-options')).not.toBeNull();
    expect(cloudSyncSection.querySelector('#sync-push-btn')).not.toBeNull();
    expect(cloudSyncSection.querySelector('#sync-pull-btn')).not.toBeNull();
    expect(cloudSyncSection.querySelector('#save-sync-config')).not.toBeNull();
    expect(Array.from(cloudSyncSection.querySelector('#sync-auto-mode').options).map(option => option.value)).toEqual([
      'off',
      'push',
      'pull'
    ]);
    expect(Array.from(cloudSyncSection.querySelector('#sync-interval').options).map(option => option.value)).toEqual([
      '15',
      '30',
      '60',
      '360',
      '720',
      '1440'
    ]);
    expect(cloudSyncSection.querySelector('.sync-pull-warning').textContent).toContain('远程配置完整覆盖本地配置');
    expect(cloudSyncSection.querySelector('#sync-last-time')).not.toBeNull();
    expect(pageDocument.querySelector('.sync-config-tip')).toBeNull();
    expect(pageDocument.querySelector('head script').getAttribute('src')).toBe('./js/main-navigation-bootstrap.js');
    expect(pageDocument.querySelector('.main-nav-item.active')).toBeNull();
    expect(readMainCss()).toContain(
      'html[data-initial-main-page="sync"] .main-page[data-page="sync"]'
    );
    expect(readMainCss()).toContain(
      '.config-json-line[hidden]'
    );
  });

  test('restores the saved page before the navigation markup is rendered', () => {
    window.localStorage.setItem('proxyAssistant.activeMainPage', 'subscriptions');

    window.eval(fs.readFileSync(navigationBootstrapPath, 'utf8'));

    expect(document.documentElement.dataset.initialMainPage).toBe('subscriptions');

    window.localStorage.setItem('proxyAssistant.activeMainPage', 'sync');
    window.eval(fs.readFileSync(navigationBootstrapPath, 'utf8'));

    expect(document.documentElement.dataset.initialMainPage).toBe('sync');

    window.localStorage.setItem('proxyAssistant.activeMainPage', 'removed-page');
    window.eval(fs.readFileSync(navigationBootstrapPath, 'utf8'));

    expect(document.documentElement.dataset.initialMainPage).toBe('proxies');
  });

  test('switches the visible page and refreshes scenario content', () => {
    document.body.innerHTML = `
      <button class="main-nav-item active" data-main-page="proxies" aria-current="page"></button>
      <button class="main-nav-item" data-main-page="scenarios"></button>
      <button class="main-nav-item" data-main-page="about"></button>
      <section class="main-page active" data-page="proxies"></section>
      <section class="main-page" data-page="scenarios" hidden></section>
      <section class="main-page" data-page="about" hidden></section>
      <div id="scenario-manage-list"></div>
    `;

    window.eval(fs.readFileSync(jqueryPath, 'utf8'));
    global.$ = window.$;
    global.jQuery = window.jQuery;
    global.ScenariosModule = {
      renderScenarioManagementList: jest.fn()
    };
    window.ScenariosModule = global.ScenariosModule;
    global.VersionModule = {
      loadVersionInfo: jest.fn(() => Promise.resolve())
    };
    window.VersionModule = global.VersionModule;

    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.initMainNavigation();
    $('.main-nav-item[data-main-page="scenarios"]').trigger('click');

    expect($('.main-nav-item[data-main-page="scenarios"]').attr('aria-current')).toBe('page');
    expect($('.main-page[data-page="proxies"]').prop('hidden')).toBe(true);
    expect($('.main-page[data-page="scenarios"]').prop('hidden')).toBe(false);
    expect(window.localStorage.getItem('proxyAssistant.activeMainPage')).toBe('scenarios');
    expect(global.ScenariosModule.renderScenarioManagementList).toHaveBeenCalledTimes(1);

    $('.main-nav-item[data-main-page="about"]').trigger('click');
    expect($('.main-page[data-page="about"]').prop('hidden')).toBe(false);
    expect(window.localStorage.getItem('proxyAssistant.activeMainPage')).toBe('about');
    expect(global.VersionModule.loadVersionInfo).toHaveBeenCalledTimes(1);
  });

  test('restores the saved page and falls back when the navigation item no longer exists', () => {
    document.body.innerHTML = `
      <button class="main-nav-item active" data-main-page="proxies" aria-current="page"></button>
      <button class="main-nav-item" data-main-page="scenarios"></button>
      <section class="main-page active" data-page="proxies"></section>
      <section class="main-page" data-page="scenarios" hidden></section>
    `;

    window.eval(fs.readFileSync(jqueryPath, 'utf8'));
    global.$ = window.$;
    global.jQuery = window.jQuery;
    global.ScenariosModule = {
      renderScenarioManagementList: jest.fn()
    };
    window.ScenariosModule = global.ScenariosModule;
    window.localStorage.setItem('proxyAssistant.activeMainPage', 'scenarios');

    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.initMainNavigation();

    expect($('.main-nav-item[data-main-page="scenarios"]').attr('aria-current')).toBe('page');
    expect($('.main-page[data-page="scenarios"]').prop('hidden')).toBe(false);
    expect(document.documentElement.hasAttribute('data-initial-main-page')).toBe(false);

    window.localStorage.setItem('proxyAssistant.activeMainPage', 'removed-page');
    window.initMainNavigation();

    expect($('.main-nav-item[data-main-page="proxies"]').attr('aria-current')).toBe('page');
    expect($('.main-page[data-page="proxies"]').prop('hidden')).toBe(false);
    expect(window.localStorage.getItem('proxyAssistant.activeMainPage')).toBe('proxies');
  });

  test('provides collapsible scenario cards and accessible management dialogs', () => {
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const scenarioPage = pageDocument.querySelector('#page-scenarios');

    const addScenarioButton = scenarioPage.querySelector('#open-add-scenario-btn');
    expect(addScenarioButton).not.toBeNull();

    const addScenarioLabel = addScenarioButton.querySelector('[data-i18n="add_new"]');
    expect(addScenarioLabel.textContent.trim()).toBe('新增');
    expect(scenarioPage.querySelector('#scenario-expand-collapse-btn')).not.toBeNull();
    expect(scenarioPage.querySelector('#scenario-manage-list')).not.toBeNull();
    expect(scenarioPage.querySelector('.scenario-overview')).toBeNull();
    expect(pageDocument.querySelector('.add-scenario-tip')).toBeNull();

    const dialogs = Array.from(pageDocument.querySelectorAll('.scenario-dialog-tip'));
    expect(dialogs).toHaveLength(3);
    dialogs.forEach(dialog => {
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    });

    const css = readMainCss();
    expect(css).toMatch(/\.scenario-card-header \.scenario-drag-handle\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s);
    expect(css).toMatch(/\.scenario-condition-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.7fr\) minmax\(0, 0\.7fr\) minmax\(0, 2\.6fr\) 72px;/s);
    expect(css).toMatch(/\.scenario-time-value\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.3fr\) minmax\(0, 1fr\) 12px minmax\(0, 1fr\);/s);
    expect(css).toMatch(/\.scenario-time-value \.scenario-time-input\s*\{[^}]*height:\s*38px;[^}]*font-family:\s*inherit;/s);
    expect(css).toMatch(/\.proxy-body \.form-grid > \.form-item:nth-child\(3\)/);
    expect(css).toMatch(/\.proxy-subscription-trigger\s*\{[^}]*height:\s*36px;[^}]*border:\s*1px solid #e2e8f0;[^}]*border-radius:\s*6px;/s);
    expect(css).toMatch(/\.proxy-subscription-search-row\s*\{[^}]*height:\s*38px;[^}]*border:\s*1px solid #e2e8f0;[^}]*border-radius:\s*6px;/s);
    expect(css).toMatch(/\.proxy-subscription-search-row:focus-within\s*\{[^}]*border-color:\s*#4164f5;[^}]*box-shadow:/s);
    expect(css).toMatch(/\.proxy-body \.form-grid > \.form-item\s*\{[^}]*grid-column:\s*1 \/ -1\s*!important;/s);
  });

  test('keeps open form menus above surrounding content without clipping', () => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div class="system-config-list">
        <div class="config-row">
          <div class="lh-select">
            <div class="lh-select-k">Language</div>
            <ul class="lh-select-op"><li>English</li></ul>
          </div>
        </div>
      </div>
    `;

    window.eval(fs.readFileSync(jqueryPath, 'utf8'));
    global.$ = window.$;
    global.jQuery = window.jQuery;
    global.chrome = {
      storage: {
        onChanged: {
          addListener: jest.fn()
        }
      }
    };
    window.chrome = global.chrome;
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));
    window.initDropdowns();

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    $('.lh-select-k')[0].getBoundingClientRect = () => ({
      top: 520,
      bottom: 556
    });
    const originalOuterHeight = $.fn.outerHeight;
    $.fn.outerHeight = jest.fn(() => 190);

    $('.lh-select-k').trigger('click');
    jest.runOnlyPendingTimers();

    expect($('.lh-select').hasClass('dropdown-open')).toBe(true);
    expect($('.lh-select-op').hasClass('drop-up')).toBe(true);
    expect($('.lh-select-op').css('display')).not.toBe('none');

    $('html').trigger('click');
    expect($('.lh-select').hasClass('dropdown-open')).toBe(false);
    expect($('.lh-select-op').hasClass('drop-up')).toBe(false);
    expect($('.lh-select-op').css('display')).toBe('none');

    $.fn.outerHeight = originalOuterHeight;

    const css = readMainCss();
    expect(css).toMatch(/\.system-config-list\s*\{[^}]*overflow:\s*visible;/s);
    expect(css).toMatch(/\.lh-select\.dropdown-open\s*\{[^}]*z-index:\s*var\(--layer-dropdown\);/s);
  });

  test('enhances native selects with the protocol dropdown menu style and preserves change events', () => {
    document.body.innerHTML = `
      <div class="form-item">
        <label>默认代理</label>
        <select class="subscription-card-select scenario-default-proxy-select">
          <option value="">暂无可用代理</option>
          <option value="proxy-a">公司代理</option>
        </select>
      </div>
    `;

    window.eval(fs.readFileSync(jqueryPath, 'utf8'));
    global.$ = window.$;
    global.jQuery = window.jQuery;
    global.chrome = {
      storage: {
        onChanged: {
          addListener: jest.fn()
        }
      }
    };
    window.chrome = global.chrome;
    window.eval(fs.readFileSync(mainJsPath, 'utf8'));

    const changeHandler = jest.fn();
    $('.scenario-default-proxy-select').on('change', changeHandler);
    window.initDropdowns();

    const $container = $('.native-select-enhanced');
    expect($container.hasClass('lh-select')).toBe(true);
    expect($container.find('.native-select-trigger').attr('aria-label')).toBe('默认代理');
    expect($container.find('.native-select-value').text()).toBe('暂无可用代理');
    expect($container.find('.native-select-options li').map((index, item) => $(item).text()).get())
      .toEqual(['暂无可用代理', '公司代理']);
    expect($('.scenario-default-proxy-select').hasClass('native-select-source')).toBe(true);

    $container.find('.native-select-options li[data-value="proxy-a"]').trigger('click');

    expect($('.scenario-default-proxy-select').val()).toBe('proxy-a');
    expect($container.find('.native-select-value').text()).toBe('公司代理');
    expect(changeHandler).toHaveBeenCalledTimes(1);

    $('.scenario-default-proxy-select').val('').trigger('change');
    expect($container.find('.native-select-value').text()).toBe('暂无可用代理');

    const css = readMainCss();
    expect(css).toMatch(/\.native-select-source\s*\{[^}]*clip-path:\s*inset\(50%\)\s*!important;/s);
    expect(css).toMatch(/\.native-select-enhanced\.dropdown-open \.select-icon\s*\{[^}]*transform:\s*rotate\(180deg\);/s);
  });
});
