// ==========================================
// Detection Module - Proxy Detection & PAC
// ==========================================

let pacStorageListener = null;

const detectionIcons = {
  success: MainIcons.render('successCircle', { width: 48, height: 48, style: 'color:#22c55e' }),
  warning: MainIcons.render('warningCircle', { width: 48, height: 48, style: 'color:#f59e0b' }),
  error: MainIcons.render('errorCircle', { width: 48, height: 48, style: 'color:#ef4444' }),
  loading: MainIcons.render('loading', { width: 48, height: 48, className: 'spin' })
};

// ==========================================
// Proxy Detection
// ==========================================

async function detectProxy() {
  var $btn = $("#detect-proxy-btn");
  $btn.prop("disabled", true);

  $("#detection-status-icon").html(detectionIcons.loading);
  $("#detection-status-text").text(I18n.t('proxy_effect_testing'));
  $("#detection-details, #detection-warning, #detection-suggestion").hide();
  $(".proxy-detection-tip").show().addClass("show");

  try {
    var browserConfig = await getBrowserProxyConfig();
    var pluginConfig = await getPluginProxyConfig();
    var result = analyzeProxyStatus(browserConfig, pluginConfig);
    displayDetectionResult(result);
  } catch (error) {
    console.log("Proxy detection error:", error);
    displayErrorResult(error.message);
  }
  $btn.prop("disabled", false);
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
        list: list
      });
    });
  });
}

function analyzeProxyStatus(browserConfig, pluginConfig) {
  var result = { status: 'normal', statusText: '', statusIcon: '', details: [], warning: null, suggestion: null };
  var browserMode = (browserConfig.value && browserConfig.value.mode) || 'system';
  var levelOfControl = browserConfig.levelOfControl || '';

  var proxyServer = '', proxyProtocol = '';
  if (browserConfig.value && browserConfig.value.rules) {
    var rules = browserConfig.value.rules;
    if (rules.singleProxy) { proxyServer = rules.singleProxy.host + ':' + rules.singleProxy.port; proxyProtocol = rules.singleProxy.scheme || 'http'; }
    else if (rules.proxyForHttp || rules.proxyForHttps) { var p = rules.proxyForHttp || rules.proxyForHttps; proxyServer = p.host + ':' + p.port; proxyProtocol = p.scheme || 'http'; }
  } else if (browserConfig.value && browserConfig.value.pacScript) { proxyServer = 'PAC Script'; proxyProtocol = 'Auto'; }

  result.details.push({ label: I18n.t('proxy_mode'), value: getModeDisplayName(browserMode) });
  if (proxyServer) result.details.push({ label: I18n.t('proxy_server'), value: proxyServer });
  if (proxyProtocol) result.details.push({ label: I18n.t('proxy_protocol'), value: proxyProtocol.toUpperCase() });

  var controlText = '';
  if (levelOfControl === 'controlled_by_this_extension') controlText = I18n.t('proxy_control_this');
  else if (levelOfControl === 'controlled_by_other_extensions') controlText = I18n.t('proxy_control_other');
  else controlText = I18n.t('proxy_control_system');
  result.details.push({ label: I18n.t('proxy_control'), value: controlText });

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
    result.status = 'normal'; result.statusText = I18n.t('status_disabled'); result.statusIcon = detectionIcons.success;
    result.details.push({ label: I18n.t('proxy_effect'), value: I18n.t('proxy_control_system') });
  } else if (isUsingPlugin && !hasOtherProxy) {
    result.status = 'normal'; result.statusText = I18n.t('proxy_status_normal'); result.statusIcon = detectionIcons.success;
    result.details.push({ label: I18n.t('proxy_effect'), value: I18n.t('proxy_effect_verified') });
  } else {
    result.status = 'warning'; result.statusText = I18n.t('proxy_status_warning'); result.statusIcon = detectionIcons.warning;
    result.warning = I18n.t('proxy_warning_system'); result.suggestion = I18n.t('proxy_suggestion_check');
    result.details.push({ label: I18n.t('proxy_effect'), value: I18n.t('proxy_effect_failed') });
  }
  return result;
}

function getModeDisplayName(mode) {
  switch (mode) {
    case 'fixed_servers': return I18n.t('mode_manual');
    case 'pac_script': return I18n.t('mode_auto');
    case 'system': return I18n.t('proxy_control_system');
    case 'direct': return I18n.t('mode_disabled');
    default: return mode || I18n.t('mode_disabled');
  }
}

function displayDetectionResult(result) {
  var iconKey = result.status === 'normal' ? 'success' : (result.status === 'warning' ? 'warning' : 'error');
  $("#detection-status-icon").html(detectionIcons[iconKey]);
  $("#detection-status-text").text(result.statusText);

  var detailsHtml = '';
  result.details.forEach(function (item) {
    detailsHtml += '<div class="detection-row"><span class="detection-label">' + item.label + '</span><span class="detection-value">' + item.value + '</span></div>';
  });
  $("#detection-details").html(detailsHtml).show();

  if (result.warning) $("#detection-warning").text(result.warning).show(); else $("#detection-warning").hide();
  if (result.suggestion) { $("#detection-suggestion-text").text(result.suggestion); $("#detection-suggestion").show(); } else $("#detection-suggestion").hide();
}

function displayErrorResult(errorMsg) {
  $("#detection-status-icon").html(detectionIcons.error);
  $("#detection-status-text").text(I18n.t('proxy_status_error'));
  var safeErrorMsg = errorMsg ? UtilsModule.escapeHtml(errorMsg) : I18n.t('proxy_suggestion_retry');
  $("#detection-details").html('<div class="detection-row"><span class="detection-label">Error</span><span class="detection-value">' + safeErrorMsg + '</span></div>').show();
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
  $(".pac-details-tip").show().addClass("show");
}

function updatePacDetails() {
  chrome.storage.local.get(['state'], function (result) {
    const mode = result.state?.proxy?.mode || 'disabled';

    $("#pac-mode-value").text(mode === 'auto' ? I18n.t('mode_auto') : I18n.t('mode_disabled'));
    $("#pac-generated-time").text(new Date().toLocaleString());

    // Fetch the actual PAC script from the background worker to ensure it includes subscription logic
    chrome.runtime.sendMessage({ action: "getPacScript" }, function (response) {
      if (chrome.runtime.lastError) {
        console.info("Error fetching PAC script:", chrome.runtime.lastError);
        $("#pac-script-content").text("// Error fetching PAC script: " + chrome.runtime.lastError.message);
        $("#pac-rules-count-text").text(I18n.t('pac_rules_count') + ": ");
        $("#pac-rules-count-value").text("0");
      } else if (response && response.success) {
        $("#pac-script-content").text(response.script);
        const ifCount = (response.script.match(/if\s*\(/g) || []).length;
        $("#pac-rules-count-text").text(I18n.t('pac_rules_count') + ": ");
        $("#pac-rules-count-value").text(ifCount);
      } else {
        $("#pac-script-content").text("// Failed to generate PAC script");
        $("#pac-rules-count-text").text(I18n.t('pac_rules_count') + ": ");
        $("#pac-rules-count-value").text("0");
      }
    });
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
  closePacDetails: () => {
    if (pacStorageListener) { chrome.storage.onChanged.removeListener(pacStorageListener); pacStorageListener = null; }
  }
};
