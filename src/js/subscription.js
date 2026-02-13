// Subscription Module
// Subscription configuration, fetching, and conversion

const SubscriptionModule = (function () {
  let currentProxyIndex = -1;
  // Holds the state for the currently open modal
  // Structure: { current: '...', lists: { ... } }
  let subscriptionConfig = null;

  const FORMATS = ['autoproxy', 'switchy_legacy', 'switchy_omega', 'pac'];
  const FORMAT_NAMES = {
    'autoproxy': 'AutoProxy',
    'switchy_legacy': 'Switchy Legacy',
    'switchy_omega': 'Switchy Omega',
    'pac': 'PAC'
  };

  function init() {
    bindEvents();
  }

  function getEmptyConfig() {
    const config = {
      enabled: false,
      current: 'autoproxy',
      lists: {}
    };
    [...FORMATS].forEach(f => {
      const isPac = f === 'pac';
      config.lists[f] = {
        url: '',
        content: '',
        decoded_content: '',
        include_rules: '',
        bypass_rules: '',
        include_lines: 0,
        bypass_lines: 0,
        refresh_interval: 0,
        reverse: false,
        last_fetch_time: null,
        ...(isPac ? {
          script: JSON.stringify({
            bypass: {
              left: "],[[",
              right: "],["
            },
            include: {
              left: "\"],[\"",
              right: "]]];"
            }
          }, null, 2)
        } : {})
      };
    });
    return config;
  }

  function bindEvents() {
    $('.subscription-config-close-btn, .subscription-config-tip').on('click', function (e) {
      if (this === e.target || $(this).hasClass('subscription-config-close-btn')) {
        closeModal();
      }
    });

    $('#subscription-enabled').on('change', function () {
      if (!subscriptionConfig) return;
      subscriptionConfig.enabled = $(this).prop('checked');
      $('.subscription-config-content').toggleClass('subscription-disabled', !subscriptionConfig.enabled);
    });

    $('#run-script-btn').on('click', function () {
      runPacProcessRule();
    });

    $('#reset-script-btn').on('click', function () {
      resetPacScript();
    });

    $('#subscription-process-rule-content').on('input', function () {
      if (!subscriptionConfig) return;
      const format = subscriptionConfig.current;
      if (format === 'pac') {
        subscriptionConfig.lists[format].process_rule = $(this).val();
      }
    });

    $('#fetch-subscription-btn').on('click', function () {
      const $btn = $(this);
      const $icon = $btn.find('svg');

      if ($btn.hasClass('btn-loading')) {
        return;
      }

      $btn.addClass('btn-loading');
      $icon.addClass('spinning');

      fetchSubscription().finally(function () {
        $btn.removeClass('btn-loading');
        $icon.removeClass('spinning');
      });
    });

    $('#save-subscription-btn').on('click', function () {
      saveSubscriptionConfig();
    });

    $('.subscription-format-selector .lh-select-op li').on('click', function () {
      const format = $(this).data('value');
      switchFormat(format);
      $(this).closest('.lh-select-op').hide();
    });

    $('.subscription-refresh-selector .lh-select-op li').on('click', function () {
      if (!subscriptionConfig) return;
      const interval = parseInt($(this).data('value'), 10) || 0;
      subscriptionConfig.lists[subscriptionConfig.current].refresh_interval = interval;
      $(this).closest('.lh-select-op').hide();
    });

    $('.subscription-reverse-selector .lh-select-op li').on('click', function () {
      if (!subscriptionConfig) return;
      const reverse = $(this).data('value') === true;
      subscriptionConfig.lists[subscriptionConfig.current].reverse = reverse;

      // Update UI text immediately
      const $selector = $(this).closest('.subscription-reverse-selector');
      $selector.find('.lh-select-value').text($(this).text());
      $selector.find('.lh-select-value').data('value', reverse);

      $(this).closest('.lh-select-op').hide();

      // Re-parse content with new setting
      const config = subscriptionConfig.lists[subscriptionConfig.current];
      updateContentDisplay(config.content || '', subscriptionConfig.current);
    });

    $('#subscription-url').on('input', function () {
      if (!subscriptionConfig) return;
      subscriptionConfig.lists[subscriptionConfig.current].url = $(this).val();
    });

    $('.subscription-tab').on('click', function () {
      const tab = $(this).data('tab');

      switchToTab(tab);
      updateProcessRuleEditable(tab);
      updateEmptyStateVisibility(tab);
    });
  }

  function openModal(proxyIndex) {
    currentProxyIndex = proxyIndex;
    loadModalData();
    updateModalUI();
    // Default to original tab
    $('.subscription-tab[data-tab="original"]').click();
    $('.subscription-config-tip').show().addClass('show');
  }

  function closeModal() {
    $('.subscription-config-tip').removeClass('show');
    setTimeout(function () {
      $('.subscription-config-tip').hide();
    }, 300);
    currentProxyIndex = -1;
    subscriptionConfig = null;
  }

  function loadModalData() {
    subscriptionConfig = getEmptyConfig();

    const proxyList = ProxyModule.getList();
    const proxy = currentProxyIndex >= 0 && proxyList ? proxyList[currentProxyIndex] : null;

    if (proxy && proxy.subscription) {
      subscriptionConfig.enabled = proxy.subscription.enabled !== false;
      const savedCurrent = proxy.subscription.current || proxy.subscription.activeFormat || 'autoproxy';
      subscriptionConfig.current = FORMATS.includes(savedCurrent) ? savedCurrent : FORMATS[0];

      const savedLists = proxy.subscription.lists || proxy.subscription.formats || {};

      [...FORMATS].forEach(f => {
        if (savedLists[f]) {
          subscriptionConfig.lists[f] = { ...savedLists[f] };
        }
      });
    }
  }

  function switchFormat(newFormat) {
    if (!subscriptionConfig) return;

    const oldFormat = subscriptionConfig.current;
    subscriptionConfig.lists[oldFormat].url = $('#subscription-url').val();

    subscriptionConfig.current = newFormat;
    updateModalUI();

    $('.subscription-tab[data-tab="original"]').click();
  }

  function updateModalUI() {
    if (!subscriptionConfig) return;

    // Update enabled toggle
    const enabled = subscriptionConfig.enabled !== false;
    $('#subscription-enabled').prop('checked', enabled);
    $('.subscription-config-content').toggleClass('subscription-disabled', !enabled);

    const format = subscriptionConfig.current;
    const config = subscriptionConfig.lists[format];

    // Update Selector
    $('.subscription-format-selector .lh-select-value').text(FORMAT_NAMES[format]);

    // Update Inputs
    $('#subscription-url').val(config.url || '');
    $('#subscription-raw-content').val(config.content || '');

    // Update Refresh Selector
    const refreshInterval = config.refresh_interval || 0;
    const $refreshSelector = $('.subscription-refresh-selector');
    const $refreshOption = $refreshSelector.find(`.lh-select-op li[data-value="${refreshInterval}"]`);
    $refreshSelector.find('.lh-select-op li').removeClass('selected-option');

    if ($refreshOption.length) {
      $refreshSelector.find('.lh-select-value').text($refreshOption.text());
      $refreshOption.addClass('selected-option');
    } else {
      // Fallback for custom values
      $refreshSelector.find('.lh-select-value').text(refreshInterval === 0 ? I18n.t('subscription_refresh_unit').replace('(0 = ', '').replace(')', '') : (refreshInterval + ' ' + I18n.t('subscription_refresh_unit').split(' ')[0]));
      if (refreshInterval === 0) {
        $refreshSelector.find(`.lh-select-op li[data-value="0"]`).addClass('selected-option');
      }
    }

    // Update Reverse Selector
    const reverse = config.reverse || false;
    const $reverseSelector = $('.subscription-reverse-selector');
    const reverseText = reverse ? I18n.t('yes') : I18n.t('no');
    $reverseSelector.find('.lh-select-value').text(reverseText);
    $reverseSelector.find('.lh-select-value').data('value', reverse);

    // Update active state in reverse dropdown
    $reverseSelector.find('.lh-select-op li').removeClass('selected-option');
    $reverseSelector.find(`.lh-select-op li[data-value="${reverse}"]`).addClass('selected-option');

    // Update active state in dropdown
    $('.subscription-format-selector .lh-select-op li').removeClass('selected-option');
    $(`.subscription-format-selector .lh-select-op li[data-value="${format}"]`).addClass('selected-option');

    updateContentDisplay(config.content || '', format);
    updateLastUpdatedTime();
  }

  function updateContentDisplay(content, format) {
    updateRawContent(content);
    updateParsedData(format);
    updateTabVisibility(format);
    updateScriptPane(format);
    updateActiveTabContent();
  }

  function updateRawContent(content) {
    $('#subscription-raw-content').val(content);
    $('#subscription-raw-empty').toggle(!(content && content.trim()));
  }

  function updateParsedData(format) {
    if (!subscriptionConfig || !subscriptionConfig.lists[format]) return;

    const config = subscriptionConfig.lists[format];
    const parsed = {
      decoded: config.decoded_content || '',
      include_rules: config.include_rules || '',
      bypass_rules: config.bypass_rules || ''
    };

    $('#subscription-decoded-content').val(parsed.decoded);
    $('#subscription-include-content').val(parsed.include_rules);
    $('#subscription-bypass-content').val(parsed.bypass_rules);

    const includeLines = parsed.include_rules ? countNonEmptyLines(parsed.include_rules) : 0;
    const bypassLines = parsed.bypass_rules ? countNonEmptyLines(parsed.bypass_rules) : 0;

    config.decoded_content = parsed.decoded;
    config.include_rules = parsed.include_rules;
    config.bypass_rules = parsed.bypass_rules;
    config.include_lines = includeLines;
    config.bypass_lines = bypassLines;
  }

  function countNonEmptyLines(text) {
    return text.split(/\r\n|\r|\n/).filter(line => line.trim()).length;
  }

  function updateTabVisibility(format) {
    const hasContent = subscriptionConfig?.lists[format]?.content?.trim();
    const hasDecoded = subscriptionConfig?.lists[format]?.decoded_content;

    $('.subscription-tab[data-tab="process-rule"]').toggle(format === 'pac');
    $('.subscription-tab[data-tab="decoded"]').toggle(!!hasDecoded && hasDecoded !== subscriptionConfig?.lists[format]?.content);
    $('.subscription-tab[data-tab="include"]').toggle(!!hasContent);
    $('.subscription-tab[data-tab="bypass"]').toggle(!!hasContent);

    const activeTab = $('.subscription-tab.active').data('tab');
    const shouldSwitch = (
      (activeTab === 'decoded' && !hasDecoded) ||
      ((activeTab === 'include' || activeTab === 'bypass') && !hasContent)
    );
    if (shouldSwitch) {
      switchToTab('original');
    }
  }

  function updateScriptPane(format) {
    const $processRulePane = $('#tab-pane-process-rule');
    const $processRuleContent = $('#subscription-process-rule-content');
    const config = subscriptionConfig?.lists[format];

    if (format === 'pac') {
      if ($processRuleContent.val() === '') {
        $processRuleContent.val(config?.process_rule || getDefaultPacProcessRule());
      }
      if (config) {
        config.process_rule = $processRuleContent.val();
      }
    } else {
      $processRulePane.hide();
    }
  }

  function getDefaultPacProcessRule() {
    return JSON.stringify({
      bypass: { left: '],[[', right: ',[' },
      include: { left: '","', right: '"]]];' }
    }, null, 2);
  }

  function switchToTab(tabName) {
    const $tabs = $('.subscription-tab');
    const $panes = $('.subscription-tab-pane');

    $tabs.filter('.active').removeClass('active');
    $panes.filter('.active').removeClass('active').hide();

    const $targetTab = $(`.subscription-tab[data-tab="${tabName}"]`);
    const $targetPane = $(`#tab-pane-${tabName}`);

    if ($targetTab.length && $targetPane.length) {
      $targetTab.addClass('active');
      $targetPane.addClass('active').show();
    }

    updateActiveTabContent();
  }

  function updateActiveTabContent() {
    const activeTab = $('.subscription-tab.active').data('tab') || 'original';
    const $textarea = $(`#tab-pane-${activeTab} textarea`);
    updateContentStats($textarea.val() || '');
  }

  function updateProcessRuleEditable(activeTab) {
    const isProcessRuleTab = activeTab === 'process-rule';
    $('#subscription-process-rule-content').prop('readonly', !isProcessRuleTab);
    $('#subscription-raw-content, #subscription-decoded-content, #subscription-include-content, #subscription-bypass-content').prop('readonly', true);
  }

  function updateEmptyStateVisibility(activeTab) {
    if (activeTab === 'original') {
      const content = $('#subscription-raw-content').val();
      $('#subscription-raw-empty').toggle(!(content && content.trim()));
    } else {
      $('#subscription-raw-empty').hide();
    }
  }

  function updateContentStats(content) {
    const lines = content ? content.split(/\r\n|\r|\n/).length : 0;
    const size = new Blob([content]).size;
    $('#subscription-lines').text(lines);
    $('#subscription-size').text(formatBytes(size));
  }

  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function updateLastUpdatedTime() {
    if (!subscriptionConfig) return;
    const format = subscriptionConfig.current;
    const config = subscriptionConfig.lists[format];
    const lastFetchTime = config.last_fetch_time;

    if (lastFetchTime) {
      const date = new Date(lastFetchTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const timeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      $('#subscription-last-updated').text(timeStr);
    } else {
      $('#subscription-last-updated').text('-');
    }
  }

  function resetCurrentFormat() {
    if (!subscriptionConfig) return;
    const format = subscriptionConfig.current;
    const oldRefreshInterval = subscriptionConfig.lists[format].refresh_interval;
    const oldUrl = subscriptionConfig.lists[format].url;
    subscriptionConfig.lists[format] = {
      url: '',
      content: '',
      decoded_content: '',
      include_rules: '',
      bypass_rules: '',
      include_lines: 0,
      bypass_lines: 0,
      refresh_interval: 0,
      reverse: false,
      last_fetch_time: null
    };
    updateModalUI();

    if (currentProxyIndex >= 0 && (oldRefreshInterval > 0 || oldUrl)) {
      const proxyList = ProxyModule.getList();
      const proxy = proxyList?.[currentProxyIndex];
      if (proxy?.id) {
        disableBackgroundRefresh(proxy.id, format);
      }
    }
  }

  function updateSubscriptionParsedData(format, config) {
    if (!config || !config.content) {
      config.include_rules = '';
      config.bypass_rules = '';
      config.include_lines = 0;
      config.bypass_lines = 0;
      return;
    }

    const reverse = config.reverse || false;
    const processRule = format === 'pac' ? config.process_rule : undefined;
    const parsed = parseSubscriptionContent(config.content, format, reverse, processRule);

    config.decoded_content = parsed.decoded || '';
    config.include_rules = parsed.include_rules || '';
    config.bypass_rules = parsed.bypass_rules || '';
    config.include_lines = parsed.include_rules ? parsed.include_rules.split(/\r\n|\r|\n/).length : 0;
    config.bypass_lines = parsed.bypass_rules ? parsed.bypass_rules.split(/\r\n|\r|\n/).length : 0;
  }

  async function fetchSubscription() {
    if (!subscriptionConfig) return;
    const format = subscriptionConfig.current;
    const url = $('#subscription-url').val().trim();

    if (!url) {
      UtilsModule.showTip(I18n.t('subscription_empty_url'), true);
      return;
    }

    UtilsModule.showProcessingTip(I18n.t('processing'));

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let content = await response.text();

      // Normal validation
      if (!isFormatValid(content, format)) {
        throw new Error(I18n.t('alert_invalid_format') || 'Invalid format');
      }

      subscriptionConfig.lists[format].url = url;
      subscriptionConfig.lists[format].content = content;
      subscriptionConfig.lists[format].last_fetch_time = Date.now();

      updateSubscriptionParsedData(format, subscriptionConfig.lists[format]);

      updateContentDisplay(content, format);
      updateLastUpdatedTime();

      UtilsModule.showTip(I18n.t('subscription_fetch_success'), false);

    } catch (error) {
      console.info(error);
      UtilsModule.showTip(I18n.t('subscription_fetch_failed') + ': ' + error.message, true);
    }
  }

  function saveSubscriptionConfig() {
    if (!subscriptionConfig) return;

    const format = subscriptionConfig.current;
    subscriptionConfig.lists[format].url = $('#subscription-url').val().trim();
    if (format === 'pac') {
      const processRule = $('#subscription-process-rule-content').val();
      const validation = validatePacProcessRule(processRule);
      if (!validation.valid) {
        UtilsModule.showTip(I18n.t('subscription_save_failed') + ': ' + I18n.t(validation.error), true);
        return;
      }
      subscriptionConfig.lists[format].process_rule = processRule;
    }

    const currentInterval = subscriptionConfig.lists[format].refresh_interval || 0;
    if (currentInterval < 0 || currentInterval > 10080) {
      UtilsModule.showTip(I18n.t('subscription_invalid_interval'), true);
      return;
    }

    const proxyList = ProxyModule.getList();
    if (currentProxyIndex >= 0 && proxyList && proxyList[currentProxyIndex]) {
      const proxy = proxyList[currentProxyIndex];
      const oldUrl = proxy.subscription?.lists?.[format]?.url || '';

      proxy.subscription = {
        enabled: subscriptionConfig.enabled !== false,
        current: subscriptionConfig.current,
        lists: {}
      };

      Object.keys(subscriptionConfig.lists).forEach(key => {
        const item = subscriptionConfig.lists[key];
        const includeRulesStr = item.include_rules || '';
        const bypassRulesStr = item.bypass_rules || '';
        const saveItem = {
          url: item.url,
          content: item.content,
          decoded_content: item.decoded_content || '',
          include_rules: includeRulesStr,
          bypass_rules: bypassRulesStr,
          include_lines: includeRulesStr ? includeRulesStr.split(/\r\n|\r|\n/).filter(line => line.trim()).length : 0,
          bypass_lines: bypassRulesStr ? bypassRulesStr.split(/\r\n|\r|\n/).filter(line => line.trim()).length : 0,
          refresh_interval: item.refresh_interval,
          reverse: item.reverse,
          last_fetch_time: item.last_fetch_time
        };
        if (key === 'pac') {
          saveItem.process_rule = item.process_rule || '';
        }
        proxy.subscription.lists[key] = saveItem;
      });

      delete proxy.subscription_config;

      ProxyModule.saveData({
        successMsg: I18n.t('subscription_save_success'),
        callback: function (success) {
          if (success) {
            closeModal();
            if (currentProxyIndex >= 0) {
              const proxyList = ProxyModule.getList();
              const proxy = proxyList?.[currentProxyIndex];
              if (proxy?.id && proxy?.subscription) {
                const newUrl = proxy.subscription.lists?.[format]?.url || '';
                const newInterval = proxy.subscription.lists?.[format]?.refresh_interval || 0;

                if (newInterval <= 0 || !newUrl) {
                  disableBackgroundRefresh(proxy.id, format);
                } else {
                  scheduleBackgroundRefresh(proxy.id, proxy.subscription);
                }
              }
            }
          }
        }
      });
    }
  }

  function scheduleBackgroundRefresh(proxyId, subscription) {
    if (!subscription || subscription.enabled === false) return;

    const format = subscription.current;
    const config = subscription.lists?.[format];

    if (config?.refresh_interval > 0 && config?.url) {
      chrome.runtime.sendMessage({
        action: 'scheduleSubscriptionRefresh',
        proxyId: proxyId,
        format: format,
        refreshInterval: config.refresh_interval,
        url: config.url
      });
      console.log(`[Subscription] Schedule refresh requested: ${proxyId}, interval: ${config.refresh_interval}min`);
    }
  }

  function disableBackgroundRefresh(proxyId, format) {
    const alarmName = `subscription_${proxyId}_${format}`;
    chrome.alarms.clear(alarmName, () => {
      console.log(`[Subscription] Alarm cleared: ${alarmName}`);
    });
  }

  function scheduleAllBackgroundRefreshes(config) {
    if (!config?.scenarios?.lists) return;

    config.scenarios.lists.forEach(scenario => {
      if (scenario.proxies) {
        scenario.proxies.forEach(proxy => {
          if (proxy.id && proxy.subscription) {
            scheduleBackgroundRefresh(proxy.id, proxy.subscription);
          }
        });
      }
    });
  }

  async function fetchSubscriptionBackground(proxyId, format, url) {
    console.log(`[Subscription] Background fetch should be handled by worker: ${proxyId}`);
  }

  function resetPacScript() {
    if (!subscriptionConfig) return;
    const format = subscriptionConfig.current;
    if (format !== 'pac') return;

    const defaultProcessRule = JSON.stringify({
      bypass: {
        left: "],[[",
        right: "],["
      },
      include: {
        left: "\"],[\"",
        right: "]]];"
      }
    }, null, 2);

    subscriptionConfig.lists[format].process_rule = defaultProcessRule;
    $('#subscription-process-rule-content').val(defaultProcessRule);
    UtilsModule.showTip(I18n.t('subscription_reset_success'), false);
  }

  function runPacProcessRule() {
    if (!subscriptionConfig) return;
    const format = subscriptionConfig.current;
    if (format !== 'pac') return;

    const rule = $('#subscription-process-rule-content').val();
    const content = $('#subscription-raw-content').val();
    const reverse = subscriptionConfig.lists[format].reverse || false;

    const validation = validatePacProcessRule(rule);
    if (!validation.valid) {
      UtilsModule.showTip(I18n.t('subscription_process_rule_error') + ': ' + I18n.t(validation.error), true);
      return;
    }

    const result = executePacProcessRule(rule, content, reverse);

    subscriptionConfig.lists[format].include_rules = result.include.join('\n');
    subscriptionConfig.lists[format].bypass_rules = result.bypass.join('\n');
    subscriptionConfig.lists[format].include_lines = result.include.length;
    subscriptionConfig.lists[format].bypass_lines = result.bypass.length;
    subscriptionConfig.lists[format].process_rule = rule;

    $('#subscription-include-content').val(result.include.join('\n'));
    $('#subscription-bypass-content').val(result.bypass.join('\n'));

    const includeCount = result.include.length;
    const bypassCount = result.bypass.length;
    const successText = I18n.t('subscription_process_rule_success')
      .replace('{include_count}', includeCount)
      .replace('{bypass_count}', bypassCount);
    UtilsModule.showTip(successText, false);
  }

  // --- Helper Functions ---

  function isFormatValid(content, format) {
    if (!content) return false;
    const trimmed = content.trim();

    switch (format) {
      case 'autoproxy':
        return trimmed.startsWith('[AutoProxy') || trimmed.startsWith('W0F1dG9Qcm94');
      case 'switchy_legacy':
        return !trimmed.startsWith('[SwitchyOmega Conditions]') && trimmed.includes('#BEGIN') && trimmed.includes('#END');
      case 'switchy_omega':
        return trimmed.startsWith('[SwitchyOmega Conditions]');
      case 'pac':
        return true;
      default:
        return true;
    }
  }

  function validatePacProcessRule(rule) {
    if (!rule || !rule.trim()) {
      return { valid: false, error: 'process_rule_empty' };
    }

    try {
      const config = JSON.parse(rule);
      return { valid: true, config };
    } catch (error) {
      return { valid: false, error: 'process_rule_json_error' };
    }
  }

  function executePacProcessRule(rule, rawContent, reverse = false) {
    if (!rule || !rawContent) {
      return { include: [], bypass: [] };
    }

    let config;
    try {
      config = JSON.parse(rule);
    } catch (error) {
      console.info('Execute pac process rule failed:', error);
      return { include: [], bypass: [] };
    }

    const content = rawContent.replace(/\s+/g, '');

    const extractedInclude = [];
    const extractedBypass = [];

    const bypassConfig = config.bypass || {};
    const includeConfig = config.include || {};

    const bypassLeft = bypassConfig.left || '';
    const bypassRight = bypassConfig.right || '';
    const includeLeft = includeConfig.left || '';
    const includeRight = includeConfig.right || '';

    function extractByBounds(content, left, right) {
      if (!left || !right) return [];

      const results = [];
      let start = 0;
      while (true) {
        const leftIdx = content.indexOf(left, start);
        if (leftIdx === -1) break;
        const rightIdx = content.indexOf(right, leftIdx + left.length);
        if (rightIdx === -1) break;

        const extracted = content.substring(leftIdx + left.length, rightIdx);
        results.push(extracted);

        start = rightIdx + right.length;
      }
      return results;
    }

    function parseExtracted(items) {
      const parsed = [];
      for (const item of items) {
        const parts = item.replace(/["']/g, '').split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed) {
            parsed.push(trimmed);
          }
        }
      }
      return parsed;
    }

    if (bypassLeft && bypassRight) {
      const bypassItems = extractByBounds(content, bypassLeft, bypassRight);
      extractedBypass.push(...parseExtracted(bypassItems));
    }

    if (includeLeft && includeRight) {
      const includeItems = extractByBounds(content, includeLeft, includeRight);
      extractedInclude.push(...parseExtracted(includeItems));
    }

    const include = [...new Set(extractedInclude.filter(item => item && typeof item === 'string' && !item.includes('*')))];
    const bypass = [...new Set(extractedBypass.filter(item => item && typeof item === 'string' && !item.includes('*')))];

    if (reverse) {
      return {
        include: bypass,
        bypass: include
      };
    }

    return {
      include: include,
      bypass: bypass
    };
  }

  function decodeAutoProxyContent(content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('W0F1dG9Qcm94')) {
      try {
        return atob(trimmed);
      } catch (e) {
        console.info('Failed to decode Base64 AutoProxy content');
        return content;
      }
    }
    return content;
  }

  function extractDomainFromWildcard(pattern) {
    if (pattern.startsWith('*.')) {
      return pattern.substring(2);
    }
    if (pattern.startsWith('*')) {
      return pattern.substring(1);
    }
    return pattern;
  }

  function isValidManualBypassPattern(pattern) {
    if (!pattern || typeof pattern !== 'string') return false;

    const trimmed = pattern.trim();
    if (!trimmed) return false;

    if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
      return false;
    }

    if (trimmed.startsWith('|') && !trimmed.startsWith('||')) {
      return false;
    }

    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(trimmed)) {
      return true;
    }

    if (trimmed.includes('/')) {
      const ipv4CidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/(8|9|1\d|2\d|3[0-2])$/;
      if (ipv4CidrPattern.test(trimmed)) {
        return true;
      }
      return false;
    }

    const portPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?:[1-9]\d{0,4}$/;
    if (portPattern.test(trimmed)) {
      return true;
    }

    const ipPortPattern = /^(\d{1,3}\.){3}\d{1,3}:[1-9]\d{0,4}$/;
    if (ipPortPattern.test(trimmed)) {
      return true;
    }

    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (domainPattern.test(trimmed)) {
      return true;
    }

    return false;
  }

  function parseRuleLine(line, format, defaultType, defaultAddress, reverse) {
    let isException = false;
    let actionType = defaultType;
    let isDirect = false;

    if (format === 'autoproxy') {
      if (line.startsWith('[') && line.endsWith(']')) return null;
      if (line.startsWith('!')) return null;
      if (line.startsWith('@@')) {
        isException = true;
        line = line.substring(2);
      }
      const finalActionIsDirect = reverse ? !isException : isException;
      isDirect = finalActionIsDirect;
    } else if (format === 'switchy_omega') {
      if (line.startsWith('[SwitchyOmega Conditions]')) return null;
      if (line.startsWith(';')) return null;
      if (line.startsWith('@')) return null;
      if (line.includes(' +')) {
        const parts = line.split(' +');
        line = parts[0].trim();
        const res = parts[1].trim().toLowerCase();
        if (res === 'direct') isDirect = true;
      }
      if (line.startsWith('!')) {
        isException = true;
        line = line.substring(1).trim();
      }
      if (isException) isDirect = true;
      if (reverse) isDirect = !isDirect;
    } else if (format === 'switchy_legacy') {
      if (line.startsWith(';')) return null;
      if (line === '#BEGIN' || line === '#END') return null;
      if (line.startsWith('[') && line.endsWith(']')) return null;
      if (line.startsWith('!')) {
        isException = true;
        line = line.substring(1);
      }
      const finalActionIsDirect = reverse ? !isException : isException;
      isDirect = finalActionIsDirect;
    }

    const result = isDirect ? 'DIRECT' : defaultType;
    const addressPart = defaultAddress ? ` ${defaultAddress}` : '';
    const returnVal = isDirect ? '"DIRECT"' : `"${defaultType}${addressPart}"`;

    if (format === 'switchy_omega' && line === '*') {
      return { type: 'all', pattern: '*', action: result, js: `return ${returnVal};` };
    }

    let js = '';
    let pattern = line;
    let ruleType = 'keyword';

    if (line.startsWith('||')) {
      pattern = line.substring(2);
      js = `if (host.endsWith('.${pattern}') || host === '${pattern}') return ${returnVal};`;
      ruleType = 'domain';
    } else if (line.startsWith('|')) {
      pattern = line.substring(1);
      js = `if (url.startsWith('${pattern}')) return ${returnVal};`;
      ruleType = 'start';
    } else if (line.startsWith('/') && line.endsWith('/')) {
      pattern = line.substring(1, line.length - 1);
      js = `if (/${pattern}/.test(url)) return ${returnVal};`;
      ruleType = 'regex';
    } else if (isIpPattern(line)) {
      if (line.includes('/')) {
        js = `if (isInCidrRange(host, "${line}")) return ${returnVal};`;
        ruleType = 'cidr';
      } else {
        js = `if (host === "${line}") return ${returnVal};`;
        ruleType = 'ip';
      }
    } else if (format === 'switchy_omega' && line.startsWith(':')) {
      pattern = line.substring(1).trim();
      js = `if (host.endsWith('.${pattern}') || host === '${pattern}') return ${returnVal};`;
      ruleType = 'domain';
    } else if (format === 'switchy_omega') {
      js = `if (host.endsWith('.${line}') || host === '${line}') return ${returnVal};`;
      ruleType = 'domain';
    } else {
      js = `if (url.indexOf('${line}') >= 0) return ${returnVal};`;
    }

    return { type: ruleType, pattern, action: result, js };
  }

  function parseRules(content, format, proxyType, proxyAddress, reverse = false) {
    if (!content) return [];

    let decoded = content;
    let actualFormat = format;

    if (format === 'autoproxy' && (content.startsWith('W0F1dG9Qcm94') || content.trim().startsWith('[AutoProxy'))) {
      if (content.startsWith('W0F1dG9Qcm94')) {
        try {
          decoded = atob(content);
        } catch (e) {
          console.info("Base64 decode failed", e);
        }
      }
    }

    const lines = decoded.split(/[\r\n]+/);
    const rules = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      const rule = parseRuleLine(line, actualFormat, proxyType, proxyAddress, reverse);
      if (rule) {
        rules.push(rule);
      }
    }

    return rules;
  }

  function extractDomainFromWildcard(pattern) {
    const parts = pattern.split('.');
    if (parts.length < 2) return null;

    let wildcardIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes('*')) {
        wildcardIndex = i;
        break;
      }
    }

    if (wildcardIndex === -1) return pattern;

    const wildcardFromRight = parts.length - 1 - wildcardIndex;

    if (wildcardFromRight === 0 || wildcardFromRight === 1) {
      return null;
    }

    const lastDotIndex = pattern.lastIndexOf('.');
    return pattern.substring(pattern.lastIndexOf('.', lastDotIndex - 1) + 1);
  }

  function extractIPFromURL(url) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}/;
    const match = url.match(ipv4Pattern);
    if (match) {
      return match[0];
    }
    return null;
  }

  function extractHostname(url) {
    url = url.replace(/^[^:]+:\/\//, '').replace(/\/.*$/, '').replace(/\?.*$/, '').replace(/#.*$/, '');
    const atIndex = url.indexOf('@');
    if (atIndex !== -1) {
      url = url.substring(atIndex + 1);
    }
    url = url.replace(/:\d+$/, '');
    return url;
  }

  function normalizeAutoproxyPattern(pattern) {
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      return pattern;
    }

    if (pattern.startsWith('|') && (pattern.includes('://') || pattern.endsWith('|'))) {
      let url = pattern.replace(/^\|+|\|+$/g, '');
      const hostname = extractHostname(url);
      const extractedIP = extractIPFromURL(hostname);
      if (extractedIP) {
        return extractedIP;
      }
      const extracted = extractDomainFromWildcard(hostname);
      return extracted || null;
    }

    if (pattern.startsWith('||')) {
      const domainPart = pattern.substring(2);
      const hostname = extractHostname(domainPart);
      if (hostname.includes('*')) {
        const extracted = extractDomainFromWildcard(hostname);
        return extracted || null;
      }
      return hostname;
    }

    if (pattern.startsWith('.')) {
      return pattern.includes('*') ? null : pattern.substring(1);
    }

    if (pattern.includes('/')) {
      const hostname = extractHostname(pattern);
      if (hostname.includes('*')) {
        const extracted = extractDomainFromWildcard(hostname);
        return extracted || null;
      }
      return hostname;
    }

    if (pattern.includes('*')) {
      const extracted = extractDomainFromWildcard(pattern);
      return extracted || null;
    }

    return pattern;
  }

  function isIpPattern(pattern) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/([0-9]|[12][0-9]|3[0-2]))?$/;
    return ipv4Pattern.test(pattern);
  }

  function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  function isInCidrRange(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

  function normalizeAutoproxyLine(line, reverse) {
    if (line.startsWith('[') && line.endsWith(']')) return null;
    if (line.startsWith('!')) return null;

    let isException = false;
    let normalizedLine = line;
    if (line.startsWith('@@')) {
      isException = true;
      normalizedLine = line.substring(2);
    }

    const finalActionIsDirect = isException ? !reverse : reverse;
    const normalizedPattern = normalizeAutoproxyPattern(normalizedLine);

    if (!normalizedPattern) return null;
    if (!isValidManualBypassPattern(normalizedPattern) && finalActionIsDirect) return null;

    return {
      pattern: normalizedPattern,
      isDirect: finalActionIsDirect
    };
  }

  function classifyOmegaPattern(pattern) {
    const ipPattern = /^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/;
    if (ipPattern.test(pattern)) {
      return 'ip_range';
    }

    const segments = pattern.split('.');
    const hasWildcard = pattern.includes('*');

    if (!hasWildcard) {
      return segments.length >= 2 ? 'domain' : 'single_segment';
    }

    if (segments.length === 2 && segments[0] === '*') {
      return 'single_wildcard';
    }

    if (segments[0] === '*' && segments[segments.length - 1] === '*') {
      return 'complex_wildcard';
    }

    if (segments[0] === '*' && segments.length >= 3) {
      return 'wildcard_domain';
    }

    return 'unknown';
  }

  function convertOmegaToProxyRule(pattern, type) {
    switch (type) {
      case 'ip_range':
        return convertIPRangeToCIDR(pattern);

      case 'single_wildcard': {
        const domain = pattern.replace(/^\*\./, '');
        return `/^[a-z0-9-]+\.${escapeRegExp(domain)}$/`;
      }

      case 'complex_wildcard': {
        const domainPart = pattern.substring(2, pattern.length - 1);
        return `/.*\\.${escapeRegExp(domainPart)}\\..*/`;
      }

      case 'wildcard_domain': {
        const domain = pattern.replace(/^\*\./, '');
        return domain;
      }

      case 'domain':
        return pattern;

      case 'single_segment':
        return null;

      default:
        return pattern;
    }
  }

  function convertOmegaToBypassRule(pattern, type) {
    switch (type) {
      case 'ip_range':
        return convertIPRangeToCIDR(pattern);

      case 'wildcard_domain': {
        const domain = pattern.replace(/^\*\./, '');
        return domain;
      }

      case 'domain':
        return pattern;

      case 'single_wildcard':
      case 'complex_wildcard':
      case 'single_segment':
        return null;

      default:
        return pattern;
    }
  }

  function convertIPRangeToCIDR(pattern) {
    const parts = pattern.split('.');
    const result = [];

    function parseSegment(seg, base, bits) {
      if (seg === '*') {
        return { start: 0, end: 255 };
      }
      const val = parseInt(seg, 10);
      return { start: val, end: val };
    }

    const s0 = parseSegment(parts[0], 0, 8);
    const s1 = parseSegment(parts[1], 0, 8);
    const s2 = parseSegment(parts[2], 0, 8);
    const s3 = parseSegment(parts[3], 0, 8);

    if (s0.start === s0.end && s1.start === 0 && s2.start === 0 && s3.start === 0) {
      return '10.0.0.0/8';
    }
    if (s0.start === s0.end && s1.start === 16 && s2.start === 0 && s3.start === 0) {
      return '172.16.0.0/12';
    }
    if (s0.start === s0.end && s1.start === 168 && s2.start === 0 && s3.start === 0) {
      return '192.168.0.0/16';
    }
    if (s0.start === s0.end && s1.start === s1.end && s2.start === 0 && s3.start === 0) {
      return `${parts[0]}.${parts[1]}.0.0/16`;
    }
    if (s0.start === s0.end && s1.start === s1.end && s2.start === s2.end && s3.start === 0) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    if (s0.start === s0.end && s1.start === s1.end && s2.start === s2.end && s3.start === s3.end) {
      return pattern;
    }

    return null;
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalizeSwitchyOmegaLine(line, reverse) {
    if (line.startsWith('[SwitchyOmega Conditions]')) return null;
    if (line.startsWith(';')) return null;
    if (line.startsWith('@')) return null;

    let pattern = line;
    let isDirectRule = false;

    if (line.includes(' +')) {
      const parts = line.split(' +');
      pattern = parts[0].trim();
      const res = parts[1] ? parts[1].trim().toLowerCase() : '';
      if (res === 'direct') isDirectRule = true;
    } else if (line.includes('\t+')) {
      const parts = line.split('\t+');
      pattern = parts[0].trim();
      const res = parts[1] ? parts[1].trim().toLowerCase() : '';
      if (res === 'direct') isDirectRule = true;
    }

    if (pattern.startsWith('!')) {
      pattern = pattern.substring(1).trim();
      isDirectRule = true;
    }

    if (pattern.includes(': ')) {
      const parts = pattern.split(': ');
      const type = parts[0].toLowerCase();
      if (['host', 'wildcard', 'hostwildcard', 'url', 'urlwildcard'].some(t => type.includes(t))) {
        const domainInfo = extractDomainInfo(parts[1].trim());
        pattern = domainInfo ? domainInfo.domain : null;
      } else {
        return null;
      }
    }

    if (pattern.startsWith(': ')) {
      pattern = pattern.substring(2).trim();
    }

    if (!pattern) return null;

    const shouldBeDirect = isDirectRule ? !reverse : reverse;
    const type = classifyOmegaPattern(pattern);

    let finalPattern;
    if (shouldBeDirect) {
      finalPattern = convertOmegaToBypassRule(pattern, type);
    } else {
      finalPattern = convertOmegaToProxyRule(pattern, type);
    }

    if (finalPattern === null) return null;
    if (shouldBeDirect && !isValidManualBypassPattern(finalPattern)) return null;

    return {
      pattern: finalPattern,
      isDirect: shouldBeDirect
    };
  }

  function normalizeSwitchyLegacyLine(line, reverse, section) {
    if (line.startsWith(';') || line.startsWith('#') || line.startsWith('@')) return null;

    let pattern = line;
    let isDirectRule = false;

    const plusMatch = line.match(/^(.+?)[\t ]\+(.+)$/);
    if (plusMatch) {
      pattern = plusMatch[1].trim();
      if (plusMatch[2].trim().toLowerCase() === 'direct') {
        isDirectRule = true;
      }
    } else if (line.startsWith('!')) {
      isDirectRule = true;
      pattern = line.substring(1);
    }

    if (pattern.includes(': ')) {
      const parts = pattern.split(': ');
      const type = parts[0].toLowerCase();
      const validTypes = ['host', 'wildcard', 'hostwildcard', 'url', 'urlwildcard'];
      if (validTypes.some(t => type.includes(t))) {
        pattern = parts[1].trim();
      } else {
        return null;
      }
    }

    if (pattern.startsWith(': ')) {
      pattern = pattern.substring(2).trim();
    }

    if (!pattern) return null;

    const shouldBeDirect = isDirectRule ? !reverse : reverse;

    if (section === 'regexp' && reverse) {
      return null;
    }

    let finalPattern = pattern;

    const wildcardSections = ['wildcard', 'host_wildcard', 'url_wildcard'];
    if (wildcardSections.includes(section)) {
      const extracted = extractDomainInfo(pattern);
      if (!extracted) return null;

      if (extracted.segmentCount === 1 && !(shouldBeDirect && reverse)) {
        finalPattern = '/.*' + extracted.domain + '.*/';
      } else {
        finalPattern = extracted.domain;
      }
    } else if (section === 'regexp') {
      finalPattern = shouldBeDirect ? pattern : '/.*' + pattern + '.*/';
    }

    return {
      pattern: finalPattern,
      isDirect: shouldBeDirect
    };
  }

  function extractDomainInfo(pattern) {
    if (!pattern) return null;

    let domain = pattern
      .replace(/^\*\:?\/?\/?(\*\.)?/, '')
      .replace(/\/\*.*$/, '')
      .trim();

    if (!domain) return null;

    const domainParts = domain.split('.');
    const segmentCount = domainParts.filter(Boolean).length;

    const secondLastPart = domainParts[domainParts.length - 2];
    return {
      domain: domainParts.length >= 2 && secondLastPart
        ? domainParts.slice(-2).join('.')
        : domain,
      segmentCount: segmentCount
    };
  }

  function parseSubscriptionContent(content, format, reverse, processRule) {
    if (!content) {
      return {
        include_rules: '',
        bypass_rules: '',
        decoded: null
      };
    }

    const result = {
      include_rules: [],
      bypass_rules: [],
      decoded: null
    };

    try {
      let contentToParse = content;
      const sectionRegex = /^\[(Wildcard|Host Wildcard|URL Wildcard|RegExp)\]$/i;

      if (format === 'pac') {
        const pacResult = parsePacContent(contentToParse, processRule, reverse);
        result.include_rules = pacResult.include;
        result.bypass_rules = pacResult.bypass;
      } else {
        if (format === 'autoproxy') {
          const trimmed = content.trim();
          if (trimmed.startsWith('W0F1dG9Qcm94')) {
            try {
              result.decoded = atob(trimmed);
              contentToParse = result.decoded;
            } catch (e) {
              console.info('Failed to decode Base64 AutoProxy content');
              result.decoded = content;
            }
          }
        }

        const lines = contentToParse.split('\n');
        let currentSection = 'wildcard';

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          const sectionMatch = line.match(sectionRegex);
          if (sectionMatch) {
            currentSection = sectionMatch[1].toLowerCase().replace(/\s+/g, '_');
            continue;
          }

          let normalized = null;
          if (format === 'autoproxy') {
            normalized = normalizeAutoproxyLine(line, reverse);
          } else if (format === 'switchy_omega') {
            normalized = normalizeSwitchyOmegaLine(line, reverse);
          } else if (format === 'switchy_legacy') {
            normalized = normalizeSwitchyLegacyLine(line, reverse, currentSection);
          }

          if (normalized) {
            if (normalized.isDirect) {
              result.bypass_rules.push(normalized.pattern);
            } else {
              result.include_rules.push(normalized.pattern);
            }
          }
        }
      }
    } catch (e) {
      console.info('Parse error', e);
    }

    const uniqueInclude = [...new Set(result.include_rules)];
    const uniqueBypass = [...new Set(result.bypass_rules)];

    return {
      include_rules: uniqueInclude.join('\n'),
      bypass_rules: uniqueBypass.join('\n'),
      decoded: result.decoded
    };
  }

  function parsePacContent(rawContent, processRule, reverse = false) {
    if (!rawContent || !processRule) {
      return { include: [], bypass: [] };
    }

    let config;
    try {
      config = JSON.parse(processRule);
    } catch (error) {
      console.info('PAC content parse failed:', error);
      return { include: [], bypass: [] };
    }

    const content = rawContent.replace(/\s+/g, '');

    const extractedInclude = [];
    const extractedBypass = [];

    const bypassConfig = config.bypass || {};
    const includeConfig = config.include || {};

    const bypassLeft = bypassConfig.left || '';
    const bypassRight = bypassConfig.right || '';
    const includeLeft = includeConfig.left || '';
    const includeRight = includeConfig.right || '';

    function extractByBounds(content, left, right) {
      if (!left || !right) return [];

      const results = [];
      let start = 0;
      while (true) {
        const leftIdx = content.indexOf(left, start);
        if (leftIdx === -1) break;
        const rightIdx = content.indexOf(right, leftIdx + left.length);
        if (rightIdx === -1) break;

        const extracted = content.substring(leftIdx + left.length, rightIdx);
        results.push(extracted);

        start = rightIdx + right.length;
      }
      return results;
    }

    function parseExtracted(items) {
      const parsed = [];
      for (const item of items) {
        const parts = item.replace(/["']/g, '').split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed) {
            parsed.push(trimmed);
          }
        }
      }
      return parsed;
    }

    if (bypassLeft && bypassRight) {
      const bypassItems = extractByBounds(content, bypassLeft, bypassRight);
      extractedBypass.push(...parseExtracted(bypassItems));
    }

    if (includeLeft && includeRight) {
      const includeItems = extractByBounds(content, includeLeft, includeRight);
      extractedInclude.push(...parseExtracted(includeItems));
    }

    const include = [...new Set(extractedInclude.filter(item => item && typeof item === 'string' && !item.includes('*')))];
    const bypass = [...new Set(extractedBypass.filter(item => item && typeof item === 'string' && !item.includes('*')))];

    if (reverse) {
      return { include: bypass, bypass: include };
    }

    return { include, bypass };
  }

  function convertContent(content, format) {
    const parsed = parseSubscriptionContent(content, format, false);
    return parsed.include_rules;
  }

  function getSubscriptionLineCounts(subscription) {
    if (!subscription || !subscription.current || !subscription.lists || !subscription.lists[subscription.current]) {
      return { include_lines: 0, bypass_lines: 0 };
    }
    const currentFormat = subscription.current;
    const config = subscription.lists[currentFormat];
    if (!config) return { include_lines: 0, bypass_lines: 0 };

    return {
      include_lines: config.include_lines || 0,
      bypass_lines: config.bypass_lines || 0
    };
  }

  function generateSubscriptionStats(content, format, reverse, processRule) {
    if (!content) {
      return {
        decoded_content: '',
        include_rules: '',
        bypass_rules: '',
        include_lines: 0,
        bypass_lines: 0
      };
    }

    const parsed = parseSubscriptionContent(content, format, reverse || false, processRule);

    return {
      decoded_content: parsed.decoded || '',
      include_rules: parsed.include_rules || '',
      bypass_rules: parsed.bypass_rules || '',
      include_lines: parsed.include_rules ? parsed.include_rules.split(/\r\n|\r|\n/).length : 0,
      bypass_lines: parsed.bypass_rules ? parsed.bypass_rules.split(/\r\n|\r|\n/).length : 0
    };
  }

  function parseProxyListSubscriptions(proxyList) {
    if (!proxyList || !Array.isArray(proxyList)) {
      return;
    }

    proxyList.forEach((proxy) => {
      if (!proxy.subscription || !proxy.subscription.lists) return;

      Object.keys(proxy.subscription.lists).forEach((format) => {
        const listConfig = proxy.subscription.lists[format];
        if (listConfig.content) {
          const stats = generateSubscriptionStats(
            listConfig.content,
            format,
            listConfig.reverse || false,
            format === 'pac' ? listConfig.process_rule : undefined
          );
          listConfig.decoded_content = stats.decoded_content;
          listConfig.include_rules = stats.include_rules;
          listConfig.bypass_rules = stats.bypass_rules;
          listConfig.include_lines = stats.include_lines;
          listConfig.bypass_lines = stats.bypass_lines;
        }
      });
    });
  }

  return {
    init: init,
    openModal: openModal,
    closeModal: closeModal,
    fetchSubscription: fetchSubscription,
    convertContent: convertContent,
    getSubscriptionLineCounts: getSubscriptionLineCounts,
    generateSubscriptionStats: generateSubscriptionStats,
    parseRules: parseRules,
    parseProxyListSubscriptions: parseProxyListSubscriptions,
    scheduleBackgroundRefresh: scheduleBackgroundRefresh,
    scheduleAllBackgroundRefreshes: scheduleAllBackgroundRefreshes,
    fetchSubscriptionBackground: fetchSubscriptionBackground,
    disableBackgroundRefresh: disableBackgroundRefresh
  };
})();
