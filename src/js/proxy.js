// ==========================================
// Proxy Module
// Proxy list management, rendering, and interactions
// ==========================================

const ProxyModule = (function () {
  // Local cache reference to proxy list (direct reference to data in storage)
  let list = [];
  let del_index = -1;

  function init() {
    // Load data from storage
    list = StorageModule ? StorageModule.getProxies() : [];
    bindGlobalEvents();
  }

  function getList() {
    // Always get latest data from storage
    if (StorageModule) {
      list = StorageModule.getProxies();
    }
    return list;
  }

  function setList(newList) {
    list = newList;
  }

  function addProxy() {
    const newProxy = {
      id: ConfigModule.generateProxyId(),
      enabled: true,
      name: "",
      protocol: "http",
      ip: "",
      port: "",
      username: "",
      password: "",
      bypass_rules: "",
      include_rules: "",
      fallback_policy: "direct",
      is_new: true,
      show_password: false
    };

    if (StorageModule) {
      const index = StorageModule.addProxy(newProxy);
      list = StorageModule.getProxies();
      return index;
    } else {
      list.push(newProxy);
      return list.length - 1;
    }
  }


  function ensureProxyId(proxy) {
    if (!proxy || proxy.id) return proxy;
    proxy.id = ConfigModule.generateProxyId();
    return proxy;
  }

  function deleteProxy(index) {
    if (index !== undefined && index >= 0 && list[index]) {
      if (StorageModule) {
        StorageModule.deleteProxy(index);
        list = StorageModule.getProxies();
      } else {
        list.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  function getProxy(index) {
    return list[index];
  }

  function updateProxy(index, data) {
    if (list[index]) {
      Object.assign(list[index], data);
      // Sync to storage
      if (StorageModule) {
        StorageModule.updateProxy(index, data);
      }
    }
  }

  function saveData(options) {
    options = options || {};

    StorageModule.save().then(() => {
      if (!options.silent) {
        UtilsModule.showTip(options.successMsg || I18n.t('save_success'), false);
      }

      if ($(".sync-config-tip").hasClass("show") && SyncModule.getSyncConfig().type === 'native') {
        SyncModule.updateNativeQuotaInfo();
      }

      if (options.callback) options.callback(true);
    }).catch(err => {
      console.error("Save failed:", err);
      if (!options.silent) {
        UtilsModule.showTip(I18n.t('save_failed'), true);
      }
      if (options.callback) options.callback(false);
    });
  }

  function saveSingleProxy(i) {
    var info = list[i];
    if (!info) return;

    var isNameValid = info.name.trim() !== '';

    const conflict = ScenariosModule.checkNameGlobalUniqueness(info.name, i, ScenariosModule.getCurrentScenarioId());
    if (conflict.isDuplicate) {
      isNameValid = false;
    }

    var isIpValid = true, ipErrorMsg = '';
    var parts = info.ip.split('.');
    var isIpLike = parts.length === 4 && parts.every(p => /^\d+$/.test(p));

    if (isIpLike) {
      var ipValidation = ValidatorModule.validateIPAddress(info.ip);
      if (!ipValidation.isValid) { isIpValid = false; ipErrorMsg = ipValidation.error; }
    } else {
      if (!ValidatorModule.isValidHost(info.ip)) { isIpValid = false; ipErrorMsg = I18n.t('alert_ip_invalid'); }
    }

    var port = parseInt(info.port);
    var isPortValid = !isNaN(port) && port >= 1 && port <= 65535 && info.port.toString() === port.toString();

    var isIncludeUrlsValid = true, includeUrlsErrorMsg = '';
    var includeUrlsCheck = ValidatorModule.checkIncludeUrlsConflict(list, i, info.include_rules);
    if (includeUrlsCheck.hasConflict) { isIncludeUrlsValid = false; includeUrlsErrorMsg = includeUrlsCheck.error; }

    var $item = $(`.proxy-card[data-id="${i}"]`);

    if (isNameValid) $item.find('.name').removeClass('input-error'); else $item.find('.name').addClass('input-error');
    if (isIpValid) $item.find('.ip').removeClass('input-error'); else $item.find('.ip').addClass('input-error');
    if (isPortValid) $item.find('.port').removeClass('input-error'); else $item.find('.port').addClass('input-error');
    if (isIncludeUrlsValid) $item.find('.include_rules').removeClass('input-error'); else $item.find('.include_rules').addClass('input-error');

    if (!isNameValid || !isIpValid || !isPortValid || !isIncludeUrlsValid) {
      var failMsg = I18n.t('save_failed');
      if (!isNameValid) {
        if (conflict.isDuplicate) {
          UtilsModule.showTip(failMsg + I18n.t('global_name_conflict').replace('{name}', info.name).replace('{scenario}', conflict.scenarioName), true);
        } else {
          UtilsModule.showTip(failMsg + I18n.t('alert_name_required'), true);
        }
      }
      else if (!isIpValid) UtilsModule.showTip(failMsg + (ipErrorMsg || I18n.t('alert_ip_invalid')), true);
      else if (!isPortValid) UtilsModule.showTip(failMsg + I18n.t('alert_port_invalid'), true);
      else if (!isIncludeUrlsValid) UtilsModule.showTip(failMsg + includeUrlsErrorMsg, true);
      return;
    }

    saveData();
  }

  function renderList() {
    const expansionState = {};
    $(".proxy-card").each(function () {
      const $item = $(this);
      const name = $item.find('.name').val();
      if (!$item.hasClass("collapsed") && name) {
        expansionState[name] = true;
      }
    });

    // Get latest data from storage
    if (StorageModule) {
      list = StorageModule.getProxies();
    }

    let html = "";
    for (let i = 0; i < list.length; i++) {
      const info = list[i];

      if (info.enabled === undefined) {
        info.enabled = info.disabled !== true;
      }
      const is_enabled = info.enabled;

      const protocolClass = (info.protocol || "http").toLowerCase();
      const displayProtocol = (info.protocol || "http").toUpperCase();

      const isSocks5 = protocolClass === 'socks5';
      const disableAuth = !isFirefox && isSocks5;
      const disabledAttr = disableAuth ? 'disabled' : '';

      const fallbackPolicy = info.fallback_policy || "direct";
      const displayFallback = fallbackPolicy === "reject" ? I18n.t('fallback_reject') : I18n.t('fallback_direct');
      const rawPreviewText = `${info.name || I18n.t('unnamed_proxy')} · ${info.ip || "0.0.0.0"}:${info.port || "0"}`;
      const previewText = UtilsModule.escapeHtml(rawPreviewText);

      let isExpanded = false;
      if (info.is_new) {
        isExpanded = true;
      } else if (info.name && expansionState[info.name]) {
        isExpanded = true;
      }

      const collapsedClass = isExpanded ? "" : "collapsed";
      delete info.is_new;

      const bypassLines = info.bypass_rules ? info.bypass_rules.split(/\r\n|\r|\n/).filter(line => line.trim()).length : 0;
      const includeLines = info.include_rules ? info.include_rules.split(/\r\n|\r|\n/).filter(line => line.trim()).length : 0;

      let subscriptionBadgeBypass = `<span class="subscription-badge active" data-type="bypass" data-mode="local" title="${I18n.t('current_rules_count')}">${bypassLines}</span>`;
      let subscriptionBadgeInclude = `<span class="subscription-badge active" data-type="include" data-mode="local" title="${I18n.t('current_rules_count')}">${includeLines}</span>`;

      if (info.subscription && info.subscription.enabled !== false) {
        const counts = SubscriptionModule.getSubscriptionLineCounts(info.subscription);

        subscriptionBadgeBypass += `<span class="subscription-badge subscription-lines-badge visible" data-type="bypass" data-mode="subscription" title="${I18n.t('subscription_rules_count')}">${counts.bypass_lines >= 0 ? '+' : ''}${counts.bypass_lines}</span>`;
        subscriptionBadgeInclude += `<span class="subscription-badge subscription-lines-badge visible" data-type="include" data-mode="subscription" title="${I18n.t('subscription_rules_count')}">${counts.include_lines >= 0 ? '+' : ''}${counts.include_lines}</span>`;
      }

      html += `<div class="proxy-card ${collapsedClass} ${is_enabled ? "" : "disabled"}" data-id="${i}">
        <div class="proxy-header" data-index="${i}">
            <div class="header-left">
                <div class="drag-handle" title="${I18n.t('drag_sort')}">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                </div>
                <span class="proxy-index">#${i + 1}</span>
                <div class="proxy-type-badge ${protocolClass}">${displayProtocol}</div>
                <div class="proxy-title-preview" title="${previewText}">${previewText}</div>
            </div>
            <div class="header-right">
                <div class="proxy-header-test-result" data-index="${i}"></div>
                <div class="status-container">
                    <span class="status-text">${is_enabled ? I18n.t('status_enabled') : I18n.t('status_disabled')}</span>
                    <label class="switch-modern">
                        <input type="checkbox" class="proxy-status-toggle" data-index="${i}" ${is_enabled ? "checked" : ""}>
                        <span class="slider-modern"></span>
                    </label>
                </div>
            </div>
        </div>

        <div class="proxy-body">
            <div class="proxy-body-container">
                <div class="proxy-content-left">
                    <div class="form-grid">
                        <div class="form-item" style="grid-column: span 4;">
                            <label>${I18n.t('proxy_name')}</label>
                            <input data-index="${i}" class="name" type="text" placeholder="${I18n.t('proxy_name_placeholder')}" value="${UtilsModule.escapeHtml(info.name)}" tabindex="${i * 100 + 1}">
                        </div>
                        <div class="form-item" style="grid-column: span 2;">
                            <label>${I18n.t('protocol')}</label>
                            <div class="lh-select" data-type="protocol" tabindex="${i * 100 + 2}">
                                <div class="lh-select-k">
                                    <span class="lh-select-value" data-index="${i}">${displayProtocol}</span>
                                    <span class="iconfont"></span>
                                </div>
                                <ul class="lh-select-op">
                                    <li data-value="HTTP">HTTP</li>
                                    <li data-value="HTTPS">HTTPS</li>
                                    <li data-value="SOCKS5">SOCKS5</li>
                                </ul>
                            </div>
                        </div>
                        <div class="form-item" style="grid-column: span 3;">
                            <label>
                                ${I18n.t('username_optional')}
                                <span class="info-icon" data-tooltip="${I18n.t('socks5_auth_not_supported')}">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                </span>
                            </label>
                            <input data-index="${i}" class="username" type="text" placeholder="${I18n.t('username_placeholder')}" value="${UtilsModule.escapeHtml(info.username)}" tabindex="${i * 100 + 5}" ${disabledAttr}>
                        </div>
                        <div class="form-item" style="grid-column: span 3;">
                            <label>
                                ${I18n.t('password_optional')}
                                <span class="info-icon" data-tooltip="${I18n.t('socks5_auth_not_supported')}">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                </span>
                            </label>
                            <div style="position: relative; display: flex; align-items: center; width: 100%;">
                                <input data-index="${i}" class="password" type="${info.show_password ? "text" : "password"}" placeholder="${I18n.t('password_placeholder')}" value="${UtilsModule.escapeHtml(info.password)}" style="padding-right: 35px; width: 100%;" tabindex="${i * 100 + 6}" ${disabledAttr}>
                                <label class="container eye-toggle ${info.show_password ? 'show-password' : 'hide-password'}" data-index="${i}" style="position: absolute; right: 8px; margin: 0; cursor: pointer;">
                                    <input type="checkbox" ${info.show_password ? "checked" : ""}>
                                    <svg class="eye" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"></path></svg>
                                    <svg class="eye-slash" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"></path></svg>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="form-grid" style="margin-top: 15px;">
                        <div class="form-item" style="grid-column: span 4;">
                            <label>${I18n.t('ip_address')}</label>
                            <input data-index="${i}" class="ip" type="text" placeholder="127.0.0.1" value="${UtilsModule.escapeHtml(info.ip)}" tabindex="${i * 100 + 3}">
                        </div>
                        <div class="form-item" style="grid-column: span 2;">
                            <label>${I18n.t('port')}</label>
                            <input data-index="${i}" class="port" type="text" placeholder="8080" value="${UtilsModule.escapeHtml(info.port)}" tabindex="${i * 100 + 4}">
                        </div>
                        <div class="form-item" style="grid-column: span 6;">
                            <label>${I18n.t('fallback_policy')}</label>
                            <div class="lh-select" data-type="fallback" tabindex="${i * 100 + 7}">
                                <div class="lh-select-k">
                                    <span class="lh-select-value" data-index="${i}">${displayFallback}</span>
                                    <span class="iconfont"></span>
                                </div>
                                <ul class="lh-select-op">
                                    <li data-value="direct">${I18n.t('fallback_direct')}</li>
                                    <li data-value="reject">${I18n.t('fallback_reject')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                     <div class="url-config-section">
                          <div class="form-item">
                              <div class="url-config-header">
                                   <label>${I18n.t('bypass_rules')}<span class="info-icon" data-i18n-tooltip="bypass_rules_tooltip" data-tooltip="${I18n.t('bypass_rules_tooltip')}"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></span></label>
                                  <div class="url-config-actions">
                                      ${subscriptionBadgeBypass}
                                  </div>
                              </div>
                               <textarea data-index="${i}" class="bypass_rules url-config-textarea subscription-content" data-type="bypass" data-mode="local" placeholder="${I18n.t('bypass_rules_placeholder')}" tabindex="${i * 100 + 8}">${UtilsModule.escapeHtml(info.bypass_rules || "")}</textarea>
                              <textarea class="bypass_rules url-config-textarea subscription-content" data-type="bypass" data-mode="subscription" readonly style="display: none;" placeholder=""></textarea>
                          </div>
                          <div class="form-item">
                              <div class="url-config-header">
                                   <label>${I18n.t('include_rules')}<span class="info-icon" data-i18n-tooltip="include_rules_tooltip" data-tooltip="${I18n.t('include_rules_tooltip')}"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></span></label>
                                  <div class="url-config-actions">
                                      ${subscriptionBadgeInclude}
                                  </div>
                              </div>
                               <textarea data-index="${i}" class="include_rules url-config-textarea subscription-content" data-type="include" data-mode="local" placeholder="${I18n.t('include_rules_placeholder')}" tabindex="${i * 100 + 9}">${UtilsModule.escapeHtml(info.include_rules || "")}</textarea>
                              <textarea class="include_rules url-config-textarea subscription-content" data-type="include" data-mode="subscription" readonly style="display: none;" placeholder=""></textarea>
                          </div>
                       </div>
                 </div>

                  <div class="proxy-content-right">
                     <button class="right-panel-btn btn-test test-proxy-btn" data-index="${i}" tabindex="-1">
                          ${I18n.t('link_test')}
                     </button>
                     <button class="right-panel-btn btn-move move-proxy-btn" data-index="${i}" title="${I18n.t('move_proxy_title')}" tabindex="-1">
                          ${I18n.t('move_proxy')}
                     </button>
                      <button class="right-panel-btn btn-subscription subscription-btn" data-index="${i}" title="${I18n.t('subscription_config_title')}" tabindex="-1">
                           ${I18n.t('subscription_btn')}
                      </button>
                     <div class="test-result-display test-result" data-index="${i}"></div>
                     <button class="right-panel-btn btn-save item-save-btn" data-index="${i}" tabindex="${i * 100 + 10}">
                          ${I18n.t('save')}
                     </button>
                     <button class="right-panel-btn btn-delete del" data-index="${i}" title="${I18n.t('delete_proxy_title')}" tabindex="${i * 100 + 11}">
                          ${I18n.t('delete')}
                     </button>
                 </div>
            </div>
        </div>
      </div>`;
    }
    $("#proxy-list").html(html);

    initSortable();
    bindItemEvents();

    updateSubscriptionLinesDisplay();

    $(".move-proxy-btn").on("click", function () {
      const index = $(this).data("index");
      const currentScenario = ScenariosModule.getCurrentScenario();
      ScenariosModule.showMoveProxyDialog(index, currentScenario ? currentScenario.name : I18n.t('scenario_default'));
    });
  }

  function updateSubscriptionLinesDisplay() {
    $(".subscription-badge[data-type]").each(function () {
      const $badge = $(this);
      const index = $badge.closest('.proxy-card').data('id');
      const type = $badge.data('type');
      const mode = $badge.data('mode');

      if (index === undefined || index === null) return;

      const info = list[index];
      if (!info) return;

      const bypassLines = info.bypass_rules ? info.bypass_rules.split(/\r\n|\r|\n/).filter(line => line.trim()).length : 0;
      const includeLines = info.include_rules ? info.include_rules.split(/\r\n|\r|\n/).filter(line => line.trim()).length : 0;

      if (mode === 'local') {
        $badge.text(type === 'bypass' ? bypassLines : includeLines);
      } else if (mode === 'subscription') {
        if (info.subscription && info.subscription.enabled !== false) {
          const lineCounts = SubscriptionModule.getSubscriptionLineCounts(info.subscription);
          const count = type === 'bypass' ? lineCounts.bypass_lines : lineCounts.include_lines;
          $badge.text(`${count >= 0 ? '+' : ''}${count}`);
        }
      }
    });
  }

  function bindGlobalEvents() {
    $("#add-proxy-btn").on("click", function () {
      const newIndex = addProxy();
      renderList();

      setTimeout(function () {
        const $newItem = $(".proxy-card").last();
        if ($newItem.length) {
          $("html, body").animate({ scrollTop: $newItem.offset().top - 100 }, 500);
        }
      }, 50);
    });

    $("#test-all-btn").on("click", async function () {
      const $btn = $(this);
      if ($btn.prop('disabled')) return;
      $btn.prop('disabled', true);

      $(".proxy-header-test-result").text("").removeClass("text-green text-orange text-red text-blue");

      // Refresh list reference
      list = StorageModule ? StorageModule.getProxies() : list;

      for (let index = 0; index < list.length; index++) {
        const proxy = list[index];
        const $item = $(`.proxy-card[data-id="${index}"]`);

        proxy.name = $item.find('.name').val();
        proxy.protocol = UtilsModule.cleanProtocol($item.find('.lh-select-value[data-index="' + index + '"]').closest('.lh-select[data-type="protocol"]').find('.lh-select-op li.selected-option').data('value') || proxy.protocol);
        proxy.ip = $item.find('.ip').val();
        proxy.port = $item.find('.port').val();
        proxy.username = $item.find('.username').val();
        proxy.password = $item.find('.password').val();

        if (proxy.disabled || !proxy.ip || !proxy.port) continue;

        const $resultSpan = $(`.proxy-header-test-result[data-index="${index}"]`);
        $resultSpan.text(I18n.t('testing')).removeClass("text-green text-orange text-red").addClass("text-blue");

        await new Promise(function (resolve) {
          chrome.runtime.sendMessage({
            action: "testProxyConnection",
            proxyInfo: proxy
          }, function (response) {
            if (chrome.runtime.lastError) {
              $resultSpan.text(I18n.t('test_failed')).removeClass("text-blue").addClass("text-red");
            } else if (response && response.success) {
              const latency = response.latency;
              const colorClass = latency < 500 ? "text-green" : "text-orange";
              $resultSpan.text(latency + "ms").removeClass("text-blue").addClass(colorClass);
            } else {
              let errorMsg = (response && response.error) ? response.error : I18n.t('test_failed');
              if (errorMsg.length > 10) errorMsg = I18n.t('test_failed');
              $resultSpan.text(errorMsg).removeClass("text-blue").addClass("text-red");
            }
            resolve();
          });
        });
      }
      $btn.prop('disabled', false);
    });

    $("#expand-collapse-btn").on("click", function () {
      const $btn = $(this);
      const isExpanded = $btn.hasClass("expanded");

      if (isExpanded) {
        $(".proxy-card").addClass("collapsed");
        $btn.removeClass("expanded");
        $btn.html(`<svg class="icon-expand" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg> <span data-i18n="expand_all">${I18n.t('expand_all')}</span>`);
      } else {
        $(".proxy-card").removeClass("collapsed");
        $btn.addClass("expanded");
        $btn.html(`<svg class="icon-collapse" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg> <span data-i18n="collapse_all">${I18n.t('collapse_all')}</span>`);
      }
    });
  }

  function bindItemEvents() {
    $("input, textarea").on("blur", function () {
      const i = $(this).data("index");
      const val = $(this).val();
      let name = $(this).attr("class");
      if (name && name.indexOf(" ") !== -1) name = name.split(" ")[0];
      input_blur(i, name, val);
    });

    $("input.ip").on("paste", function () {
      const i = $(this).data("index");
      const that = this;
      setTimeout(function () {
        const val = $(that).val();
        if (val.indexOf(":") != -1) {
          const txt_arr = val.split(":");
          $(that).val(txt_arr[0]);
          $(that).closest('.form-grid').find('.port').val(txt_arr[1]);
          input_blur(i, 'ip', txt_arr[0]);
          input_blur(i, 'port', txt_arr[1]);
        }
      }, 100);
    });

    $(".eye-toggle input").on("change", function () {
      const i = $(this).parent().data("index");
      if (i !== undefined && list[i]) {
        list[i].show_password = $(this).prop("checked");
        const passwordInput = $(".password[data-index='" + i + "']");
        passwordInput.attr("type", list[i].show_password ? "text" : "password");

        const $toggle = $(this).parent();
        if (list[i].show_password) $toggle.removeClass('hide-password').addClass('show-password');
        else $toggle.removeClass('show-password').addClass('hide-password');
      }
    });

    $(".del").on("click", function () {
      const index = $(this).data("index");
      if (index !== undefined && list[index]) {
        const info = list[index];
        const previewText = `${info.name || I18n.t('unnamed_proxy')} (${info.ip || "0.0.0.0"}:${info.port || "0"})`;
        $(".delete-tip-content").html(`${I18n.t('delete_proxy_confirm')}<br><span style="color: #e11d48; font-weight: 600; margin-top: 10px; display: block;">${previewText}</span>`);
        $(".delete-tip").show().addClass("show");
        del_index = index;
      }
    });

    $(".subscription-btn").on("click", function () {
      const index = $(this).data("index");
      if (index !== undefined) {
        SubscriptionModule.openModal(index);
      }
    });

    $(document).on('click', '.subscription-badge[data-type][data-mode]', function (e) {
      const $badge = $(this);
      const type = $badge.data('type');
      const mode = $badge.data('mode');

      if ($badge.hasClass('active')) return;

      const $actions = $badge.closest('.url-config-actions');
      const $card = $badge.closest('.proxy-card');
      const index = $card.data('id');

      $actions.find('.subscription-badge').removeClass('active');
      $badge.addClass('active');

      const $localTextarea = $card.find(`.${type}_rules[data-mode="local"]`);
      const $subTextarea = $card.find(`.${type}_rules[data-mode="subscription"]`);

      if (mode === 'subscription') {
        const info = list[index];
        if (info.subscription && info.subscription.lists) {
          const currentFormat = info.subscription.current || 'autoproxy';
          const subConfig = info.subscription.lists[currentFormat];
          const content = type === 'bypass' ? subConfig.bypass_rules : subConfig.include_rules;

          $localTextarea.removeClass('textarea-fade-in').addClass('textarea-fade-out');
          setTimeout(() => {
            $localTextarea.hide().removeClass('textarea-fade-out');
            $subTextarea.val(content || '').show().addClass('textarea-fade-in');
          }, 150);
        }
      } else {
        $subTextarea.removeClass('textarea-fade-in').addClass('textarea-fade-out');
        setTimeout(() => {
          $subTextarea.hide().removeClass('textarea-fade-out');
          $localTextarea.show().addClass('textarea-fade-in');
        }, 150);
      }
    });

    $(".item-save-btn").on("click", function () {
      UtilsModule.showProcessingTip(I18n.t('processing'));
      saveSingleProxy($(this).data("index"));
    });

    $(".test-proxy-btn").on("click", function () {
      const i = $(this).data("index");
      const $btn = $(this);
      const $headerResultSpan = $(`.proxy-header-test-result[data-index="${i}"]`);

      if (i !== undefined && list[i]) {
        const $item = $(`.proxy-card[data-id="${i}"]`);
        list[i].name = $item.find('.name').val();
        list[i].protocol = UtilsModule.cleanProtocol($item.find('.lh-select-value').text());
        list[i].ip = $item.find('.ip').val();
        list[i].port = $item.find('.port').val();
        list[i].username = $item.find('.username').val();
        list[i].password = $item.find('.password').val();

        if (!list[i].ip || !list[i].port) return;

        $headerResultSpan.text(I18n.t('testing')).removeClass("text-green text-orange text-red").addClass("text-blue");
        $btn.prop("disabled", true);

        chrome.runtime.sendMessage({
          action: "testProxyConnection",
          proxyInfo: list[i]
        }, function (response) {
          $btn.prop("disabled", false);
          if (chrome.runtime.lastError) {
            $headerResultSpan.text(I18n.t('test_failed')).removeClass("text-blue").addClass("text-red");
          } else if (response && response.success) {
            const latency = response.latency;
            const colorClass = latency < 500 ? "text-green" : "text-orange";
            $headerResultSpan.text(latency + "ms").removeClass("text-blue").addClass(colorClass);
          } else {
            var errorMsg = (response && response.error) ? response.error : I18n.t('test_failed');
            if (errorMsg.length > 10) errorMsg = I18n.t('test_failed');
            $headerResultSpan.text(errorMsg).removeClass("text-blue").addClass("text-red");
          }
        });
      }
    });

    $(document).off("change", ".proxy-status-toggle").on("change", ".proxy-status-toggle", function () {
      var i = $(this).data("index");
      if (i !== undefined && list[i]) {
        delete list[i].disabled;

        const $item = $(this).closest('.proxy-card');
        const $statusText = $item.find('.status-text');

        list[i].enabled = $(this).prop("checked");
        if (list[i].enabled) {
          $item.removeClass('disabled');
          $statusText.text(I18n.t('status_enabled'));
        } else {
          $item.addClass('disabled');
          $statusText.text(I18n.t('status_disabled'));
        }
        saveSingleProxy(i);
      }
    });

    $(document).off("click", ".proxy-header").on("click", ".proxy-header", function (e) {
      if ($(e.target).closest('.switch-modern, .action-btn-delete, input').length) return;
      $(this).closest('.proxy-card').toggleClass("collapsed");
    });
  }

  function input_blur(i, name, val) {
    if (i !== undefined && name && list[i]) {
      var validProperties = ["name", "ip", "port", "username", "password", "include_rules", "bypass_rules"];
      if (validProperties.includes(name)) {
        list[i][name] = val;
        if (["name", "ip", "port", "include_rules"].includes(name)) {
          ValidatorModule.validateProxy(list, i, name, val);
        }
        if (name === "bypass_rules") {
          ValidatorModule.validateProxy(list, i, name, val);
        }
        if (["name", "ip", "port"].includes(name)) {
          var info = list[i];
          var previewText = `${info.name || I18n.t('unnamed_proxy')} · ${info.ip || "0.0.0.0"}:${info.port || "0"}`;
          $(`.proxy-card[data-id="${i}"] .proxy-title-preview`).text(previewText).attr('title', previewText);
        }
      }
    }
  }

  function initSortable() {
    const $container = $("#proxy-list");

    $container.off("mousedown", ".drag-handle");

    $container.on("mousedown", ".drag-handle", function (e) {
      if (e.button !== 0) return;

      e.preventDefault();
      const $handle = $(this);
      const $item = $handle.closest(".proxy-card");
      if ($item.length === 0) return;

      const itemEl = $item[0];
      const rect = itemEl.getBoundingClientRect();
      const itemHeight = rect.height;
      const itemWidth = rect.width;

      const startX = e.clientX;
      const startY = e.clientY;
      const startTop = rect.top;
      const startLeft = rect.left;

      const $placeholder = $('<div class="drag-placeholder"></div>').css({
        height: itemHeight,
        marginBottom: 0
      });

      const $clone = $item.clone();

      const $originInputs = $item.find('input, textarea, select');
      const $cloneInputs = $clone.find('input, textarea, select');
      $originInputs.each(function (i) {
        if ($(this).attr('type') === 'checkbox') {
          $cloneInputs.eq(i).prop('checked', $(this).prop('checked'));
        } else {
          $cloneInputs.eq(i).val($(this).val());
        }
      });

      $clone.addClass("proxy-card-clone").css({
        position: "fixed",
        top: startTop,
        left: startLeft,
        width: itemWidth,
        height: itemHeight,
        zIndex: 10000,
        opacity: 0.95,
        boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
        pointerEvents: "none",
        margin: 0,
        transform: "scale(1.02)",
        transition: "none"
      });

      $("body").append($clone);
      $item.before($placeholder).hide();

      let isDragging = true;
      let rafId = null;

      const scrollThreshold = 50;
      const scrollSpeed = 10;
      let scrollInterval = null;

      const autoScroll = (clientY) => {
        if (scrollInterval) clearInterval(scrollInterval);
        scrollInterval = null;

        if (clientY < scrollThreshold) {
          scrollInterval = setInterval(() => {
            window.scrollBy(0, -scrollSpeed);
            handleMove(null, clientY);
          }, 16);
        } else if (window.innerHeight - clientY < scrollThreshold) {
          scrollInterval = setInterval(() => {
            window.scrollBy(0, scrollSpeed);
            handleMove(null, clientY);
          }, 16);
        }
      };

      const handleMove = (clientX, clientY) => {
        if (clientX !== null) {
          $clone.css({
            top: startTop + (clientY - startY),
            left: startLeft + (clientX - startX)
          });
        }

        const $siblings = $container.find(".proxy-card:not(:hidden)");
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
      };

      const onMouseMove = function (e) {
        if (!isDragging) return;
        const clientX = e.clientX;
        const clientY = e.clientY;

        autoScroll(clientY);

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => handleMove(clientX, clientY));
      };

      const onMouseUp = function () {
        isDragging = false;
        if (rafId) cancelAnimationFrame(rafId);
        if (scrollInterval) clearInterval(scrollInterval);

        $(document).off("mousemove", onMouseMove);
        $(document).off("mouseup", onMouseUp);

        $clone.animate({
          top: $placeholder[0].getBoundingClientRect().top,
          left: $placeholder[0].getBoundingClientRect().left
        }, 200, function () {
          $clone.remove();
          $placeholder.replaceWith($item);
          $item.show();

          const newItems = $container.find(".proxy-card").toArray();
          const newList = newItems.map(node => {
            const oldIdx = parseInt($(node).attr("data-id"));
            return list[oldIdx];
          });

          let changed = false;
          if (newList.length !== list.length) changed = true;
          else {
            for (let i = 0; i < newList.length; i++) {
              if (newList[i] !== list[i]) {
                changed = true;
                break;
              }
            }
          }

          if (changed) {
            list = newList;
            if (StorageModule) {
              StorageModule.reorderProxies(newList);
            }
            renderList();
            saveData({ successMsg: I18n.t('sort_success') });
          }
        });
      };

      $(document).on("mousemove", onMouseMove);
      $(document).on("mouseup", onMouseUp);
    });
  }

  function confirmDelete() {
    UtilsModule.showProcessingTip(I18n.t('processing'));
    $(".delete-tip").removeClass("show");
    setTimeout(function () { $(".delete-tip").hide(); }, 300);

    if (del_index !== undefined && del_index >= 0 && list[del_index]) {
      deleteProxy(del_index);

      StorageModule.save().then(() => {
        UtilsModule.showTip(I18n.t('delete_success'), false);
        chrome.runtime.sendMessage({ action: "refreshProxy" });
        renderList();
      }).catch(err => {
        console.error("Delete failed:", err);
        UtilsModule.showTip(I18n.t('delete_failed'), true);
      });
    }
  }

  return {
    init: init,
    getList: getList,
    setList: setList,
    addProxy: addProxy,
    deleteProxy: deleteProxy,
    getProxy: getProxy,
    updateProxy: updateProxy,
    saveData: saveData,
    saveSingleProxy: saveSingleProxy,
    renderList: renderList,
    confirmDelete: confirmDelete,
    updateSubscriptionLinesDisplay: updateSubscriptionLinesDisplay,
    ensureProxyId: ensureProxyId,
    generateProxyId: generateProxyId
  };
})();
