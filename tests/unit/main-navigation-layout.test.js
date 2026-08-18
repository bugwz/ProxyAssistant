const fs = require('fs');
const path = require('path');

const mainHtmlPath = path.join(__dirname, '../../src/main.html');
const mainJsPath = path.join(__dirname, '../../src/js/main.js');
const mainCssPath = path.join(__dirname, '../../src/css/main.css');
const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');

describe('main sidebar layout', () => {
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
    delete global.$;
    delete global.jQuery;
    delete global.ScenariosModule;
    delete global.VersionModule;
    delete global.chrome;
    delete window.ScenariosModule;
    delete window.VersionModule;
    delete window.chrome;
  });

  test('uses the project logo and maps seven navigation items to seven pages', () => {
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const navItems = Array.from(pageDocument.querySelectorAll('.main-nav-item'));
    const pages = Array.from(pageDocument.querySelectorAll('.main-page'));

    expect(pageDocument.querySelector('.sidebar-logo img').getAttribute('src')).toBe('./images/icon-128.png');
    expect(pageDocument.querySelector('.sidebar-footer').textContent.trim()).toBe('');
    expect(pageDocument.querySelector('#sidebar-version')).not.toBeNull();
    expect(pageDocument.querySelector('.sidebar-github-link').getAttribute('href')).toBe('https://github.com/bugwz/ProxyAssistant');
    expect(pageDocument.querySelector('.sidebar-github-link').getAttribute('target')).toBe('_blank');
    expect(navItems.map(item => item.dataset.mainPage)).toEqual([
      'scenarios',
      'proxies',
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
    expect(global.ScenariosModule.renderScenarioManagementList).toHaveBeenCalledTimes(1);

    $('.main-nav-item[data-main-page="about"]').trigger('click');
    expect($('.main-page[data-page="about"]').prop('hidden')).toBe(false);
    expect(global.VersionModule.loadVersionInfo).toHaveBeenCalledTimes(1);
  });

  test('provides scenario overview, list, and accessible management dialogs', () => {
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const scenarioPage = pageDocument.querySelector('#page-scenarios');

    expect(scenarioPage.querySelector('#open-add-scenario-btn')).not.toBeNull();
    expect(scenarioPage.querySelector('.scenario-overview')).not.toBeNull();
    expect(scenarioPage.querySelector('#scenario-management-current')).not.toBeNull();
    expect(scenarioPage.querySelector('#scenario-total-count')).not.toBeNull();
    expect(scenarioPage.querySelector('#scenario-proxy-total-count')).not.toBeNull();
    expect(scenarioPage.querySelector('#scenario-manage-list')).not.toBeNull();

    const dialogs = Array.from(pageDocument.querySelectorAll('.scenario-dialog-tip'));
    expect(dialogs).toHaveLength(4);
    dialogs.forEach(dialog => {
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    });
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
});
