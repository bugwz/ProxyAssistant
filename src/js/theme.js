// ==========================================
// Theme Module - Theme Mode Settings
// ==========================================

let themeMode = 'light';
let nightModeStart = '22:00';
let nightModeEnd = '06:00';
let themeInterval = null;

function initTheme() {
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
