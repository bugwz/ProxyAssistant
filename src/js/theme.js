// ==========================================
// Theme Module - Theme Mode Settings
// ==========================================

let themeMode = 'light';
let nightModeStart = '22:00';
let nightModeEnd = '06:00';
let themeInterval = null;
let themeTransitionTimer = null;
let appliedTheme = null;

const THEME_TRANSITION_MS = 280;

function applyThemeSettings(config) {
  if (config.system) {
    themeMode = config.system.theme_mode || 'light';
    nightModeStart = config.system.night_mode_start || '22:00';
    nightModeEnd = config.system.night_mode_end || '06:00';
  }

  updateThemeUI();
}

function loadThemeSettings() {
  chrome.storage.local.get(['config'], function (result) {
    applyThemeSettings(result.config || {});
  });
}

function initTheme(config) {
  if (config) applyThemeSettings(config);
  else loadThemeSettings();

  $('.theme-btn').off('click.themeMode').on('click.themeMode', function () {
    const mode = $(this).data('theme');
    $('.theme-btn').removeClass('active');
    $(this).addClass('active');

    if (mode === 'auto') {
      $('.auto-mode-time-row').show();
    } else {
      $('.auto-mode-time-row').hide();
    }

    setThemeMode(mode);
  });

  $('#night-mode-start, #night-mode-end').off('change.themeMode').on('change.themeMode', function () {
    nightModeStart = $('#night-mode-start').val();
    nightModeEnd = $('#night-mode-end').val();
    saveThemeSettings();
    if (themeMode === 'auto') {
      updateThemeByTime();
    }
  });
}

function updateThemeUI() {
  $('#night-mode-start').val(nightModeStart);
  $('#night-mode-end').val(nightModeEnd);
  $('.theme-btn').removeClass('active');
  $('.theme-btn[data-theme="' + themeMode + '"]').addClass('active');

  if (themeMode === 'auto') {
    $('.auto-mode-time-row').show();
    updateThemeByTime();
    startThemeInterval();
  } else {
    $('.auto-mode-time-row').hide();
    applyTheme(themeMode);
  }
}

function setThemeMode(mode) {
  themeMode = mode;
  if (mode === 'auto') {
    updateThemeByTime();
    startThemeInterval();
  } else {
    if (themeInterval) clearInterval(themeInterval);
    applyTheme(mode);
  }
  saveThemeSettings();
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  const $body = $('body');
  const currentTheme = $body.attr('data-theme') === 'dark' ? 'dark' : 'light';
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldTransition = appliedTheme !== null
    && currentTheme !== nextTheme
    && !prefersReducedMotion;

  if (themeTransitionTimer) {
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = null;
  }
  $body.removeClass('theme-transitioning');

  if (shouldTransition) {
    $body.addClass('theme-transitioning');
    void document.body.offsetWidth;
  }

  if (nextTheme === 'dark') $body.attr('data-theme', 'dark');
  else $body.removeAttr('data-theme');
  appliedTheme = nextTheme;

  if (shouldTransition) {
    themeTransitionTimer = setTimeout(function () {
      $body.removeClass('theme-transitioning');
      themeTransitionTimer = null;
    }, THEME_TRANSITION_MS + 40);
  }
}

function updateThemeByTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const startParts = nightModeStart.split(':');
  const endParts = nightModeEnd.split(':');
  const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
  const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

  let isNightMode;
  if (startMinutes < endMinutes) {
    isNightMode = currentTime >= startMinutes || currentTime < endMinutes;
  } else {
    isNightMode = currentTime >= startMinutes || currentTime < endMinutes;
  }

  applyTheme(isNightMode ? 'dark' : 'light');
}

function startThemeInterval() {
  if (themeInterval) clearInterval(themeInterval);
  themeInterval = setInterval(function () {
    if (themeMode === 'auto') {
      updateThemeByTime();
    }
  }, 60000);
}

function saveThemeSettings() {
  chrome.storage.local.get(['config'], function (result) {
    const config = result.config || {};
    if (!config.system) {
      config.system = {};
    }
    config.system.theme_mode = themeMode;
    config.system.night_mode_start = nightModeStart;
    config.system.night_mode_end = nightModeEnd;
    config.updated_at = new Date().toISOString();
    chrome.storage.local.set({ config: config });
  });
}

// Export for use
window.ThemeModule = {
  initTheme,
  updateThemeUI,
  setThemeMode,
  applyTheme,
  updateThemeByTime,
  getThemeMode: () => themeMode,
  setThemeMode: (mode) => { themeMode = mode; },
  getNightModeTimes: () => ({ start: nightModeStart, end: nightModeEnd }),
  setNightModeTimes: (start, end) => { nightModeStart = start; nightModeEnd = end; }
};
