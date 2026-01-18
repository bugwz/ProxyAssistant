describe('Worker.js - Utility Functions', () => {
  function cleanProtocol(protocol) {
    if (!protocol || typeof protocol !== 'string') return 'http';
    let cleaned = protocol.replace(/^(https?:\/?\/?)/i, '').trim().toLowerCase();
    const validProtocols = ['http', 'https', 'socks4', 'socks5', 'socks'];
    if (!validProtocols.includes(cleaned)) return 'http';
    return cleaned;
  }

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

  function generatePacScript(list) {
    let script = "function FindProxyForURL(url, host) {\n";

    for (const proxy of list) {
      if (proxy.disabled === true) continue;
      if (!proxy.ip || !proxy.port) continue;

      const type = (proxy.protocol || "HTTP").toUpperCase();
      let proxyType = "PROXY";
      if (type.startsWith("SOCKS")) proxyType = "SOCKS5";
      const proxyStr = `${proxyType} ${proxy.ip}:${proxy.port}`;

      const fallback = proxy.fallback_policy === "reject" ? "" : "; DIRECT";
      const returnVal = `"${proxyStr}${fallback}"`;

      if (proxy.include_urls) {
        const includeUrls = proxy.include_urls.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        for (const pattern of includeUrls) {
          if (pattern.includes('*')) {
            const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
            script += `  if (/${regexPattern}/.test(host)) return ${returnVal};\n`;
          } else {
            script += `  if (dnsDomainIs(host, "${pattern}") || host === "${pattern}") return ${returnVal};\n`;
          }
        }
      }
    }

    script += "  return \"DIRECT\";\n}";
    return script;
  }

  function matchesPattern(url, pattern) {
    const host = new URL(url).hostname;

    if (pattern.includes('*')) {
      const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexStr}$`, 'i');
      return regex.test(host);
    } else {
      return host === pattern || host.endsWith('.' + pattern);
    }
  }

  function checkBypass(bypassUrls, url) {
    if (!bypassUrls) return false;

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

  function createFirefoxProxyObject(proxy) {
    const type = cleanProtocol(proxy.protocol || proxy.type || "http");

    let proxyType = "http";
    let proxyDNS = false;
    let socksVersion = undefined;

    if (type === "socks5") {
      proxyType = "socks";
      proxyDNS = true;
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

    if ((proxyType === 'http' || proxyType === 'https') && proxy.username && proxy.password) {
      result.proxyAuthorizationHeader = 'Basic ' + btoa(proxy.username + ':' + proxy.password);
    }

    return result;
  }

  describe('cleanProtocol', () => {
    test('should return http for null input', () => {
      expect(cleanProtocol(null)).toBe('http');
    });

    test('should return http for undefined input', () => {
      expect(cleanProtocol(undefined)).toBe('http');
    });

    test('should return http for empty string', () => {
      expect(cleanProtocol('')).toBe('http');
    });

    test('should clean http:// prefix', () => {
      expect(cleanProtocol('http://example.com')).toBe('http');
    });

    test('should clean https:// prefix', () => {
      expect(cleanProtocol('https://example.com')).toBe('http');
    });

    test('should normalize to lowercase', () => {
      expect(cleanProtocol('HTTP')).toBe('http');
      expect(cleanProtocol('HTTPS')).toBe('https');
      expect(cleanProtocol('SOCKS5')).toBe('socks5');
    });

    test('should validate and return valid protocols', () => {
      expect(cleanProtocol('http')).toBe('http');
      expect(cleanProtocol('https')).toBe('https');
      expect(cleanProtocol('socks4')).toBe('socks4');
      expect(cleanProtocol('socks5')).toBe('socks5');
      expect(cleanProtocol('socks')).toBe('socks');
    });

    test('should return http for invalid protocols', () => {
      expect(cleanProtocol('ftp')).toBe('http');
      expect(cleanProtocol('invalid')).toBe('http');
      expect(cleanProtocol('ssh')).toBe('http');
    });
  });

  describe('validateProxyConfig', () => {
    test('should validate valid IPv4 addresses', () => {
      expect(validateProxyConfig('192.168.1.1', '8080').valid).toBe(true);
      expect(validateProxyConfig('10.0.0.1', '3128').valid).toBe(true);
      expect(validateProxyConfig('255.255.255.255', '80').valid).toBe(true);
    });

    test('should validate valid hostnames', () => {
      expect(validateProxyConfig('proxy.example.com', '8080').valid).toBe(true);
      expect(validateProxyConfig('my-proxy', '3128').valid).toBe(true);
    });

    test('should reject invalid hostnames', () => {
      expect(validateProxyConfig('-invalid.com', '8080').valid).toBe(false);
      expect(validateProxyConfig('invalid-.com', '8080').valid).toBe(false);
    });

    test('should validate port numbers', () => {
      expect(validateProxyConfig('192.168.1.1', '1').valid).toBe(true);
      expect(validateProxyConfig('192.168.1.1', '65535').valid).toBe(true);
      expect(validateProxyConfig('192.168.1.1', '80').valid).toBe(true);
    });

    test('should reject invalid port numbers', () => {
      expect(validateProxyConfig('192.168.1.1', '0').valid).toBe(false);
      expect(validateProxyConfig('192.168.1.1', '65536').valid).toBe(false);
      expect(validateProxyConfig('192.168.1.1', '-1').valid).toBe(false);
      expect(validateProxyConfig('192.168.1.1', 'abc').valid).toBe(false);
    });

    test('should return error messages for invalid configs', () => {
      const result = validateProxyConfig('-invalid.com', '8080');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generatePacScript', () => {
    test('should generate basic PAC script', () => {
      const list = [{
        name: 'Test Proxy',
        protocol: 'http',
        ip: '192.168.1.1',
        port: '8080',
        include_urls: 'example.com',
        fallback_policy: 'direct'
      }];

      const script = generatePacScript(list);
      expect(script).toContain('function FindProxyForURL(url, host) {');
      expect(script).toContain('PROXY 192.168.1.1:8080');
      expect(script).toContain('DIRECT');
      expect(script).toContain('return "DIRECT";');
    });

    test('should skip disabled proxies', () => {
      const list = [
        {
          name: 'Disabled Proxy',
          protocol: 'http',
          ip: '192.168.1.1',
          port: '8080',
          include_urls: 'example.com',
          disabled: true
        },
        {
          name: 'Enabled Proxy',
          protocol: 'http',
          ip: '10.0.0.1',
          port: '3128',
          include_urls: 'test.com',
          fallback_policy: 'direct'
        }
      ];

      const script = generatePacScript(list);
      expect(script).not.toContain('192.168.1.1:8080');
      expect(script).toContain('10.0.0.1:3128');
    });

    test('should skip proxies without ip or port', () => {
      const list = [
        {
          name: 'Invalid Proxy',
          protocol: 'http',
          ip: '',
          port: '8080',
          include_urls: 'example.com'
        }
      ];

      const script = generatePacScript(list);
      expect(script).toContain('return "DIRECT"');
      expect(script).not.toContain('PROXY');
    });

    test('should handle wildcard patterns', () => {
      const list = [{
        name: 'Wildcard Proxy',
        protocol: 'http',
        ip: '192.168.1.1',
        port: '8080',
        include_urls: '*.example.com',
        fallback_policy: 'direct'
      }];

      const script = generatePacScript(list);
      expect(script).toContain('.*\\.example\\.com');
    });

    test('should handle SOCKS5 proxies', () => {
      const list = [{
        name: 'SOCKS5 Proxy',
        protocol: 'socks5',
        ip: '192.168.1.1',
        port: '1080',
        include_urls: 'example.com',
        fallback_policy: 'direct'
      }];

      const script = generatePacScript(list);
      expect(script).toContain('SOCKS5 192.168.1.1:1080');
    });

    test('should handle reject fallback policy', () => {
      const list = [{
        name: 'Reject Proxy',
        protocol: 'http',
        ip: '192.168.1.1',
        port: '8080',
        include_urls: 'example.com',
        fallback_policy: 'reject'
      }];

      const script = generatePacScript(list);
      expect(script).not.toContain('; DIRECT');
    });

    test('should handle multiple proxies', () => {
      const list = [
        {
          name: 'Proxy 1',
          protocol: 'http',
          ip: '192.168.1.1',
          port: '8080',
          include_urls: 'site1.com'
        },
        {
          name: 'Proxy 2',
          protocol: 'socks5',
          ip: '10.0.0.1',
          port: '1080',
          include_urls: 'site2.com'
        }
      ];

      const script = generatePacScript(list);
      expect(script).toContain('192.168.1.1:8080');
      expect(script).toContain('10.0.0.1:1080');
    });

    test('should handle empty proxy list', () => {
      const script = generatePacScript([]);
      expect(script).toContain('return "DIRECT";');
    });

    test('should handle proxy with multiple include URLs', () => {
      const list = [{
        name: 'Multi URL Proxy',
        protocol: 'http',
        ip: '192.168.1.1',
        port: '8080',
        include_urls: 'site1.com\nsite2.com,site3.com',
        fallback_policy: 'direct'
      }];

      const script = generatePacScript(list);
      expect(script).toContain('site1.com');
      expect(script).toContain('site2.com');
      expect(script).toContain('site3.com');
    });
  });

  describe('matchesPattern', () => {
    test('should match exact hostname', () => {
      expect(matchesPattern('http://example.com', 'example.com')).toBe(true);
      expect(matchesPattern('http://www.example.com', 'example.com')).toBe(true);
    });

    test('should match subdomain', () => {
      expect(matchesPattern('http://sub.example.com', 'example.com')).toBe(true);
      expect(matchesPattern('http://deep.sub.example.com', 'example.com')).toBe(true);
    });

    test('should not match unrelated domains', () => {
      expect(matchesPattern('http://example.com', 'other.com')).toBe(false);
      expect(matchesPattern('http://test.com', 'example.com')).toBe(false);
    });

    test('should match wildcard patterns', () => {
      expect(matchesPattern('http://sub.example.com', '*.example.com')).toBe(true);
      expect(matchesPattern('http://test.example.com', '*.example.com')).toBe(true);
    });

    test('should handle case insensitive matching', () => {
      expect(matchesPattern('http://EXAMPLE.COM', 'example.com')).toBe(true);
      expect(matchesPattern('http://Sub.Example.Com', '*.example.com')).toBe(true);
    });
  });

  describe('checkBypass', () => {
    test('should return false for null bypassUrls', () => {
      expect(checkBypass(null, 'http://example.com')).toBe(false);
    });

    test('should return false for empty bypassUrls', () => {
      expect(checkBypass('', 'http://example.com')).toBe(false);
    });

    test('should bypass matching patterns', () => {
      expect(checkBypass('example.com', 'http://example.com')).toBe(true);
      expect(checkBypass('example.com', 'http://sub.example.com')).toBe(true);
    });

    test('should not bypass non-matching patterns', () => {
      expect(checkBypass('example.com', 'http://other.com')).toBe(false);
    });

    test('should handle multiple bypass URLs', () => {
      expect(checkBypass('example.com\ntest.com', 'http://test.com')).toBe(true);
      expect(checkBypass('example.com,test.com', 'http://example.com')).toBe(true);
    });

    test('should handle wildcard in bypass URLs', () => {
      expect(checkBypass('*.example.com', 'http://sub.example.com')).toBe(true);
    });
  });

  describe('createFirefoxProxyObject', () => {
    test('should create HTTP proxy object', () => {
      const proxy = {
        protocol: 'http',
        ip: '192.168.1.1',
        port: '8080'
      };

      const result = createFirefoxProxyObject(proxy);
      expect(result.type).toBe('http');
      expect(result.host).toBe('192.168.1.1');
      expect(result.port).toBe(8080);
    });

    test('should create HTTPS proxy object', () => {
      const proxy = {
        protocol: 'https',
        ip: '192.168.1.1',
        port: '8080'
      };

      const result = createFirefoxProxyObject(proxy);
      expect(result.type).toBe('https');
    });

    test('should create SOCKS5 proxy object with remote DNS', () => {
      const proxy = {
        protocol: 'socks5',
        ip: '192.168.1.1',
        port: '1080'
      };

      const result = createFirefoxProxyObject(proxy);
      expect(result.type).toBe('socks');
      expect(result.proxyDNS).toBe(true);
      expect(result.socksVersion).toBeUndefined();
    });

    test('should create SOCKS4 proxy object', () => {
      const proxy = {
        protocol: 'socks4',
        ip: '192.168.1.1',
        port: '1080'
      };

      const result = createFirefoxProxyObject(proxy);
      expect(result.type).toBe('socks');
      expect(result.socksVersion).toBe(4);
    });

    test('should include authentication when provided', () => {
      const proxy = {
        protocol: 'http',
        ip: '192.168.1.1',
        port: '8080',
        username: 'user',
        password: 'pass'
      };

      const result = createFirefoxProxyObject(proxy);
      expect(result.username).toBe('user');
      expect(result.password).toBe('pass');
    });

    test('should handle protocol type field', () => {
      const proxy = {
        type: 'http',
        ip: '192.168.1.1',
        port: '8080'
      };

      const result = createFirefoxProxyObject(proxy);
      expect(result.type).toBe('http');
    });
  });
});
