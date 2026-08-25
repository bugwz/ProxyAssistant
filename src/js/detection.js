// ==========================================
// Detection Module - Proxy Detection & PAC
// ==========================================

let pacStorageListener = null;
let runtimeLogs = [];
let runtimeLogSortOrder = 'asc';
let runtimeLogAutoUpdateEnabled = false;
let runtimeLogAutoUpdateTimer = null;
let runtimeLogClearTrigger = null;
let runtimeLogClearHideTimer = null;

const MIN_REFRESH_FEEDBACK_MS = 600;
const RUNTIME_LOG_AUTO_UPDATE_INTERVAL_MS = 1000;
const RUNTIME_LOG_STORAGE_KEY = 'runtime_logs';
const RUNTIME_LOG_SORT_ORDER_STORAGE_KEY = 'proxyAssistant.runtimeLogSortOrder';

const detectionIcons = {
  disabled: MainIcons.render('disabledCircle', { width: 48, height: 48, style: 'color:#94a3b8' }),
  error: MainIcons.render('errorCircle', { width: 48, height: 48, style: 'color:#ef4444' }),
  loading: MainIcons.render('loading', { width: 48, height: 48, className: 'spin' })
};

function formatDateTime(value) {
  const date = value === undefined ? new Date() : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const pad = number => String(number).padStart(2, '0');
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-')
    + ' '
    + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(':');
}

// ==========================================
// Proxy Detection
// ==========================================

function waitForRefreshFeedback(startTime) {
  const remainingTime = MIN_REFRESH_FEEDBACK_MS - (Date.now() - startTime);
  return remainingTime > 0
    ? new Promise(resolve => setTimeout(resolve, remainingTime))
    : Promise.resolve();
}

function getDetectionPlaceholderSections() {
  return [
    {
      title: I18n.t('proxy_extension_section'),
      items: [
        { label: I18n.t('proxy_extension_mode'), value: '-' },
        { label: I18n.t('proxy_control'), value: '-' },
        { label: I18n.t('scenario_name'), value: '-' },
        { label: I18n.t('proxy_current_node'), value: '-' },
        { label: I18n.t('proxy_server'), value: '-' },
        { label: I18n.t('authentication'), value: '-' }
      ]
    }
  ];
}

async function detectProxy(event) {
  const shouldDelayFeedback = event?.type === 'click';
  const refreshStartedAt = Date.now();
  const $btn = $('#detect-proxy-btn').prop('disabled', true);
  const $content = $('.diagnostics-detection-card .proxy-detection-content');
  $content.addClass('is-refreshing').attr('aria-busy', 'true');

  $('#detection-status-icon').html(detectionIcons.loading);
  $('#detection-status-text').text(I18n.t('proxy_effect_testing'));
  renderDetectionSections(getDetectionPlaceholderSections());
  $('#detection-warning, #detection-suggestion').hide();

  try {
    const browserConfig = await getBrowserProxyConfig();
    const pluginConfig = await getPluginProxyConfig();
    const result = analyzeProxyStatus(browserConfig, pluginConfig);
    if (shouldDelayFeedback) await waitForRefreshFeedback(refreshStartedAt);
    displayDetectionResult(result);
  } catch (error) {
    if (shouldDelayFeedback) await waitForRefreshFeedback(refreshStartedAt);
    console.log('Proxy detection error:', error);
    displayErrorResult(error.message);
  } finally {
    $content.removeClass('is-refreshing').attr('aria-busy', 'false');
    $btn.prop('disabled', false);
  }
}

function getBrowserProxyConfig() {
  return new Promise(function (resolve) {
    if (typeof chrome !== 'undefined' && chrome.proxy && chrome.proxy.settings) {
      chrome.proxy.settings.get({ incognito: false }, function (config) {
        resolve(config || { value: { mode: 'system' } });
      });
    } else {
      resolve({ value: { mode: 'system' } });
    }
  });
}

function getPluginProxyConfig() {
  return new Promise(function (resolve) {
    chrome.storage.local.get(['state', 'config'], function (result) {
      const config = result.config || {};
      const scenarios = config.scenarios?.lists || [];
      const currentScenarioId = config.scenarios?.current || 'default';
      const currentScenario = scenarios.find(s => s.id === currentScenarioId);
      const list = currentScenario?.proxies || [];
      resolve({
        mode: result.state?.proxy?.mode || 'disabled',
        currentProxy: result.state?.proxy?.current || null,
        currentScenarioName: currentScenario
          ? (currentScenario.name || I18n.t('scenario_default'))
          : '-',
        list: list
      });
    });
  });
}

function analyzeProxyStatus(browserConfig, pluginConfig) {
  var result = { status: 'normal', mode: pluginConfig.mode, statusText: '', sections: [], warning: null, suggestion: null };
  var browserMode = (browserConfig.value && browserConfig.value.mode) || 'system';
  var levelOfControl = browserConfig.levelOfControl || '';

  var proxyServer = '', proxyProtocol = '';
  if (browserConfig.value && browserConfig.value.rules) {
    var rules = browserConfig.value.rules;
    if (rules.singleProxy) { proxyServer = rules.singleProxy.host + ':' + rules.singleProxy.port; proxyProtocol = rules.singleProxy.scheme || 'http'; }
    else if (rules.proxyForHttp || rules.proxyForHttps) { var p = rules.proxyForHttp || rules.proxyForHttps; proxyServer = p.host + ':' + p.port; proxyProtocol = p.scheme || 'http'; }
  } else if (browserConfig.value && browserConfig.value.pacScript) { proxyServer = 'PAC Script'; proxyProtocol = 'Auto'; }

  var controlText = '';
  if (levelOfControl === 'controlled_by_this_extension') controlText = I18n.t('proxy_control_this');
  else if (levelOfControl === 'controlled_by_other_extensions') controlText = I18n.t('proxy_control_other');
  else controlText = I18n.t('proxy_control_system');
  const proxyEndpoint = proxyServer === 'PAC Script'
    ? proxyServer
    : [proxyProtocol ? proxyProtocol.toUpperCase() : '', proxyServer].filter(Boolean).join(' · ') || '-';

  var isUsingPlugin = false;
  var isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;

  if (isFirefox) {
    if (pluginConfig.mode !== 'disabled' && levelOfControl !== 'controlled_by_other_extensions') isUsingPlugin = true;
  } else {
    if (browserMode === 'fixed_servers' && pluginConfig.mode === 'manual') {
      if (pluginConfig.currentProxy && proxyServer) {
        var expectedServer = pluginConfig.currentProxy.ip + ':' + pluginConfig.currentProxy.port;
        isUsingPlugin = (proxyServer === expectedServer);
      }
    } else if (browserMode === 'pac_script' && pluginConfig.mode === 'auto') { isUsingPlugin = true; }
    else if (browserMode === 'disabled' && pluginConfig.mode === 'disabled') { isUsingPlugin = true; }
  }

  var hasOtherProxy = (levelOfControl === 'controlled_by_other_extensions');
  if (!isFirefox && pluginConfig.mode !== 'disabled') hasOtherProxy = hasOtherProxy || (browserMode === 'system');

  if (pluginConfig.mode === 'disabled') {
    result.status = 'disabled'; result.statusText = I18n.t('status_disabled');
  } else if (isUsingPlugin && !hasOtherProxy) {
    result.status = 'normal'; result.statusText = getPluginStatusText(pluginConfig.mode);
  } else {
    result.status = 'warning'; result.statusText = getPluginStatusText(pluginConfig.mode);
    result.warning = I18n.t('proxy_warning_system'); result.suggestion = I18n.t('proxy_suggestion_check');
  }

  const currentProxy = pluginConfig.currentProxy;
  const currentProxyName = currentProxy
    ? (currentProxy.name || [currentProxy.ip, currentProxy.port].filter(Boolean).join(':') || '-')
    : '-';
  let authStatus = '-';
  if (currentProxy) {
    authStatus = currentProxy.username || currentProxy.password
      ? I18n.t('proxy_auth_configured')
      : I18n.t('proxy_auth_none');
  } else if (pluginConfig.mode === 'auto') {
    authStatus = I18n.t('proxy_auth_dynamic');
  }
  result.sections = [
    {
      title: I18n.t('proxy_extension_section'),
      items: [
        { label: I18n.t('proxy_extension_mode'), value: getPluginModeDisplayName(pluginConfig.mode) },
        { label: I18n.t('proxy_control'), value: controlText },
        { label: I18n.t('scenario_name'), value: pluginConfig.currentScenarioName },
        { label: I18n.t('proxy_current_node'), value: currentProxyName },
        { label: I18n.t('proxy_server'), value: proxyEndpoint },
        { label: I18n.t('authentication'), value: authStatus }
      ]
    }
  ];
  return result;
}

function getPluginModeDisplayName(mode) {
  switch (mode) {
    case 'manual': return I18n.t('mode_manual');
    case 'auto': return I18n.t('mode_auto');
    default: return I18n.t('mode_disabled');
  }
}

function getPluginStatusText(mode) {
  return mode === 'manual'
    ? I18n.t('proxy_status_manual_mode')
    : I18n.t('proxy_status_auto_mode');
}

function renderDetectionSections(sections) {
  let detailsHtml = '';
  sections.forEach(function (section) {
    detailsHtml += '<section class="detection-info-group"><h3>' + UtilsModule.escapeHtml(section.title) + '</h3><div class="detection-info-grid">';
    section.items.forEach(function (item) {
      detailsHtml += '<div class="detection-row"><span class="detection-label">' + UtilsModule.escapeHtml(item.label) + '</span><span class="detection-value">' + UtilsModule.escapeHtml(item.value) + '</span></div>';
    });
    detailsHtml += '</div></section>';
  });
  $('#detection-details').html(detailsHtml).show();
}

function displayDetectionResult(result) {
  var statusIcon = detectionIcons.disabled;
  if (result.status !== 'disabled') {
    const iconName = result.mode === 'manual' ? 'manualMode' : 'autoMode';
    const iconColor = result.status === 'warning'
      ? '#f59e0b'
      : (result.mode === 'manual' ? 'var(--manual-mode-color)' : '#22c55e');
    statusIcon = MainIcons.render(iconName, { width: 48, height: 48, style: 'color:' + iconColor });
  }
  $("#detection-status-icon").html(statusIcon);
  $("#detection-status-text").text(result.statusText);

  renderDetectionSections(result.sections);
  $("#detection-checked-time").text(formatDateTime());

  if (result.warning) $("#detection-warning").text(result.warning).show(); else $("#detection-warning").hide();
  if (result.suggestion) { $("#detection-suggestion-text").text(result.suggestion); $("#detection-suggestion").show(); } else $("#detection-suggestion").hide();
}

function displayErrorResult(errorMsg) {
  $("#detection-status-icon").html(detectionIcons.error);
  $("#detection-status-text").text(I18n.t('proxy_status_error'));
  var safeErrorMsg = errorMsg ? UtilsModule.escapeHtml(errorMsg) : I18n.t('proxy_suggestion_retry');
  $("#detection-details").html('<section class="detection-info-group detection-error-group"><div class="detection-row"><span class="detection-label">Error</span><span class="detection-value">' + safeErrorMsg + '</span></div></section>').show();
  $("#detection-checked-time").text(formatDateTime());
  $("#detection-warning").hide();
  $("#detection-suggestion-text").text(I18n.t('proxy_suggestion_retry'));
  $("#detection-suggestion").show();
}

// ==========================================
// PAC Details
// ==========================================

function showPacDetails() {
  updatePacDetails();
  if (pacStorageListener) {
    chrome.storage.onChanged.removeListener(pacStorageListener);
  }
  pacStorageListener = function (changes, namespace) {
    if (namespace === 'local' && changes.state) {
      updatePacDetails();
    }
  };
  chrome.storage.onChanged.addListener(pacStorageListener);
}

function closePacDetails() {
  if (!pacStorageListener) return;
  chrome.storage.onChanged.removeListener(pacStorageListener);
  pacStorageListener = null;
}

function renderPacScript(text) {
  const script = String(text || '');
  const $code = $('#pac-script-content').data('script', script).empty();
  if (!script) return;

  script.split('\n').forEach(function (line, lineIndex) {
    const $gutter = $('<span class="config-json-gutter"></span>')
      .append('<span class="config-json-fold-placeholder"></span>')
      .append($('<span class="config-json-line-number"></span>').text(lineIndex + 1));
    const $content = $('<span class="config-json-line-content"></span>')
      .text(line)
      .attr('contenteditable', 'false')
      .attr('spellcheck', 'false');
    $('<div class="config-json-line"></div>')
      .attr('data-line-index', lineIndex)
      .append($gutter, $content)
      .appendTo($code);
  });
}

function updatePacDetails(event) {
  const shouldDelayFeedback = event?.type === 'click';
  const refreshStartedAt = Date.now();
  const $button = $('#pac-details-btn').prop('disabled', true);
  const $wrapper = $('#pac-script-wrapper');
  const previousHeight = $wrapper[0]?.getBoundingClientRect().height;
  if (previousHeight > 0) {
    $wrapper.css('height', `${previousHeight}px`);
  }
  const $content = $('.diagnostics-pac-card .pac-details-content')
    .addClass('is-refreshing')
    .attr('aria-busy', 'true');
  const $loading = $('.diagnostics-pac-card .pac-script-loading').attr('aria-hidden', 'false');
  renderPacScript('');
  $('#pac-rules-count-value').text('-');
  // Fetch the actual PAC script from the background worker to ensure it includes subscription logic
  return new Promise(resolve => chrome.runtime.sendMessage({ action: 'getPacScript' }, async function (response) {
    const runtimeError = chrome.runtime.lastError;
    if (shouldDelayFeedback) await waitForRefreshFeedback(refreshStartedAt);
    $('#pac-rules-count-text').text(I18n.t('pac_rules_count'));
    if (runtimeError) {
      console.info('Error fetching PAC script:', runtimeError);
      renderPacScript('// Error fetching PAC script: ' + runtimeError.message);
      $('#pac-rules-count-value').text('0');
    } else if (response && response.success) {
      renderPacScript(response.script);
      const ifCount = (response.script.match(/if\s*\(/g) || []).length;
      $('#pac-rules-count-value').text(ifCount);
      $('#pac-last-fetched-at').text(formatDateTime());
    } else {
      renderPacScript('// Failed to generate PAC script');
      $('#pac-rules-count-value').text('0');
    }
    $content.removeClass('is-refreshing').attr('aria-busy', 'false');
    $wrapper.css('height', '');
    $loading.attr('aria-hidden', 'true');
    $button.prop('disabled', false);
    resolve();
  }));
}

// ==========================================
// Runtime Logs
// ==========================================

const RUNTIME_LOG_MESSAGES = {
  extension_installed: 'Extension initialized after installation',
  extension_updated: 'Extension initialized after update',
  proxy_manual_enabled: 'Manual proxy enabled',
  proxy_auto_enabled: 'Automatic proxy enabled',
  proxy_disabled: 'Proxy disabled',
  proxy_apply_failed: 'Proxy configuration could not be applied',
  proxy_added: 'Proxy added',
  proxy_updated: 'Proxy configuration changed',
  proxy_deleted: 'Proxy deleted',
  proxy_reordered: 'Proxy order changed',
  scenario_activated: 'Proxy scenario switched',
  scenario_activation_failed: 'Proxy scenario could not be switched',
  scenario_added: 'Scenario added',
  scenario_updated: 'Scenario configuration changed',
  scenario_deleted: 'Scenario deleted',
  scenario_reordered: 'Scenario order changed',
  subscription_refreshed: 'Rule subscription refreshed',
  subscription_refresh_failed: 'Rule subscription refresh failed',
  subscription_added: 'Subscription added',
  subscription_updated: 'Subscription configuration changed',
  subscription_deleted: 'Subscription deleted',
  subscription_reordered: 'Subscription order changed',
  system_settings_updated: 'System settings changed',
  config_file_options_updated: 'Configuration file options changed',
  configuration_updated: 'Configuration changed',
  worker_error: 'Background task failed'
};

const RUNTIME_LOG_DETAIL_LABELS = {
  proxyName: 'proxy',
  subscriptionName: 'subscription',
  scenarioId: 'scenario',
  name: 'name',
  error: 'error',
  count: 'count',
  includeSubscriptions: 'include subscriptions',
  includeSubscriptionCache: 'include subscription cache'
};

const RUNTIME_LOG_LEVEL_LABELS = {
  info: 'INFO',
  warning: 'WARN',
  error: 'ERRO'
};

function getRuntimeLogMessage(log) {
  return RUNTIME_LOG_MESSAGES[log.event] || 'Unknown runtime event';
}

function getRuntimeLogDetails(log) {
  const details = log.details && typeof log.details === 'object' ? log.details : {};
  return Object.keys(details)
    .filter(key => details[key] !== '' && details[key] !== null && details[key] !== undefined)
    .map(key => {
      if (key === 'updated') {
        return details[key] ? 'content updated' : 'content unchanged';
      }
      const label = RUNTIME_LOG_DETAIL_LABELS[key]
        || key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
      const value = typeof details[key] === 'object'
        ? JSON.stringify(details[key])
        : String(details[key]);
      return `${label}: ${value}`;
    });
}

function getRuntimeLogContent(log) {
  const message = getRuntimeLogMessage(log);
  const details = getRuntimeLogDetails(log);
  const content = details.length ? `${message}, ${details.join(', ')}` : message;
  const normalizedContent = content.toLocaleLowerCase('en-US');
  return normalizedContent.charAt(0).toUpperCase() + normalizedContent.slice(1);
}

function updateRuntimeLogCounts() {
  const counts = runtimeLogs.reduce((result, log) => {
    const level = ['info', 'warning', 'error'].includes(log.level) ? log.level : 'info';
    result[level] += 1;
    return result;
  }, { info: 0, warning: 0, error: 0 });

  $('#runtime-log-count-total').text(runtimeLogs.length);
  $('#runtime-log-count-info').text(counts.info);
  $('#runtime-log-count-warning').text(counts.warning);
  $('#runtime-log-count-error').text(counts.error);
}

function updateRuntimeLogSortButton() {
  const isNewestFirst = runtimeLogSortOrder === 'desc';
  const translationKey = isNewestFirst
    ? 'runtime_logs_sort_oldest_first'
    : 'runtime_logs_sort_newest_first';
  const $button = $('#runtime-log-sort-btn');
  $button
    .attr('data-sort-order', runtimeLogSortOrder)
    .attr('aria-pressed', String(isNewestFirst))
    .attr('title', I18n.t(translationKey))
    .attr('aria-label', I18n.t(translationKey))
    .attr('data-i18n-title', translationKey)
    .attr('data-i18n-aria-label', translationKey)
    .html(MainIcons.render(isNewestFirst ? 'sortAscending' : 'sortDescending', { width: 16, height: 16 }));
}

function restoreRuntimeLogSortOrder() {
  try {
    const storedOrder = window.localStorage.getItem(RUNTIME_LOG_SORT_ORDER_STORAGE_KEY);
    runtimeLogSortOrder = storedOrder === 'desc' ? 'desc' : 'asc';
  } catch (error) {
    runtimeLogSortOrder = 'asc';
  }
}

function persistRuntimeLogSortOrder() {
  try {
    window.localStorage.setItem(RUNTIME_LOG_SORT_ORDER_STORAGE_KEY, runtimeLogSortOrder);
  } catch (error) {
    // Keep sorting available when browser storage is unavailable.
  }
}

function updateRuntimeLogLiveButton() {
  const translationKey = runtimeLogAutoUpdateEnabled
    ? 'runtime_logs_auto_update_disable'
    : 'runtime_logs_auto_update_enable';
  $('#runtime-log-live-btn')
    .attr('aria-pressed', String(runtimeLogAutoUpdateEnabled))
    .attr('title', I18n.t(translationKey))
    .attr('aria-label', I18n.t(translationKey))
    .attr('data-i18n-title', translationKey)
    .attr('data-i18n-aria-label', translationKey)
    .html('<span class="runtime-log-live-indicator" aria-hidden="true"><span class="runtime-log-live-dot"></span></span>');
}

function setRuntimeLogAutoUpdate(enabled) {
  runtimeLogAutoUpdateEnabled = enabled;
  if (runtimeLogAutoUpdateTimer) {
    clearInterval(runtimeLogAutoUpdateTimer);
    runtimeLogAutoUpdateTimer = null;
  }
  if (runtimeLogAutoUpdateEnabled) {
    loadRuntimeLogs();
    runtimeLogAutoUpdateTimer = setInterval(loadRuntimeLogs, RUNTIME_LOG_AUTO_UPDATE_INTERVAL_MS);
  }
  updateRuntimeLogLiveButton();
}

function getRuntimeLogKey(log, index) {
  return String(log.id || `${log.time || ''}:${log.event || ''}:${index}`);
}

function createRuntimeLogItem(log, lineNumber, key) {
  const level = ['info', 'warning', 'error'].includes(log.level) ? log.level : 'info';
  const $item = $('<article class="runtime-log-item"></article>')
    .addClass('runtime-log-' + level)
    .attr('data-runtime-log-key', key);
  const $gutter = $('<span class="runtime-log-gutter" aria-hidden="true"></span>');
  const $lineNumber = $('<span class="runtime-log-line-number"></span>').text(lineNumber);
  const $time = $('<time class="runtime-log-time"></time>').attr('datetime', log.time || '').text(formatDateTime(log.time));
  const $level = $('<span class="runtime-log-level"></span>').text(RUNTIME_LOG_LEVEL_LABELS[level]);
  const $message = $('<div class="runtime-log-message"></div>').text(getRuntimeLogContent(log));

  $gutter.append($lineNumber);
  $item.append($gutter, $time, $level, $message);
  return $item[0];
}

function reconcileRuntimeLogItems(orderedLogs) {
  const list = $('#runtime-log-list')[0];
  if (!list) return;
  const existingItems = new Map(Array.from(list.children).map(item => [item.dataset.runtimeLogKey, item]));
  const desiredItems = orderedLogs.map(({ log, lineNumber, key }) => {
    const item = existingItems.get(key) || createRuntimeLogItem(log, lineNumber, key);
    const lineNumberElement = item.querySelector('.runtime-log-line-number');
    if (lineNumberElement.textContent !== String(lineNumber)) {
      lineNumberElement.textContent = lineNumber;
    }
    existingItems.delete(key);
    return item;
  });

  desiredItems.forEach((item, index) => {
    if (list.children[index] !== item) {
      list.insertBefore(item, list.children[index] || null);
    }
  });
  existingItems.forEach(item => item.remove());
}

function renderRuntimeLogs() {
  updateRuntimeLogCounts();
  updateRuntimeLogSortButton();
  updateRuntimeLogLiveButton();
  const selectedLevel = $('#runtime-log-level').val() || 'all';
  const filteredLogs = runtimeLogs
    .map((log, index) => ({ log, key: getRuntimeLogKey(log, index) }))
    .filter(({ log }) => selectedLevel === 'all' || log.level === selectedLevel);
  const $empty = $('#runtime-log-empty');

  if (!filteredLogs.length) {
    reconcileRuntimeLogItems([]);
    $empty.prop('hidden', false);
    return;
  }

  $empty.prop('hidden', true);
  const orderedLogs = filteredLogs.map(({ log, key }, index) => ({ log, key, lineNumber: index + 1 }));
  if (runtimeLogSortOrder === 'desc') orderedLogs.reverse();
  reconcileRuntimeLogItems(orderedLogs);
}

function getRuntimeLogCopyText() {
  const orderedLogs = runtimeLogs.slice();
  if (runtimeLogSortOrder === 'desc') orderedLogs.reverse();
  return orderedLogs.map(log => {
    const level = ['info', 'warning', 'error'].includes(log.level) ? log.level : 'info';
    return `${formatDateTime(log.time)} ${RUNTIME_LOG_LEVEL_LABELS[level]} ${getRuntimeLogContent(log)}`;
  }).join('\n');
}

function copyRuntimeLogs() {
  const clipboard = navigator.clipboard;
  if (!clipboard || typeof clipboard.writeText !== 'function') {
    UtilsModule.showTip(I18n.t('runtime_logs_copy_failed'), true);
    return;
  }

  clipboard.writeText(getRuntimeLogCopyText()).then(function () {
    UtilsModule.showTip(I18n.t('runtime_logs_copy_success'), false);
  }).catch(function () {
    UtilsModule.showTip(I18n.t('runtime_logs_copy_failed'), true);
  });
}

function loadRuntimeLogs(event) {
  const shouldDelayFeedback = event?.type === 'click';
  const refreshStartedAt = Date.now();
  const $button = $('#refresh-runtime-logs-btn');
  if ($button.prop('disabled')) return;
  $button.prop('disabled', true);
  const $shell = $('.runtime-log-shell');
  const $wrapper = $('#runtime-log-wrapper');
  const $loading = $('.runtime-log-loading');
  if (shouldDelayFeedback) {
    const previousHeight = $wrapper[0]?.getBoundingClientRect().height;
    if (previousHeight > 0) {
      $wrapper.css('height', `${previousHeight}px`);
    }
    $shell.addClass('is-refreshing').attr('aria-busy', 'true');
    $loading.attr('aria-hidden', 'false');
    $('#runtime-log-list').empty();
    $('#runtime-log-empty').prop('hidden', true);
    $('#runtime-log-count-total, #runtime-log-count-info, #runtime-log-count-warning, #runtime-log-count-error').text('-');
  }
  chrome.storage.local.get([RUNTIME_LOG_STORAGE_KEY], function (result) {
    const loadFailed = Boolean(chrome.runtime.lastError);
    const finishLoading = function () {
      $button.prop('disabled', false);
      if (loadFailed) {
        runtimeLogs = [];
        $('#runtime-log-empty span').text(I18n.t('runtime_logs_load_failed'));
        renderRuntimeLogs();
        $shell.removeClass('is-refreshing').attr('aria-busy', 'false');
        $wrapper.css('height', '');
        $loading.attr('aria-hidden', 'true');
        return;
      }
      $('#runtime-log-empty span').text(I18n.t('runtime_logs_empty'));
      runtimeLogs = Array.isArray(result?.[RUNTIME_LOG_STORAGE_KEY])
        ? result[RUNTIME_LOG_STORAGE_KEY]
        : [];
      renderRuntimeLogs();
      $shell.removeClass('is-refreshing').attr('aria-busy', 'false');
      $wrapper.css('height', '');
      $loading.attr('aria-hidden', 'true');
    };

    if (!shouldDelayFeedback) {
      finishLoading();
      return;
    }

    const remainingTime = MIN_REFRESH_FEEDBACK_MS - (Date.now() - refreshStartedAt);
    if (remainingTime <= 0) {
      finishLoading();
      return;
    }
    setTimeout(finishLoading, remainingTime);
  });
}

function clearRuntimeLogs() {
  $('#clear-runtime-logs-btn').prop('disabled', true);
  chrome.storage.local.set({ [RUNTIME_LOG_STORAGE_KEY]: [] }, function () {
    $('#clear-runtime-logs-btn').prop('disabled', false);
    if (chrome.runtime.lastError) {
      UtilsModule.showTip(I18n.t('runtime_logs_clear_failed'), true);
      return;
    }
    runtimeLogs = [];
    $('#runtime-log-empty span').text(I18n.t('runtime_logs_empty'));
    renderRuntimeLogs();
  });
}

function closeRuntimeLogClearDialog() {
  const $dialog = $('.runtime-log-clear-tip');
  if (runtimeLogClearHideTimer) clearTimeout(runtimeLogClearHideTimer);
  $dialog.removeClass('show');
  runtimeLogClearHideTimer = setTimeout(function () {
    $dialog.hide();
    runtimeLogClearHideTimer = null;
  }, 200);

  if (runtimeLogClearTrigger) {
    runtimeLogClearTrigger.focus();
    runtimeLogClearTrigger = null;
  }
}

function openRuntimeLogClearDialog() {
  if (runtimeLogClearHideTimer) {
    clearTimeout(runtimeLogClearHideTimer);
    runtimeLogClearHideTimer = null;
  }
  runtimeLogClearTrigger = document.activeElement;
  $('.runtime-log-clear-tip').show().addClass('show');
  $('.runtime-log-clear-cancel-btn').trigger('focus');
}

function initRuntimeLogs() {
  restoreRuntimeLogSortOrder();
  updateRuntimeLogSortButton();
  $('#refresh-runtime-logs-btn').off('click.runtimeLogs').on('click.runtimeLogs', loadRuntimeLogs);
  $('#clear-runtime-logs-btn').off('click.runtimeLogs').on('click.runtimeLogs', openRuntimeLogClearDialog);
  $('#runtime-log-level').off('change.runtimeLogs').on('change.runtimeLogs', renderRuntimeLogs);
  $('#runtime-log-sort-btn').off('click.runtimeLogs').on('click.runtimeLogs', function () {
    runtimeLogSortOrder = runtimeLogSortOrder === 'asc' ? 'desc' : 'asc';
    persistRuntimeLogSortOrder();
    renderRuntimeLogs();
  });
  $('#runtime-log-copy-btn').off('click.runtimeLogs').on('click.runtimeLogs', copyRuntimeLogs);
  $('#runtime-log-live-btn').off('click.runtimeLogs').on('click.runtimeLogs', function () {
    setRuntimeLogAutoUpdate(!runtimeLogAutoUpdateEnabled);
  });
  $('.runtime-log-clear-close-btn, .runtime-log-clear-cancel-btn').off('click.runtimeLogs').on('click.runtimeLogs', closeRuntimeLogClearDialog);
  $('.runtime-log-clear-tip').off('click.runtimeLogs').on('click.runtimeLogs', function (event) {
    if (event.target === this) closeRuntimeLogClearDialog();
  });
  $('#confirm-clear-runtime-logs-btn').off('click.runtimeLogs').on('click.runtimeLogs', function () {
    closeRuntimeLogClearDialog();
    clearRuntimeLogs();
  });
  $(document).off('keydown.runtimeLogsClear').on('keydown.runtimeLogsClear', function (event) {
    if (event.key === 'Escape' && $('.runtime-log-clear-tip').hasClass('show')) {
      closeRuntimeLogClearDialog();
    }
  });
}

function generatePacScript(proxyList) {
  var script = "function FindProxyForURL(url, host) {\n";
  var usedPatterns = new Set();

  proxyList.forEach(function (proxy) {
    if (proxy.enabled === false || !proxy.ip || !proxy.port) return;
    const type = (proxy.protocol || "HTTP").toUpperCase();
    let proxyType = type.startsWith("SOCKS") ? "SOCKS5" : "PROXY";
    const proxyStr = proxyType + " " + proxy.ip + ":" + proxy.port;
    const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
    const returnVal = '"' + proxyStr + fallback + '"';

    if (proxy.include_rules) {
      const includeUrls = proxy.include_rules.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      includeUrls.forEach(function (pattern) {
        if (usedPatterns.has(pattern)) return;
        usedPatterns.add(pattern);

        if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          script += '  if (/' + regexPattern + '/.test(host)) return ' + returnVal + ';\n';
        } else {
          script += '  if (dnsDomainIs(host, "' + pattern + '") || host === "' + pattern + '") return ' + returnVal + ';\n';
        }
      });
    }
  });
  script += '  return "DIRECT";\n}';
  return script;
}

// Export for use
window.DetectionModule = {
  detectProxy,
  showPacDetails,
  updatePacDetails,
  renderPacScript,
  closePacDetails,
  initRuntimeLogs,
  loadRuntimeLogs,
  renderRuntimeLogs
};
