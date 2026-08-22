// ==========================================
// Theme Module - Preset and Custom Themes
// ==========================================

let themeMode = 'light';
let nightModeStart = '22:00';
let nightModeEnd = '06:00';
let themeInterval = null;
let themeTransitionTimer = null;
let appliedTheme = null;

const THEME_TRANSITION_MS = 280;
const THEME_MODES = ['light', 'dark', 'auto', 'custom'];
const CUSTOM_THEME_COLOR_KEYS = [
  'background',
  'surface',
  'surface_alt',
  'text',
  'muted_text',
  'border',
  'accent',
  'accent_text',
  'input_background',
  'selection_background'
];
const CUSTOM_THEME_CSS_VARIABLES = {
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
const DEFAULT_CUSTOM_THEME = {
  name: 'My Theme',
  base: 'light',
  colors: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surface_alt: '#F8FAFC',
    text: '#1E293B',
    muted_text: '#64748B',
    border: '#E5E7EB',
    accent: '#4164F5',
    accent_text: '#FFFFFF',
    input_background: '#FFFFFF',
    selection_background: '#EEF2FF'
  }
};
const LEGACY_DARK_CUSTOM_THEME_COLORS = {
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
};

let customTheme = cloneDefaultCustomTheme();

function cloneDefaultCustomTheme() {
  return JSON.parse(JSON.stringify(DEFAULT_CUSTOM_THEME));
}

function isLegacyDefaultCustomTheme(value) {
  if (!value || value.base !== 'dark' || !value.colors) return false;
  return CUSTOM_THEME_COLOR_KEYS.every(key => (
    typeof value.colors[key] === 'string'
    && value.colors[key].trim().toUpperCase() === LEGACY_DARK_CUSTOM_THEME_COLORS[key]
  ));
}

function normalizeCustomTheme(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return cloneDefaultCustomTheme();
  if (isLegacyDefaultCustomTheme(value)) return cloneDefaultCustomTheme();

  const colors = value.colors && typeof value.colors === 'object' && !Array.isArray(value.colors)
    ? value.colors
    : {};
  const normalized = {
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 80) : 'My Theme',
    base: value.base === 'dark' ? 'dark' : 'light',
    colors: {}
  };

  CUSTOM_THEME_COLOR_KEYS.forEach(key => {
    const color = typeof colors[key] === 'string' ? colors[key].trim().toUpperCase() : '';
    normalized.colors[key] = /^#[0-9A-F]{6}$/.test(color)
      ? color
      : DEFAULT_CUSTOM_THEME.colors[key];
  });
  return normalized;
}

function validateCustomTheme(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!['light', 'dark'].includes(value.base)) return false;
  if (!value.colors || typeof value.colors !== 'object' || Array.isArray(value.colors)) return false;
  return CUSTOM_THEME_COLOR_KEYS.every(key => (
    typeof value.colors[key] === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.colors[key].trim())
  ));
}

function formatCustomTheme(value) {
  return JSON.stringify(value, null, 2);
}

function applyThemeSettings(config) {
  if (config.system) {
    themeMode = THEME_MODES.includes(config.system.theme_mode) ? config.system.theme_mode : 'light';
    nightModeStart = config.system.night_mode_start || '22:00';
    nightModeEnd = config.system.night_mode_end || '06:00';
    customTheme = normalizeCustomTheme(config.system.custom_theme);
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

  $('#theme-preset-select').off('change.themeMode').on('change.themeMode', function () {
    setThemeMode($(this).val());
  });

  $('#night-mode-start, #night-mode-end').off('change.themeMode').on('change.themeMode', function () {
    nightModeStart = $('#night-mode-start').val();
    nightModeEnd = $('#night-mode-end').val();
    saveThemeSettings();
    if (themeMode === 'auto') updateThemeByTime();
  });

  $('#apply-custom-theme-btn').off('click.customTheme').on('click.customTheme', function () {
    let parsed;
    try {
      parsed = JSON.parse($('#custom-theme-json').val());
    } catch (error) {
      showCustomThemeError(I18n.t('custom_theme_invalid_json'));
      return;
    }
    if (!validateCustomTheme(parsed)) {
      showCustomThemeError(I18n.t('custom_theme_invalid_schema'));
      return;
    }

    $('#custom-theme-error').prop('hidden', true).text('');
    customTheme = normalizeCustomTheme(parsed);
    themeMode = 'custom';
    syncThemePresetControl();
    $('#custom-theme-json').val(formatCustomTheme(customTheme));
    applyTheme('custom');
    saveThemeSettings();
    if (typeof UtilsModule !== 'undefined' && UtilsModule.showTip) {
      UtilsModule.showTip(I18n.t('custom_theme_saved'), false);
    }
  });

  $('#reset-custom-theme-btn').off('click.customTheme').on('click.customTheme', function () {
    $('#custom-theme-json').val(formatCustomTheme(cloneDefaultCustomTheme()));
    $('#custom-theme-error').prop('hidden', true).text('');
  });
}

function showCustomThemeError(message) {
  $('#custom-theme-error').text(message).prop('hidden', false);
}

function syncThemePresetControl() {
  const $select = $('#theme-preset-select');
  $select.val(themeMode);
  const $container = $select.closest('.native-select-enhanced');
  if (!$container.length) return;
  const $option = $select.find('option:selected');
  $container.find('.native-select-value').text($option.text());
  $container.find('.native-select-options li')
    .removeClass('selected-option')
    .attr('aria-selected', 'false')
    .filter(`[data-value="${themeMode}"]`)
    .addClass('selected-option')
    .attr('aria-selected', 'true');
}

function updateThemeUI() {
  $('#night-mode-start').val(nightModeStart);
  $('#night-mode-end').val(nightModeEnd);
  $('#custom-theme-json').val(formatCustomTheme(customTheme));
  syncThemePresetControl();

  $('.auto-mode-time-row').prop('hidden', themeMode !== 'auto').toggle(themeMode === 'auto');
  $('.custom-theme-row').prop('hidden', themeMode !== 'custom').toggle(themeMode === 'custom');

  if (themeMode === 'auto') {
    updateThemeByTime();
    startThemeInterval();
  } else {
    if (themeInterval) clearInterval(themeInterval);
    themeInterval = null;
    applyTheme(themeMode);
  }
}

function setThemeMode(mode) {
  themeMode = THEME_MODES.includes(mode) ? mode : 'light';
  updateThemeUI();
  saveThemeSettings();
}

function clearCustomThemeVariables() {
  const rootStyle = document.documentElement.style;
  Object.values(CUSTOM_THEME_CSS_VARIABLES).forEach(variable => rootStyle.removeProperty(variable));
  $('body').removeAttr('data-custom-theme');
}

function applyCustomThemeVariables() {
  const rootStyle = document.documentElement.style;
  CUSTOM_THEME_COLOR_KEYS.forEach(key => {
    rootStyle.setProperty(CUSTOM_THEME_CSS_VARIABLES[key], customTheme.colors[key]);
  });
  $('body').attr('data-custom-theme', 'true');
}

function applyTheme(theme) {
  const isCustom = theme === 'custom';
  const nextTheme = isCustom ? customTheme.base : (theme === 'dark' ? 'dark' : 'light');
  const $body = $('body');
  const currentTheme = $body.attr('data-theme') === 'dark' ? 'dark' : 'light';
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldTransition = appliedTheme !== null
    && (currentTheme !== nextTheme || isCustom)
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

  if (isCustom) applyCustomThemeVariables();
  else clearCustomThemeVariables();
  if (nextTheme === 'dark') $body.attr('data-theme', 'dark');
  else $body.removeAttr('data-theme');
  appliedTheme = isCustom ? `custom:${nextTheme}` : nextTheme;

  if (shouldTransition) {
    themeTransitionTimer = setTimeout(function () {
      $body.removeClass('theme-transitioning');
      themeTransitionTimer = null;
    }, THEME_TRANSITION_MS + 40);
  }
}

function updateThemeByTime() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startParts = nightModeStart.split(':').map(Number);
  const endParts = nightModeEnd.split(':').map(Number);
  const startMinutes = startParts[0] * 60 + startParts[1];
  const endMinutes = endParts[0] * 60 + endParts[1];
  const isNightMode = startMinutes < endMinutes
    ? currentTime >= startMinutes && currentTime < endMinutes
    : currentTime >= startMinutes || currentTime < endMinutes;

  applyTheme(isNightMode ? 'dark' : 'light');
}

function startThemeInterval() {
  if (themeInterval) clearInterval(themeInterval);
  themeInterval = setInterval(function () {
    if (themeMode === 'auto') updateThemeByTime();
  }, 60000);
}

function saveThemeSettings() {
  if (typeof StorageModule !== 'undefined' && StorageModule.getConfig) {
    const config = StorageModule.getConfig();
    if (!config.system) config.system = {};
    config.system.theme_mode = themeMode;
    config.system.night_mode_start = nightModeStart;
    config.system.night_mode_end = nightModeEnd;
    config.system.custom_theme = normalizeCustomTheme(customTheme);
    StorageModule.setConfig(config);
    StorageModule.save();
    return;
  }

  chrome.storage.local.get(['config'], function (result) {
    const config = result.config || {};
    if (!config.system) config.system = {};
    config.system.theme_mode = themeMode;
    config.system.night_mode_start = nightModeStart;
    config.system.night_mode_end = nightModeEnd;
    config.system.custom_theme = normalizeCustomTheme(customTheme);
    config.updated_at = new Date().toISOString();
    chrome.storage.local.set({ config: config });
  });
}

window.ThemeModule = {
  initTheme,
  updateThemeUI,
  setThemeMode,
  applyTheme,
  updateThemeByTime,
  normalizeCustomTheme,
  validateCustomTheme,
  getThemeMode: () => themeMode,
  getCustomTheme: () => normalizeCustomTheme(customTheme),
  setCustomTheme: value => { customTheme = normalizeCustomTheme(value); },
  getNightModeTimes: () => ({ start: nightModeStart, end: nightModeEnd }),
  setNightModeTimes: (start, end) => { nightModeStart = start; nightModeEnd = end; }
};
