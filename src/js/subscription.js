// Subscription Module
// Subscription configuration, fetching, and conversion

const SubscriptionModule = (function () {
  const SUBSCRIPTION_FETCH_TIMEOUT_MS = 30000;
  const MAX_SUBSCRIPTION_RESPONSE_BYTES = 4 * 1024 * 1024;
  const MAX_SUBSCRIPTION_PARSED_RULES = 20000;
  let currentSubscriptionId = null;
  // Holds the state for the currently open modal
  // Structure: { current: '...', lists: { ... } }
  let subscriptionConfig = null;
  let managementExpansionMode = 'auto';

  const FORMATS = ['autoproxy', 'switchy_legacy', 'switchy_omega', 'pac'];
  const FORMAT_NAMES = {
    'autoproxy': 'AutoProxy',
    'switchy_legacy': 'Switchy Legacy',
    'switchy_omega': 'Switchy Omega',
    'pac': 'PAC'
  };
  let lastFallbackSubscriptionIdTime = 0;

  function createSubscriptionFetchError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function getUtf8ByteLength(value) {
    let byteLength = 0;
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      if (code <= 0x7f) byteLength += 1;
      else if (code <= 0x7ff) byteLength += 2;
      else if (code >= 0xd800 && code <= 0xdbff
        && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) {
        byteLength += 4;
        index += 1;
      } else byteLength += 3;
    }
    return byteLength;
  }

  async function readResponseTextWithLimit(response, maxBytes = MAX_SUBSCRIPTION_RESPONSE_BYTES) {
    const contentLength = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw createSubscriptionFetchError('response_too_large', 'Subscription response is too large');
    }

    if (!response.body?.getReader || typeof TextDecoder === 'undefined') {
      const content = await response.text();
      if (getUtf8ByteLength(content) > maxBytes) {
        throw createSubscriptionFetchError('response_too_large', 'Subscription response is too large');
      }
      return content;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const chunks = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          throw createSubscriptionFetchError('response_too_large', 'Subscription response is too large');
        }
        chunks.push(decoder.decode(value, { stream: true }));
      }
      chunks.push(decoder.decode());
      return chunks.join('');
    } finally {
      reader.releaseLock?.();
    }
  }

  async function fetchSubscriptionText(url, timeoutMs = SUBSCRIPTION_FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await readResponseTextWithLimit(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw createSubscriptionFetchError('request_timeout', 'Subscription request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function getSubscriptionFetchErrorMessage(error) {
    if (error?.code === 'response_too_large') return I18n.t('subscription_response_too_large');
    if (error?.code === 'request_timeout') return I18n.t('subscription_request_timeout');
    return error?.message || I18n.t('subscription_fetch_failed');
  }

  function generateSubscriptionId() {
    if (window.ConfigModule && typeof window.ConfigModule.generateSubscriptionId === 'function') {
      return window.ConfigModule.generateSubscriptionId();
    }

    const currentSecond = Math.floor(Date.now() / 1000) * 1000;
    const timestamp = Math.max(currentSecond, lastFallbackSubscriptionIdTime + 1000);
    const date = new Date(timestamp);
    const pad = value => String(value).padStart(2, '0');
    lastFallbackSubscriptionIdTime = timestamp;
    return 'subscription_'
      + date.getFullYear()
      + pad(date.getMonth() + 1)
      + pad(date.getDate())
      + pad(date.getHours())
      + pad(date.getMinutes())
      + pad(date.getSeconds());
  }

  function init() {
    bindEvents();
    initManagementSortable();
    renderManagementList();
  }

  function getEmptyConfig() {
    const config = {
      enabled: true,
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
    $('#subscription-expand-collapse-btn').on('click', function () {
      const shouldCollapse = managementExpansionMode === 'expanded';
      managementExpansionMode = shouldCollapse ? 'collapsed' : 'expanded';
      $('#subscription-manage-list .subscription-card').toggleClass('collapsed', shouldCollapse);
      updateManagementCardToggleState();
      syncManagementExpandCollapseButton();
    });

    $('#add-subscription-btn').on('click', function () {
      const subscription = {
        ...getEmptyConfig(),
        id: generateSubscriptionId(),
        name: '',
        order: StorageModule.getSubscriptions().length,
        is_new: true
      };
      StorageModule.addSubscription(subscription);
      managementExpansionMode = 'auto';
      renderManagementList();

      const $card = $(`.subscription-card[data-id="${subscription.id}"]`);
      if ($card.length) {
        $('html, body').animate({ scrollTop: $card.offset().top - 100 }, 300);
        $card.find('.subscription-name-input').trigger('focus');
      }
    });

    $(document).off('click.subscriptionCard', '.subscription-card-header')
      .on('click.subscriptionCard', '.subscription-card-header', function (event) {
        if ($(event.target).closest('button, input, label, select, .drag-handle').length) return;
        toggleManagementCard($(this).closest('.subscription-card'));
      });

    $(document).off('change.subscriptionCard', '.subscription-card-enabled')
      .on('change.subscriptionCard', '.subscription-card-enabled', function () {
        const subscription = getCardSubscription($(this).closest('.subscription-card'));
        if (!subscription) return;
        subscription.enabled = $(this).prop('checked');
        $(this).closest('.subscription-card').toggleClass('disabled', !subscription.enabled)
          .find('.subscription-status-text')
          .text(subscription.enabled ? I18n.t('status_enabled') : I18n.t('status_disabled'));
      });

    $(document).off('change.subscriptionCard', '.subscription-card-format')
      .on('change.subscriptionCard', '.subscription-card-format', function () {
        const $card = $(this).closest('.subscription-card');
        const subscription = getCardSubscription($card);
        if (!subscription) return;
        collectCardData($card, subscription);
        subscription.current = $(this).val();
        renderManagementList();
      });

    $(document).off('click.subscriptionCard', '.subscription-card-tab')
      .on('click.subscriptionCard', '.subscription-card-tab', function () {
        const $card = $(this).closest('.subscription-card');
        const tab = $(this).data('tab');
        $card.find('.subscription-card-tab').removeClass('active');
        $(this).addClass('active');
        $card.find('.subscription-card-pane').removeClass('active');
        $card.find(`.subscription-card-pane[data-pane="${tab}"]`).addClass('active');
      });

    $(document).off('click.subscriptionCard', '.subscription-card-fetch')
      .on('click.subscriptionCard', '.subscription-card-fetch', function () {
        fetchCardSubscription($(this).closest('.subscription-card'), $(this));
      });

    $(document).off('click.subscriptionCard', '.subscription-card-save')
      .on('click.subscriptionCard', '.subscription-card-save', function () {
        saveCardSubscription($(this).closest('.subscription-card'));
      });

    $(document).off('click.subscriptionCard', '.subscription-card-delete')
      .on('click.subscriptionCard', '.subscription-card-delete', function () {
        deleteCardSubscription($(this).closest('.subscription-card'));
      });

    $(document).off('input.subscriptionCard', '.subscription-name-input')
      .on('input.subscriptionCard', '.subscription-name-input', function () {
        const $card = $(this).closest('.subscription-card');
        const name = $card.find('.subscription-name-input').val().trim() || I18n.t('subscription_unnamed');
        $card.find('.subscription-title-preview').text(name).attr('title', name);
      });

    $(document).off('click.subscriptionCard', '.subscription-card-collapse')
      .on('click.subscriptionCard', '.subscription-card-collapse', function () {
        toggleManagementCard($(this).closest('.subscription-card'));
      });

    $(document).off('click.subscriptionCard', '.subscription-manage-delete').on('click.subscriptionCard', '.subscription-manage-delete', function () {
      deleteCardSubscription($(this).closest('.subscription-card'));
    });
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

  function openModal(subscriptionId) {
    currentSubscriptionId = subscriptionId || null;
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
    currentSubscriptionId = null;
    subscriptionConfig = null;
  }

  function loadModalData() {
    subscriptionConfig = getEmptyConfig();

    const savedSubscription = currentSubscriptionId ? StorageModule.getSubscription(currentSubscriptionId) : null;
    $('#subscription-name').val(savedSubscription?.name || '');

    if (savedSubscription) {
      subscriptionConfig.enabled = savedSubscription.enabled !== false;
      const savedCurrent = savedSubscription.current || savedSubscription.activeFormat || 'autoproxy';
      subscriptionConfig.current = FORMATS.includes(savedCurrent) ? savedCurrent : FORMATS[0];

      const savedLists = savedSubscription.lists || savedSubscription.formats || {};

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

    if (currentSubscriptionId && (oldRefreshInterval > 0 || oldUrl)) {
      disableBackgroundRefresh(currentSubscriptionId, format);
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
      const content = await fetchSubscriptionText(url);

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
      UtilsModule.showTip(I18n.t('subscription_fetch_failed') + ': ' + getSubscriptionFetchErrorMessage(error), true);
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

    const name = $('#subscription-name').val().trim();
    if (!name) {
      UtilsModule.showTip(I18n.t('subscription_name_required'), true);
      return;
    }

    const oldSubscription = currentSubscriptionId ? StorageModule.getSubscription(currentSubscriptionId) : null;
    const oldUrl = oldSubscription?.lists?.[format]?.url || '';
    const savedSubscription = {
        id: currentSubscriptionId || generateSubscriptionId(),
        name: name,
        order: Number.isInteger(oldSubscription?.order)
          ? oldSubscription.order
          : StorageModule.getSubscriptions().length,
        enabled: subscriptionConfig.enabled !== false,
        current: subscriptionConfig.current,
        lists: {}
    };

      const item = subscriptionConfig.lists[format];
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
      if (format === 'pac') {
        saveItem.process_rule = item.process_rule || '';
      }
      savedSubscription.lists[format] = saveItem;

      if (oldSubscription) {
        StorageModule.updateSubscription(currentSubscriptionId, savedSubscription);
      } else {
        StorageModule.addSubscription(savedSubscription);
        currentSubscriptionId = savedSubscription.id;
      }

      const savedId = savedSubscription.id;
      ProxyModule.saveData({
        successMsg: I18n.t('subscription_save_success'),
        callback: function (success) {
          if (success) {
            renderManagementList();
            ProxyModule.renderList();
            closeModal();
            const newUrl = savedSubscription.lists?.[format]?.url || '';
            const newInterval = savedSubscription.lists?.[format]?.refresh_interval || 0;
            if (newInterval <= 0 || !newUrl) {
              disableBackgroundRefresh(savedId, format);
            } else {
              scheduleBackgroundRefresh(savedId, savedSubscription);
            }
          }
        }
      });
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
    chrome.runtime.sendMessage({
      action: 'scheduleSubscriptionRefresh',
      proxyId: proxyId,
      format: format,
      refreshInterval: 0,
      url: null
    }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        const error = chrome.runtime.lastError?.message || response?.error || 'Unknown error';
        console.info(`[Subscription] Failed to clear refresh alarm: ${error}`);
        return;
      }
      console.log(`[Subscription] Refresh alarm cleared: ${proxyId}, format: ${format}`);
    });
  }

  function scheduleAllBackgroundRefreshes(config) {
    if (!config) return;
    chrome.runtime.sendMessage({ action: 'scheduleAllSubscriptionRefreshes' }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        const error = chrome.runtime.lastError?.message || response?.error || 'Unknown error';
        console.info(`[Subscription] Failed to reconcile refresh alarms: ${error}`);
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
        return trimmed.includes('FindProxyForURL');
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
    const IP_RANGE_PATTERN = /^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/;
    if (IP_RANGE_PATTERN.test(pattern)) {
      return 'ip_range';
    }

    const segments = pattern.split('.');
    const hasWildcard = pattern.includes('*');
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    if (!hasWildcard) {
      return segments.length >= 2 ? 'domain' : 'single_segment';
    }

    if (segments.length === 2 && firstSegment === '*') {
      return 'single_wildcard';
    }

    if (firstSegment === '*' && lastSegment === '*') {
      return 'complex_wildcard';
    }

    if (firstSegment === '*' && segments.length >= 3) {
      return 'wildcard_domain';
    }

    return 'unknown';
  }

  function convertOmegaToProxyRule(pattern, type) {
    const domainWithoutWildcard = pattern.replace(/^\*\./, '');

    switch (type) {
      case 'ip_range':
        return convertIPRangeToCIDR(pattern);

      case 'single_wildcard':
        return `/^[a-z0-9-]+\.${escapeRegExp(domainWithoutWildcard)}$/`;

      case 'complex_wildcard':
        return `/.*\\.${escapeRegExp(pattern.substring(2, pattern.length - 1))}\\..*/`;

      case 'wildcard_domain':
        return domainWithoutWildcard;

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

      case 'wildcard_domain':
        return pattern.replace(/^\*\./, '');

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
    if (parts.length !== 4) return null;

    const firstWildcard = parts.indexOf('*');
    const hasWildcard = firstWildcard !== -1;

    if (!hasWildcard) {
      const isValidIp = parts.every(part => {
        const value = parseInt(part, 10);
        return /^\d{1,3}$/.test(part) && value >= 0 && value <= 255;
      });
      return isValidIp ? pattern : null;
    }

    const hasNonTrailingWildcard = parts
      .slice(firstWildcard)
      .some(part => part !== '*');
    if (hasNonTrailingWildcard) return null;

    const cidrParts = parts.map(part => part === '*' ? '0' : part);
    const hasInvalidOctet = cidrParts.some(part => {
      const value = parseInt(part, 10);
      return !/^\d{1,3}$/.test(part) || value < 0 || value > 255;
    });
    if (hasInvalidOctet) return null;

    return `${cidrParts.join('.')}/${firstWildcard * 8}`;
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalizeSwitchyOmegaLine(line, reverse) {
    if (line.startsWith('[SwitchyOmega Conditions]') || line.startsWith(';') || line.startsWith('@')) {
      return null;
    }

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
    const patternType = classifyOmegaPattern(pattern);

    const finalPattern = shouldBeDirect
      ? convertOmegaToBypassRule(pattern, patternType)
      : convertOmegaToProxyRule(pattern, patternType);

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
        result.include_rules = pacResult.include.slice(0, MAX_SUBSCRIPTION_PARSED_RULES);
        result.bypass_rules = pacResult.bypass.slice(
          0,
          Math.max(0, MAX_SUBSCRIPTION_PARSED_RULES - result.include_rules.length)
        );
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
            if (result.include_rules.length + result.bypass_rules.length >= MAX_SUBSCRIPTION_PARSED_RULES) {
              break;
            }
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

    const { left: bypassLeft = '', right: bypassRight = '' } = config.bypass || {};
    const { left: includeLeft = '', right: includeRight = '' } = config.include || {};

    const isValidItem = item => item && typeof item === 'string' && !item.includes('*');

    function extractByBounds(content, left, right) {
      if (!left || !right) return [];
      const results = [];
      let start = 0;
      while (true) {
        const leftIdx = content.indexOf(left, start);
        if (leftIdx === -1) break;
        const rightIdx = content.indexOf(right, leftIdx + left.length);
        if (rightIdx === -1) break;
        results.push(content.substring(leftIdx + left.length, rightIdx));
        start = rightIdx + right.length;
      }
      return results;
    }

    function extractItems(targetArray, left, right) {
      if (!left || !right) return;
      const items = extractByBounds(content, left, right)
        .flatMap(item => item.replace(/["']/g, '').split(',')
          .map(part => part.trim())
          .filter(Boolean));
      targetArray.push(...items);
    }

    const extractedInclude = [];
    const extractedBypass = [];

    extractItems(extractedBypass, bypassLeft, bypassRight);
    extractItems(extractedInclude, includeLeft, includeRight);

    const include = [...new Set(extractedInclude.filter(isValidItem))];
    const bypass = [...new Set(extractedBypass.filter(isValidItem))];

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

  function getProxySubscriptions(proxy) {
    const ids = Array.isArray(proxy?.subscription_ids) ? proxy.subscription_ids : [];
    if (typeof StorageModule.getSubscription !== 'function') {
      return proxy?.subscription ? [proxy.subscription] : [];
    }
    return ids.map(id => StorageModule.getSubscription(id)).filter(Boolean);
  }

  function getProxySubscriptionLineCounts(proxy) {
    return getProxySubscriptions(proxy).reduce((totals, subscription) => {
      if (subscription.enabled === false) return totals;
      const counts = getSubscriptionLineCounts(subscription);
      totals.include_lines += counts.include_lines;
      totals.bypass_lines += counts.bypass_lines;
      return totals;
    }, { include_lines: 0, bypass_lines: 0 });
  }

  function getCardSubscription($card) {
    return StorageModule.getSubscription($card.data('id'));
  }

  function ensureFormatConfig(subscription, format) {
    if (!subscription.lists) subscription.lists = {};
    if (!subscription.lists[format]) {
      subscription.lists[format] = getEmptyConfig().lists[format];
    }
    if (format === 'pac' && !subscription.lists[format].process_rule) {
      subscription.lists[format].process_rule = getDefaultPacProcessRule();
    }
    return subscription.lists[format];
  }

  function collectCardData($card, subscription) {
    const format = subscription.current || 'autoproxy';
    const item = ensureFormatConfig(subscription, format);
    subscription.name = $card.find('.subscription-name-input').val().trim();
    subscription.enabled = $card.find('.subscription-card-enabled').prop('checked');
    item.url = $card.find('.subscription-url-input').val().trim();
    item.reverse = $card.find('.subscription-card-reverse').val() === 'true';
    item.refresh_interval = parseInt($card.find('.subscription-card-refresh').val(), 10) || 0;
    if (format === 'pac') {
      item.process_rule = $card.find('.subscription-process-rule-input').val() || '';
    }
  }

  function formatLastUpdated(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '-';
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function renderFormatOptions(selected) {
    return FORMATS.map(format => `<option value="${format}"${format === selected ? ' selected' : ''}>${FORMAT_NAMES[format]}</option>`).join('');
  }

  function renderRefreshOptions(selected) {
    const options = [
      [0, I18n.t('interval_never')],
      [1, I18n.t('interval_1m')],
      [360, I18n.t('interval_6h')],
      [720, I18n.t('interval_12h')],
      [1440, I18n.t('interval_1d')],
      [7200, I18n.t('interval_5d')]
    ];
    return options.map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');
  }

  async function fetchCardSubscription($card, $button) {
    const subscription = getCardSubscription($card);
    if (!subscription || $button.prop('disabled')) return;
    collectCardData($card, subscription);

    const format = subscription.current;
    const item = ensureFormatConfig(subscription, format);
    if (!item.url) {
      UtilsModule.showTip(I18n.t('subscription_empty_url'), true);
      $card.find('.subscription-url-input').addClass('input-error').trigger('focus');
      return;
    }

    $button.prop('disabled', true).addClass('btn-loading');
    try {
      const content = await fetchSubscriptionText(item.url);
      if (!isFormatValid(content, format)) throw new Error(I18n.t('alert_invalid_format'));

      item.content = content;
      item.last_fetch_time = Date.now();
      updateSubscriptionParsedData(format, item);
      renderManagementList();
      UtilsModule.showTip(I18n.t('subscription_fetch_success'), false);
    } catch (error) {
      console.info('Subscription fetch failed:', error);
      UtilsModule.showTip(`${I18n.t('subscription_fetch_failed')}: ${getSubscriptionFetchErrorMessage(error)}`, true);
    } finally {
      $button.prop('disabled', false).removeClass('btn-loading');
    }
  }

  function saveCardSubscription($card) {
    const subscription = getCardSubscription($card);
    if (!subscription) return;
    collectCardData($card, subscription);

    if (!subscription.name) {
      $card.find('.subscription-name-input').addClass('input-error').trigger('focus');
      UtilsModule.showTip(I18n.t('subscription_name_required'), true);
      return;
    }

    const format = subscription.current;
    const item = ensureFormatConfig(subscription, format);
    if (format === 'pac') {
      const validation = validatePacProcessRule(item.process_rule || '');
      if (!validation.valid) {
        UtilsModule.showTip(`${I18n.t('subscription_save_failed')}: ${I18n.t(validation.error)}`, true);
        return;
      }
    }
    if (item.content) updateSubscriptionParsedData(format, item);
    subscription.lists = { [format]: item };
    delete subscription.is_new;

    StorageModule.save().then(function () {
      renderManagementList();
      ProxyModule.renderList();
      if (item.refresh_interval > 0 && item.url && subscription.enabled !== false) {
        scheduleBackgroundRefresh(subscription.id, subscription);
      } else {
        disableBackgroundRefresh(subscription.id, format);
      }
      UtilsModule.showTip(I18n.t('subscription_save_success'), false);
    }).catch(function (error) {
      console.info('Subscription save failed:', error);
      UtilsModule.showTip(I18n.t('subscription_save_failed'), true);
    });
  }

  function deleteCardSubscription($card) {
    const subscription = getCardSubscription($card);
    if (!subscription || !window.confirm(I18n.t('subscription_delete_confirm'))) return;
    StorageModule.deleteSubscription(subscription.id);
    StorageModule.save().then(function () {
      renderManagementList();
      ProxyModule.renderList();
    });
  }

  function syncManagementExpandCollapseButton() {
    const $button = $('#subscription-expand-collapse-btn');
    if (!$button.length) return;

    if (managementExpansionMode === 'expanded') {
      $button.addClass('expanded');
      $button.html(`${MainIcons.render('collapse', { width: 16, height: 16, className: 'icon-collapse' })} <span data-i18n="collapse_all">${I18n.t('collapse_all')}</span>`);
      return;
    }

    $button.removeClass('expanded');
    $button.html(`${MainIcons.render('expand', { width: 16, height: 16, className: 'icon-expand' })} <span data-i18n="expand_all">${I18n.t('expand_all')}</span>`);
  }

  function updateManagementExpansionModeFromCards() {
    const $cards = $('#subscription-manage-list .subscription-card');
    const collapsedCount = $cards.filter('.collapsed').length;

    if (!$cards.length) {
      managementExpansionMode = 'auto';
    } else if (collapsedCount === 0) {
      managementExpansionMode = 'expanded';
    } else if (collapsedCount === $cards.length) {
      managementExpansionMode = 'collapsed';
    } else {
      managementExpansionMode = 'auto';
    }
    syncManagementExpandCollapseButton();
  }

  function updateManagementCardToggleState() {
    $('#subscription-manage-list .subscription-card').each(function () {
      const $card = $(this);
      const isExpanded = !$card.hasClass('collapsed');
      $card.find('.subscription-card-collapse')
        .attr('aria-expanded', String(isExpanded))
        .attr('title', I18n.t(isExpanded ? 'collapse_all' : 'expand_all'));
    });
  }

  function toggleManagementCard($card) {
    $card.toggleClass('collapsed');
    updateManagementCardToggleState();
    updateManagementExpansionModeFromCards();
  }

  function initManagementSortable() {
    const $container = $('#subscription-manage-list');
    $container.off('mousedown.subscriptionSort', '.subscription-drag-handle');
    $container.on('mousedown.subscriptionSort', '.subscription-drag-handle', function (event) {
      if (event.button !== 0) return;
      event.preventDefault();

      $container.find('.subscription-card').each(function () {
        const $card = $(this);
        const subscription = getCardSubscription($card);
        if (subscription) collectCardData($card, subscription);
      });

      const $item = $(this).closest('.subscription-card');
      if (!$item.length) return;

      const rect = $item[0].getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const $placeholder = $('<div class="drag-placeholder subscription-drag-placeholder"></div>').css({
        height: rect.height,
        marginBottom: 0
      });
      const $clone = $item.clone().addClass('proxy-card-clone').css({
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 10000,
        opacity: 0.95,
        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        margin: 0,
        transform: 'scale(1.02)',
        transition: 'none'
      });

      $('body').append($clone);
      $item.before($placeholder).hide();

      function moveItem(clientX, clientY) {
        $clone.css({
          top: rect.top + (clientY - startY),
          left: rect.left + (clientX - startX)
        });

        let $target = null;
        $container.find('.subscription-card:not(:hidden)').each(function () {
          const targetRect = this.getBoundingClientRect();
          if (clientY < targetRect.top + targetRect.height / 2) {
            $target = $(this);
            return false;
          }
        });

        if ($target) {
          $target.before($placeholder);
        } else {
          $container.append($placeholder);
        }
      }

      function finishSort() {
        $(document).off('mousemove.subscriptionSort mouseup.subscriptionSort');
        $clone.remove();
        $placeholder.replaceWith($item);
        $item.show();

        const subscriptions = StorageModule.getSubscriptions();
        const subscriptionsById = new Map(subscriptions.map(subscription => [subscription.id, subscription]));
        const newOrder = $container.find('.subscription-card').map(function () {
          return subscriptionsById.get(String($(this).data('id')));
        }).get().filter(Boolean);
        const hasChanged = newOrder.some((subscription, index) => subscription !== subscriptions[index]);

        if (!hasChanged) return;
        StorageModule.reorderSubscriptions(newOrder);
        StorageModule.save().then(function () {
          renderManagementList();
          ProxyModule.renderList();
          UtilsModule.showTip(I18n.t('sort_success'), false);
        }).catch(function (error) {
          console.info('Subscription sort failed:', error);
          renderManagementList();
          UtilsModule.showTip(I18n.t('save_failed'), true);
        });
      }

      $(document).on('mousemove.subscriptionSort', function (moveEvent) {
        moveItem(moveEvent.clientX, moveEvent.clientY);
      });
      $(document).on('mouseup.subscriptionSort', finishSort);
    });
  }

  function renderManagementList() {
    const $list = $('#subscription-manage-list');
    if (!$list.length) return;

    const expandedIds = new Set();
    $list.find('.subscription-card:not(.collapsed)').each(function () {
      expandedIds.add($(this).data('id'));
    });

    const subscriptions = typeof StorageModule.getSubscriptions === 'function'
      ? StorageModule.getSubscriptions().map((subscription, index) => ({
        subscription: subscription,
        order: Number.isInteger(subscription.order) && subscription.order >= 0 ? subscription.order : index,
        index: index
      })).sort((left, right) => left.order - right.order || left.index - right.index)
        .map(entry => entry.subscription)
      : [];
    if (!subscriptions.length) {
      $list.html(`<div class="subscription-manage-empty">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 11a9 9 0 0 1 9 9"></path>
          <path d="M4 4a16 16 0 0 1 16 16"></path>
          <circle cx="5" cy="19" r="1"></circle>
        </svg>
        <span>${I18n.t('subscription_empty_management')}</span>
      </div>`);
      managementExpansionMode = 'auto';
      syncManagementExpandCollapseButton();
      return;
    }

    const html = subscriptions.map((subscription, index) => {
      const format = subscription.current || 'autoproxy';
      const item = ensureFormatConfig(subscription, format);
      const counts = getSubscriptionLineCounts(subscription);
      const name = subscription.name || I18n.t('subscription_unnamed');
      const lastUpdated = formatLastUpdated(item.last_fetch_time);
      const isExpanded = managementExpansionMode === 'expanded'
        || (managementExpansionMode === 'auto' && (subscription.is_new || expandedIds.has(subscription.id)));
      const collapsed = isExpanded ? '' : ' collapsed';
      const disabled = subscription.enabled === false ? ' disabled' : '';
      return `<div class="proxy-card subscription-card${collapsed}${disabled}" data-id="${UtilsModule.escapeHtml(subscription.id)}">
        <div class="proxy-header subscription-card-header">
          <div class="header-left">
            <div class="drag-handle subscription-drag-handle" title="${I18n.t('drag_sort')}">
              ${MainIcons.render('dragHandle', { width: 20, height: 20 })}
            </div>
            <span class="proxy-index">#${index + 1}</span>
            <div class="proxy-type-badge subscription-type-badge ${format}">${FORMAT_NAMES[format] || format}</div>
            <div class="subscription-title-preview" title="${UtilsModule.escapeHtml(name)}">${UtilsModule.escapeHtml(name)}</div>
          </div>
          <div class="header-right">
            <span class="subscription-last-updated" title="${UtilsModule.escapeHtml(I18n.t('subscription_last_updated'))}">${lastUpdated}</span>
            <div class="status-container">
              <span class="status-text subscription-status-text">${subscription.enabled === false ? I18n.t('status_disabled') : I18n.t('status_enabled')}</span>
              <label class="switch-modern">
                <input type="checkbox" class="subscription-card-enabled"${subscription.enabled === false ? '' : ' checked'}>
                <span class="slider-modern"></span>
              </label>
            </div>
            <button type="button" class="subscription-card-collapse" title="${I18n.t(isExpanded ? 'collapse_all' : 'expand_all')}" aria-expanded="${isExpanded}">${MainIcons.render('chevronDown', { width: 16, height: 16 })}</button>
          </div>
        </div>
        <div class="proxy-body">
          <div class="proxy-body-container">
            <div class="proxy-content-left subscription-card-content">
              <div class="form-grid subscription-card-form">
                <div class="form-item" style="grid-column: span 4;">
                  <label>${I18n.t('subscription_name')}</label>
                  <input type="text" class="subscription-name-input" value="${UtilsModule.escapeHtml(subscription.name || '')}" placeholder="${I18n.t('subscription_name')}">
                </div>
                <div class="form-item" style="grid-column: span 8;">
                  <label>${I18n.t('subscription_url')}</label>
                  <input type="text" class="subscription-url-input" value="${UtilsModule.escapeHtml(item.url || '')}" placeholder="https://example.com/subscription.ini">
                </div>
                <div class="form-item" style="grid-column: span 4;">
                  <label>${I18n.t('subscription_format')}</label>
                  <select class="subscription-card-select subscription-card-format">${renderFormatOptions(format)}</select>
                </div>
                <div class="form-item" style="grid-column: span 4;">
                  <label>${I18n.t('reverse_rule')}</label>
                  <select class="subscription-card-select subscription-card-reverse">
                    <option value="false"${item.reverse ? '' : ' selected'}>${I18n.t('no')}</option>
                    <option value="true"${item.reverse ? ' selected' : ''}>${I18n.t('yes')}</option>
                  </select>
                </div>
                <div class="form-item" style="grid-column: span 4;">
                  <label>${I18n.t('subscription_refresh_method')}</label>
                  <select class="subscription-card-select subscription-card-refresh">${renderRefreshOptions(item.refresh_interval || 0)}</select>
                </div>
              </div>
              <div class="subscription-card-content-panel">
                <div class="subscription-card-tabs">
                  <button type="button" class="subscription-card-tab active" data-tab="original">${I18n.t('subscription_content_original')}</button>
                  ${format === 'pac' ? `<button type="button" class="subscription-card-tab" data-tab="process">${I18n.t('subscription_content_script')}</button>` : ''}
                  <button type="button" class="subscription-card-tab" data-tab="include">${I18n.t('subscription_content_include')}</button>
                  <button type="button" class="subscription-card-tab" data-tab="bypass">${I18n.t('subscription_content_bypass')}</button>
                </div>
                <div class="subscription-card-pane active" data-pane="original"><textarea readonly>${UtilsModule.escapeHtml(item.content || '')}</textarea></div>
                ${format === 'pac' ? `<div class="subscription-card-pane" data-pane="process"><textarea class="subscription-process-rule-input">${UtilsModule.escapeHtml(item.process_rule || '')}</textarea></div>` : ''}
                <div class="subscription-card-pane" data-pane="include"><textarea readonly>${UtilsModule.escapeHtml(item.include_rules || '')}</textarea></div>
                <div class="subscription-card-pane" data-pane="bypass"><textarea readonly>${UtilsModule.escapeHtml(item.bypass_rules || '')}</textarea></div>
                <div class="subscription-card-footer">
                  <span>${formatLastUpdated(item.last_fetch_time)}</span>
                  <span>${I18n.t('subscription_content_include')}: ${counts.include_lines} · ${I18n.t('subscription_content_bypass')}: ${counts.bypass_lines}</span>
                </div>
              </div>
            </div>
            <div class="proxy-content-right subscription-card-actions">
              <button type="button" class="right-panel-btn btn-test subscription-card-fetch">${I18n.t('fetch_subscription')}</button>
              <button type="button" class="right-panel-btn btn-save subscription-card-save">${I18n.t('save')}</button>
              <button type="button" class="right-panel-btn btn-delete subscription-card-delete">${I18n.t('delete')}</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
    $list.html(html);
    if (typeof window.enhanceNativeSelects === 'function') {
      window.enhanceNativeSelects($list[0]);
    }
    updateManagementCardToggleState();
    updateManagementExpansionModeFromCards();
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
    const subscriptions = typeof StorageModule.getSubscriptions === 'function' ? StorageModule.getSubscriptions().slice() : [];
    (proxyList || []).forEach(proxy => {
      if (proxy.subscription) subscriptions.push(proxy.subscription);
    });
    subscriptions.forEach(subscription => {
      Object.keys(subscription.lists || {}).forEach((format) => {
        const listConfig = subscription.lists[format];
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
    getProxySubscriptions: getProxySubscriptions,
    getProxySubscriptionLineCounts: getProxySubscriptionLineCounts,
    renderManagementList: renderManagementList,
    generateSubscriptionStats: generateSubscriptionStats,
    parseRules: parseRules,
    parseProxyListSubscriptions: parseProxyListSubscriptions,
    scheduleBackgroundRefresh: scheduleBackgroundRefresh,
    scheduleAllBackgroundRefreshes: scheduleAllBackgroundRefreshes,
    fetchSubscriptionBackground: fetchSubscriptionBackground,
    disableBackgroundRefresh: disableBackgroundRefresh,
    readResponseTextWithLimit: readResponseTextWithLimit,
    fetchSubscriptionText: fetchSubscriptionText
  };
})();
