// ==========================================
// Scenarios Module
// Scenario management, switching, and proxy grouping
// ==========================================

const ScenariosModule = (function () {
  let editingScenarioId = null;
  let deletingScenarioId = null;
  let managementExpansionMode = 'auto';
  let newManagementScenarioId = null;

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
    if (scenario) {
      setCurrentScenarioId(id);

      try {
        if (StorageModule) {
          await StorageModule.save();
        }
      } catch (err) {
        setCurrentScenarioId(currentId);
        console.info('Switch scenario failed:', err);
        if (typeof UtilsModule !== 'undefined' && UtilsModule.showTip) {
          UtilsModule.showTip(I18n.t('save_failed'), true);
        }
        renderScenarioViews();
        return false;
      }

      if (typeof onScenarioSwitch === 'function') {
        onScenarioSwitch(id, scenario.proxies || []);
      } else if (typeof ProxyModule !== 'undefined' && ProxyModule.setList) {
        ProxyModule.setList(scenario.proxies || []);
        if (typeof ProxyModule.renderList === 'function') {
          ProxyModule.renderList();
        }
      }

      renderScenarioViews();
      return true;
    }

    return false;
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
            ${isCurrent ? `<span class="scenario-current-indicator"><span class="scenario-current-dot"></span>${I18n.t('status_current')}</span>` : ''}
            <button type="button" class="scenario-card-collapse" title="${I18n.t(isExpanded ? 'collapse_all' : 'expand_all')}" aria-expanded="${isExpanded}">${MainIcons.render('chevronDown', { width: 16, height: 16 })}</button>
          </div>
        </div>
        <div class="proxy-body">
          <div class="proxy-body-container">
            <div class="proxy-content-left scenario-card-content">
              <div class="form-grid scenario-card-form">
                <div class="form-item" style="grid-column: span 12;">
                  <label>${I18n.t('scenario_name')}</label>
                  <input type="text" class="scenario-card-name-input" data-id="${escapedId}" value="${escapedName}" placeholder="${I18n.t('scenario_name_placeholder')}">
                </div>
              </div>
            </div>
            <div class="proxy-content-right scenario-card-actions">
              ${isCurrent ? '' : `<button type="button" class="right-panel-btn btn-test scenario-switch-btn" data-id="${escapedId}">${I18n.t('switch_scenario_tooltip')}</button>`}
              <button type="button" class="right-panel-btn btn-save scenario-card-save" data-id="${escapedId}">${I18n.t('save')}</button>
              <button type="button" class="right-panel-btn btn-delete delete-scenario-btn" data-id="${escapedId}" title="${I18n.t('delete')}">${I18n.t('delete')}</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    $list.html(html);
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
      proxies: []
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

  function renameScenario(id, newName) {
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

    if (StorageModule) {
      StorageModule.updateScenario(id, { name: newName });
    }

    if (typeof onScenarioRename === 'function') {
      onScenarioRename(id, newName);
    }

    renderScenarioViews();
    return true;
  }

  function doDeleteScenario(id) {
    const scenarios = getScenarios();
    const scenarioIndex = scenarios.findIndex(s => s.id === id);
    if (scenarioIndex === -1) return;

    const currentId = getCurrentScenarioId();

    if (id === currentId) {
      let nextScenario = scenarios.find(s => s.id !== id);
      if (!nextScenario) {
        if (scenarios.length === 1) {
          // Create default scenario
          const defaultScenarioId = window.ConfigModule.generateScenarioId();
          const defaultScenario = { id: defaultScenarioId, name: I18n.t('scenario_default'), proxies: [] };
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
      $("#new-scenario-name").val("").removeClass('input-error');
      $(".add-scenario-tip").show().addClass("show");
      setTimeout(() => $("#new-scenario-name").focus(), 100);
    });

    $(".add-scenario-close-btn, .add-scenario-cancel-btn, .add-scenario-tip").on("click", function (e) {
      if (this === e.target || $(this).hasClass('add-scenario-close-btn') || $(this).hasClass('add-scenario-cancel-btn')) {
        $(".add-scenario-tip").removeClass("show");
        setTimeout(function () { $(".add-scenario-tip").hide(); }, 200);
        $("#open-add-scenario-btn").trigger("focus");
      }
    });

    $("#add-scenario-btn").on("click", function () {
      const name = $("#new-scenario-name").val().trim();
      addScenario(name, function () {
        $("#new-scenario-name").val("");
        $(".add-scenario-tip").removeClass("show");
        setTimeout(function () { $(".add-scenario-tip").hide(); }, 200);
        $("#open-add-scenario-btn").trigger("focus");
      });
    });

    $("#new-scenario-name").on("keydown", function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $("#add-scenario-btn").trigger("click");
      }
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

    $("#scenario-manage-list").on("click", ".scenario-switch-btn", function () {
      switchScenario($(this).data("id"));
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

    $('#scenario-manage-list').on('click', '.scenario-card-save', function () {
      const $card = $(this).closest('.scenario-card');
      const id = $(this).data('id');
      const name = $card.find('.scenario-card-name-input').val().trim();
      if (renameScenario(id, name)) {
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
    doDeleteScenario: doDeleteScenario,
    showAlertScenario: showAlertScenario,
    checkNameGlobalUniqueness: checkNameGlobalUniqueness
  };
})();
