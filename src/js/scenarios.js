// ==========================================
// Scenarios Module
// Scenario management, switching, and proxy grouping
// ==========================================

const ScenariosModule = (function() {
  let scenarios = [];
  let currentScenarioId = 'default';
  let editingScenarioId = null;
  let deletingScenarioId = null;
  let move_proxy_index = -1;

  function init() {
    bindEvents();
  }

  function getScenarios() {
    return scenarios;
  }

  function getCurrentScenarioId() {
    return currentScenarioId;
  }

  function setScenarios(newScenarios) {
    scenarios = newScenarios;
  }

  function setCurrentScenarioId(id) {
    currentScenarioId = id;
  }

  function getCurrentScenario() {
    return scenarios.find(s => s.id === currentScenarioId);
  }

  function updateCurrentListFromScenario() {
    const scenario = scenarios.find(s => s.id === currentScenarioId);
    return scenario ? scenario.proxies : [];
  }

  function saveCurrentListToScenario(list) {
    const scenario = scenarios.find(s => s.id === currentScenarioId);
    if (scenario) {
      scenario.proxies = list;
    }
  }

  function renderScenarioSelector() {
    let html = "";
    let currentScenarioName = "";

    scenarios.forEach(function(scenario) {
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

  function switchScenario(id) {
    if (currentScenarioId === id) return;

    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      currentScenarioId = id;
      const list = scenario.proxies || [];

      chrome.storage.local.set({
        currentScenarioId: currentScenarioId,
        list: list
      });

      if (typeof onScenarioSwitch === 'function') {
        onScenarioSwitch(id, list);
      } else if (typeof ProxyModule !== 'undefined' && ProxyModule.setList) {
        ProxyModule.setList(list);
        if (typeof ProxyModule.renderList === 'function') {
          ProxyModule.renderList();
        }
      }

      renderScenarioSelector();
    }
  }

  function renderScenarioManagementList() {
    let html = "";
    scenarios.forEach(function(scenario, index) {
      const isCurrent = scenario.id === currentScenarioId;
      const proxyCount = (scenario.proxies || []).length;

      html += `
         <div class="scenario-item" data-id="${scenario.id}">
           <div class="scenario-item-left">
             <div class="drag-handle" title="${I18n.t('drag_sort')}">
               <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
             </div>
             <span class="scenario-name">${UtilsModule.escapeHtml(scenario.name)}</span>
             <span class="scenario-proxy-count">${proxyCount}</span>
             ${isCurrent ? '<span class="scenario-current-indicator">(' + I18n.t('status_current') + ')</span>' : ''}
           </div>
           <div class="scenario-actions">
             <button class="edit-scenario-btn" data-id="${scenario.id}" data-name="${UtilsModule.escapeHtml(scenario.name)}" title="${I18n.t('scenario_edit')}">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
             </button>
             <button class="delete-scenario-btn" data-id="${scenario.id}" title="${I18n.t('delete')}">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
             </button>
           </div>
         </div>
       `;
    });
    $("#scenario-manage-list").html(html);

    initScenarioSortable();
  }

  function initScenarioSortable() {
    const $container = $("#scenario-manage-list");

    $container.off("mousedown", ".drag-handle");

    $container.on("mousedown", ".drag-handle", function(e) {
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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px",
        border: "1px solid var(--border-color)",
        borderRadius: "6px"
      });

      $("body").append($clone);
      $item.before($placeholder).hide();

      let isDragging = true;
      let rafId = null;

      const onMouseMove = function(e) {
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

          $siblings.each(function() {
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

      const onMouseUp = function() {
        isDragging = false;
        if (rafId) cancelAnimationFrame(rafId);

        $(document).off("mousemove", onMouseMove);
        $(document).off("mouseup", onMouseUp);

        $clone.animate({
          top: $placeholder[0].getBoundingClientRect().top,
          left: $placeholder[0].getBoundingClientRect().left
        }, 200, function() {
          $clone.remove();
          $placeholder.replaceWith($item);
          $item.show();

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
            scenarios = newScenarioList;
            if (typeof onScenariosReorder === 'function') {
              onScenariosReorder(scenarios);
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

    if (scenarios.some(s => s.name === name)) {
      showAlertScenario(I18n.t('scenario_name_duplicate'));
      return false;
    }

    const newId = 'scenario_' + Date.now();
    scenarios.push({
      id: newId,
      name: name,
      proxies: []
    });

    if (typeof onScenarioAdd === 'function') {
      onScenarioAdd(newId, name);
    }

    renderScenarioManagementList();
    renderScenarioSelector();
    if (callback) callback();
    return true;
  }

  function renameScenario(id, newName) {
    if (!newName) {
      showAlertScenario(I18n.t('scenario_name_required'));
      return;
    }

    if (/\s/.test(newName)) {
      showAlertScenario(I18n.t('alert_scenario_name_spaces'));
      return;
    }

    if (scenarios.some(s => s.name === newName && s.id !== id)) {
      showAlertScenario(I18n.t('scenario_name_duplicate'));
      return;
    }

    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      scenario.name = newName;
      if (typeof onScenarioRename === 'function') {
        onScenarioRename(id, newName);
      }
      renderScenarioManagementList();
      renderScenarioSelector();
    }
  }

  function doDeleteScenario(id) {
    const scenarioIndex = scenarios.findIndex(s => s.id === id);
    if (scenarioIndex === -1) return;

    if (id === currentScenarioId) {
      let nextScenario = scenarios.find(s => s.id !== id);
      if (!nextScenario) {
        if (scenarios.length === 1) {
          scenarios = [{ id: 'default', name: I18n.t('scenario_default'), proxies: [] }];
          currentScenarioId = 'default';
          if (typeof onScenarioDelete === 'function') {
            onScenarioDelete(id, true);
          }
          renderScenarioManagementList();
          renderScenarioSelector();
          return;
        } else {
          switchScenario(nextScenario.id);
        }
      } else {
        switchScenario(nextScenario.id);
      }
    }

    scenarios.splice(scenarioIndex, 1);
    if (typeof onScenarioDelete === 'function') {
      onScenarioDelete(id, false);
    }
    renderScenarioManagementList();
    renderScenarioSelector();
  }

  function showAlertScenario(message) {
    $("#alert-scenario-message").text(message);
    $(".alert-scenario-tip").show().addClass("show");
  }

  function moveProxy(proxyIndex, targetScenarioId) {
    if (proxyIndex === -1) return;
    if (targetScenarioId === currentScenarioId) return;

    const targetScenario = scenarios.find(s => s.id === targetScenarioId);
    if (!targetScenario) return;

    const currentList = updateCurrentListFromScenario();
    if (!currentList[proxyIndex]) return;

    const proxy = currentList[proxyIndex];

    currentList.splice(proxyIndex, 1);

    if (!targetScenario.proxies) targetScenario.proxies = [];
    targetScenario.proxies.push(proxy);

    if (typeof onProxyMove === 'function') {
      onProxyMove(proxyIndex, targetScenarioId, proxy);
    }

    chrome.storage.local.set({
      scenarios: scenarios,
      currentScenarioId: currentScenarioId,
      list: currentList
    }, function() {
      if (chrome.runtime.lastError) {
        console.log("Move proxy failed:", chrome.runtime.lastError);
        UtilsModule.showTip(I18n.t('move_failed') + ': ' + chrome.runtime.lastError.message, true);
        return;
      }

      UtilsModule.showTip(I18n.t('move_success'), false);
      chrome.runtime.sendMessage({ action: "refreshProxy" });
    });
  }

  function checkNameGlobalUniqueness(name, excludeProxyIndex, excludeScenarioId) {
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

    let html = "";
    let hasOptions = false;
    scenarios.forEach(function(scenario) {
      if (scenario.id !== currentScenarioId) {
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
    $("#add-scenario-btn").on("click", function() {
      const name = $("#new-scenario-name").val().trim();
      if (addScenario(name)) {
        $("#new-scenario-name").val("");
      }
    });

    $(".edit-scenario-close-btn, .edit-scenario-cancel-btn, .edit-scenario-tip").on("click", function(e) {
      if (this === e.target || $(this).hasClass('edit-scenario-close-btn') || $(this).hasClass('edit-scenario-cancel-btn')) {
        $(".edit-scenario-tip").removeClass("show");
        setTimeout(function() { $(".edit-scenario-tip").hide(); }, 300);
        editingScenarioId = null;
      }
    });

    $("#confirm-edit-scenario-btn").on("click", function() {
      const newName = $("#edit-scenario-name").val().trim();
      if (editingScenarioId) {
        UtilsModule.showProcessingTip(I18n.t('processing'));
        renameScenario(editingScenarioId, newName);
        $(".edit-scenario-tip").removeClass("show");
        setTimeout(function() { $(".edit-scenario-tip").hide(); }, 300);
        editingScenarioId = null;
      }
    });

    $(".delete-scenario-close-btn, .delete-scenario-cancel-btn, .delete-scenario-tip").on("click", function(e) {
      if (this === e.target || $(this).hasClass('delete-scenario-close-btn') || $(this).hasClass('delete-scenario-cancel-btn')) {
        $(".delete-scenario-tip").removeClass("show");
        setTimeout(function() { $(".delete-scenario-tip").hide(); }, 300);
        deletingScenarioId = null;
      }
    });

    $("#confirm-delete-scenario-btn").on("click", function() {
      if (deletingScenarioId) {
        UtilsModule.showProcessingTip(I18n.t('processing'));
        doDeleteScenario(deletingScenarioId);
        $(".delete-scenario-tip").removeClass("show");
        setTimeout(function() { $(".delete-scenario-tip").hide(); }, 300);
        deletingScenarioId = null;
      }
    });

    $(".alert-scenario-close-btn, .alert-scenario-tip, #alert-scenario-ok-btn").on("click", function(e) {
      if (this === e.target || $(this).hasClass('alert-scenario-close-btn') || $(this).is("#alert-scenario-ok-btn")) {
        $(".alert-scenario-tip").removeClass("show");
        setTimeout(function() { $(".alert-scenario-tip").hide(); }, 300);
      }
    });

    $("#scenario-manage-list").on("click", ".delete-scenario-btn", function() {
      const id = $(this).data("id");
      const scenario = scenarios.find(s => s.id === id);
      if (scenario && scenario.proxies && scenario.proxies.length > 0) {
        showAlertScenario(I18n.t('scenario_delete_not_empty'));
        return;
      }
      deletingScenarioId = id;
      $("#delete-scenario-message").html(`${I18n.t('scenario_delete_confirm')}<br><span style="color: #ef4444; font-weight: 600; margin-top: 10px; display: block; text-align: center; font-size: 16px;">${UtilsModule.escapeHtml(scenario.name)}</span>`);
      $(".delete-scenario-tip").show().addClass("show");
    });

    $("#scenario-manage-list").on("click", ".edit-scenario-btn", function() {
      const id = $(this).data("id");
      const oldName = $(this).data("name");
      editingScenarioId = id;
      $("#edit-scenario-oldname").text(UtilsModule.escapeHtml(oldName));
      $("#edit-scenario-name").val(oldName);
      $("#edit-scenario-name").removeClass('input-error');
      $(".edit-scenario-tip").show().addClass("show");
      setTimeout(() => $("#edit-scenario-name").focus(), 100);
    });

    $(".move-proxy-close-btn, .move-proxy-cancel-btn, .move-proxy-tip").on("click", function(e) {
      if (this === e.target || $(this).hasClass('move-proxy-close-btn') || $(this).hasClass('move-proxy-cancel-btn')) {
        $(".move-proxy-tip").removeClass("show");
        setTimeout(function() { $(".move-proxy-tip").hide(); }, 300);
      }
    });

    $("#confirm-move-proxy-btn").on("click", function() {
      const targetScenarioId = $("#target-scenario-display").data("value");
      if (targetScenarioId && move_proxy_index !== -1) {
        UtilsModule.showProcessingTip(I18n.t('processing'));
        moveProxy(move_proxy_index, targetScenarioId);
        $(".move-proxy-tip").removeClass("show");
        setTimeout(function() { $(".move-proxy-tip").hide(); }, 300);
      }
    });

    $("#scenario-manage-btn").on("click", function() {
      renderScenarioManagementList();
      $(".scenario-manage-tip").show().addClass("show");
    });
  }

  return {
    init: init,
    getScenarios: getScenarios,
    getCurrentScenarioId: getCurrentScenarioId,
    setScenarios: setScenarios,
    setCurrentScenarioId: setCurrentScenarioId,
    getCurrentScenario: getCurrentScenario,
    updateCurrentListFromScenario: updateCurrentListFromScenario,
    saveCurrentListToScenario: saveCurrentListToScenario,
    renderScenarioSelector: renderScenarioSelector,
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
