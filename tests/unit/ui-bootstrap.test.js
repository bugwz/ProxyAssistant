const fs = require('fs');
const path = require('path');

const bootstrapPath = path.join(__dirname, '../../src/js/ui-bootstrap.js');

function runBootstrap(config) {
  global.chrome = {
    storage: {
      local: {
        get: jest.fn((keys, callback) => callback({ config }))
      }
    }
  };
  window.chrome = global.chrome;
  window.eval(fs.readFileSync(bootstrapPath, 'utf8'));
}

describe('UI first-paint bootstrap', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.documentElement.setAttribute('data-ui-initializing', '');
    document.documentElement.removeAttribute('data-initial-theme');
    document.documentElement.removeAttribute('style');
    document.body.removeAttribute('data-theme');
    document.body.removeAttribute('data-custom-theme');
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.chrome;
    delete window.chrome;
    delete window.finishUIInitialization;
  });

  test('applies the saved dark theme before revealing the UI', () => {
    runBootstrap({ system: { theme_mode: 'dark' } });

    expect(document.documentElement.dataset.initialTheme).toBe('dark');
    expect(document.body.dataset.theme).toBe('dark');
    expect(document.documentElement.hasAttribute('data-ui-initializing')).toBe(true);

    window.finishUIInitialization();

    expect(document.documentElement.hasAttribute('data-ui-initializing')).toBe(false);
  });

  test('resolves automatic night mode before the first paint', () => {
    jest.setSystemTime(new Date('2026-08-22T23:30:00'));

    runBootstrap({
      system: {
        theme_mode: 'auto',
        night_mode_start: '22:00',
        night_mode_end: '06:00'
      }
    });

    expect(document.documentElement.dataset.initialTheme).toBe('dark');
    expect(document.body.dataset.theme).toBe('dark');
  });

  test('reveals the UI after the safety timeout', () => {
    runBootstrap({ system: { theme_mode: 'light' } });

    jest.advanceTimersByTime(1999);
    expect(document.documentElement.hasAttribute('data-ui-initializing')).toBe(true);

    jest.advanceTimersByTime(1);
    expect(document.documentElement.hasAttribute('data-ui-initializing')).toBe(false);
  });

  test('restores a custom theme before the first paint', () => {
    runBootstrap({
      system: {
        theme_mode: 'custom',
        custom_theme: {
          base: 'light',
          colors: {
            background: '#102030',
            accent: '#405060'
          }
        }
      }
    });

    expect(document.documentElement.dataset.initialTheme).toBe('light');
    expect(document.body.dataset.customTheme).toBe('true');
    expect(document.documentElement.style.getPropertyValue('--custom-theme-background')).toBe('#102030');
    expect(document.documentElement.style.getPropertyValue('--custom-theme-accent')).toBe('#405060');
  });

  test('uses light mode when a custom theme does not define a base', () => {
    runBootstrap({
      system: {
        theme_mode: 'custom',
        custom_theme: { colors: { background: '#102030' } }
      }
    });

    expect(document.documentElement.dataset.initialTheme).toBe('light');
    expect(document.body.hasAttribute('data-theme')).toBe(false);
  });
});
