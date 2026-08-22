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
    if (mode !== 'auto') return mode === 'dark' ? 'dark' : 'light';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = (system.night_mode_start || '22:00').split(':').map(Number);
    const end = (system.night_mode_end || '06:00').split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return isTimeInRange(currentMinutes, startMinutes, endMinutes) ? 'dark' : 'light';
  }

  function applyInitialTheme(theme) {
    root.dataset.initialTheme = theme;

    function applyToBody() {
      if (!document.body) return;
      if (theme === 'dark') document.body.setAttribute('data-theme', 'dark');
      else document.body.removeAttribute('data-theme');
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
    applyInitialTheme(getInitialTheme(system));
  });
})();
