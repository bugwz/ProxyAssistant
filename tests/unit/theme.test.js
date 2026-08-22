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
    document.body.removeAttribute('data-custom-theme');
    document.body.className = '';
    document.documentElement.removeAttribute('style');
    window.matchMedia = jest.fn(() => ({ matches: false }));
  });

  afterEach(() => {
    jest.useRealTimers();
    delete window.ThemeModule;
    delete window.matchMedia;
    delete window.$;
    delete window.jQuery;
    delete global.StorageModule;
    delete global.I18n;
    delete global.UtilsModule;
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

  test('validates and applies every custom theme color as a semantic CSS variable', () => {
    const ThemeModule = loadThemeModule();
    const customTheme = {
      name: 'Ocean',
      base: 'light',
      colors: {
        background: '#102030',
        surface: '#203040',
        surface_alt: '#304050',
        text: '#F0F1F2',
        muted_text: '#A0A1A2',
        border: '#405060',
        accent: '#506070',
        accent_text: '#FFFFFF',
        input_background: '#607080',
        selection_background: '#708090'
      }
    };

    expect(ThemeModule.validateCustomTheme(customTheme)).toBe(true);
    ThemeModule.setCustomTheme(customTheme);
    ThemeModule.applyTheme('custom');

    expect(document.body.hasAttribute('data-theme')).toBe(false);
    expect(document.body.dataset.customTheme).toBe('true');
    expect(document.documentElement.style.getPropertyValue('--custom-theme-background')).toBe('#102030');
    expect(document.documentElement.style.getPropertyValue('--custom-theme-accent')).toBe('#506070');
  });

  test('rejects incomplete custom theme templates', () => {
    const ThemeModule = loadThemeModule();

    expect(ThemeModule.normalizeCustomTheme({ colors: {} }).base).toBe('light');
    expect(ThemeModule.validateCustomTheme({
      base: 'dark',
      colors: { background: '#102030' }
    })).toBe(false);
  });

  test('replaces the previous built-in dark template with the light template', () => {
    const ThemeModule = loadThemeModule();
    const normalized = ThemeModule.normalizeCustomTheme({
      name: 'My Theme',
      base: 'dark',
      colors: {
        background: '#15181D',
        surface: '#1D2127',
        surface_alt: '#282D35',
        text: '#F1F5F9',
        muted_text: '#A8B4C5',
        border: '#353A43',
        accent: '#818CF8',
        accent_text: '#FFFFFF',
        input_background: '#111827',
        selection_background: '#293250'
      }
    });

    expect(normalized.base).toBe('light');
    expect(normalized.colors.background).toBe('#F6F7F9');
    expect(normalized.colors.surface).toBe('#FFFFFF');
    expect(normalized.colors.accent).toBe('#4164F5');
  });

  test('opens the JSON editor and persists a custom theme from the preset control', () => {
    document.body.innerHTML = `
      <select id="theme-preset-select">
        <option value="light">Light</option>
        <option value="custom">Custom</option>
      </select>
      <div class="auto-mode-time-row"></div>
      <div class="custom-theme-row" hidden></div>
      <input id="night-mode-start" value="22:00">
      <input id="night-mode-end" value="06:00">
      <textarea id="custom-theme-json"></textarea>
      <button id="apply-custom-theme-btn"></button>
      <button id="reset-custom-theme-btn"></button>
      <div id="custom-theme-error" hidden></div>
    `;
    const config = {
      system: {
        theme_mode: 'light',
        night_mode_start: '22:00',
        night_mode_end: '06:00'
      }
    };
    global.StorageModule = {
      getConfig: jest.fn(() => config),
      setConfig: jest.fn(),
      save: jest.fn()
    };
    global.I18n = { t: jest.fn(key => key) };
    global.UtilsModule = { showTip: jest.fn() };
    const ThemeModule = loadThemeModule();

    ThemeModule.initTheme(config);
    window.$('#theme-preset-select').val('custom').trigger('change');

    expect(window.$('.custom-theme-row').prop('hidden')).toBe(false);
    expect(config.system.theme_mode).toBe('custom');
    expect(config.system.custom_theme.base).toBe('light');
    expect(config.system.custom_theme.colors.background).toBe('#F6F7F9');
    expect(config.system.custom_theme.colors).toHaveProperty('accent', '#4164F5');
    expect(global.StorageModule.save).toHaveBeenCalled();

    window.$('#custom-theme-json').val('{').trigger('input');
    window.$('#apply-custom-theme-btn').trigger('click');
    expect(window.$('#custom-theme-error').prop('hidden')).toBe(false);
    expect(window.$('#custom-theme-error').text()).toBe('custom_theme_invalid_json');
  });
});
