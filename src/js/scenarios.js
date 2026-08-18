// ==========================================
// Scenarios Module
// Scenario management, switching, and proxy grouping
// ==========================================

const ScenariosModule = (function () {
  let editingScenarioId = null;
  let deletingScenarioId = null;
  let move_proxy_index = -1;

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

  function renderScenarioManagementList() {
    const scenarios = getScenarios();
    const currentScenarioId = getCurrentScenarioId();
    const currentScenario = scenarios.find(scenario => scenario.id === currentScenarioId);
    const totalProxyCount = scenarios.reduce((total, scenario) => total + (scenario.proxies || []).length, 0);

    let html = "";
    scenarios.forEach(function (scenario, index) {
      const isCurrent = scenario.id === currentScenarioId;
      const proxyCount = (scenario.proxies || []).length;
      const escapedId = UtilsModule.escapeHtml(scenario.id);
      const escapedName = UtilsModule.escapeHtml(scenario.name);

      html += `
         <div class="scenario-item${isCurrent ? ' is-current' : ''}" data-id="${escapedId}">
           <button type="button" class="drag-handle" title="${I18n.t('drag_sort')}" aria-label="${I18n.t('drag_sort')}">
             <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle></svg>
           </button>
           <button type="button" class="scenario-item-main" data-id="${escapedId}"${isCurrent ? ' aria-current="true"' : ''} title="${I18n.t('switch_scenario_tooltip')}">
             <span class="scenario-item-icon" aria-hidden="true">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 7l8 4 8-4-8-4Z"></path><path d="m4 12 8 4 8-4"></path><path d="m4 17 8 4 8-4"></path></svg>
             </span>
             <span class="scenario-item-copy">
               <span class="scenario-name">${escapedName}</span>
               <span class="scenario-item-meta">
                 <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="6" rx="2"></rect><rect x="4" y="14" width="16" height="6" rx="2"></rect><path d="M8 7h.01M8 17h.01"></path></svg>
                 <span class="scenario-proxy-count">${proxyCount}</span>
                 <span>${I18n.t('scenario_proxy_unit')}</span>
               </span>
             </span>
           </button>
           ${isCurrent ? `<span class="scenario-current-indicator"><span class="scenario-current-dot"></span>${I18n.t('status_current')}</span>` : ''}
           <div class="scenario-actions">
             <button type="button" class="edit-scenario-btn" data-id="${escapedId}" data-name="${escapedName}" title="${I18n.t('scenario_edit')}">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
             </button>
             <button type="button" class="delete-scenario-btn" data-id="${escapedId}" title="${I18n.t('delete')}">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
             </button>
           </div>
         </div>
       `;
    });
    $("#scenario-manage-list").html(html);
    $("#scenario-management-current").text(currentScenario ? currentScenario.name : I18n.t('scenario_default'));
    $("#scenario-total-count, #scenario-list-count").text(scenarios.length);
    $("#scenario-proxy-total-count").text(totalProxyCount);

    initScenarioSortable();
  }

  function initScenarioSortable() {
    const $container = $("#scenario-manage-list");

    $container.off("mousedown", ".drag-handle");

    $container.on("mousedown", ".drag-handle", function (e) {
      if (e.button !== 0) return;

      e.preventDefault();
      const $handle = $(this);
      const $item = $handle.closest(".scenario-item");
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
        display: "grid"
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

          const $siblings = $container.find(".scenario-item:not(:hidden)");
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
          const newItems = $container.find(".scenario-item").toArray();
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

  function moveProxy(proxyIndex, targetScenarioId) {
    if (proxyIndex === -1) return;

    const currentId = getCurrentScenarioId();
    if (targetScenarioId === currentId) return;

    const scenarios = getScenarios();
    const targetScenario = scenarios.find(s => s.id === targetScenarioId);
    if (!targetScenario) return;

    const currentScenario = scenarios.find(s => s.id === currentId);
    if (!currentScenario || !currentScenario.proxies || !currentScenario.proxies[proxyIndex]) return;

    const proxy = currentScenario.proxies[proxyIndex];

    if (StorageModule) {
      const success = StorageModule.moveProxy(proxyIndex, currentId, targetScenarioId);
      if (success) {
        StorageModule.save().then(() => {
          if (typeof onProxyMove === 'function') {
            onProxyMove(proxyIndex, targetScenarioId, proxy);
          }
          UtilsModule.showTip(I18n.t('move_success'), false);
          chrome.runtime.sendMessage({ action: "refreshProxy" });
        }).catch(err => {
          console.info("Move proxy failed:", err);
          UtilsModule.showTip(I18n.t('move_failed') + ': ' + err.message, true);
        });
      }
    }
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

  function showMoveProxyDialog(proxyIndex, currentScenarioName) {
    move_proxy_index = proxyIndex;
    $("#current-scenario-display").text(currentScenarioName || I18n.t('scenario_default'));

    const scenarios = getScenarios();
    const currentId = getCurrentScenarioId();

    let html = "";
    let hasOptions = false;
    scenarios.forEach(function (scenario) {
      if (scenario.id !== currentId) {
        html += `<li data-value="${scenario.id}">${UtilsModule.escapeHtml(scenario.name)}</li>`;
        hasOptions = true;
      }
    });

    if (!hasOptions) {
      html = `<li class="disabled" style="color: var(--text-secondary); cursor: not-allowed; font-style: italic; padding: 8px 12px;">无其他场景可用</li>`;
    }

    $("#target-scenario-options").html(html);
    $("#target-scenario-display").text("请选择").removeData("value");
    $(".move-proxy-tip").show().addClass("show");
  }

  function bindEvents() {
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

    $("#scenario-manage-list").on("click", ".scenario-item-main", function () {
      switchScenario($(this).data("id"));
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

    $(".move-proxy-close-btn, .move-proxy-cancel-btn, .move-proxy-tip").on("click", function (e) {
      if (this === e.target || $(this).hasClass('move-proxy-close-btn') || $(this).hasClass('move-proxy-cancel-btn')) {
        $(".move-proxy-tip").removeClass("show");
        setTimeout(function () { $(".move-proxy-tip").hide(); }, 300);
      }
    });

    $("#confirm-move-proxy-btn").on("click", function () {
      const targetScenarioId = $("#target-scenario-display").data("value");
      if (targetScenarioId && move_proxy_index !== -1) {
        UtilsModule.showProcessingTip(I18n.t('processing'));
        moveProxy(move_proxy_index, targetScenarioId);
        $(".move-proxy-tip").removeClass("show");
        setTimeout(function () { $(".move-proxy-tip").hide(); }, 300);
      }
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
    moveProxy: moveProxy,
    checkNameGlobalUniqueness: checkNameGlobalUniqueness,
    showMoveProxyDialog: showMoveProxyDialog
  };
})();
