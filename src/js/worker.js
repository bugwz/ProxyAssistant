// Proxy Assistant - Background Service Worker
// Implements Manifest V3 proxy functionality for Chrome and Firefox

// Browser detection
const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo !== undefined;
const isChrome = !isFirefox && typeof chrome !== 'undefined';

// Global variable to store current proxy authentication credentials
let currentProxyAuth = {
  username: '',
  password: ''
};

// Track in-progress subscription fetches to prevent duplicates
const inProgressFetches = new Set();

// Helper to sync auth to session storage (MV3 state safety)
function updateSessionAuth(auth) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    chrome.storage.session.set({ currentProxyAuth: auth });
  }
}

// Firefox-specific state management
// FoxyProxy implementation uses internal state + onRequest instead of settings API
let firefoxProxyState = {
  mode: 'disabled', // disabled, manual, auto
  currentProxy: null,
  list: [],
  testMode: false,
  testProxy: null
};

// Global config cache for Firefox auto mode
let currentConfig = null;

// Helper to sync Firefox state to session storage
function updateFirefoxSessionState() {
  if (isFirefox && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    chrome.storage.session.set({ firefoxProxyState: firefoxProxyState });
  }
}

// State loading promise for async handling
let stateLoaded = false;
let stateLoadedResolve = null;
const stateLoadedPromise = new Promise(resolve => {
  stateLoadedResolve = resolve;
});

// Listener for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Proxy Assistant installed/updated');

  if (details.reason === 'install') {
    turnOffProxy();
  }

  if (details.reason === 'update' || details.reason === 'install') {
    restoreProxySettings();
  }
});

// Helper function: validate subscription format
function isSubscriptionFormatValid(content, format) {
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

// ==========================================
// Subscription Rule Parsing Functions
// ==========================================

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

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function convertIPRangeToCIDR(pattern) {
  const parts = pattern.split('.');
  const segments = parts.map(seg => seg === '*' ? 0 : parseInt(seg, 10));
  const [s0, s1, s2, s3] = segments;

  const isFullRange = (s, e) => s === 0 && e === 255;
  const isSingle = (seg, idx) => seg === segments[idx];

  if (isFullRange(s0) && isFullRange(s1) && isFullRange(s2) && isFullRange(s3)) {
    return s0 === s1 && s1 === s2 && s2 === s3 ? pattern : `${s0}.0.0.0/8`;
  }
  if (s0 === s1 && s1 === s2 && isFullRange(s3)) {
    return `${s0}.${s1}.0.0/16`;
  }
  if (s0 === s1 && s2 === s3 && isFullRange(s3)) {
    return `${s0}.${s1}.${s2}.0/24`;
  }
  if (s0 === 10 && s1 === 0 && s2 === 0 && s3 === 0) return '10.0.0.0/8';
  if (s0 === 172 && s1 === 16 && s2 === 0 && s3 === 0) return '172.16.0.0/12';
  if (s0 === 192 && s1 === 168 && s2 === 0 && s3 === 0) return '192.168.0.0/16';

  return s0 === s1 && s1 === s2 && s2 === s3 ? pattern : null;
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

function extractDomainFromWildcard(pattern) {
  if (!pattern) return null;

  let domain = pattern
    .replace(/^\*\:\/\/\*\./, '')
    .replace(/^\*\:\/\//, '')
    .replace(/^\*\./, '')
    .replace(/\/\*$/, '')
    .replace(/\/\*.*$/, '')
    .trim();

  if (!domain) return null;

  const domainParts = domain.split('.');
  const segmentCount = domainParts.filter(part => part && part.trim()).length;

  if (domainParts.length >= 2 && domainParts[domainParts.length - 2]) {
    return {
      domain: domainParts.slice(-2).join('.'),
      segmentCount: segmentCount
    };
  }

  return {
    domain: domain,
    segmentCount: segmentCount
  };
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

function extractIPFromURL(url) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}/;
  const match = url.match(ipv4Pattern);
  if (match) {
    return match[0];
  }
  return null;
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

// Helper function: parse subscription content
function parseSubscriptionContent(content, format, reverse, processRule) {
  const result = {
    include_rules: [],
    bypass_rules: [],
    decoded: null
  };

  if (!content) return result;

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
    console.info('[Worker] Parse subscription error:', e);
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
    console.info('[Worker] PAC content parse failed:', error);
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

// Fetch with timeout and retry support
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Background fetch for subscription with retry
async function fetchSubscriptionBackground(proxyId, format, url, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Worker] Background fetch started (attempt ${attempt}/${maxRetries}): ${url}`);

      const response = await fetchWithTimeout(url, {}, 30000);
      if (!response.ok) {
        console.info(`[Worker] HTTP error: ${response.status} ${response.statusText} for URL: ${url}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const content = await response.text();

      if (!isSubscriptionFormatValid(content, format)) {
        console.info(`[Worker] Invalid subscription format: ${format} for proxy: ${proxyId}`);
        throw new Error('Invalid format after fetch');
      }

      let updated = false;

      const result = await new Promise((resolve, reject) => {
        chrome.storage.local.get(['config'], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Storage get error: ${chrome.runtime.lastError.message}`));
            return;
          }
          resolve(result);
        });
      });

      const config = result.config;
      if (!config?.scenarios?.lists) {
        console.warn(`[Worker] No config found for proxy: ${proxyId}`);
        return;
      }

      let proxyFound = false;

      for (const scenario of config.scenarios.lists) {
        if (!scenario.proxies) continue;

        for (const proxy of scenario.proxies) {
          if (proxy.id === proxyId &&
            proxy.subscription?.current === format &&
            proxy.subscription?.lists?.[format]) {

            proxyFound = true;
            const listConfig = proxy.subscription.lists[format];
            const oldContent = listConfig.content;

            if (oldContent !== content) {
              listConfig.content = content;
              listConfig.last_fetch_time = Date.now();

              const reverse = listConfig.reverse || false;
              const processRule = format === 'pac' ? listConfig.process_rule : undefined;
              const parsed = parseSubscriptionContent(content, format, reverse, processRule);
              listConfig.decoded_content = parsed.decoded || '';
              listConfig.include_rules = parsed.include_rules || '';
              listConfig.bypass_rules = parsed.bypass_rules || '';
              listConfig.include_lines = parsed.include_rules ? parsed.include_rules.split(/\r\n|\r|\n/).length : 0;
              listConfig.bypass_lines = parsed.bypass_rules ? parsed.bypass_rules.split(/\r\n|\r|\n/).length : 0;

              updated = true;
              console.log(`[Worker] Updated subscription for proxy: ${proxy.name || proxyId}`);
            } else {
              listConfig.last_fetch_time = Date.now();
              console.log(`[Worker] No changes for proxy: ${proxy.name || proxyId}, content unchanged`);
            }
          }
        }
      }

      if (!proxyFound) {
        console.warn(`[Worker] Proxy ${proxyId} with format ${format} not found in config`);
      }

      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ config: config }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Storage set error: ${chrome.runtime.lastError.message}`));
            return;
          }
          resolve();
        });
      });

      console.log(`[Worker] Background fetch saved: ${proxyId}`);

      if (updated) {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'subscriptionUpdated',
            proxyId: proxyId,
            format: format
          }, () => {
            if (chrome.runtime.lastError) {
              console.info(`[Worker] Send message error: ${chrome.runtime.lastError.message} for proxy: ${proxyId}`);
            }
            resolve();
          });
        });
      }

      console.log(`[Worker] Background fetch completed for proxy: ${proxyId}, updated: ${updated}`);
      return;
    } catch (error) {
      lastError = error;
      console.info(`[Worker] Background fetch attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Worker] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.info(`[Worker] All ${maxRetries} attempts failed for proxy: ${proxyId}, last error: ${lastError?.message}`);
}

// Unified function to schedule or clear subscription alarm
function scheduleOrClearSubscriptionAlarm(proxyId, format, refreshInterval, url) {
  const alarmName = `subscription___${proxyId}___${format}`;

  if (!refreshInterval || refreshInterval <= 0 || !url) {
    chrome.alarms.clear(alarmName);
    console.log(`[Worker] Alarm cleared: ${alarmName}`);
    return;
  }

  // Clear all old subscription alarms for this proxy before creating new one
  const knownFormats = ['autoproxy', 'switchy_omega', 'switchy_legacy', 'pac'];
  knownFormats.forEach(oldFormat => {
    if (oldFormat !== format) {
      chrome.alarms.clear(`subscription___${proxyId}___${oldFormat}`);
    }
  });

  chrome.alarms.get(alarmName, (existingAlarm) => {
    if (existingAlarm) {
      const existingInterval = existingAlarm.periodInMinutes;
      if (existingInterval !== refreshInterval) {
        chrome.alarms.clear(alarmName, () => {
          chrome.alarms.create(alarmName, {
            delayInMinutes: refreshInterval,
            periodInMinutes: refreshInterval
          });
          console.log(`[Worker] Alarm updated: ${alarmName}, interval: ${refreshInterval}min`);
        });
      } else {
        console.log(`[Worker] Alarm already exists with same interval: ${alarmName}`);
      }
    } else {
      chrome.alarms.create(alarmName, {
        delayInMinutes: refreshInterval,
        periodInMinutes: refreshInterval
      });
      console.log(`[Worker] Alarm created: ${alarmName}, interval: ${refreshInterval}min`);
    }
  });
}

// Schedule background refresh for all subscriptions
function scheduleAllBackgroundRefreshes(config) {
  if (!config?.scenarios?.lists) return;

  console.log('[Worker] Scheduling subscription alarms for all enabled subscriptions');

  config.scenarios.lists.forEach(scenario => {
    if (!scenario.proxies) return;

    scenario.proxies.forEach(proxy => {
      if (!proxy.id || !proxy.subscription) return;

      // Clear all old subscription alarms for this proxy first
      if (proxy.subscription.lists) {
        Object.keys(proxy.subscription.lists).forEach(format => {
          const oldAlarmName = `subscription___${proxy.id}___${format}`;
          chrome.alarms.clear(oldAlarmName);
        });
      }

      if (proxy.subscription.enabled !== false) {
        const format = proxy.subscription.current;
        const subConfig = proxy.subscription.lists?.[format];
        scheduleOrClearSubscriptionAlarm(
          proxy.id,
          format,
          subConfig?.refresh_interval,
          subConfig?.url
        );
      }
    });
  });
}

// Schedule background refresh for single subscription (called from frontend)
function scheduleSubscriptionRefresh(proxyId, format, refreshInterval, url) {
  scheduleOrClearSubscriptionAlarm(proxyId, format, refreshInterval, url);
}

// Alarm listener for subscription refresh
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('subscription___')) {
    const alarmName = alarm.name.replace('subscription___', '');
    const lastSeparatorIndex = alarmName.lastIndexOf('___');
    const proxyId = alarmName.substring(0, lastSeparatorIndex);
    const format = alarmName.substring(lastSeparatorIndex + 3);
    const fetchKey = `${proxyId}_${format}`;

    if (inProgressFetches.has(fetchKey)) {
      console.log(`[Worker] Skipped duplicate alarm: ${alarm.name}`);
      return;
    }

    console.log(`[Worker] Subscription alarm triggered: ${alarm.name}`);

    chrome.storage.local.get(['config'], (result) => {
      const config = result.config;
      if (!config?.scenarios?.lists) return;

      for (const scenario of config.scenarios.lists) {
        if (!scenario.proxies) continue;

        for (const proxy of scenario.proxies) {
          if (proxy.id === proxyId &&
            proxy.subscription?.current === format &&
            proxy.subscription?.enabled !== false) {

            const subConfig = proxy.subscription.lists?.[format];
            if (subConfig?.url) {
              inProgressFetches.add(fetchKey);
              fetchSubscriptionBackground(proxyId, format, subConfig.url).finally(() => {
                inProgressFetches.delete(fetchKey);
              });
            }
            return;
          }
        }
      }
    });
  }
});

// Storage change listener for subscription config updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.config) {
    const newConfig = changes.config.newValue;
    const oldConfig = changes.config.oldValue;

    if (newConfig) {
      console.log('[Worker] Config changed, scheduling alarms...');
      setTimeout(() => {
        scheduleAllBackgroundRefreshes(newConfig);
      }, 1000);
    }
  }
});

// Restore previous proxy settings
function restoreProxySettings() {
  console.log('Checking for saved proxy settings');

  // Load both local (persistent) and session (runtime) settings
  const storagePromise = new Promise(resolve => {
    chrome.storage.local.get(['state', 'config'], (localResult) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get(['firefoxProxyState'], (sessionResult) => {
          resolve({ local: localResult, session: sessionResult });
        });
      } else {
        resolve({ local: localResult, session: {} });
      }
    });
  });

  storagePromise.then(({ local: result, session: sessionResult }) => {
    if (isFirefox) {
      // Load config for Firefox auto mode
      currentConfig = result.config || {};

      // Sync local state for Firefox
      if (result.state?.proxy?.current) firefoxProxyState.currentProxy = result.state.proxy.current;
      // If enabled, restore mode
      if (result.state?.proxy?.mode && result.state.proxy.mode !== 'disabled') {
        firefoxProxyState.mode = result.state.proxy.mode || 'manual';
      } else {
        firefoxProxyState.mode = 'disabled';
      }

      // OVERRIDE: If we have session state (e.g. recovered from suspension during test), restore it
      if (sessionResult.firefoxProxyState) {
        console.log("Restoring Firefox runtime state from session");
        const savedState = sessionResult.firefoxProxyState;

        // Restore test mode if it was active
        if (savedState.testMode) {
          firefoxProxyState.testMode = true;
          firefoxProxyState.testProxy = savedState.testProxy;
        }

        // Restore mode if valid (session takes precedence for runtime consistency if needed)
        // But generally we trust local storage for the main mode, session for transient states
        if (savedState.mode && savedState.mode !== firefoxProxyState.mode) {
          console.log(`Session mode ${savedState.mode} differs from local mode ${firefoxProxyState.mode}, keeping local`);
        }
      }

      // Ensure settings are cleared and listeners are active
      setupFirefoxProxy();

      if (firefoxProxyState.mode !== 'disabled') {
        console.log('Restoring saved proxy settings');
      } else {
        // Clear badge for disabled
        updateBadge();
      }
    } else {
      // Chrome
      if (result.state?.proxy?.mode && result.state.proxy.mode !== 'disabled') {
        console.log('Restoring saved proxy settings');
        applyProxySettings(result.state.proxy.current);
      } else {
        // Clear badge for disabled
        updateBadge();
      }
    }

    // Mark state as loaded
    if (!stateLoaded) {
      stateLoaded = true;
      if (stateLoadedResolve) stateLoadedResolve();
    }

    // Restore subscription alarms after state is loaded
    chrome.storage.local.get(['config'], (configResult) => {
      if (configResult.config) {
        scheduleAllBackgroundRefreshes(configResult.config);
      }
    });
  });
}

// Hook into startup event
chrome.runtime.onStartup.addListener(restoreProxySettings);

// Also run immediately on script load to handle Service Worker wakeups
restoreProxySettings();

// Helper function to get proxy settings with browser-specific implementation
function getProxySettings() {
  return new Promise((resolve) => {
    try {
      if (isFirefox) {
        // Firefox API - we return our internal state because we use onRequest
        // We mock the Chrome API structure for compatibility with UI
        let config = { value: { mode: "system" }, levelOfControl: "controlled_by_this_extension" };

        if (firefoxProxyState.mode === 'manual') {
          config.value = {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                host: firefoxProxyState.currentProxy?.ip,
                port: parseInt(firefoxProxyState.currentProxy?.port || 0)
              }
            }
          };
        } else if (firefoxProxyState.mode === 'auto') {
          config.value = { mode: "pac_script" };
        }

        resolve(config);
      } else {
        // Chrome API
        chrome.proxy.settings.get({ incognito: false }, (config) => {
          if (chrome.runtime.lastError) {
            console.log("Chrome proxy.settings.get error:", chrome.runtime.lastError);
            resolve({ value: null, levelOfControl: "unknown" });
          } else {
            resolve(config || { value: null, levelOfControl: "unknown" });
          }
        });
      }
    } catch (error) {
      console.log("Exception getting proxy settings:", error);
      resolve({ value: null, levelOfControl: "unknown" });
    }
  });
}

// List of URLs to preconnect to warm up proxy connection
const TEST_URLS = [
  'https://www.baidu.com/favicon.ico',
];

// Set extension icon badge
function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color: color });
  }
}

// Monitor storage changes to keep badge updated
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.state) {
      updateBadge();
    }

    // Sync Firefox config on storage changes
    if (isFirefox && changes.config) {
      currentConfig = changes.config.newValue || {};
    }

    // Sync Firefox state on storage changes
    if (isFirefox) {
      if (changes.state?.proxy?.current) firefoxProxyState.currentProxy = changes.state.proxy.current.newValue;
    }
  }
});

// Update badge based on current state and requirements
function updateBadge() {
  chrome.storage.local.get(['state'], (result) => {
    const mode = result.state?.proxy?.mode || 'disabled';

    if (mode === 'manual') {
      setBadge("ᴍ", "#4164f5");
    } else if (mode === 'auto') {
      setBadge("ᴀ", "#28a745");
    } else {
      setBadge("");
    }
  });
}

// Handle different types of proxy settings
function applyProxySettings(proxyInfo) {
  chrome.storage.local.get(['state'], (result) => {
    const mode = result.state?.proxy?.mode || 'manual';

    if (isFirefox) {
      // Update Firefox state
      if (mode === 'disabled') {
        firefoxProxyState.mode = 'disabled';
        firefoxProxyState.currentProxy = null;
      } else if (mode === 'auto') {
        firefoxProxyState.mode = 'auto';
        firefoxProxyState.currentProxy = null;
      } else {
        // Manual
        firefoxProxyState.mode = 'manual';
        // Use provided info or fallback to storage
        firefoxProxyState.currentProxy = proxyInfo || result.state?.proxy?.current;
      }
      updateFirefoxSessionState();

      // Update UI
      chrome.storage.local.set({
        state: { proxy: { mode: firefoxProxyState.mode, current: firefoxProxyState.currentProxy } }
      }, () => {
        updateBadge();
        setupFirefoxProxy(); // Activate the proxy logic
      });
    } else {
      // Chrome
      const chromeMode = result.state?.proxy?.mode || 'manual';

      if (chromeMode === 'auto') {
        applyAutoProxySettings();
      } else if (chromeMode === 'disabled') {
        // If mode is disabled, always turn off proxy regardless of proxyInfo
        turnOffProxy();
      } else {
        // Manual mode
        // If manual mode and no proxyInfo provided (e.g. from refreshProxy), use the one from storage
        const infoToApply = proxyInfo || result.state?.proxy?.current;
        if (infoToApply) {
          applyManualProxySettings(infoToApply);
        } else {
          turnOffProxy();
        }
      }
    }
  });
}

// Protocol field cleaning function - prevents protocol value corruption
function cleanProtocol(protocol) {
  if (!protocol || typeof protocol !== 'string') return 'http';
  // Remove potential URL prefixes (http://, https://, http:, https:, etc.)
  let cleaned = protocol.replace(/^(https?:\/?\/?)/i, '').trim();
  // Normalize to lowercase
  cleaned = cleaned.toLowerCase();
  // Validate against known protocols
  const validProtocols = ['http', 'https', 'socks4', 'socks5', 'socks'];
  if (!validProtocols.includes(cleaned)) {
    return 'http';
  }
  return cleaned;
}

// Helper function to validate proxy configuration
function validateProxyConfig(ip, port) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

  if (!ipv4Regex.test(ip) && !hostnameRegex.test(ip)) {
    return { valid: false, error: "Invalid IP address or hostname format" };
  }

  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { valid: false, error: "Invalid port number (must be 1-65535)" };
  }

  return { valid: true };
}

// ==========================================
// Subscription Functions for Service Worker
// ==========================================

function scheduleBackgroundRefresh(proxyId, subscription) {
  if (!subscription) return;

  const format = subscription.current;
  const config = subscription.lists?.[format];

  scheduleOrClearSubscriptionAlarm(
    proxyId,
    format,
    subscription.enabled === false ? 0 : config?.refresh_interval,
    subscription.enabled === false ? null : config?.url
  );
}

// -----------------------------------------------------------------------------
// Chrome Implementation Section
// -----------------------------------------------------------------------------

// Manual mode: Apply fixed server configuration (Chrome only)
async function applyManualProxySettings(proxyInfo) {
  if (!proxyInfo) {
    console.log("No proxy info provided, turning off proxy");
    turnOffProxy();
    return { success: false, error: "No proxy information provided" };
  }

  // Clean protocol field to prevent corruption
  const type = cleanProtocol(proxyInfo.protocol || proxyInfo.type || "http");
  const ip = proxyInfo.ip;
  const port = proxyInfo.port;
  const username = proxyInfo.username;
  const password = proxyInfo.password;
  const proxyName = proxyInfo.name || "";
  const bypassUrls = proxyInfo.bypass_rules || "";

  if (!type || !ip || !port) {
    console.log("Missing required proxy information", proxyInfo);
    return { success: false, error: "Missing proxy IP, port, or protocol" };
  }

  // Validate IP and port format before applying
  const validation = validateProxyConfig(ip, port);
  if (!validation.valid) {
    console.log("Invalid proxy configuration:", validation.error);
    return { success: false, error: validation.error };
  }

  let proxyScheme = type === "socks5" ? "socks5" : (type === "socks4" ? "socks4" : "http");
  if (type === "https") proxyScheme = "https";

  let portNumber = parseInt(port);

  // Parse bypassUrls
  let bypassList = ["localhost", "127.0.0.1", "<local>"];
  if (bypassUrls) {
    const customBypass = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    bypassList = [...new Set([...bypassList, ...customBypass])];
  }

  // Merge subscription bypass rules (DIRECT) for Manual Mode
  if (proxyInfo.subscription && proxyInfo.subscription.enabled !== false && proxyInfo.subscription.current) {
    try {
      const format = proxyInfo.subscription.current;
      const subConfig = proxyInfo.subscription.lists ? proxyInfo.subscription.lists[format] : null;

      if (subConfig && subConfig.bypass_rules) {
        const reverse = subConfig.reverse || false;
        const rules = parseSubscriptionRules(subConfig.bypass_rules, format, 'PROXY', '0.0.0.0:0', reverse);

        // Filter for DIRECT rules (exceptions/bypass)
        const directRules = rules.filter(r => r.action === 'DIRECT');
        let addedCount = 0;

        for (const rule of directRules) {
          if (rule.type === 'domain') {
            let pattern = rule.pattern.replace(/^\|\|/, '');
            if (!pattern) continue;

            if (pattern.startsWith('*.')) {
              pattern = pattern.substring(2);
            }

            if (pattern.includes('/')) {
              const ipv4CidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/(8|9|1\d|2\d|3[0-2])$/;
              if (ipv4CidrPattern.test(pattern)) {
                if (!bypassList.includes(pattern)) {
                  bypassList.push(pattern);
                  addedCount++;
                }
              }
              continue;
            }

            if (pattern.includes(':')) {
              const ipPortPattern = /^(\d{1,3}\.){3}\d{1,3}:[1-9]\d{0,4}$/;
              const portPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?:[1-9]\d{0,4}$/;
              if (ipPortPattern.test(pattern) || portPattern.test(pattern)) {
                if (!bypassList.includes(pattern)) {
                  bypassList.push(pattern);
                  addedCount++;
                }
              }
              continue;
            }

            const isIpPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (isIpPattern.test(pattern)) continue;

            if (pattern && !bypassList.includes(pattern)) {
              bypassList.push(pattern);
              addedCount++;
            }
          } else if (rule.type === 'wildcard') {
            let pattern = rule.pattern;
            if (!pattern) continue;

            if (pattern.startsWith('*.')) {
              const domain = pattern.substring(2);
              if (domain.includes('/')) continue;
              const isIpPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
              if (!isIpPattern.test(domain)) {
                pattern = domain;
              }
            }

            if (pattern && !bypassList.includes(pattern)) {
              bypassList.push(pattern);
              addedCount++;
            }
          } else if (rule.type === 'start') {
            console.log(`Skipping URL prefix bypass rule: ${rule.pattern} (not supported by Chrome bypassList)`);
          }
        }
        console.log(`Merged ${addedCount} bypass rules from subscription (Manual Mode)`);
      }
    } catch (e) {
      console.info("Error merging subscription bypass rules:", e);
    }
  }

  currentProxyAuth = { username: username || '', password: password || '' };
  updateSessionAuth(currentProxyAuth);

  chrome.storage.local.set({
    state: { proxy: { mode: 'manual', current: { ...proxyInfo, type: type, ip: ip, port: port, name: proxyName } } }
  }, () => {
    updateBadge();
  });

  setupAuthListener();

  const config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: proxyScheme, host: ip, port: portNumber },
      bypassList: bypassList
    }
  };

  // Check if we have control over proxy settings
  const controlStatus = await getProxySettings();

  if (controlStatus.levelOfControl === "controlled_by_other_extensions") {
    console.warn("Cannot apply proxy - controlled by other extension");
    return {
      success: false,
      error: "Proxy settings are controlled by another extension. Please disable other proxy/VPN extensions."
    };
  }

  chrome.proxy.settings.set({ value: config, scope: "regular" }, async () => {
    if (chrome.runtime.lastError) {
      console.log("Error setting proxy:", chrome.runtime.lastError);
    } else {
      console.log("Manual proxy enabled:", proxyName);
      preconnectToTestUrls();
    }
  });

  return { success: true };
}

// Flag to track if legacy fields have been cleaned up
let legacyFieldsCleaned = false;

// Auto mode: Generate and apply PAC script (Chrome only)
async function applyAutoProxySettings() {
  // Read from new config format (unified storage)
  const result = await new Promise(resolve => {
    chrome.storage.local.get(['config'], resolve);
  });

  const config = result.config || {};
  const scenarios = config.scenarios?.lists || [];
  const currentScenarioId = config.scenarios?.current || 'default';
  const currentScenario = scenarios.find(s => s.id === currentScenarioId);
  const list = currentScenario?.proxies || [];

  const pacScript = generatePacScript(list);

  console.log("Generated PAC Script:", pacScript);

  const pacConfig = {
    mode: "pac_script",
    pacScript: {
      data: pacScript
    }
  };

  setupAuthListener();

  chrome.proxy.settings.set({ value: pacConfig, scope: "regular" }, () => {
    if (chrome.runtime.lastError) {
      console.log("Error setting auto proxy:", chrome.runtime.lastError);
    } else {
      console.log("Auto proxy (PAC) enabled");
      chrome.storage.local.set({ state: { proxy: { mode: 'auto', current: null } } }, () => {
        updateBadge();
      });
    }
  });
}

// Helper function to check if pattern is an IP address
function isIpPattern(pattern) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/([0-9]|[12][0-9]|3[0-2]))?$/;
  return ipv4Pattern.test(pattern);
}

// Generate PAC script logic (Chrome only)
function generatePacScript(list) {
  let script = `function FindProxyForURL(url, host) {
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

`;

  // Check include_rules in proxy list order, use first match
  for (const proxy of list) {
    // Skip disabled proxies
    if (proxy.enabled === false) continue;
    if (!proxy.ip || !proxy.port) continue;

    const type = (proxy.protocol || "HTTP").toUpperCase();
    let proxyType = "PROXY";
    if (type.startsWith("SOCKS")) proxyType = "SOCKS5";
    const proxyStr = `${proxyType} ${proxy.ip}:${proxy.port}`;

    // Determine fallback behavior based on fallback_policy
    const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
    const returnVal = `"${proxyStr}${fallback}"`;

    // Only process include_rules, ignore bypass_rules in auto mode
    if (proxy.include_rules) {
      const includeUrls = proxy.include_rules.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      for (const pattern of includeUrls) {
        // Support regex pattern: /pattern/flags
        if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
          const regexContent = pattern.slice(1, -1);
          const regexFlags = pattern.includes('/') ? pattern.split('/').pop() : '';
          const flags = regexFlags && !regexFlags.includes('/') ? regexFlags : '';
          script += `  if (/${regexContent}/${flags}.test(host)) return ${returnVal};\n`;
        } else if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          script += `  if (/${regexPattern}/.test(host)) return ${returnVal};\n`;
        } else if (isIpPattern(pattern)) {
          // IP address or CIDR range
          if (pattern.includes('/')) {
            // CIDR format: 192.168.1.0/24
            script += `  if (isInCidrRange(host, "${pattern}")) return ${returnVal};\n`;
          } else {
            // Single IP address
            script += `  if (host === "${pattern}") return ${returnVal};\n`;
          }
        } else {
          script += `  if (dnsDomainIs(host, "${pattern}") || host === "${pattern}") return ${returnVal};\n`;
        }
      }
    }

    // Process subscription rules for Auto Mode
    if (proxy.subscription && proxy.subscription.enabled !== false && proxy.subscription.current) {
      try {
        const format = proxy.subscription.current;
        const subConfig = proxy.subscription.lists ? proxy.subscription.lists[format] : null;

        if (subConfig && subConfig.include_rules) {
          const includeUrls = subConfig.include_rules.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

          for (const pattern of includeUrls) {
            if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
              const regexContent = pattern.slice(1, -1);
              const regexFlags = pattern.includes('/') ? pattern.split('/').pop() : '';
              const flags = regexFlags && !regexFlags.includes('/') ? regexFlags : '';
              script += `  if (/${regexContent}/${flags}.test(host)) return ${returnVal};\n`;
            } else if (pattern.includes('*')) {
              const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
              script += `  if (/${regexPattern}/.test(host)) return ${returnVal};\n`;
            } else if (isIpPattern(pattern)) {
              if (pattern.includes('/')) {
                script += `  if (isInCidrRange(host, "${pattern}")) return ${returnVal};\n`;
              } else {
                script += `  if (host === "${pattern}") return ${returnVal};\n`;
              }
            } else {
              script += `  if (dnsDomainIs(host, "${pattern}") || host === "${pattern}") return ${returnVal};\n`;
            }
          }
        }
      } catch (e) {
        console.info("Error merging subscription rules in Auto Mode:", e);
      }
    }
  }

  script += "  return \"DIRECT\";\n}";
  return script;
}

// -----------------------------------------------------------------------------
// Firefox Implementation Section
// -----------------------------------------------------------------------------

function setupFirefoxProxy() {
  if (typeof browser === 'undefined' || !browser.proxy) {
    console.warn("Firefox proxy API not available");
    return;
  }

  browser.proxy.settings.clear({});

  registerFirefoxListener();

  setupAuthListener();
}

// Firefox proxy listener registration - will be called after handleFirefoxRequest is defined
function registerFirefoxListener() {
  if (isFirefox && typeof browser !== 'undefined' && browser.proxy && browser.proxy.onRequest) {
    if (!browser.proxy.onRequest.hasListener(handleFirefoxRequest)) {
      browser.proxy.onRequest.addListener(handleFirefoxRequest, { urls: ["<all_urls>"] });
      console.log("Firefox proxy.onRequest listener registered");
    }
  }
}

async function handleFirefoxRequest(details) {
  // Wait for state to be loaded from storage
  if (!stateLoaded) {
    await stateLoadedPromise;
  }

  // Test Mode Override
  if (firefoxProxyState.testMode && firefoxProxyState.testProxy) {
    return createFirefoxProxyObject(firefoxProxyState.testProxy);
  }

  // Disabled
  if (firefoxProxyState.mode === 'disabled') {
    return null; // Fallthrough to system
  }

  // Manual Mode
  if (firefoxProxyState.mode === 'manual') {
    if (firefoxProxyState.currentProxy) {
      const proxy = firefoxProxyState.currentProxy;
      let bypassAll = proxy.bypass_rules || '';

      // Merge subscription bypass_rules
      if (proxy.subscription && proxy.subscription.enabled !== false && proxy.subscription.current) {
        const format = proxy.subscription.current;
        const subConfig = proxy.subscription.lists ? proxy.subscription.lists[format] : null;
        if (subConfig && subConfig.bypass_rules) {
          bypassAll = bypassAll + '\n' + subConfig.bypass_rules;
        }
      }

      // Check bypass list for manual mode
      if (checkBypass(bypassAll, details.url)) {
        return { type: "direct" };
      }
      return createFirefoxProxyObject(proxy);
    }
    return null; // No config -> System
  }

  // Auto Mode
  if (firefoxProxyState.mode === 'auto') {
    return findProxyForRequestFirefox(details.url);
  }

  return { type: "direct" };
}

function checkBypass(bypassUrls, url) {
  if (!bypassUrls) return false;

  // Standard bypass for localhost
  const host = new URL(url).hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;

  const patterns = bypassUrls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
  for (const pattern of patterns) {
    if (matchesPattern(url, pattern)) {
      return true;
    }
  }
  return false;
}

function findProxyForRequestFirefox(url) {
  const host = new URL(url).hostname;

  // Get proxy list from config
  const config = currentConfig || {};
  const scenarios = config.scenarios?.lists || [];
  const currentScenarioId = config.scenarios?.current || 'default';
  const currentScenario = scenarios.find(s => s.id === currentScenarioId);
  const proxyList = currentScenario?.proxies || [];

  // Check proxy list in order, use first matching include_rules
  for (const proxy of proxyList) {
    if (proxy.enabled === false) continue;
    if (!proxy.ip || !proxy.port) continue;

    const includeUrlsList = [];

    // Add local include_rules
    if (proxy.include_rules) {
      const localRules = proxy.include_rules.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
      includeUrlsList.push(...localRules);
    }

    // Merge subscription include_rules
    if (proxy.subscription && proxy.subscription.enabled !== false && proxy.subscription.current) {
      const format = proxy.subscription.current;
      const subConfig = proxy.subscription.lists ? proxy.subscription.lists[format] : null;
      if (subConfig && subConfig.include_rules) {
        const subRules = subConfig.include_rules.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        includeUrlsList.push(...subRules);
      }
    }

    // Check include rules
    for (const pattern of includeUrlsList) {
      if (matchesPattern(url, pattern)) {
        return createFirefoxProxyObject(proxy);
      }
    }
  }

  return { type: "direct" }; // No match, direct connection
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

function matchesPattern(url, pattern) {
  const host = new URL(url).hostname;
  const port = new URL(url).port;

  // Handle regex pattern: /pattern/ or /pattern/flags
  if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
    const regexContent = pattern.slice(1, -1);
    const regexFlags = pattern.slice(1, -1).split('/').pop();
    const flags = regexFlags && !regexFlags.includes('/') ? regexFlags : '';
    try {
      const regex = new RegExp(regexContent, flags || 'i');
      return regex.test(host);
    } catch (e) {
      return false;
    }
  }

  if (pattern.includes('/')) {
    return isInCidrRange(host, pattern);
  }

  if (pattern.includes('*')) {
    const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexStr}$`, 'i');
    return regex.test(host);
  }

  return host === pattern || host.endsWith('.' + pattern);
}

function createFirefoxProxyObject(proxy) {
  const type = cleanProtocol(proxy.protocol || proxy.type || "http");

  let proxyType = "http";
  let proxyDNS = false;
  let socksVersion = undefined;

  if (type === "socks5") {
    proxyType = "socks";
    proxyDNS = true; // Default to remote DNS for SOCKS5
  } else if (type === "socks4") {
    proxyType = "socks";
    socksVersion = 4;
  } else if (type === "https") {
    proxyType = "https";
  }

  const result = {
    type: proxyType,
    host: proxy.ip,
    port: parseInt(proxy.port),
    username: proxy.username || undefined,
    password: proxy.password || undefined,
    proxyDNS: proxyDNS
  };

  if (socksVersion) {
    result.socksVersion = socksVersion;
  }

  // Include Auth header for HTTP/HTTPS to potentially skip onAuthRequired
  if ((proxyType === 'http' || proxyType === 'https') && proxy.username && proxy.password) {
    result.proxyAuthorizationHeader = 'Basic ' + btoa(proxy.username + ':' + proxy.password);
  }

  return result;
}

// -----------------------------------------------------------------------------
// End Browser-Specific Implementation Sections
// -----------------------------------------------------------------------------

// Preconnect to test URLs to warm up proxy connection and avoid auth popups
function preconnectToTestUrls() {
  console.log("Preconnecting to test URLs to warm up proxy connection");

  // Create a hidden iframe to load test URLs
  TEST_URLS.forEach(url => {
    fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    }).catch(err => {
      // Ignore errors, this is just to warm up the connection
      console.log(`Preconnect to ${url} completed (errors are expected)`);
    });
  });
}

// Set up authentication listener
function setupAuthListener() {
  // Remove previous auth listener first
  try {
    chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
  } catch (e) {
    console.log("No previous auth listener to remove");
  }

  // Add new auth listener - using asyncBlocking in Manifest V3
  chrome.webRequest.onAuthRequired.addListener(
    handleAuthRequest,
    { urls: ["<all_urls>"] },
    ["asyncBlocking"]
  );

  console.log("Auth listener set up with asyncBlocking");
}

// Authentication callback function - handles auth requests
function handleAuthRequest(details, callback) {
  console.log("Auth request received for: " + details.url);

  // Only handle proxy authentication requests
  if (details.isProxy) {
    console.log("Handling proxy auth request");

    if (currentProxyAuth.username && currentProxyAuth.password) {
      console.log("Providing auth credentials for: " + currentProxyAuth.username);

      // Direct callback for better performance and reliability with fetch
      callback({
        authCredentials: {
          username: currentProxyAuth.username,
          password: currentProxyAuth.password
        }
      });
    } else {
      // Helper for local storage fallback
      const checkLocalStorage = () => {
        chrome.storage.local.get(['state'], (result) => {
          if (result.state?.proxy?.current &&
            result.state.proxy.current.username &&
            result.state.proxy.current.password) {

            // Update global variables
            currentProxyAuth.username = result.state.proxy.current.username;
            currentProxyAuth.password = result.state.proxy.current.password;
            // Note: We don't updateSessionAuth here because local storage is the source of truth for persisted settings

            console.log("Retrieved auth credentials from storage");

            setTimeout(() => {
              callback({
                authCredentials: {
                  username: result.state.proxy.current.username,
                  password: result.state.proxy.current.password
                }
              });
            }, 0);
          } else {
            console.log("No auth credentials available");
            callback({ cancel: false });
          }
        });
      };

      // If no auth info in global var, try session storage first (MV3 state safety)
      // This is crucial for testProxyConnection scenarios where credentials are temporary
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get(['currentProxyAuth'], (sessionResult) => {
          if (sessionResult.currentProxyAuth && sessionResult.currentProxyAuth.username) {
            currentProxyAuth = sessionResult.currentProxyAuth;
            console.log("Retrieved auth credentials from session storage");
            callback({
              authCredentials: {
                username: currentProxyAuth.username,
                password: currentProxyAuth.password
              }
            });
          } else {
            checkLocalStorage();
          }
        });
      } else {
        checkLocalStorage();
      }
    }
  } else {
    console.log("Not a proxy auth request");
    callback({ cancel: false });
  }
}

// Turn off proxy
async function turnOffProxy() {
  if (isFirefox) {
    firefoxProxyState.mode = 'disabled';
    updateFirefoxSessionState();
    chrome.storage.local.set({ state: { proxy: { mode: 'disabled', current: null } } }, () => {
      updateBadge();
    });
    browser.proxy.settings.clear({});
  } else {
    // Chrome
    return new Promise(async (resolve) => {
      try {
        // First check current proxy control status
        const currentConfig = await getProxySettings();

        // Check if controlled by other extensions
        if (currentConfig.levelOfControl === "controlled_by_other_extensions") {
          console.warn("Proxy is controlled by other extensions, cannot turn off");
        }

        const config = {
          mode: "system"
        };

        // Clear auth info
        currentProxyAuth = {
          username: '',
          password: ''
        };
        updateSessionAuth(currentProxyAuth);

        // Mark proxy as disabled
        chrome.storage.local.set({ state: { proxy: { mode: 'disabled', current: null } } }, () => {
          updateBadge();
        });

        // Remove auth listener
        try {
          chrome.webRequest.onAuthRequired.removeListener(handleAuthRequest);
        } catch (e) {
          console.log("No auth listener to remove");
        }

        chrome.proxy.settings.set(
          { value: config, scope: "regular" },
          async () => {
            if (chrome.runtime.lastError) {
              console.log("Error turning off proxy:", chrome.runtime.lastError);
            } else {
              console.log("Proxy turned off (mode: system)");
            }
            resolve();
          }
        );
      } catch (error) {
        console.log("Error in turnOffProxy:", error);
        resolve();
      }
    });
  }
}

// Listen for messages from popup or settings page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message.action);

  try {
    if (message.action === "applyProxy") {
      applyProxySettings(message.proxyInfo);
      sendResponse({ success: true });
    } else if (message.action === "refreshProxy") {
      applyProxySettings();
      sendResponse({ success: true });
    } else if (message.action === "turnOffProxy") {
      turnOffProxy();
      sendResponse({ success: true });
    } else if (message.action === "getProxyStatus") {
      chrome.storage.local.get(['state'], (result) => {
        sendResponse({
          enabled: result.state?.proxy?.mode && result.state.proxy.mode !== 'disabled',
          proxyInfo: result.state?.proxy?.current || null
        });
      });
      return true; // Keep message channel open for async response
    } else if (message.action === "testProxyConnection") {
      testProxyConnection(message.proxyInfo, sendResponse);
      return true;
    } else if (message.action === "getPacScript") {
      (async () => {
        try {
          const result = await new Promise(resolve => {
            chrome.storage.local.get(['config'], resolve);
          });

          const config = result.config || {};
          const scenarios = config.scenarios?.lists || [];
          const currentScenarioId = config.scenarios?.current || 'default';
          const currentScenario = scenarios.find(s => s.id === currentScenarioId);
          const list = currentScenario?.proxies || [];

          const script = generatePacScript(list);
          sendResponse({ success: true, script: script });
        } catch (e) {
          console.info("Error generating PAC script:", e);
          sendResponse({ success: false, error: e.message });
        }
      })();
      return true;
    } else if (message.action === "subscriptionUpdated") {
      console.log(`[Worker] Subscription updated: ${message.proxyId}, format: ${message.format}`);
      applyProxySettings();
      sendResponse({ success: true });
    } else if (message.action === "scheduleSubscriptionRefresh") {
      scheduleSubscriptionRefresh(
        message.proxyId,
        message.format,
        message.refreshInterval,
        message.url
      );
      sendResponse({ success: true });
    } else {
      console.warn("Unknown action:", message.action);
      sendResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.log("Error handling message:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

async function testProxyConnection(proxyInfo, sendResponse) {
  const previousAuth = { ...currentProxyAuth };

  // Set test auth
  currentProxyAuth = {
    username: proxyInfo.username || '',
    password: proxyInfo.password || ''
  };
  updateSessionAuth(currentProxyAuth);

  // Ensure listener is active
  setupAuthListener();

  // Clean protocol field to prevent corruption
  const type = cleanProtocol(proxyInfo.protocol || "http");

  // Validate IP format
  const ipValidation = validateProxyConfig(proxyInfo.ip, proxyInfo.port);
  if (!ipValidation.valid) {
    sendResponse({ success: false, error: `Invalid proxy configuration: ${ipValidation.error}` });
    return;
  }

  if (isFirefox) {
    // -------------------------
    // Firefox Test Implementation
    // -------------------------
    // Backup state
    const previousMode = firefoxProxyState.mode;

    // Set Test Mode
    firefoxProxyState.testMode = true;
    firefoxProxyState.testProxy = proxyInfo;
    updateFirefoxSessionState();

    // In Firefox, we rely on onRequest which reads the state
    // We don't need to "set" anything other than the state variables
    console.log("Firefox: Enabled Test Mode for connectivity check");

    try {
      // Wait a bit for state to be picked up
      await new Promise(resolve => setTimeout(resolve, 500));

      const testResult = await runConnectivityTest(proxyInfo);
      sendResponse(testResult);

    } catch (error) {
      sendResponse({ success: false, error: error.message || "Connection failed" });
    } finally {
      // Restore state
      firefoxProxyState.testMode = false;
      firefoxProxyState.testProxy = null;
      firefoxProxyState.mode = previousMode;
      currentProxyAuth = previousAuth;
      updateSessionAuth(currentProxyAuth);
      updateFirefoxSessionState();
    }
  } else {
    // -------------------------
    // Chrome Test Implementation
    // -------------------------
    let proxyScheme = type === "socks5" ? "socks5" : (type === "socks4" ? "socks4" : "http");
    if (type === "https") proxyScheme = "https";

    // Config for test
    const config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: proxyScheme,
          host: proxyInfo.ip,
          port: parseInt(proxyInfo.port)
        },
        bypassList: ["<local>"]
      }
    };

    try {
      // Apply test proxy
      await new Promise((resolve, reject) => {
        chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // Wait a bit for proxy settings to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      const testResult = await runConnectivityTest(proxyInfo);
      sendResponse(testResult);

    } catch (error) {
      sendResponse({ success: false, error: error.message || "Connection failed" });
    } finally {
      // Restore previous settings
      currentProxyAuth = previousAuth;
      updateSessionAuth(currentProxyAuth);
      applyProxySettings(); // Re-apply whatever was in storage
    }
  }
}

// Shared connectivity test logic
async function runConnectivityTest(proxyInfo) {
  // First test: Try to connect to a URL that should fail if proxy is invalid
  const invalidTargetTest = await testProxyConnectivity(proxyInfo);
  if (!invalidTargetTest.success) {
    return { success: false, error: invalidTargetTest.error };
  }

  // Phase 2: Test with actual URLs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 8000); // 8s timeout

  const startTime = Date.now();

  const testUrls = [
    "https://www.baidu.com/favicon.ico?_t=" + Date.now(),
    "https://httpbin.org/status/200?_t=" + Date.now()
  ];

  let testResult = null;
  let lastError = null;

  // Try each URL until one succeeds
  for (const testUrl of testUrls) {
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok && response.status === 200) {
        const latency = Date.now() - startTime;
        testResult = { success: true, latency: latency, url: testUrl };
        break;
      } else {
        lastError = `HTTP ${response.status} from ${testUrl}`;
      }
    } catch (error) {
      lastError = `${error.message} for ${testUrl}`;
      continue; // Try next URL
    }
  }

  clearTimeout(timeoutId);

  if (testResult && testResult.success) {
    return { success: true, latency: testResult.latency, testUrl: testResult.url };
  } else {
    return { success: false, error: lastError || "All test URLs failed" };
  }
}

// Helper function to test if proxy is actually being used
async function testProxyConnectivity(proxyInfo) {
  const testHost = "invalid-test-host-12345.com";
  const testUrl = `https://${testHost}/test`;

  let timeoutId;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(testUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      return {
        success: false,
        error: "Proxy connectivity test failed - request did not go through proxy"
      };
    }
    return { success: true };

  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error.name === 'TypeError' && error.message.includes('fetch')) return { success: true };
    if (error.name === 'AbortError') return { success: true };
    return { success: false, error: `Proxy connectivity test failed: ${error.message}` };
  }
}

// Subscription rules parser for worker context
function parseSubscriptionRuleLine(line, format, defaultType, defaultAddress, reverse) {
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

function parseSubscriptionRules(content, format, proxyType, proxyAddress, reverse = false) {
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
    const rule = parseSubscriptionRuleLine(line, actualFormat, proxyType, proxyAddress, reverse);
    if (rule) {
      rules.push(rule);
    }
  }

  return rules;
}

// Register Firefox proxy listener after all functions are defined
registerFirefoxListener();
