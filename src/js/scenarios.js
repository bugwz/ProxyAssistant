// ==========================================
// Scenarios Module
// Scenario management, switching, and proxy grouping
// ==========================================

const ScenariosModule = (function () {
  let editingScenarioId = null;
  let deletingScenarioId = null;
  let managementExpansionMode = 'auto';
  let newManagementScenarioId = null;
  const draftScenarioIds = new Set();
  let isSyncingScenarioRuleOperators = false;
  const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
  const WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 0];
  const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const TIME_24_HOUR_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

  function getScenarioAutomation(scenario) {
    const automation = scenario?.automation || {};
    const timeRules = Array.isArray(automation.rules)
      ? automation.rules.filter(rule => rule?.type === 'time')
      : [];
    const operatorMode = timeRules[1]?.operator === 'and' ? 'and' : 'or';

    return {
      enabled: automation.enabled === true,
      rules: (timeRules.length ? timeRules : [{}]).map((rule, index) => ({
        type: 'time',
        operator: index === 0 ? 'if' : operatorMode,
        weekdays: Array.isArray(rule?.weekdays) && rule.weekdays.length
          ? rule.weekdays.map(Number)
          : DEFAULT_WEEKDAYS.slice(),
        start: rule?.start || '09:00',
        end: rule?.end || '18:00'
      }))
    };
  }

  function getWeekdayLabel(day) {
    return I18n.t(`scenario_day_${WEEKDAY_KEYS[day]}`);
  }

  function renderWeekdaySelector(weekdays) {
    const selectedDays = [...new Set((weekdays || []).map(Number))];
    const selectedNames = WEEKDAY_OPTIONS.filter(day => selectedDays.includes(day)).map(getWeekdayLabel);
    const summary = selectedNames.length ? selectedNames.join('、') : I18n.t('scenario_weekday_select_empty');
    const options = WEEKDAY_OPTIONS.map(day => {
      const label = getWeekdayLabel(day);
      const checked = selectedDays.includes(day) ? ' checked' : '';
      return `<label class="scenario-weekday-option">
        <input type="checkbox" value="${day}"${checked}>
        <span>${label}</span>
      </label>`;
    }).join('');

    return `<div class="scenario-weekday-select">
      <button type="button" class="scenario-weekday-trigger" aria-haspopup="true" aria-expanded="false">
        <span class="scenario-weekday-value" title="${UtilsModule.escapeHtml(summary)}">${UtilsModule.escapeHtml(summary)}</span>
        ${MainIcons.render('chevronDown', { width: 14, height: 14, className: 'select-icon' })}
      </button>
      <div class="scenario-weekday-menu">
        <div class="scenario-weekday-options">${options}</div>
      </div>
    </div>`;
  }

  function renderAutomationRule(rule, index) {
    const operator = index === 0 ? 'if' : (rule.operator === 'and' ? 'and' : 'or');
    const operatorOptions = index === 0
      ? `<option value="if" selected>${I18n.t('scenario_operator_if')}</option>`
      : `<option value="and"${operator === 'and' ? ' selected' : ''}>${I18n.t('scenario_operator_and')}</option>
        <option value="or"${operator === 'or' ? ' selected' : ''}>${I18n.t('scenario_operator_or')}</option>`;

    return `<div class="scenario-condition-row" data-index="${index}">
      <div class="form-item scenario-condition-operator">
        <select class="scenario-condition-operator-select" aria-label="${I18n.t('scenario_condition_relation')}"${index === 0 || index > 1 ? ' disabled' : ''}>${operatorOptions}</select>
      </div>
      <div class="form-item scenario-condition-type">
        <select class="scenario-condition-type-select" aria-label="${I18n.t('scenario_strategy_type')}">
          <option value="time" selected>${I18n.t('scenario_strategy_time')}</option>
        </select>
      </div>
      <div class="form-item scenario-condition-value">
        <div class="scenario-time-value">
          ${renderWeekdaySelector(rule.weekdays)}
          <input type="text" inputmode="numeric" maxlength="5" autocomplete="off" spellcheck="false" class="scenario-time-input scenario-automation-start" value="${rule.start}" placeholder="HH:mm" aria-label="${I18n.t('start_time')}">
          <span class="scenario-time-range-separator">—</span>
          <input type="text" inputmode="numeric" maxlength="5" autocomplete="off" spellcheck="false" class="scenario-time-input scenario-automation-end" value="${rule.end}" placeholder="HH:mm" aria-label="${I18n.t('end_time')}">
        </div>
      </div>
      <div class="scenario-condition-actions">
        <button type="button" class="scenario-condition-remove" title="${I18n.t('scenario_condition_remove')}" aria-label="${I18n.t('scenario_condition_remove')}"${index === 0 ? ' disabled' : ''}>${MainIcons.render('trash', { width: 16, height: 16 })}</button>
        <button type="button" class="scenario-condition-add" title="${I18n.t('scenario_condition_add')}" aria-label="${I18n.t('scenario_condition_add')}">${MainIcons.render('add', { width: 16, height: 16 })}</button>
      </div>
    </div>`;
  }

  function getSelectableScenarioProxies(scenario) {
    return (scenario?.proxies || []).filter(proxy => (
      proxy?.id && proxy.enabled !== false && proxy.ip && proxy.port
    ));
  }

  function syncScenarioRuleOperators($list) {
    if (isSyncingScenarioRuleOperators) return;

    isSyncingScenarioRuleOperators = true;
    const $rows = $list.children('.scenario-condition-row');
    const mode = $rows.eq(1).find('.scenario-condition-operator-select').val() === 'and' ? 'and' : 'or';
    $rows.each(function (index) {
      const $select = $(this).find('.scenario-condition-operator-select');
      const value = index === 0 ? 'if' : mode;
      $select.val(value).prop('disabled', index === 0 || index > 1).trigger('change');
    });
    isSyncingScenarioRuleOperators = false;
  }

  function init() {
    bindEvents();
  }

  function getScenarios() {
    return StorageModule ? StorageModule.getScenarios() : [];
  }

  function getCurrentScenarioId() {
    return StorageModule ? StorageModule.getCurrentScenarioId() : 'default';
  }

  function setScenarios(newScenarios) {
    if (StorageModule) {
      StorageModule.setScenarios(newScenarios);
    }
  }

  function setCurrentScenarioId(id) {
    if (StorageModule) {
      StorageModule.setCurrentScenarioId(id);
    }
  }

  function getCurrentScenario() {
    return StorageModule ? StorageModule.getCurrentScenario() : null;
  }

  function renderScenarioViews() {
    renderScenarioSelector();
    if ($("#scenario-manage-list").length) {
      renderScenarioManagementList();
    }
  }

  function renderScenarioSelector() {
    const scenarios = getScenarios();
    const currentScenarioId = getCurrentScenarioId();

    let html = "";
    let currentScenarioName = "";

    scenarios.forEach(function (scenario) {
      const isCurrent = scenario.id === currentScenarioId;
      const proxyCount = scenario.proxies ? scenario.proxies.length : 0;
      const cssClass = isCurrent ? 'current-scenario' : '';
      html += `<li data-value="${scenario.id}" class="${cssClass}">
        <span class="scenario-name">${UtilsModule.escapeHtml(scenario.name)}</span>
        <span class="scenario-count">${proxyCount}</span>
      </li>`;
      if (scenario.id === currentScenarioId) {
        currentScenarioName = scenario.name;
      }
    });

    $(".main-scenario-dropdown").html(html);
    $(".main-scenario-btn").attr("title", `${I18n.t("switch_scenario_tooltip")} (${currentScenarioName || I18n.t('scenario_default')})`);
    $("#current-scenario-indicator").text(currentScenarioName || I18n.t('scenario_default'));
  }

  async function switchScenario(id) {
    const currentId = getCurrentScenarioId();
    if (currentId === id) return;

    const scenarios = getScenarios();
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return false;

    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      return false;
    }

    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'activateScenario', scenarioId: id, source: 'manual' }, response => {
        const error = chrome.runtime.lastError?.message || response?.error;
        if (error || !response?.success) {
          console.info('Switch scenario failed:', error || 'Unknown error');
          if (typeof UtilsModule !== 'undefined' && UtilsModule.showTip) {
            UtilsModule.showTip(`${I18n.t('scenario_activation_failed')}: ${error || ''}`.replace(/:\s*$/, ''), true);
          }
          resolve(false);
          return;
        }

        setCurrentScenarioId(id);
        if (typeof onScenarioSwitch === 'function') {
          onScenarioSwitch(id, scenario.proxies || []);
        } else if (typeof ProxyModule !== 'undefined' && ProxyModule.setList) {
          ProxyModule.setList(scenario.proxies || []);
          if (typeof ProxyModule.renderList === 'function') {
            ProxyModule.renderList();
          }
        }
        renderScenarioViews();
        resolve(true);
      });
    });
  }

  function syncManagementExpandCollapseButton() {
    const $button = $('#scenario-expand-collapse-btn');
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
    const $cards = $('#scenario-manage-list .scenario-card');
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
    $('#scenario-manage-list .scenario-card').each(function () {
      const $card = $(this);
      const isExpanded = !$card.hasClass('collapsed');
      $card.find('.scenario-card-collapse')
        .attr('aria-expanded', String(isExpanded))
        .attr('title', I18n.t(isExpanded ? 'collapse_all' : 'expand_all'));
    });
  }

  function toggleManagementCard($card) {
    $card.toggleClass('collapsed');
    updateManagementCardToggleState();
    updateManagementExpansionModeFromCards();
  }

  function renderScenarioManagementList() {
    const $list = $('#scenario-manage-list');
    const expandedIds = new Set();
    $list.find('.scenario-card:not(.collapsed)').each(function () {
      expandedIds.add(String($(this).data('id')));
    });

    const scenarios = getScenarios();
    const currentScenarioId = getCurrentScenarioId();
    const html = scenarios.map(function (scenario, index) {
      const isCurrent = scenario.id === currentScenarioId;
      const proxyCount = (scenario.proxies || []).length;
      const escapedId = UtilsModule.escapeHtml(scenario.id);
      const escapedName = UtilsModule.escapeHtml(scenario.name);
      const isExpanded = managementExpansionMode === 'expanded'
        || (managementExpansionMode === 'auto' && (scenario.id === newManagementScenarioId || expandedIds.has(String(scenario.id))));
      const collapsed = isExpanded ? '' : ' collapsed';
      const selectableProxies = getSelectableScenarioProxies(scenario);
      const defaultProxyId = selectableProxies.some(proxy => proxy.id === scenario.defaultProxyId)
        ? scenario.defaultProxyId
        : '';
      const defaultProxyOptions = `<option value=""${defaultProxyId ? '' : ' selected'}>${I18n.t('scenario_last_used_proxy')}</option>`
        + selectableProxies.map(proxy => {
          const selected = proxy.id === defaultProxyId ? ' selected' : '';
          const proxyName = proxy.name || proxy.ip;
          const proxyAddress = `${proxy.ip}:${proxy.port}`;
          return `<option value="${UtilsModule.escapeHtml(proxy.id)}"${selected}>${UtilsModule.escapeHtml(`${proxyName} - ${proxyAddress}`)}</option>`;
        }).join('');
      const automation = getScenarioAutomation(scenario);
      const automationPanelHidden = automation.enabled ? '' : ' hidden';
      const automationRuleRows = automation.rules.map(renderAutomationRule).join('');

      return `<div class="proxy-card scenario-card${collapsed}${isCurrent ? ' is-current' : ''}" data-id="${escapedId}">
        <div class="proxy-header scenario-card-header">
          <div class="header-left">
            <button type="button" class="drag-handle scenario-drag-handle" title="${I18n.t('drag_sort')}" aria-label="${I18n.t('drag_sort')}">
              ${MainIcons.render('dragHandle', { width: 20, height: 20 })}
            </button>
            <span class="proxy-index">#${index + 1}</span>
            <div class="scenario-card-title" title="${escapedName}">${escapedName}</div>
          </div>
          <div class="header-right">
            <span class="scenario-proxy-summary">${proxyCount} ${I18n.t('scenario_proxy_unit')}</span>
            <button type="button" class="scenario-card-collapse" title="${I18n.t(isExpanded ? 'collapse_all' : 'expand_all')}" aria-expanded="${isExpanded}">${MainIcons.render('chevronDown', { width: 16, height: 16 })}</button>
          </div>
        </div>
        <div class="proxy-body">
          <div class="proxy-body-container">
            <div class="proxy-content-left scenario-card-content">
              <div class="form-grid scenario-card-form">
                <div class="form-item scenario-name-field">
                  <label>${I18n.t('scenario_name')}</label>
                  <input type="text" class="scenario-card-name-input" data-id="${escapedId}" value="${escapedName}" placeholder="${I18n.t('scenario_name_placeholder')}">
                </div>
                <div class="form-item scenario-default-proxy-field">
                  <label>${I18n.t('scenario_default_proxy')}</label>
                  <select class="subscription-card-select scenario-default-proxy-select">${defaultProxyOptions}</select>
                </div>
                <div class="form-item scenario-automation-status-field">
                  <label>${I18n.t('scenario_automation')}</label>
                  <select class="scenario-automation-enabled">
                    <option value="off"${automation.enabled ? '' : ' selected'}>${I18n.t('scenario_automation_off')}</option>
                    <option value="on"${automation.enabled ? ' selected' : ''}>${I18n.t('scenario_automation_on')}</option>
                  </select>
                </div>
                <div class="scenario-automation-panel${automationPanelHidden}">
                  <div class="scenario-automation-summary">
                    <div>
                      <strong>
                        ${I18n.t('scenario_conditions')}
                        <span class="info-icon scenario-strategy-info" tabindex="0" data-tooltip="${I18n.t('scenario_conditions_hint')}" aria-label="${I18n.t('scenario_conditions_hint')}">
                          ${MainIcons.render('info', { width: 14, height: 14 })}
                        </span>
                      </strong>
                    </div>
                  </div>
                  <div class="scenario-condition-columns">
                    <span>${I18n.t('scenario_condition_relation')}</span>
                    <span>${I18n.t('scenario_strategy_type')}</span>
                    <span>${I18n.t('scenario_strategy_value')}</span>
                    <span aria-hidden="true"></span>
                  </div>
                  <div class="scenario-condition-list">${automationRuleRows}</div>
                </div>
              </div>
            </div>
            <div class="proxy-content-right scenario-card-actions">
              <button type="button" class="right-panel-btn btn-save scenario-card-save" data-id="${escapedId}">${I18n.t('save')}</button>
              <button type="button" class="right-panel-btn btn-delete delete-scenario-btn" data-id="${escapedId}" title="${I18n.t('delete')}">${I18n.t('delete')}</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    $list.html(html);
    if (typeof window.enhanceNativeSelects === 'function') {
      window.enhanceNativeSelects($list[0]);
    }
    $list.find('.scenario-condition-list').each(function () {
      syncScenarioRuleOperators($(this));
    });
    newManagementScenarioId = null;
    updateManagementCardToggleState();
    updateManagementExpansionModeFromCards();
    initScenarioSortable();
  }

  function initScenarioSortable() {
    const $container = $("#scenario-manage-list");

    $container.off("mousedown", ".drag-handle");

    $container.on("mousedown", ".drag-handle", function (e) {
      if (e.button !== 0) return;

      e.preventDefault();
      const $handle = $(this);
      const $item = $handle.closest(".scenario-card");
      if ($item.length === 0) return;

      const itemEl = $item[0];
      const rect = itemEl.getBoundingClientRect();

      const startX = e.clientX;
      const startY = e.clientY;
      const startTop = rect.top;
      const startLeft = rect.left;

      const $placeholder = $('<div class="drag-placeholder"></div>').css({
        height: rect.height,
        marginBottom: 0,
        borderRadius: '6px'
      });

      const $clone = $item.clone();

      $clone.addClass("scenario-item-clone").css({
        position: "fixed",
        top: startTop,
        left: startLeft,
        width: rect.width,
        height: rect.height,
        zIndex: 10000,
        opacity: 0.95,
        boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
        background: 'var(--bg-primary, #fff)',
        pointerEvents: "none",
        margin: 0,
        transform: "scale(1.02)",
        transition: "none",
        display: "block"
      });

      $("body").append($clone);
      $item.before($placeholder).hide();

      let isDragging = true;
      let rafId = null;

      const onMouseMove = function (e) {
        if (!isDragging) return;
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          $clone.css({
            top: startTop + (clientY - startY),
            left: startLeft + (clientX - startX)
          });

          const $siblings = $container.find(".scenario-card:not(:hidden)");
          let $target = null;

          $siblings.each(function () {
            const box = this.getBoundingClientRect();
            const center = box.top + box.height / 2;
            if (clientY < center) {
              $target = $(this);
              return false;
            }
          });

          if ($target) {
            if ($target[0] !== $placeholder.next()[0]) {
              $target.before($placeholder);
            }
          } else {
            $container.append($placeholder);
          }
        });
      };

      const onMouseUp = function () {
        isDragging = false;
        if (rafId) cancelAnimationFrame(rafId);

        $(document).off("mousemove", onMouseMove);
        $(document).off("mouseup", onMouseUp);

        $clone.animate({
          top: $placeholder[0].getBoundingClientRect().top,
          left: $placeholder[0].getBoundingClientRect().left
        }, 200, function () {
          $clone.remove();
          $placeholder.replaceWith($item);
          $item.show();

          const scenarios = getScenarios();
          const newItems = $container.find(".scenario-card").toArray();
          const newScenarioList = newItems.map(node => {
            const id = $(node).attr("data-id");
            return scenarios.find(s => s.id === id);
          });

          let changed = false;
          if (newScenarioList.length !== scenarios.length) changed = true;
          else {
            for (let i = 0; i < newScenarioList.length; i++) {
              if (newScenarioList[i].id !== scenarios[i].id) {
                changed = true;
                break;
              }
            }
          }

          if (changed) {
            setScenarios(newScenarioList);
            if (typeof onScenariosReorder === 'function') {
              onScenariosReorder(newScenarioList);
            }
            renderScenarioViews();
          }
        });
      };

      $(document).on("mousemove", onMouseMove);
      $(document).on("mouseup", onMouseUp);
    });
  }

  function addScenario(name, callback) {
    if (!name) {
      showAlertScenario(I18n.t('scenario_name_required'));
      return false;
    }

    if (/\s/.test(name)) {
      showAlertScenario(I18n.t('alert_scenario_name_spaces'));
      return false;
    }

    const scenarios = getScenarios();
    if (scenarios.some(s => s.name === name)) {
      showAlertScenario(I18n.t('scenario_name_duplicate'));
      return false;
    }

    const newId = window.ConfigModule.generateScenarioId();
    const newScenario = {
      id: newId,
      name: name,
      proxies: [],
      defaultProxyId: null,
      lastProxyId: null,
      automation: {
        enabled: false,
        rules: [{ type: 'time', operator: 'if', weekdays: DEFAULT_WEEKDAYS.slice(), start: '09:00', end: '18:00' }]
      }
    };

    managementExpansionMode = 'auto';
    newManagementScenarioId = newId;

    if (StorageModule) {
      StorageModule.addScenario(newScenario);
    } else {
      scenarios.push(newScenario);
    }

    if (typeof onScenarioAdd === 'function') {
      onScenarioAdd(newId, name);
    }

    renderScenarioViews();
    if (callback) callback();
    return true;
  }

  function addScenarioDraft() {
    const scenarios = getScenarios();
    const newId = window.ConfigModule.generateScenarioId();
    const newScenario = {
      id: newId,
      name: '',
      proxies: [],
      defaultProxyId: null,
      lastProxyId: null,
      automation: {
        enabled: false,
        rules: [{ type: 'time', operator: 'if', weekdays: DEFAULT_WEEKDAYS.slice(), start: '09:00', end: '18:00' }]
      }
    };

    managementExpansionMode = 'auto';
    newManagementScenarioId = newId;
    draftScenarioIds.add(newId);

    if (StorageModule) {
      StorageModule.addScenario(newScenario);
    } else {
      scenarios.push(newScenario);
    }

    renderScenarioManagementList();
    setTimeout(function () {
      const $newCard = $('#scenario-manage-list .scenario-card').filter(function () {
        return String($(this).data('id')) === String(newId);
      });
      if ($newCard.length) {
        $('html, body').animate({ scrollTop: $newCard.offset().top - 100 }, 500);
        $newCard.find('.scenario-card-name-input').trigger('focus');
      }
    }, 50);
    return newId;
  }

  function saveScenarioSettings(id, settings) {
    const newName = settings.name;
    if (!newName) {
      showAlertScenario(I18n.t('scenario_name_required'));
      return false;
    }

    if (/\s/.test(newName)) {
      showAlertScenario(I18n.t('alert_scenario_name_spaces'));
      return false;
    }

    const scenarios = getScenarios();
    if (scenarios.some(s => s.name === newName && s.id !== id)) {
      showAlertScenario(I18n.t('scenario_name_duplicate'));
      return false;
    }

    const scenario = scenarios.find(item => item.id === id);
    if (!scenario) return false;

    const currentAutomation = getScenarioAutomation(scenario);
    const automation = settings.automation || {
      enabled: currentAutomation.enabled,
      rules: currentAutomation.rules
    };
    const timeRules = automation.rules?.filter(rule => rule?.type === 'time') || [];
    const defaultProxyId = settings.defaultProxyId !== undefined
      ? settings.defaultProxyId
      : (scenario.defaultProxyId || null);

    const selectableProxies = getSelectableScenarioProxies(scenario);
    if (automation.enabled && (!selectableProxies.length || (defaultProxyId && !selectableProxies.some(proxy => proxy.id === defaultProxyId)))) {
      showAlertScenario(I18n.t('scenario_automation_proxy_required'));
      return false;
    }

    if (automation.enabled && (!timeRules.length || timeRules.some(rule => !Array.isArray(rule.weekdays) || !rule.weekdays.length))) {
      showAlertScenario(I18n.t('scenario_weekdays_required'));
      return false;
    }

    if (timeRules.some(rule => !TIME_24_HOUR_PATTERN.test(rule.start) || !TIME_24_HOUR_PATTERN.test(rule.end))) {
      showAlertScenario(I18n.t('scenario_time_format_error'));
      return false;
    }

    if (automation.enabled && timeRules.some(rule => rule.start === rule.end)) {
      showAlertScenario(I18n.t('scenario_time_same_error'));
      return false;
    }

    if (StorageModule) {
      StorageModule.updateScenario(id, {
        name: newName,
        defaultProxyId: defaultProxyId || null,
        automation
      });
    }

    const isDraftScenario = draftScenarioIds.has(id);
    if (isDraftScenario) {
      if (typeof onScenarioAdd === 'function') {
        onScenarioAdd(id, newName);
      }
      draftScenarioIds.delete(id);
    } else if (typeof onScenarioRename === 'function') {
      onScenarioRename(id, newName);
    }

    renderScenarioViews();
    return true;
  }

  function renameScenario(id, newName) {
    return saveScenarioSettings(id, { name: newName });
  }

  function doDeleteScenario(id) {
    const scenarios = getScenarios();
    const scenarioIndex = scenarios.findIndex(s => s.id === id);
    if (scenarioIndex === -1) return;

    const currentId = getCurrentScenarioId();
    draftScenarioIds.delete(id);

    if (id === currentId) {
      let nextScenario = scenarios.find(s => s.id !== id);
      if (!nextScenario) {
        if (scenarios.length === 1) {
          // Create default scenario
          const defaultScenarioId = window.ConfigModule.generateScenarioId();
          const defaultScenario = {
            id: defaultScenarioId,
            name: I18n.t('scenario_default'),
            proxies: [],
            defaultProxyId: null,
            lastProxyId: null,
            automation: {
              enabled: false,
              rules: [{ type: 'time', operator: 'if', weekdays: DEFAULT_WEEKDAYS.slice(), start: '09:00', end: '18:00' }]
            }
          };
          setScenarios([defaultScenario]);
          setCurrentScenarioId(defaultScenarioId);
          if (typeof onScenarioDelete === 'function') {
            onScenarioDelete(id, true);
          }
          renderScenarioViews();
          return;
        } else {
          switchScenario(nextScenario.id);
        }
      } else {
        switchScenario(nextScenario.id);
      }
    }

    if (StorageModule) {
      StorageModule.deleteScenario(id);
    }

    if (typeof onScenarioDelete === 'function') {
      onScenarioDelete(id, false);
    }

    renderScenarioViews();
  }

  function showAlertScenario(message) {
    $("#alert-scenario-message").text(message);
    $(".alert-scenario-tip").show().addClass("show");
  }

  function checkNameGlobalUniqueness(name, excludeProxyIndex, excludeScenarioId) {
    const scenarios = getScenarios();

    for (const scenario of scenarios) {
      if (!scenario.proxies) continue;

      for (let i = 0; i < scenario.proxies.length; i++) {
        const p = scenario.proxies[i];
        if (scenario.id === excludeScenarioId && i === excludeProxyIndex) continue;

        if (p.name === name) {
          return {
            isDuplicate: true,
            scenarioName: scenario.name
          };
        }
      }
    }
    return { isDuplicate: false };
  }

  function bindEvents() {
    $('#scenario-expand-collapse-btn').on('click', function () {
      const shouldCollapse = managementExpansionMode === 'expanded';
      managementExpansionMode = shouldCollapse ? 'collapsed' : 'expanded';
      $('#scenario-manage-list .scenario-card').toggleClass('collapsed', shouldCollapse);
      updateManagementCardToggleState();
      syncManagementExpandCollapseButton();
    });

    $("#open-add-scenario-btn").on("click", function () {
      addScenarioDraft();
    });

    $(".edit-scenario-close-btn, .edit-scenario-cancel-btn, .edit-scenario-tip").on("click", function (e) {
      if (this === e.target || $(this).hasClass('edit-scenario-close-btn') || $(this).hasClass('edit-scenario-cancel-btn')) {
        $(".edit-scenario-tip").removeClass("show");
        setTimeout(function () { $(".edit-scenario-tip").hide(); }, 300);
        editingScenarioId = null;
      }
    });

    $("#confirm-edit-scenario-btn").on("click", function () {
      const newName = $("#edit-scenario-name").val().trim();
      if (editingScenarioId) {
        if (renameScenario(editingScenarioId, newName)) {
          UtilsModule.showProcessingTip(I18n.t('processing'));
          $(".edit-scenario-tip").removeClass("show");
          setTimeout(function () { $(".edit-scenario-tip").hide(); }, 300);
          editingScenarioId = null;
        }
      }
    });

    $("#edit-scenario-name").on("keydown", function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $("#confirm-edit-scenario-btn").trigger("click");
      }
    });

    $(".delete-scenario-close-btn, .delete-scenario-cancel-btn, .delete-scenario-tip").on("click", function (e) {
      if (this === e.target || $(this).hasClass('delete-scenario-close-btn') || $(this).hasClass('delete-scenario-cancel-btn')) {
        $(".delete-scenario-tip").removeClass("show");
        setTimeout(function () { $(".delete-scenario-tip").hide(); }, 300);
        deletingScenarioId = null;
      }
    });

    $("#confirm-delete-scenario-btn").on("click", function () {
      if (deletingScenarioId) {
        UtilsModule.showProcessingTip(I18n.t('processing'));
        doDeleteScenario(deletingScenarioId);
        $(".delete-scenario-tip").removeClass("show");
        setTimeout(function () { $(".delete-scenario-tip").hide(); }, 300);
        deletingScenarioId = null;
      }
    });

    $(".alert-scenario-close-btn, .alert-scenario-tip, #alert-scenario-ok-btn").on("click", function (e) {
      if (this === e.target || $(this).hasClass('alert-scenario-close-btn') || $(this).is("#alert-scenario-ok-btn")) {
        $(".alert-scenario-tip").removeClass("show");
        setTimeout(function () { $(".alert-scenario-tip").hide(); }, 300);
      }
    });

    $("#scenario-manage-list").on("click", ".delete-scenario-btn", function () {
      const id = $(this).data("id");
      const scenarios = getScenarios();
      const scenario = scenarios.find(s => s.id === id);
      if (scenario && scenario.proxies && scenario.proxies.length > 0) {
        showAlertScenario(I18n.t('scenario_delete_not_empty'));
        return;
      }
      deletingScenarioId = id;
      $("#delete-scenario-message").text(I18n.t('scenario_delete_confirm'));
      $("#delete-scenario-name").text(scenario.name);
      $(".delete-scenario-tip").show().addClass("show");
    });

    $('#scenario-manage-list').on('click', '.scenario-card-header', function (event) {
      if ($(event.target).closest('button, input, label, .drag-handle').length) return;
      toggleManagementCard($(this).closest('.scenario-card'));
    });

    $('#scenario-manage-list').on('click', '.scenario-card-collapse', function () {
      toggleManagementCard($(this).closest('.scenario-card'));
    });

    $('#scenario-manage-list').on('input', '.scenario-card-name-input', function () {
      const name = $(this).val().trim() || I18n.t('scenario_default');
      $(this).closest('.scenario-card').find('.scenario-card-title').text(name).attr('title', name);
    });

    $('#scenario-manage-list').on('change', '.scenario-automation-enabled', function () {
      const $card = $(this).closest('.scenario-card');
      $card.find('.scenario-automation-panel').toggleClass('hidden', $(this).val() !== 'on');
    });

    $('#scenario-manage-list').on('click', '.scenario-condition-add', function () {
      const $row = $(this).closest('.scenario-condition-row');
      const $list = $row.closest('.scenario-condition-list');
      const index = $row.index() + 1;
      const operatorMode = $list.children('.scenario-condition-row').eq(1)
        .find('.scenario-condition-operator-select').val() === 'and' ? 'and' : 'or';
      const $newRow = $(renderAutomationRule({ operator: operatorMode, weekdays: DEFAULT_WEEKDAYS, start: '09:00', end: '18:00' }, index));
      $row.after($newRow);
      $list.children('.scenario-condition-row').each(function (rowIndex) {
        $(this).attr('data-index', rowIndex);
      });
      if (typeof window.enhanceNativeSelects === 'function') {
        window.enhanceNativeSelects($newRow[0]);
      }
      syncScenarioRuleOperators($list);
    });

    $('#scenario-manage-list').on('click', '.scenario-weekday-trigger', function (event) {
      event.stopPropagation();
      const $select = $(this).closest('.scenario-weekday-select');
      const shouldOpen = !$select.hasClass('open');
      $('.scenario-weekday-select.open').not($select).removeClass('open drop-up')
        .find('.scenario-weekday-trigger').attr('aria-expanded', 'false');
      $select.toggleClass('open', shouldOpen).removeClass('drop-up');
      $(this).attr('aria-expanded', String(shouldOpen));
      if (!shouldOpen) return;

      const triggerRect = this.getBoundingClientRect();
      const menuHeight = $select.find('.scenario-weekday-menu').outerHeight();
      const availableBelow = window.innerHeight - triggerRect.bottom;
      if (availableBelow < menuHeight + 8 && triggerRect.top > availableBelow) {
        $select.addClass('drop-up');
      }
    });

    $('#scenario-manage-list').on('click', '.scenario-weekday-menu', function (event) {
      event.stopPropagation();
    });

    $('#scenario-manage-list').on('change', '.scenario-weekday-option input', function () {
      const $select = $(this).closest('.scenario-weekday-select');
      const selectedNames = $select.find('.scenario-weekday-option input:checked').map(function () {
        return getWeekdayLabel(Number(this.value));
      }).get();
      const summary = selectedNames.length ? selectedNames.join('、') : I18n.t('scenario_weekday_select_empty');
      $select.find('.scenario-weekday-value').text(summary).attr('title', summary);
    });

    $('#scenario-manage-list').on('input blur', '.scenario-time-input', function (event) {
      const value = $(this).val().trim();
      if (event.type === 'input' && (value === '' || TIME_24_HOUR_PATTERN.test(value))) {
        $(this).removeClass('input-error');
        return;
      }
      if (event.type === 'blur' || event.type === 'focusout') {
        $(this).toggleClass('input-error', !TIME_24_HOUR_PATTERN.test(value));
      }
    });

    $('#scenario-manage-list').on('keydown', '.scenario-weekday-select', function (event) {
      if (event.key !== 'Escape') return;
      $(this).removeClass('open drop-up').find('.scenario-weekday-trigger').attr('aria-expanded', 'false').trigger('focus');
    });

    $(document).off('click.scenarioWeekdaySelect').on('click.scenarioWeekdaySelect', function () {
      $('.scenario-weekday-select.open').removeClass('open drop-up')
        .find('.scenario-weekday-trigger').attr('aria-expanded', 'false');
    });

    $('#scenario-manage-list').on('click', '.scenario-condition-remove', function () {
      const $row = $(this).closest('.scenario-condition-row');
      const $list = $(this).closest('.scenario-condition-list');
      if ($row.index() === 0 || $list.children('.scenario-condition-row').length === 1) return;
      $row.remove();
      $list.children('.scenario-condition-row').each(function (index) {
        $(this).attr('data-index', index);
      });
      syncScenarioRuleOperators($list);
    });

    $('#scenario-manage-list').on('change', '.scenario-condition-row:nth-child(2) .scenario-condition-operator-select', function () {
      syncScenarioRuleOperators($(this).closest('.scenario-condition-list'));
    });

    $('#scenario-manage-list').on('click', '.scenario-card-save', function () {
      const $card = $(this).closest('.scenario-card');
      const id = $(this).data('id');
      const name = $card.find('.scenario-card-name-input').val().trim();
      const enabled = $card.find('.scenario-automation-enabled').val() === 'on';
      const operatorMode = $card.find('.scenario-condition-row').eq(1)
        .find('.scenario-condition-operator-select').val() === 'and' ? 'and' : 'or';
      $card.find('.scenario-time-input').each(function () {
        $(this).toggleClass('input-error', !TIME_24_HOUR_PATTERN.test($(this).val().trim()));
      });
      const rules = $card.find('.scenario-condition-row').map(function (index) {
        const $row = $(this);
        return {
          type: 'time',
          operator: index === 0 ? 'if' : operatorMode,
          weekdays: $row.find('.scenario-weekday-option input:checked').map(function () {
            return Number(this.value);
          }).get(),
          start: $row.find('.scenario-automation-start').val().trim(),
          end: $row.find('.scenario-automation-end').val().trim()
        };
      }).get();
      const automation = {
        enabled,
        rules
      };

      if (saveScenarioSettings(id, {
        name,
        defaultProxyId: $card.find('.scenario-default-proxy-select').val() || null,
        automation
      })) {
        UtilsModule.showTip(I18n.t('save_success'), false);
      }
    });

    $("#scenario-manage-list").on("click", ".edit-scenario-btn", function () {
      const id = $(this).data("id");
      const oldName = $(this).data("name");
      editingScenarioId = id;
      $("#edit-scenario-oldname").text(oldName);
      $("#edit-scenario-name").val(oldName);
      $("#edit-scenario-name").removeClass('input-error');
      $(".edit-scenario-tip").show().addClass("show");
      setTimeout(() => $("#edit-scenario-name").focus(), 100);
    });

  }

  return {
    init: init,
    getScenarios: getScenarios,
    getCurrentScenarioId: getCurrentScenarioId,
    setScenarios: setScenarios,
    setCurrentScenarioId: setCurrentScenarioId,
    getCurrentScenario: getCurrentScenario,
    renderScenarioSelector: renderScenarioSelector,
    renderScenarioViews: renderScenarioViews,
    switchScenario: switchScenario,
    renderScenarioManagementList: renderScenarioManagementList,
    addScenario: addScenario,
    renameScenario: renameScenario,
    saveScenarioSettings: saveScenarioSettings,
    doDeleteScenario: doDeleteScenario,
    showAlertScenario: showAlertScenario,
    checkNameGlobalUniqueness: checkNameGlobalUniqueness
  };
})();
