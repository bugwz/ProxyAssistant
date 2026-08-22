const fs = require('fs');
const path = require('path');

const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const themePath = path.join(__dirname, '../../src/js/theme.js');

function loadThemeModule() {
  window.eval(fs.readFileSync(jqueryPath, 'utf8'));
  const source = fs.readFileSync(themePath, 'utf8');
  const factory = new Function(
    'window',
    'document',
    '$',
    'chrome',
    `${source}; return window.ThemeModule;`
  );

  return factory(window, document, window.$, global.chrome);
}

describe('theme transitions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.removeAttribute('data-theme');
    document.body.className = '';
    window.matchMedia = jest.fn(() => ({ matches: false }));
  });

  afterEach(() => {
    jest.useRealTimers();
    delete window.ThemeModule;
    delete window.matchMedia;
    delete window.$;
    delete window.jQuery;
  });

  test('animates subsequent light and dark theme changes without animating initial setup', () => {
    const ThemeModule = loadThemeModule();

    ThemeModule.applyTheme('light');
    expect(document.body.classList.contains('theme-transitioning')).toBe(false);

    ThemeModule.applyTheme('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(document.body.classList.contains('theme-transitioning')).toBe(true);

    jest.advanceTimersByTime(319);
    expect(document.body.classList.contains('theme-transitioning')).toBe(true);
    jest.advanceTimersByTime(1);
    expect(document.body.classList.contains('theme-transitioning')).toBe(false);
  });

  test('skips theme transitions when reduced motion is requested', () => {
    window.matchMedia = jest.fn(() => ({ matches: true }));
    const ThemeModule = loadThemeModule();

    ThemeModule.applyTheme('light');
    ThemeModule.applyTheme('dark');

    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(document.body.classList.contains('theme-transitioning')).toBe(false);
  });
});
