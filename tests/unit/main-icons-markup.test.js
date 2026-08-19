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
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const pushButton = pageDocument.querySelector('#sync-push-btn');
    const pullButton = pageDocument.querySelector('#sync-pull-btn');

    expect(pushButton.querySelector('path:nth-child(2)').getAttribute('d')).toBe('M12 15V9');
    expect(pullButton.querySelector('path:nth-child(2)').getAttribute('d')).toBe('M12 9v6');
  });

  test('configuration navigation combines adjustment controls with sync arrows', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const icon = pageDocument.querySelector('[data-main-page="config"] svg');

    expect(Array.from(icon.querySelectorAll('circle')).map(circle => circle.getAttribute('cy'))).toEqual(['7', '17']);
    expect(Array.from(icon.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M4 7h4m4 0h7',
      'm16 4 3 3-3 3',
      'M20 17h-4m-4 0H5',
      'm8 14-3 3 3 3'
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

  test('detect and pac buttons should use inspect and script semantics', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const html = fs.readFileSync(mainHtmlPath, 'utf8');

    expect(html).toContain('circle cx="10.5" cy="10.5" r="4.5"');
    expect(html).toContain('m14 14 4 4');
    expect(html).toContain('M8 3h5l4 4v14');
    expect(html).toContain('m10 14 2-2-2-2');
  });

  test('about page displays complete version information', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const pageDocument = new DOMParser().parseFromString(fs.readFileSync(mainHtmlPath, 'utf8'), 'text/html');
    const panel = pageDocument.querySelector('.about-version-panel');

    expect(panel).toBeTruthy();
    expect(panel.querySelector('.about-version-header')).toBeTruthy();
    expect(Array.from(panel.querySelectorAll('.version-value')).map(element => element.id)).toEqual([
      'current-version-value',
      'store-version-value',
      'github-version-value'
    ]);
  });
});
