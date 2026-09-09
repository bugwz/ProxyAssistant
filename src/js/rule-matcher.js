// Shared routing rules for the background engines and popup.
const ProxyRuleMatcher = (() => {
  const MAX_PROXY_RULES_PER_PROXY = 20000;
  const MAX_PROXY_REGEX_LENGTH = 512;

  function isIpPattern(pattern) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/([0-9]|[12][0-9]|3[0-2]))?$/;
    return ipv4Pattern.test(pattern);
  }

  function isSafeProxyRegexSource(source) {
    if (!source || source.length > MAX_PROXY_REGEX_LENGTH) return false;
    if (/\\[1-9]/.test(source)) return false;

    const normalized = source
      .replace(/\\./g, 'x')
      .replace(/\[(?:\\.|[^\]])*\]/g, 'x');
    const nestedQuantifier = /\((?:[^()]|\([^()]*\))*(?:[+*]|\{\d+,?\d*\}|\|)(?:[^()]|\([^()]*\))*\)(?:[+*]|\{\d+,?\d*\})/;
    return !nestedQuantifier.test(normalized);
  }

  function parseProxyRegexPattern(pattern) {
    const prefix = pattern.match(/^(host|url):/);
    if (prefix) pattern = pattern.slice(prefix[0].length);
    if (!pattern.startsWith('/') || pattern.length <= 2) return null;
    const lastSlash = pattern.lastIndexOf('/');
    if (lastSlash <= 0) return null;
    const source = pattern.slice(1, lastSlash);
    const target = prefix ? prefix[1] : (source.includes('/') ? 'url' : 'host');
    const flags = pattern.slice(lastSlash + 1) || (target === 'host' ? 'i' : '');
    if (!/^[gimsuy]*$/.test(flags) || !isSafeProxyRegexSource(source)) return null;
    try {
      new RegExp(source, flags);
      return { source, flags, target };
    } catch (error) {
      return null;
    }
  }

  function splitProxyRulePatterns(value) {
    const patterns = [];
    for (const line of String(value || '').split(/[\r\n]+/)) {
      let remaining = line.trim();
      while (remaining) {
        let end = remaining.indexOf(',');
        if (/^(?:(?:host|url):)?\//.test(remaining)) {
          const opening = remaining.indexOf('/');
          let escaped = false;
          let inClass = false;
          end = -1;
          for (let i = opening + 1; i < remaining.length; i += 1) {
            const char = remaining[i];
            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            if (char === '[') inClass = true;
            if (char === ']') inClass = false;
            if (char === '/' && !inClass && /^[gimsuy]*\s*(?:,|$)/.test(remaining.slice(i + 1))) {
              end = remaining.indexOf(',', i + 1);
              break;
            }
          }
        }
        patterns.push((end < 0 ? remaining : remaining.slice(0, end)).trim());
        remaining = end < 0 ? '' : remaining.slice(end + 1).trim();
      }
    }
    return patterns.filter(Boolean);
  }

  function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  function isInCidrRange(ip, cidr) {
    if (!isIPv4Address(ip) || !isIPv4Address(cidr.split('/')[0])) return false;
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

  function isIPv4Address(value) {
    return value.split('.').length === 4
      && value.split('.').every(part => /^[0-9]{1,3}$/.test(part) && Number(part) <= 255);
  }

  function compileFirefoxRulePatterns(patterns) {
    const domainPatterns = new Set();
    const cidrPatterns = [];
    const hostRegexes = [];
    const urlRegexes = [];

    patterns.slice(0, MAX_PROXY_RULES_PER_PROXY).forEach(pattern => {
      const parsedRegex = parseProxyRegexPattern(pattern);
      if (parsedRegex) {
        (parsedRegex.target === 'url' ? urlRegexes : hostRegexes).push(new RegExp(parsedRegex.source, parsedRegex.flags));
        return;
      }
      if (/^(?:(?:host|url):)?\//.test(pattern)) return;

      if (isIpPattern(pattern) && pattern.includes('/')) {
        cidrPatterns.push(pattern);
        return;
      }

      if (pattern.includes('*')) {
        const regexSource = pattern
          .replace(/[+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexSource}$`, pattern.includes('/') ? '' : 'i');
        if (pattern.includes('/')) urlRegexes.push(regex);
        else hostRegexes.push(regex);
        return;
      }

      domainPatterns.add(pattern.toLowerCase());
    });

    return { domainPatterns, cidrPatterns, hostRegexes, urlRegexes };
  }

  function matchesCompiledFirefoxRules(matcher, url, urlParts) {
    const host = urlParts.host.toLowerCase();
    let candidate = host;
    while (candidate) {
      if (matcher.domainPatterns.has(candidate)) return true;
      const separator = candidate.indexOf('.');
      if (separator === -1) break;
      candidate = candidate.substring(separator + 1);
    }

    if (isIPv4Address(host) && matcher.cidrPatterns.some(cidr => isInCidrRange(host, cidr))) {
      return true;
    }
    const testRegex = (regex, value) => {
      regex.lastIndex = 0;
      return regex.test(value);
    };
    if (matcher.hostRegexes.some(regex => testRegex(regex, host))) return true;
    return matcher.urlRegexes.some(regex => testRegex(regex, url));
  }

  return { isIpPattern, isSafeProxyRegexSource, parseProxyRegexPattern, splitProxyRulePatterns, ipToNumber, isInCidrRange, isIPv4Address, compileFirefoxRulePatterns, matchesCompiledFirefoxRules };
})();
