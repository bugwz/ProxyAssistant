// ==========================================
// Validator Module - Validation Functions
// ==========================================

// ==========================================
// IP Address Validation
// ==========================================

function validateIPAddress(ip) {
  if (!ip || ip.trim() === '') return { isValid: false, error: I18n.t('alert_ip_required') || 'IP地址不能为空' };
  var parts = ip.split('.');
  if (parts.length !== 4) return { isValid: false, error: I18n.t('alert_ip_format') || 'IP地址格式错误' };
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part === '') return { isValid: false, error: I18n.t('alert_ip_part_empty') };
    if (!/^\d+$/.test(part)) return { isValid: false, error: I18n.t('alert_ip_part_nan') };
    if (part.length > 1 && part[0] === '0') return { isValid: false, error: I18n.t('alert_ip_leading_zero') };
    var num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return { isValid: false, error: I18n.t('alert_ip_part_range') };
  }
  return { isValid: true, error: '' };
}

// ==========================================
// Host Validation
// ==========================================

function isValidHost(val) {
  var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(val)) return true;
  var hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  return hostnameRegex.test(val);
}

// ==========================================
// Proxy Validation
// ==========================================

function validateProxy(list, i, name, val) {
  var isValid = true;
  var errorMessage = '';
  var $item = $(`.proxy-card[data-id="${i}"]`);
  var $input = $item.find('.' + name);

  if (name === 'name') {
    var isDuplicate = list.some((item, index) => index !== i && item.name === val);
    if (val.trim() === '') { isValid = false; errorMessage = I18n.t('alert_name_required') || '代理名称不能为空'; }
    else if (isDuplicate) { isValid = false; errorMessage = I18n.t('alert_name_duplicate') || '代理名称不能重复'; }
  } else if (name === 'include_urls') {
    var includeUrlsCheck = checkIncludeUrlsConflict(i, val);
    if (includeUrlsCheck.hasConflict) { isValid = false; errorMessage = includeUrlsCheck.error; }
  } else if (name === 'ip') {
    var parts = val.split('.');
    var isIpLike = parts.length === 4 && parts.every(p => /^\d+$/.test(p));
    if (isIpLike) {
      var ipValidation = validateIPAddress(val);
      if (!ipValidation.isValid) { isValid = false; errorMessage = ipValidation.error; }
    } else {
      if (!isValidHost(val)) { isValid = false; errorMessage = I18n.t('alert_ip_invalid') || '请输入有效的代理地址'; }
    }
  } else if (name === 'port') {
    var port = parseInt(val);
    if (isNaN(port) || port < 1 || port > 65535 || val.toString() !== port.toString()) {
      isValid = false; errorMessage = I18n.t('alert_port_invalid') || '端口号必须在1-65535范围内';
    }
  } else if (name === 'bypass_urls') {
    var bypassCheck = validateBypassUrls(val);
    if (!bypassCheck.isValid) { isValid = false; errorMessage = bypassCheck.error; }
  }

  if (isValid) { $input.removeClass('input-error').removeAttr('title'); }
  else { $input.addClass('input-error'); if (errorMessage) $input.attr('title', errorMessage); }
  return isValid;
}

// ==========================================
// Include URLs Conflict Check
// ==========================================

function checkIncludeUrlsConflict(list, i, includeUrls) {
  if (!includeUrls || !includeUrls.trim()) return { hasConflict: false, error: '' };
  var currentUrls = includeUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

  for (var j = 0; j < list.length; j++) {
    if (j === i) continue;
    var otherProxy = list[j];
    if (!otherProxy || !otherProxy.ip || !otherProxy.port) continue;
    var otherUrls = (otherProxy.include_urls || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    var commonPatterns = currentUrls.filter(pattern => otherUrls.indexOf(pattern) !== -1);

    if (commonPatterns.length > 0) {
      var otherProxyName = otherProxy.name || (otherProxy.ip + ':' + otherProxy.port);
      var errorMsg = I18n.t('alert_include_urls_conflict').replace('{pattern}', commonPatterns[0]).replace('{proxy}', otherProxyName);
      return { hasConflict: true, error: errorMsg };
    }
  }
  return { hasConflict: false, error: '' };
}

// ==========================================
// Bypass URLs Validation
// ==========================================

function validateBypassUrls(bypassUrls) {
  if (!bypassUrls || !bypassUrls.trim()) return { isValid: true, error: '' };

  var lines = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
  var invalidLines = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!isValidBypassPattern(line)) {
      invalidLines.push(line);
    }
  }

  if (invalidLines.length > 0) {
    return {
      isValid: false,
      error: '无效的 bypass 规则: ' + invalidLines.slice(0, 3).join(', ') + (invalidLines.length > 3 ? '...' : '')
    };
  }

  return { isValid: true, error: '' };
}

function isValidBypassPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') return false;

  var trimmed = pattern.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('/') && trimmed.endsWith('/')) return false;
  if (trimmed.startsWith('|') && !trimmed.startsWith('||')) return false;

  var ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(trimmed)) return true;

  var ipv4CidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/(8|9|1\d|2\d|3[0-2])$/;
  if (ipv4CidrPattern.test(trimmed)) return true;

  var portPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?:[1-9]\d{0,4}$/;
  if (portPattern.test(trimmed)) return true;

  var ipPortPattern = /^(\d{1,3}\.){3}\d{1,3}:[1-9]\d{0,4}$/;
  if (ipPortPattern.test(trimmed)) return true;

  var hostnamePattern = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  if (hostnamePattern.test(trimmed)) return true;

  if (trimmed.includes('*')) {
    var wildcardPattern = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$/;
    if (wildcardPattern.test(trimmed.replace(/\*/g, 'a'))) return true;
  }

  return true;
}

// Export for use
window.ValidatorModule = {
  validateIPAddress,
  isValidHost,
  validateProxy,
  checkIncludeUrlsConflict,
  validateBypassUrls
};
