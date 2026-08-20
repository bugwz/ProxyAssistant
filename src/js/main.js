// ==========================================
// Main Application Logic
// Initialization and coordination of modules
// ==========================================

// ==========================================
// Module Callbacks
// ==========================================
window.onScenarioSwitch = function (id, list) {
  refreshMainView({
    list: list,
    parseSubscriptions: true
  });
};

window.onScenarioAdd = function (id, name) {
  saveConfig();
};

window.onScenarioRename = function (id, newName) {
  saveConfig();
};

window.onScenarioDelete = function (id, isOnlyScenario) {
  refreshMainView();
  saveConfig();
};

window.onScenariosReorder = function (scenarios) {
  StorageModule.setScenarios(scenarios);
  saveConfig();
};

// ==========================================
// Initialization
// ==========================================
const MAIN_NAVIGATION_STORAGE_KEY = 'proxyAssistant.activeMainPage';
const CONFIG_INCLUDE_SUBSCRIPTIONS_KEY = 'proxyAssistant.config.includeSubscriptions';
const CONFIG_INCLUDE_SUBSCRIPTION_CACHE_KEY = 'proxyAssistant.config.includeSubscriptionCache';
const CONFIG_UPDATED_AT_KEY = 'config_updated_at';
let configEditorSnapshot = '';
let configEditorRenderedText = '';
let configLastUpdatedAt = null;

document.addEventListener('DOMContentLoaded', function () {
  I18n.init(function () {
    initApp();
  });
});

function initApp() {
  initMainNavigation();
  updateAppVersion();

  // Initialize storage module
  StorageModule.init().then(() => {
    LanguageModule.initLanguage();
    ThemeModule.initTheme();
    ScenariosModule.init();
    ProxyModule.init();
    SubscriptionModule.init();
    initDropdowns();
    loadSettings();
    bindGlobalEvents();
  }).catch(err => {
    console.info('Failed to initialize storage:', err);
  });
}

function initMainNavigation() {
  $('.main-nav-item').off('click.mainNavigation').on('click.mainNavigation', function () {
    const pageId = $(this).data('main-page');
    if (switchMainPage(pageId)) {
      saveActiveMainPage(pageId);
      if (pageId === 'config') refreshConfigEditor();
    }
  });

  const savedPageId = getSavedActiveMainPage();
  if (!switchMainPage(savedPageId)) {
    switchMainPage('proxies');
    saveActiveMainPage('proxies');
  } else {
    saveActiveMainPage(savedPageId);
  }

  document.documentElement.removeAttribute('data-initial-main-page');
}

function getSavedActiveMainPage() {
  try {
    const savedPageId = window.localStorage.getItem(MAIN_NAVIGATION_STORAGE_KEY);
    return savedPageId || 'proxies';
  } catch (error) {
    return 'proxies';
  }
}

function saveActiveMainPage(pageId) {
  try {
    window.localStorage.setItem(MAIN_NAVIGATION_STORAGE_KEY, pageId);
  } catch (error) {
    // Navigation still works when browser storage is unavailable.
  }
}

function switchMainPage(pageId) {
  const $targetPage = $(`.main-page[data-page="${pageId}"]`);
  const $targetNav = $(`.main-nav-item[data-main-page="${pageId}"]`);

  if (!$targetPage.length || !$targetNav.length) return false;

  $('.main-nav-item')
    .removeClass('active')
    .removeAttr('aria-current');
  $targetNav
    .addClass('active')
    .attr('aria-current', 'page');

  $('.main-page')
    .removeClass('active')
    .prop('hidden', true);
  $targetPage
    .addClass('active')
    .prop('hidden', false);

  if (pageId === 'scenarios' && typeof ScenariosModule !== 'undefined' && ScenariosModule.renderScenarioManagementList) {
    ScenariosModule.renderScenarioManagementList();
  }

  if (pageId === 'subscriptions' && typeof SubscriptionModule !== 'undefined') {
    SubscriptionModule.renderManagementList();
  }

  if (pageId === 'about' && typeof VersionModule !== 'undefined' && VersionModule.loadVersionInfo) {
    VersionModule.loadVersionInfo().catch(error => {
      console.info('Failed to load version information:', error);
    });
  }

  return true;
}

function updateAppVersion() {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.getManifest) return;

  const version = chrome.runtime.getManifest().version;
  $('#sidebar-version').text(`v${version}`);
  $('#current-version-value').text(version);
}

function loadSettings() {
  const config = StorageModule.getConfig();

  // Apply system settings (only if not already loaded by modules)
  if (config.system) {
    // Language settings - only apply if I18n current language matches storage
    if (config.system.app_language && I18n.getCurrentLanguage() !== config.system.app_language) {
      I18n.setLanguage(config.system.app_language);
    }
    const langName = $(`#language-options li[data-value="${config.system.app_language || I18n.getCurrentLanguage()}"]`).text();
    if (langName) $('#current-language-display').text(langName);

    // Theme settings - ThemeModule.loadThemeSettings() handles this in initTheme()
    // We only set night mode times here if not already set
    const nightTimes = config.system.night_mode_start ? {
      start: config.system.night_mode_start,
      end: config.system.night_mode_end || '06:00'
    } : null;
    if (nightTimes) {
      ThemeModule.setNightModeTimes(nightTimes.start, nightTimes.end);
    }

    // Sync settings
    if (config.system.sync) {
      SyncModule.setSyncConfig(config.system.sync);
    }
  }

  // Update UI (but don't re-init theme UI since ThemeModule.initTheme() already did it)
  SyncModule.updateSyncUI();
  refreshMainView();
  initConfigFileOptions();
  refreshConfigEditor(true);
}

function getStoredConfigOption(key, defaultValue) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? defaultValue : value === 'true';
  } catch (error) {
    return defaultValue;
  }
}

function initConfigFileOptions() {
  const includeSubscriptions = getStoredConfigOption(CONFIG_INCLUDE_SUBSCRIPTIONS_KEY, true);
  const includeSubscriptionCache = getStoredConfigOption(CONFIG_INCLUDE_SUBSCRIPTION_CACHE_KEY, false);
  $('#config-include-subscriptions').prop('checked', includeSubscriptions);
  $('#config-include-subscription-cache')
    .prop('checked', includeSubscriptionCache)
    .prop('disabled', !includeSubscriptions);
}

function getConfigFileOptions() {
  const includeSubscriptions = $('#config-include-subscriptions').prop('checked') !== false;
  return {
    includeSubscriptions,
    includeSubscriptionCache: includeSubscriptions && $('#config-include-subscription-cache').prop('checked') === true
  };
}

function saveConfigFileOptions() {
  const options = getConfigFileOptions();
  try {
    window.localStorage.setItem(CONFIG_INCLUDE_SUBSCRIPTIONS_KEY, String(options.includeSubscriptions));
    window.localStorage.setItem(
      CONFIG_INCLUDE_SUBSCRIPTION_CACHE_KEY,
      String($('#config-include-subscription-cache').prop('checked') === true)
    );
  } catch (error) {
    // The switches still work for the current page when local storage is unavailable.
  }
  return options;
}

function getJsonFoldRanges(lines) {
  const ranges = new Map();
  const stack = [];
  let inString = false;
  let escaped = false;

  lines.forEach((line, lineIndex) => {
    for (let charIndex = 0; charIndex < line.length; charIndex += 1) {
      const character = line[charIndex];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
      } else if (character === '{' || character === '[') {
        stack.push({ character, lineIndex });
      } else if (character === '}' || character === ']') {
        const expected = character === '}' ? '{' : '[';
        const opening = stack.pop();
        if (opening?.character === expected && opening.lineIndex < lineIndex) {
          ranges.set(opening.lineIndex, lineIndex);
        }
      }
    }
  });

  return ranges;
}

function collectConfigJsonCode() {
  return $('#config-json-code .config-json-line-content').map(function () {
    return $(this).text();
  }).get().join('\n');
}

function syncConfigJsonSource() {
  if (!$('#config-json-code').length) return;
  const text = collectConfigJsonCode();
  configEditorRenderedText = text;
  $('#config-json-editor').val(text);
  updateConfigJsonMetadata(text);
}

function renderConfigJsonCode(text) {
  const $code = $('#config-json-code');
  if (!$code.length) return;

  const lines = String(text || '').split('\n');
  const ranges = getJsonFoldRanges(lines);
  const isEditing = !$('#config-json-editor').prop('readonly');
  $code.empty();

  lines.forEach((line, lineIndex) => {
    const $line = $('<div class="config-json-line"></div>').attr('data-line-index', lineIndex);
    const $gutter = $('<span class="config-json-gutter"></span>');
    if (ranges.has(lineIndex)) {
      $gutter.append(
        $('<button type="button" class="config-json-fold" aria-expanded="true"></button>')
          .attr('data-fold-end', ranges.get(lineIndex))
      );
    } else {
      $gutter.append('<span class="config-json-fold-placeholder"></span>');
    }
    $gutter.append($('<span class="config-json-line-number"></span>').text(lineIndex + 1));
    const $content = $('<span class="config-json-line-content"></span>')
      .text(line)
      .attr('contenteditable', isEditing ? 'true' : 'false')
      .attr('spellcheck', 'false');
    $line.append($gutter, $content);
    $code.append($line);
  });

  configEditorRenderedText = String(text || '');
  updateConfigJsonFoldAction();
}

function setConfigEditorText(text) {
  const normalized = String(text || '');
  configEditorRenderedText = normalized;
  $('#config-json-editor').val(normalized);
  renderConfigJsonCode(normalized);
  updateConfigJsonMetadata(normalized);
}

function formatConfigFileSize(text) {
  const bytes = typeof Blob === 'function'
    ? new Blob([text]).size
    : encodeURIComponent(text).replace(/%[0-9A-F]{2}|./gi, 'x').length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatConfigUpdatedAt(value) {
  if (!value) return I18n.t('config_never_updated');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return I18n.t('config_never_updated');
  return date.toLocaleString(I18n.getCurrentLanguage(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function updateConfigJsonMetadata(text = getConfigEditorText()) {
  let version = '-';
  try {
    const data = JSON.parse(text);
    if (data && data.version !== undefined && data.version !== null) {
      version = `v${data.version}`;
    }
  } catch (error) {
    // Keep the version placeholder while the edited JSON is incomplete.
  }

  $('#config-json-version').text(version);
  $('#config-json-size').text(formatConfigFileSize(String(text || '')));
  $('#config-json-updated-at')
    .removeAttr('data-i18n')
    .text(formatConfigUpdatedAt(configLastUpdatedAt));
}

function getConfigEditorText() {
  const sourceText = $('#config-json-editor').val() || '';
  if (!$('#config-json-code').length || sourceText !== configEditorRenderedText) return sourceText;
  return collectConfigJsonCode();
}

function setJsonFoldState($line, shouldCollapse) {
  const start = Number($line.attr('data-line-index'));
  const end = Number($line.find('.config-json-fold').attr('data-fold-end'));
  if (!Number.isFinite(end)) return;

  const $lines = $('#config-json-code .config-json-line');
  const $range = $lines.slice(start + 1, end + 1).prop('hidden', shouldCollapse);
  if (!shouldCollapse) {
    $range.removeClass('collapsed').find('.config-json-fold').attr('aria-expanded', 'true');
  }
  $line.toggleClass('collapsed', shouldCollapse);
  $line.find('.config-json-fold').attr('aria-expanded', String(!shouldCollapse));
  updateConfigJsonFoldAction();
}

function updateConfigJsonFoldAction() {
  const $button = $('#toggle-config-json-fold-btn');
  if (!$button.length) return;
  const hasFoldableContent = $('#config-json-code .config-json-fold').length > 0;
  const hasCollapsedContent = $('#config-json-code .config-json-line.collapsed').length > 0;
  const action = hasCollapsedContent ? 'expand' : 'collapse';
  const translationKey = action === 'expand' ? 'expand_json' : 'collapse_json';
  $button
    .attr('data-action', action)
    .prop('disabled', !hasFoldableContent)
    .attr('data-i18n-title', translationKey)
    .attr('title', I18n.t(translationKey))
    .attr('aria-label', I18n.t(translationKey))
    .html(MainIcons.render(action === 'expand' ? 'unfoldAll' : 'foldAll', { width: 16, height: 16 }));
}

function focusConfigJsonLine(lineIndex, offset = 0) {
  const element = $('#config-json-code .config-json-line-content').get(lineIndex);
  if (!element) return;
  const textNode = element.firstChild || element.appendChild(document.createTextNode(''));
  const range = document.createRange();
  range.setStart(textNode, Math.min(offset, textNode.textContent.length));
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  element.focus();
}

function refreshConfigEditor(force = false) {
  const $editor = $('#config-json-editor');
  if (!$editor.length || (!force && !$editor.prop('readonly'))) return;

  try {
    const data = ConfigModule.buildEditableConfigData
      ? ConfigModule.buildEditableConfigData(getConfigFileOptions())
      : ConfigModule.buildConfigData(false);
    const text = JSON.stringify(data, null, 2);
    configLastUpdatedAt = typeof StorageModule.getConfigUpdatedAt === 'function'
      ? StorageModule.getConfigUpdatedAt()
      : configLastUpdatedAt;
    configEditorSnapshot = text;
    $editor.prop('readonly', true);
    setConfigEditorText(text);
    $('#config-editor-actions').prop('hidden', true);
    $('#config-editor-state')
      .removeClass('editing')
      .text(I18n.t('config_readonly'));
  } catch (error) {
    console.info('Failed to render configuration editor:', error);
  }
}

function setConfigEditorEditing(isEditing) {
  const $editor = $('#config-json-editor');
  $editor.prop('readonly', !isEditing);
  $('#config-json-code')
    .toggleClass('editing', isEditing)
    .find('.config-json-line-content')
    .attr('contenteditable', isEditing ? 'true' : 'false');
  $('.config-json-editor-shell').toggleClass('editing', isEditing);
  $('#config-editor-actions').prop('hidden', !isEditing);
  $('#config-editor-state')
    .toggleClass('editing', isEditing)
    .text(I18n.t(isEditing ? 'config_editing' : 'config_readonly'));
  $('#config-include-subscriptions, #config-include-subscription-cache').prop('disabled', isEditing);
  if (!isEditing && !$('#config-include-subscriptions').prop('checked')) {
    $('#config-include-subscription-cache').prop('disabled', true);
  }
}

function refreshMainView(options) {
  options = options || {};

  const list = options.list || (typeof StorageModule.getScenarios === 'function'
    ? StorageModule.getScenarios().flatMap(scenario => scenario.proxies || [])
    : StorageModule.getProxies());
  const shouldParseSubscriptions = options.parseSubscriptions !== false;
  const shouldRenderScenarios = options.renderScenarios !== false;

  if (shouldParseSubscriptions && SubscriptionModule && typeof SubscriptionModule.parseProxyListSubscriptions === 'function') {
    SubscriptionModule.parseProxyListSubscriptions(list);
  }

  ProxyModule.setList(list);
  ProxyModule.renderList();

  if (shouldRenderScenarios && ScenariosModule) {
    if (typeof ScenariosModule.renderScenarioViews === 'function') {
      ScenariosModule.renderScenarioViews();
    } else if (typeof ScenariosModule.renderScenarioSelector === 'function') {
      ScenariosModule.renderScenarioSelector();
    }
  }
}

function saveConfig(options) {
  options = options || {};

  StorageModule.save().then(() => {
    if (!options.silent) {
      UtilsModule.showTip(options.successMsg || I18n.t('save_success'), false);
    }

    if (SyncModule.getSyncConfig().type === 'native') {
      SyncModule.updateNativeQuotaInfo();
    }

    if (options.callback) options.callback(true);
  }).catch(err => {
    console.info('Save failed:', err);
    if (!options.silent) {
      UtilsModule.showTip(I18n.t('save_failed'), true);
    }
    if (options.callback) options.callback(false);
  });
}

// ==========================================
// UI Components
// ==========================================
let nativeSelectId = 0;

function syncNativeSelect($select) {
  const select = $select && $select[0];
  if (!select) return;

  const $container = $select.closest('.native-select-enhanced');
  if (!$container.length) return;

  const selectedOption = select.options[select.selectedIndex] || select.options[0];
  const selectedValue = selectedOption ? selectedOption.value : '';
  const selectedText = selectedOption ? selectedOption.text : '';
  const $menu = $container.find('.native-select-options');

  $container.find('.native-select-value').text(selectedText);
  $menu.empty();

  Array.from(select.options).forEach(function (option) {
    const $item = $('<li role="option" tabindex="-1"></li>')
      .attr('data-value', option.value)
      .attr('aria-selected', option.value === selectedValue ? 'true' : 'false')
      .text(option.text);

    if (option.value === selectedValue) {
      $item.addClass('selected-option');
    }
    if (option.disabled) {
      $item.addClass('disabled-option').attr('aria-disabled', 'true');
    }
    $menu.append($item);
  });

  const isDisabled = Boolean(select.disabled);
  $container.toggleClass('disabled', isDisabled);
  $container.find('.native-select-trigger')
    .prop('disabled', isDisabled)
    .attr('aria-disabled', isDisabled ? 'true' : 'false');
}

function enhanceNativeSelects(root) {
  const $root = $(root || document);
  let $selects = $root.is('select') ? $root : $root.find('select');
  $selects = $selects.filter(':not([multiple])').not('.native-select-source');

  $selects.each(function () {
    const $select = $(this);
    if ($select.closest('.native-select-enhanced').length) return;

    nativeSelectId += 1;
    const menuId = `native-select-options-${nativeSelectId}`;
    const originalTabIndex = $select.attr('tabindex');
    const labelText = $select.attr('aria-label') || $select.closest('.form-item').find('label').first().text().trim();
    const icon = typeof MainIcons !== 'undefined'
      ? MainIcons.render('chevronDown', { width: 14, height: 14, className: 'select-icon' })
      : '<span class="select-icon" aria-hidden="true">⌄</span>';
    const $container = $('<div class="lh-select native-select-enhanced"></div>');
    const $trigger = $(`<button type="button" class="lh-select-k native-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="${menuId}"></button>`);
    const $value = $('<span class="lh-select-value native-select-value"></span>');
    const $menu = $(`<ul id="${menuId}" class="lh-select-op native-select-options" role="listbox"></ul>`);

    if (originalTabIndex !== undefined) {
      $trigger.attr('tabindex', originalTabIndex);
    }
    if (labelText) {
      $trigger.attr('aria-label', labelText);
    }

    $trigger.append($value).append(icon);
    $select.wrap($container);
    $select.before($trigger, $menu);
    $select.addClass('native-select-source').attr({
      'aria-hidden': 'true',
      'tabindex': '-1'
    });
    syncNativeSelect($select);
  });
}

function initDropdowns() {
  function closeDropdowns($except) {
    const $menus = $except ? $('.lh-select-op').not($except) : $('.lh-select-op');
    $menus.hide().removeClass('drop-up');
    $menus.each(function () {
      const $container = $(this).closest('.lh-select, .header-left-controls');
      $container.removeClass('dropdown-open');
      $container.find('.native-select-trigger').attr('aria-expanded', 'false');
    });
  }

  function positionDropdown($menu, $trigger) {
    $menu.removeClass('drop-up');
    const trigger = $trigger && $trigger[0];
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = $menu.outerHeight();
    const availableBelow = window.innerHeight - triggerRect.bottom;
    const availableAbove = triggerRect.top;
    if (availableBelow < menuHeight + 8 && availableAbove > availableBelow) {
      $menu.addClass('drop-up');
    }
  }

  $("html").off("click.dropdownMenus").on("click.dropdownMenus", function () {
    closeDropdowns();
  });

  enhanceNativeSelects(document);

  $(document).off('change.nativeSelectSync', 'select.native-select-source')
    .on('change.nativeSelectSync', 'select.native-select-source', function () {
      syncNativeSelect($(this));
    });

  $(document).off("click", ".lh-select-k").on("click", ".lh-select-k", function (e) {
    e.stopPropagation();
    const that = this;
    const $op = $(that).next();
    const display = $op.css('display');

    closeDropdowns($op);

    if (display != 'none') {
      $op.hide().removeClass('drop-up');
      $(that).closest('.lh-select').removeClass('dropdown-open');
      return;
    }

    setTimeout(function () {
      const $select = $(that).closest('.lh-select');
      $select.addClass('dropdown-open');
      $op.show();
      $select.find('.native-select-trigger').attr('aria-expanded', 'true');
      positionDropdown($op, $(that));
    }, 50);
  });

  $(document).off("click", ".lh-select-op li").on("click", ".lh-select-op li", function (e) {
    e.stopPropagation();
    const $li = $(this);
    if ($li.hasClass('disabled-option')) return;

    const $container = $li.closest('.lh-select');
    const type = $container.data("type");
    $li.parent().removeClass('drop-up');
    $container.removeClass('dropdown-open');
    $container.find('.native-select-trigger').attr('aria-expanded', 'false');
    $li.closest('.header-left-controls').removeClass('dropdown-open');

    $li.siblings().removeClass("selected-option");
    $li.addClass("selected-option");
    $li.parent().hide();

    const txt = $li.text();
    const val = $li.data("value") || txt;

    const $nativeSelect = $container.find('select.native-select-source');
    if ($nativeSelect.length) {
      const nativeValue = $li.attr('data-value');
      $nativeSelect.val(nativeValue === undefined ? '' : nativeValue).trigger('change');
      return;
    }

    const $selectVal = $container.find(".lh-select-value");
    $selectVal.text(txt);

    const i = $selectVal.data("index");

    if (typeof i !== 'undefined') {
      const proxy = typeof ProxyModule.getProxy === 'function'
        ? ProxyModule.getProxy(i)
        : StorageModule.getProxies()[i];
      if (proxy) {
        if (type === 'protocol') {
          const cleanVal = UtilsModule.cleanProtocol(val);
          proxy.protocol = cleanVal;
          const $badge = $li.closest('.proxy-card').find('.proxy-type-badge');
          $badge.text(cleanVal.toUpperCase()).removeClass('http https socks5').addClass(cleanVal);

          const isSocks5 = cleanVal === 'socks5';
          const disableAuth = !isFirefox && isSocks5;
          const $formGrid = $li.closest('.proxy-body-container');
          const $authInputs = $formGrid.find('.username, .password');

          $authInputs.prop('disabled', disableAuth);
          if (!disableAuth) {
            $authInputs.removeAttr('title');
          }
        } else if (type === 'fallback') {
          proxy.fallback_policy = val;
        }
      }
    }
  });

  $(document).off('keydown.nativeSelect', '.native-select-trigger, .native-select-options li')
    .on('keydown.nativeSelect', '.native-select-trigger, .native-select-options li', function (e) {
      const $target = $(this);
      const $container = $target.closest('.native-select-enhanced');
      const $trigger = $container.find('.native-select-trigger');
      const $options = $container.find('.native-select-options li:not(.disabled-option)');

      if ($target.hasClass('native-select-trigger')) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (e.key !== 'ArrowDown' || !$container.hasClass('dropdown-open')) {
            $trigger.trigger('click');
          }
          setTimeout(function () {
            const $selected = $options.filter('.selected-option');
            ($selected.length ? $selected : $options.first()).trigger('focus');
          }, 60);
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $target.trigger('click');
        $trigger.trigger('focus');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const index = $options.index($target);
        const offset = e.key === 'ArrowDown' ? 1 : -1;
        $options.eq((index + offset + $options.length) % $options.length).trigger('focus');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdowns();
        $trigger.trigger('focus');
      }
    });

  // Listen for storage changes
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local' && changes[CONFIG_UPDATED_AT_KEY]) {
      configLastUpdatedAt = changes[CONFIG_UPDATED_AT_KEY].newValue || null;
      updateConfigJsonMetadata();
    }

    if (namespace === 'local' && changes.config) {
      if (!changes[CONFIG_UPDATED_AT_KEY]) {
        const updatedAt = changes.config.newValue?.updated_at || new Date().toISOString();
        configLastUpdatedAt = updatedAt;
        updateConfigJsonMetadata();
        chrome.storage.local.set({ [CONFIG_UPDATED_AT_KEY]: updatedAt });
      }

      if (StorageModule.isSubscriptionOnlyChange(changes.config.oldValue, changes.config.newValue)) {
        StorageModule.mergeSubscriptionChanges(changes.config.newValue);
        ProxyModule.updateSubscriptionLinesDisplay();
        return;
      }

      StorageModule.reload().then(() => {
        const config = StorageModule.getConfig();
        if (config?.system?.sync) {
          SyncModule.setSyncConfig(config.system.sync);
          SyncModule.updateSyncUI();
        }
        refreshMainView();
        refreshConfigEditor();
      });
    }
  });
}

function bindGlobalEvents() {
  $(".sync-selector .lh-select-op li").on("click", function () {
    const type = $(this).data("value");
    const config = SyncModule.getSyncConfig();
    config.type = type;
    SyncModule.setSyncConfig(config);
    SyncModule.updateSyncUI();
    $(this).closest('.lh-select-op').hide();
  });

  $("#gist-token-eye input").on("change", function () {
    const isChecked = $(this).prop("checked");
    const $input = $("#gist-token");
    $input.attr("type", isChecked ? "text" : "password");
    const $toggle = $(this).parent();
    if (isChecked) $toggle.removeClass('hide-password').addClass('show-password');
    else $toggle.removeClass('show-password').addClass('hide-password');
  });

  $("#sync-auto-mode").on("change", function () {
    const isDisabled = $(this).val() === 'off';
    $("#sync-interval").prop('disabled', isDisabled).trigger('change');
  });

  $("#save-sync-config").on("click", function () {
    UtilsModule.showProcessingTip(I18n.t('processing'));
    const config = SyncModule.getSyncConfig();
    if (config.type === 'gist') {
      config.gist.token = $("#gist-token").val();
      config.gist.filename = $("#gist-filename").val() || 'proxy_assistant_config.json';
    }
    config.auto_mode = $("#sync-auto-mode").val() || 'off';
    config.interval_minutes = Number($("#sync-interval").val()) || 360;

    StorageModule.setSyncConfig(config);
    StorageModule.save().then(() => {
      UtilsModule.showTip(I18n.t('save_success'), false);
      SyncModule.updateSyncUI();
    }).catch(() => {
      UtilsModule.showTip(I18n.t('save_failed'), true);
    });
  });

  $("#sync-pull-btn").on("click", function () {
    UtilsModule.showProcessingTip(I18n.t('processing'));
    SyncModule.manualPull();
  });

  $("#sync-push-btn").on("click", function () {
    UtilsModule.showProcessingTip(I18n.t('processing'));
    SyncModule.manualPush();
  });

  $("#test-sync-connection").on("click", async function () {
    const $btn = $(this);
    const originalText = $btn.find('span').text();
    UtilsModule.showProcessingTip(I18n.t('processing'));
    $btn.prop('disabled', true).find('span').text(I18n.t('testing'));

    try {
      let resultMsg = "";
      const config = SyncModule.getSyncConfig();
      if (config.type === 'gist') {
        config.gist.token = $("#gist-token").val();
        config.gist.filename = $("#gist-filename").val() || 'proxy_assistant_config.json';
        SyncModule.setSyncConfig(config);
        resultMsg = await SyncModule.testGistConnection();
      }

      UtilsModule.showTip(resultMsg, false);

    } catch (e) {
      UtilsModule.showTip(I18n.t('test_failed') + ": " + e.message, true);
    } finally {
      $btn.prop('disabled', false).find('span').text(originalText);
    }
  });

  $(".export-btn").on("click", function () {
    ConfigModule.exportConfig(getConfigFileOptions());
  });
  $(".import-json-btn").on("click", function () { $("#json-file-input").click(); });
  $("#json-file-input").on("change", ConfigModule.importConfig);

  $('#config-include-subscriptions').on('change', function () {
    $('#config-include-subscription-cache').prop('disabled', !$(this).prop('checked'));
    saveConfigFileOptions();
    refreshConfigEditor(true);
  });

  $('#config-include-subscription-cache').on('change', function () {
    saveConfigFileOptions();
    refreshConfigEditor(true);
  });

  $('#edit-config-btn').on('click', function () {
    refreshConfigEditor(true);
    configEditorSnapshot = getConfigEditorText();
    setConfigEditorEditing(true);
    focusConfigJsonLine(0);
  });

  $('#config-json-code').on('input', '.config-json-line-content', function () {
    syncConfigJsonSource();
  }).on('keydown', '.config-json-line-content', function (event) {
    const $content = $(this);
    const lineIndex = Number($content.closest('.config-json-line').attr('data-line-index'));
    const selection = window.getSelection();
    const offset = selection.rangeCount ? selection.getRangeAt(0).startOffset : $content.text().length;
    const lineText = $content.text();

    if (event.key === 'Backspace' && offset === 0 && lineIndex > 0) {
      event.preventDefault();
      const lines = collectConfigJsonCode().split('\n');
      const previousLength = lines[lineIndex - 1].length;
      lines.splice(lineIndex - 1, 2, lines[lineIndex - 1] + lines[lineIndex]);
      setConfigEditorText(lines.join('\n'));
      focusConfigJsonLine(lineIndex - 1, previousLength);
      return;
    }

    if (event.key !== 'Enter' && event.key !== 'Tab') return;
    event.preventDefault();

    if (event.key === 'Tab') {
      const updated = lineText.slice(0, offset) + '  ' + lineText.slice(offset);
      $content.text(updated);
      syncConfigJsonSource();
      focusConfigJsonLine(lineIndex, offset + 2);
      return;
    }

    const lines = collectConfigJsonCode().split('\n');
    lines.splice(lineIndex, 1, lineText.slice(0, offset), lineText.slice(offset));
    setConfigEditorText(lines.join('\n'));
    focusConfigJsonLine(lineIndex + 1);
  });

  $('#config-json-code').on('click', '.config-json-fold', function () {
    const $line = $(this).closest('.config-json-line');
    setJsonFoldState($line, !$line.hasClass('collapsed'));
  });

  $('#toggle-config-json-fold-btn').on('click', function () {
    const shouldExpand = $(this).attr('data-action') === 'expand';
    if (shouldExpand) {
      $('#config-json-code .config-json-line').prop('hidden', false).removeClass('collapsed');
      $('#config-json-code .config-json-fold').attr('aria-expanded', 'true');
      updateConfigJsonFoldAction();
      return;
    }

    $('#config-json-code .config-json-line:has(.config-json-fold)').each(function () {
      setJsonFoldState($(this), true);
    });
    updateConfigJsonFoldAction();
  });

  $('#copy-config-json-btn').on('click', function () {
    const $button = $(this);
    const copyText = getConfigEditorText();
    const clipboard = navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      UtilsModule.showTip(I18n.t('copy_failed'), true);
      return;
    }

    clipboard.writeText(copyText).then(() => {
      $button
        .html(MainIcons.render('check', { width: 16, height: 16 }))
        .attr('title', I18n.t('copy_success'))
        .attr('aria-label', I18n.t('copy_success'));
      UtilsModule.showTip(I18n.t('copy_success'), false);
      setTimeout(() => {
        $button
          .html(MainIcons.render('copy', { width: 16, height: 16 }))
          .attr('title', I18n.t('copy_config'))
          .attr('aria-label', I18n.t('copy_config'));
      }, 1500);
    }).catch(() => {
      UtilsModule.showTip(I18n.t('copy_failed'), true);
    });
  });

  $('#format-config-btn').on('click', function () {
    try {
      const data = JSON.parse(getConfigEditorText());
      setConfigEditorText(JSON.stringify(data, null, 2));
    } catch (error) {
      UtilsModule.showTip(I18n.t('alert_parse_error') + ': ' + error.message, true);
    }
  });

  $('#cancel-config-edit-btn').on('click', function () {
    setConfigEditorText(configEditorSnapshot);
    setConfigEditorEditing(false);
  });

  $('#apply-config-btn').on('click', function () {
    let data;
    try {
      data = JSON.parse(getConfigEditorText());
    } catch (error) {
      UtilsModule.showTip(I18n.t('alert_parse_error') + ': ' + error.message, true);
      return;
    }

    const $button = $(this).prop('disabled', true);
    UtilsModule.showProcessingTip(I18n.t('processing'));
    const configFileOptions = getConfigFileOptions();
    ConfigModule.applyConfigData(data, {
      preserveOmittedSubscriptionCache: !configFileOptions.includeSubscriptionCache
    }).then(() => {
      refreshMainView();
      if (SubscriptionModule.renderManagementList) {
        SubscriptionModule.renderManagementList();
      }
      if (ScenariosModule.renderScenarioManagementList) {
        ScenariosModule.renderScenarioManagementList();
      }
      refreshConfigEditor(true);
      UtilsModule.showTip(I18n.t('save_success'), false);
    }).catch(error => {
      UtilsModule.showTip(I18n.t('save_failed') + ': ' + error.message, true);
    }).finally(() => {
      $button.prop('disabled', false);
    });
  });

  $("#detect-proxy-btn").on("click", DetectionModule.detectProxy);
  $("#pac-details-btn").on("click", DetectionModule.showPacDetails);

  $(document).on("click", ".version-row-retry-btn", function () {
    const source = $(this).data("source");
    const currentVersion = chrome.runtime.getManifest().version;
    $(this).prop("disabled", true).text(I18n.t('version_checking'));

    if (source === "github") {
      VersionModule.checkGitHubVersion(currentVersion).finally(() => {
        $(this).prop("disabled", false);
      });
    } else if (source === "store") {
      VersionModule.checkStoreVersion(currentVersion, true).finally(() => {
        $(this).prop("disabled", false);
      });
    }
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      const popupOrder = [
        '.alert-scenario-tip',
        '.edit-scenario-tip',
        '.delete-scenario-tip',
        '.subscription-config-tip',
        '.pac-details-tip',
        '.proxy-detection-tip',
        '.delete-tip'
      ];

      for (let i = 0; i < popupOrder.length; i++) {
        const $popup = $(popupOrder[i]);
        if ($popup.hasClass('show')) {
          $popup.removeClass("show");
          setTimeout(function (popup) {
            return function () { popup.hide(); };
          }($popup), 300);
          return;
        }
      }
    }
  });
}

// ==========================================
// Popups
// ==========================================

$(".delete-tip-close-btn, .delete-tip-cancel-btn, .delete-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('delete-tip-close-btn') || $(this).hasClass('delete-tip-cancel-btn')) {
    $(".delete-tip").removeClass("show");
    setTimeout(function () { $(".delete-tip").hide(); }, 300);
  }
});

$(".delete-tip-confirm-btn").on("click", function () {
  ProxyModule.confirmDelete();
});

$(".delete-tip").hide();

$(".proxy-detection-close-btn, .proxy-detection-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('proxy-detection-close-btn')) {
    $(".proxy-detection-tip").removeClass("show");
    setTimeout(function () { $(".proxy-detection-tip").hide(); }, 300);
  }
});

$(".pac-details-close-btn, .pac-details-close-btn-secondary, .pac-details-tip").on("click", function (e) {
  if (this === e.target || $(this).hasClass('pac-details-close-btn') || $(this).hasClass('pac-details-close-btn-secondary')) {
    if (typeof DetectionModule !== 'undefined' && DetectionModule.closePacDetails) {
      DetectionModule.closePacDetails();
    }
    $(".pac-details-tip").removeClass("show");
    setTimeout(function () { $(".pac-details-tip").hide(); }, 300);
  }
});

$("#pac-copy-btn").on("click", function () {
  var script = $("#pac-script-content").text();
  var $btn = $(this);
  var copyIcon = MainIcons.render('copy', { width: 16, height: 16 });
  var checkIcon = MainIcons.render('check', { width: 16, height: 16 });

  navigator.clipboard.writeText(script).then(function () {
    $btn.html(checkIcon);
    setTimeout(function () { $btn.html(copyIcon); }, 2000);
  }).catch(function (err) { console.log("Failed to copy:", err); });
});

$("#pac-toggle-btn").on("click", function () {
  var $btn = $(this);
  var $wrapper = $("#pac-script-wrapper");
  var isExpanded = !$wrapper.hasClass("collapsed");

  if (isExpanded) {
    $wrapper.addClass("collapsed");
    $btn.removeClass("expanded");
  } else {
    $wrapper.removeClass("collapsed");
    $btn.addClass("expanded");
  }
});

$(".pac-details-tip").hide();

// ==========================================
// Export for use in other modules
// ==========================================
window.saveConfig = saveConfig;
window.enhanceNativeSelects = enhanceNativeSelects;
