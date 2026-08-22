// Apply the saved theme before the extension UI is first painted.
(function () {
  const root = document.documentElement;
  const REVEAL_TIMEOUT_MS = 2000;
  let revealTimer = window.setTimeout(finishUIInitialization, REVEAL_TIMEOUT_MS);

  function isTimeInRange(currentMinutes, startMinutes, endMinutes) {
    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  function getInitialTheme(system) {
    const mode = system.theme_mode || 'light';
    if (mode === 'custom') {
      return system.custom_theme?.base === 'dark' ? 'dark' : 'light';
    }
    if (mode !== 'auto') return mode === 'dark' ? 'dark' : 'light';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = (system.night_mode_start || '22:00').split(':').map(Number);
    const end = (system.night_mode_end || '06:00').split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return isTimeInRange(currentMinutes, startMinutes, endMinutes) ? 'dark' : 'light';
  }

  function applyInitialTheme(theme, customTheme) {
    root.dataset.initialTheme = theme;
    const colorVariables = {
      background: '--custom-theme-background',
      surface: '--custom-theme-surface',
      surface_alt: '--custom-theme-surface-alt',
      text: '--custom-theme-text',
      muted_text: '--custom-theme-muted-text',
      border: '--custom-theme-border',
      accent: '--custom-theme-accent',
      accent_text: '--custom-theme-accent-text',
      input_background: '--custom-theme-input-background',
      selection_background: '--custom-theme-selection-background'
    };
    const isCustom = customTheme && customTheme.colors && typeof customTheme.colors === 'object';
    if (isCustom) {
      Object.entries(colorVariables).forEach(([key, variable]) => {
        const value = customTheme.colors[key];
        if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
          root.style.setProperty(variable, value);
        }
      });
    }

    function applyToBody() {
      if (!document.body) return;
      if (theme === 'dark') document.body.setAttribute('data-theme', 'dark');
      else document.body.removeAttribute('data-theme');
      if (isCustom) document.body.setAttribute('data-custom-theme', 'true');
    }

    applyToBody();
    if (!document.body) document.addEventListener('DOMContentLoaded', applyToBody, { once: true });
  }

  function finishUIInitialization() {
    if (revealTimer) {
      window.clearTimeout(revealTimer);
      revealTimer = null;
    }
    root.removeAttribute('data-ui-initializing');
  }

  window.finishUIInitialization = finishUIInitialization;

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    applyInitialTheme('light');
    return;
  }

  chrome.storage.local.get(['config'], function (result) {
    if (chrome.runtime?.lastError) {
      applyInitialTheme('light');
      return;
    }
    const system = result?.config?.system || {};
    applyInitialTheme(
      getInitialTheme(system),
      system.theme_mode === 'custom' ? system.custom_theme : null
    );
  });
})();
