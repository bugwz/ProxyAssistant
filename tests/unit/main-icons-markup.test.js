const fs = require('fs');
const path = require('path');

describe('main header icon markup', () => {
  test('scenario manage and test buttons should use the updated semantic svg paths', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const html = fs.readFileSync(mainHtmlPath, 'utf8');

    expect(html).toContain('M12 3H5a2 2 0 0 0-2 2');
    expect(html).toContain('M18.375 2.625a2.121 2.121 0 1 1 3 3');
    expect(html).toContain('circle cx="11" cy="11" r="6"');
    expect(html).toContain('m20 20-4.2-4.2');
  });

  test('cloud sync config button should use a settings-style icon', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const html = fs.readFileSync(mainHtmlPath, 'utf8');

    expect(html).toContain('M7 17.5A4.5 4.5 0 1 1 8 8.6');
    expect(html).toContain('A3.5 3.5 0 1 1 18 17.5H7Z');
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

  test('version check button should use the compact status info icon', () => {
    const mainHtmlPath = path.join(__dirname, '../../src/main.html');
    const html = fs.readFileSync(mainHtmlPath, 'utf8');

    expect(html).toContain('M12 4a8 8 0 1 0 8 8');
    expect(html).toContain('M12 8v5');
    expect(html).toContain('M15 15h.01');
  });
});
