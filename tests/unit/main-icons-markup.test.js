const fs = require('fs');
const path = require('path');

describe('main header icon markup', () => {
  test('scenario navigation should reuse the popup scenario switch icon', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const iconsPath = path.join(__dirname, '../../src/js/icons.js');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const MainIcons = require(iconsPath);
    const sharedIconDocument = new DOMParser().parseFromString(MainIcons.render('scenarioSwitch'), 'text/html');
    const scenarioNavigation = pageDocument.querySelector('[data-main-page="scenarios"] svg');

    const getPaths = root => Array.from(root.querySelectorAll('path')).map(path => path.getAttribute('d'));

    expect(getPaths(scenarioNavigation)).toEqual(getPaths(sharedIconDocument));
  });

  test('test button should use the updated semantic svg paths', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const html = fs.readFileSync(mainHtmlPath, 'utf8');

    expect(html).toContain('circle cx="11" cy="11" r="6"');
    expect(html).toContain('m20 20-4.2-4.2');
  });

  test('cloud sync actions should use upload and download icons', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const iconsPath = path.join(__dirname, '../../src/js/icons.js');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const MainIcons = require(iconsPath);
    const pushIconDocument = new DOMParser().parseFromString(MainIcons.render('syncPush'), 'text/html');
    const pullIconDocument = new DOMParser().parseFromString(MainIcons.render('syncPull'), 'text/html');
    const pushButtons = pageDocument.querySelectorAll('[data-sync-action="push"]');
    const pullButtons = pageDocument.querySelectorAll('[data-sync-action="pull"]');
    const getPaths = root => Array.from(root.querySelectorAll('path')).map(path => path.getAttribute('d'));

    expect(pushButtons).toHaveLength(2);
    expect(pullButtons).toHaveLength(2);
    pushButtons.forEach(button => {
      expect(getPaths(button)).toEqual(getPaths(pushIconDocument));
    });
    pullButtons.forEach(button => {
      expect(getPaths(button)).toEqual(getPaths(pullIconDocument));
    });
  });

  test('cloud sync displays native and Gist services as separate blocks', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const serviceCards = Array.from(pageDocument.querySelectorAll('.sync-service-card'));

    expect(serviceCards.map(card => card.dataset.syncService)).toEqual(['native', 'gist']);
    const gistIcon = serviceCards[1].querySelector('.sync-service-icon-gist svg');
    const sidebarGitHubIcon = pageDocument.querySelector('.sidebar-github-link svg');
    expect(gistIcon.getAttribute('fill')).toBe('currentColor');
    expect(gistIcon.querySelector('path').getAttribute('d')).toBe(sidebarGitHubIcon.querySelector('path').getAttribute('d'));
    expect(serviceCards[0].querySelector('#native-config #quota-bar-fill')).toBeTruthy();
    expect(serviceCards[1].querySelector('#gist-config #gist-token')).toBeTruthy();
    expect(serviceCards[1].querySelector('#gist-config #gist-filename')).toBeTruthy();
  });

  test('configuration and cloud sync navigation use distinct file and cloud icons', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const configIcon = pageDocument.querySelector('[data-main-page="config"] svg');
    const syncIcon = pageDocument.querySelector('[data-main-page="sync"] svg');

    expect(Array.from(configIcon.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
      'M14 3v5h4',
      'M8 13h7',
      'M8 17h5'
    ]);
    expect(Array.from(syncIcon.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M7 18.5A4.5 4.5 0 1 1 8 9.6a5.5 5.5 0 0 1 10.5 1.9A3.5 3.5 0 1 1 18 18.5H7Z'
    ]);
  });

  test('display settings navigation uses a monitor with a light-dark indicator', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const icon = pageDocument.querySelector('[data-main-page="appearance"] svg');

    expect(icon.querySelector('rect').getAttribute('width')).toBe('18');
    expect(icon.querySelector('circle').getAttribute('r')).toBe('3');
    expect(Array.from(icon.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M12 7v6',
      'M8 21h8M12 17v4'
    ]);
  });

  test('config import and export buttons should use balanced mirrored tray icons', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const html = fs.readFileSync(mainHtmlPath, 'utf8');

    expect(html).toContain('M12 14V5');
    expect(html).toContain('m9.5 8.5 2.5-2.5 2.5 2.5');
    expect(html).toContain('M12 5v9');
    expect(html).toContain('m15 10-3 3-3-3');
    expect(html).toContain('M5 15.5v2A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-2');
  });

  test('current configuration refresh action precedes import and uses refresh semantics', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const actions = Array.from(pageDocument.querySelectorAll('.current-config-section .config-actions button'));
    const refreshButton = actions[0];

    expect(refreshButton.id).toBe('refresh-config-json-btn');
    expect(refreshButton.querySelector('span').getAttribute('data-i18n')).toBe('config_refresh');
    expect(Array.from(refreshButton.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M21 12a9 9 0 1 1-2.64-6.36L21 8',
      'M21 3v5h-5'
    ]);
  });

  test('diagnostics refresh buttons should share refresh semantics and styling', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const refreshButtonIds = ['detect-proxy-btn', 'refresh-runtime-logs-btn', 'pac-details-btn'];
    const expectedPaths = [
      'M21 12a9 9 0 1 1-2.64-6.36L21 8',
      'M21 3v5h-5'
    ];

    refreshButtonIds.forEach(id => {
      const button = pageDocument.querySelector(`#${id}`);
      expect(button.classList.contains('control-btn')).toBe(true);
      expect(button.classList.contains('refresh-control-btn')).toBe(true);
      expect(Array.from(button.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual(expectedPaths);
      expect(button.querySelector('svg').classList.contains('diagnostics-refresh-icon')).toBe(true);
    });
    expect(pageDocument.querySelector('#pac-details-btn span').getAttribute('data-i18n')).toBe('proxy_detection_button');
    expect(pageDocument.querySelector('#refresh-runtime-logs-btn span').getAttribute('data-i18n')).toBe('runtime_logs_refresh');
  });

  test('runtime log clear action uses the shared icon and text button style', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const clearButton = pageDocument.querySelector('#clear-runtime-logs-btn');

    expect(clearButton.getAttribute('class')).toBe('control-btn');
    expect(clearButton.querySelector('span').getAttribute('data-i18n')).toBe('runtime_logs_clear');
    expect(Array.from(clearButton.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M3 6h18',
      'M8 6V4h8v2',
      'm19 6-1 14H6L5 6',
      'M10 11v5M14 11v5'
    ]);
  });

  test('about page displays complete version information', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const panel = pageDocument.querySelector('.about-version-panel');
    const content = panel.querySelector('.about-version-content');
    const details = content.querySelector('.about-version-details');
    const pageDescription = pageDocument.querySelector('#page-about .page-heading p');

    expect(panel).toBeTruthy();
    expect(pageDescription.getAttribute('data-i18n')).toBe('about_page_desc');
    expect(content.querySelector('.about-brand-summary img').getAttribute('src')).toBe('./images/icon-128.png');
    expect(details.firstElementChild.classList.contains('about-project-overview')).toBe(true);
    expect(details.lastElementChild.classList.contains('about-version-section')).toBe(true);
    expect(details.querySelector('.about-project-overview h3').getAttribute('data-i18n')).toBe('project_intro_title');
    expect(details.querySelector('.about-project-overview p').getAttribute('data-i18n')).toBe('project_intro_desc');
    expect(details.querySelectorAll('.about-version-section .version-info-row')).toHaveLength(3);
    expect(details.querySelector('#github-version-value').getAttribute('aria-busy')).toBe('true');
    expect(details.querySelector('#github-version-value .version-checking-text').textContent).toBe('获取中...');
    expect(details.querySelector('#github-version-value .version-status-icon')).toBeNull();
    expect(Array.from(details.querySelectorAll('.about-version-section .version-value')).map(element => element.id)).toEqual([
      'current-version-value',
      'store-version-value',
      'github-version-value'
    ]);
  });
});
