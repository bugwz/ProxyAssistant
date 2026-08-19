const fs = require('fs');
const path = require('path');

const mainHtmlPath = path.join(__dirname, '../../src/main.html');
const mainJsPath = path.join(__dirname, '../../src/js/main.js');
const navigationBootstrapPath = path.join(__dirname, '../../src/js/main-navigation-bootstrap.js');
const mainCssPath = path.join(__dirname, '../../src/css/main.css');
const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');

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
      'sync',
      'config',
      'diagnostics',
      'appearance',
      'about'
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
    expect(pageDocument.querySelector('head script').getAttribute('src')).toBe('./js/main-navigation-bootstrap.js');
    expect(pageDocument.querySelector('.main-nav-item.active')).toBeNull();
  });

  test('restores the saved page before the navigation markup is rendered', () => {
    window.localStorage.setItem('proxyAssistant.activeMainPage', 'subscriptions');

    window.eval(fs.readFileSync(navigationBootstrapPath, 'utf8'));

    expect(document.documentElement.dataset.initialMainPage).toBe('subscriptions');

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

    const css = fs.readFileSync(mainCssPath, 'utf8');
    expect(css).toMatch(/\.scenario-card-header \.scenario-drag-handle\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s);
    expect(css).toMatch(/\.scenario-condition-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.7fr\) minmax\(0, 0\.7fr\) minmax\(0, 2\.6fr\) 72px;/s);
    expect(css).toMatch(/\.scenario-time-value\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.3fr\) minmax\(0, 1fr\) 12px minmax\(0, 1fr\);/s);
    expect(css).toMatch(/\.scenario-time-value \.scenario-time-input\s*\{[^}]*height:\s*38px;[^}]*font-family:\s*inherit;/s);
    expect(css).toMatch(/\.proxy-body \.form-grid > \.form-item:nth-child\(3\)/);
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

    const css = fs.readFileSync(mainCssPath, 'utf8');
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

    const css = fs.readFileSync(mainCssPath, 'utf8');
    expect(css).toMatch(/\.native-select-source\s*\{[^}]*clip-path:\s*inset\(50%\)\s*!important;/s);
    expect(css).toMatch(/\.native-select-enhanced\.dropdown-open \.select-icon\s*\{[^}]*transform:\s*rotate\(180deg\);/s);
  });
});
