// ==========================================
// Theme Module - Theme Mode Settings
// ==========================================

let themeMode = 'light';
let nightModeStart = '22:00';
let nightModeEnd = '06:00';
let themeInterval = null;

function loadThemeSettings() {
  chrome.storage.local.get(['themeSettings', 'config'], function (result) {
    const themeSettings = result.themeSettings;
    const config = result.config;

    if (themeSettings) {
      if (themeSettings.mode) {
        themeMode = themeSettings.mode;
      }
      if (themeSettings.startTime) {
        nightModeStart = themeSettings.startTime;
      }
      if (themeSettings.endTime) {
        nightModeEnd = themeSettings.endTime;
      }
    }

    if (config && config.system) {
      if (config.system.theme_mode && !themeSettings?.mode) {
        themeMode = config.system.theme_mode;
      }
      if (config.system.night_mode_start && !themeSettings?.startTime) {
        nightModeStart = config.system.night_mode_start;
      }
      if (config.system.night_mode_end && !themeSettings?.endTime) {
        nightModeEnd = config.system.night_mode_end;
      }
    }

    updateThemeUI();
  });
}

function initTheme() {
  loadThemeSettings();

  $('.theme-btn').on('click', function () {
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

  $('#night-mode-start, #night-mode-end').on('change', function () {
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
  if (theme === 'dark') {
    $('body').attr('data-theme', 'dark');
  } else {
    $('body').removeAttr('data-theme');
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
  const themeSettings = {
    mode: themeMode,
    startTime: nightModeStart,
    endTime: nightModeEnd
  };

  chrome.storage.local.set({ themeSettings: themeSettings });

  chrome.storage.local.get(['config'], function (result) {
    const config = result.config || {};
    if (!config.system) {
      config.system = {};
    }
    config.system.theme_mode = themeMode;
    config.system.night_mode_start = nightModeStart;
    config.system.night_mode_end = nightModeEnd;
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
