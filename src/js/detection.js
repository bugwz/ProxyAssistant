// ==========================================
// Detection Module - Proxy Detection & PAC
// ==========================================

let pacStorageListener = null;

const detectionIcons = {
  success: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="12" r="10" fill="#dcfce7"/><path d="M8 12l2.5 2.5L16 9" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warning: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="12" r="10" fill="#fef3c7"/><path d="M12 8v4m0 4h.01" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>',
  error: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M15 9l-6 6m0-6l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>',
  loading: '<svg class="spin" viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>'
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
    chrome.storage.local.get(['proxyMode', 'currentProxy', 'list'], function (result) {
      resolve({
        mode: result.proxyMode || 'disabled',
        currentProxy: result.currentProxy || null,
        list: result.list || []
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
  $("#detection-details").html('<div class="detection-row"><span class="detection-label">Error</span><span class="detection-value">' + (errorMsg || I18n.t('proxy_suggestion_retry')) + '</span></div>').show();
  $("#detection-warning").hide();
  $("#detection-suggestion-text").text(I18n.t('proxy_suggestion_retry'));
  $("#detection-suggestion").show();
}

// ==========================================
// PAC Details
// ==========================================

function showPacDetails() {
  updatePacDetails();
  pacStorageListener = function (changes, namespace) {
    if (namespace === 'local' && (changes.list || changes.proxyMode)) {
      updatePacDetails();
    }
  };
  chrome.storage.onChanged.addListener(pacStorageListener);
  $(".pac-details-tip").show().addClass("show");
}

function updatePacDetails() {
  chrome.storage.local.get(['proxyMode', 'list'], function (result) {
    const mode = result.proxyMode || 'disabled';
    const proxyList = result.list || [];
    const pacData = generatePacDetailsData(proxyList);

    $("#pac-mode-value").text(mode === 'auto' ? I18n.t('mode_auto') : I18n.t('mode_disabled'));
    $("#pac-generated-time").text(new Date().toLocaleString());
    $("#pac-rules-count").text(pacData.rules.length);

    var rulesHtml = '';
    if (pacData.rules.length === 0) rulesHtml = '<div class="pac-rule-item empty">' + I18n.t('pac_no_rules') + '</div>';
    else {
      pacData.rules.forEach(function (rule) {
        rulesHtml += `<div class="pac-rule-item"><span class="pac-rule-pattern">${escapeHtml(rule.pattern)}</span><span class="pac-rule-arrow">→</span><span class="pac-rule-proxy">${escapeHtml(rule.proxy)}</span></div>`;
      });
    }
    $("#pac-rules-list").html(rulesHtml);
    $("#pac-script-content").text(pacData.script);
  });
}

function generatePacDetailsData(proxyList) {
  var rules = [];
  var script = "function FindProxyForURL(url, host) {\n";
  var usedPatterns = new Set();

  proxyList.forEach(function (proxy) {
    if (proxy.disabled === true || !proxy.ip || !proxy.port) return;
    const type = (proxy.protocol || "HTTP").toUpperCase();
    let proxyType = type.startsWith("SOCKS") ? "SOCKS5" : "PROXY";
    const proxyStr = proxyType + " " + proxy.ip + ":" + proxy.port;
    const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
    const returnVal = '"' + proxyStr + fallback + '"';

    if (proxy.include_urls) {
      const includeUrls = proxy.include_urls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      includeUrls.forEach(function (pattern) {
        if (usedPatterns.has(pattern)) return;
        usedPatterns.add(pattern);
        rules.push({ pattern: pattern, proxy: proxy.name || (proxy.ip + ":" + proxy.port) });

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
  return { rules: rules, script: script };
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
