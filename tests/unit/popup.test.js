describe('Popup.js - Proxy Matching Functions', () => {
  function checkMatch(patternsStr, hostname) {
    if (!patternsStr) return false;
    const patterns = patternsStr.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        try {
          const regexStr = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          if (new RegExp(regexStr).test(hostname)) return true;
        } catch (e) { }
      } else {
        let normalizedPattern = pattern;
        if (normalizedPattern.startsWith('.')) {
          normalizedPattern = normalizedPattern.substring(1);
        }

        if (hostname === normalizedPattern || hostname.endsWith('.' + normalizedPattern)) return true;
      }
    }
    return false;
  }

  function getAutoProxy(proxyList, hostname) {
    if (!proxyList || !hostname) return null;

    for (const proxy of proxyList) {
      if (proxy.enabled === false) continue;
      if (!proxy.ip || !proxy.port) continue;

      if (checkMatch(proxy.include_rules, hostname)) {
        return proxy;
      }
    }

    return null;
  }

  describe('checkMatch', () => {
    test('should return false for empty patterns', () => {
      expect(checkMatch('', 'example.com')).toBe(false);
      expect(checkMatch(null, 'example.com')).toBe(false);
      expect(checkMatch(undefined, 'example.com')).toBe(false);
    });

    test('should match exact hostname', () => {
      expect(checkMatch('example.com', 'example.com')).toBe(true);
      expect(checkMatch('test.com', 'test.com')).toBe(true);
    });

    test('should match subdomain', () => {
      expect(checkMatch('example.com', 'www.example.com')).toBe(true);
      expect(checkMatch('example.com', 'sub.example.com')).toBe(true);
      expect(checkMatch('example.com', 'deep.sub.example.com')).toBe(true);
    });

    test('should not match unrelated domains', () => {
      expect(checkMatch('example.com', 'test.com')).toBe(false);
      expect(checkMatch('example.com', 'example.org')).toBe(false);
    });

    test('should match wildcard patterns', () => {
      expect(checkMatch('*.example.com', 'www.example.com')).toBe(true);
      expect(checkMatch('*.example.com', 'sub.example.com')).toBe(true);
      expect(checkMatch('*test.com', 'atest.com')).toBe(true);
      expect(checkMatch('example.*', 'example.com')).toBe(true);
    });

    test('should handle leading dot pattern', () => {
      expect(checkMatch('.example.com', 'example.com')).toBe(true);
      expect(checkMatch('.example.com', 'www.example.com')).toBe(true);
    });

    test('should handle multiple patterns separated by newline', () => {
      expect(checkMatch('example.com\ntest.com', 'example.com')).toBe(true);
      expect(checkMatch('example.com\ntest.com', 'test.com')).toBe(true);
      expect(checkMatch('example.com\ntest.com', 'other.com')).toBe(false);
    });

    test('should handle multiple patterns separated by comma', () => {
      expect(checkMatch('example.com,test.com', 'example.com')).toBe(true);
      expect(checkMatch('example.com,test.com', 'test.com')).toBe(true);
      expect(checkMatch('example.com,test.com', 'other.com')).toBe(false);
    });

    test('should trim whitespace from patterns', () => {
      expect(checkMatch('  example.com  ', 'example.com')).toBe(true);
      expect(checkMatch(' example.com ', 'example.com')).toBe(true);
    });

    test('should handle empty strings in patterns', () => {
      const result = checkMatch('example.com\n\ntest.com', 'test.com');
      expect(result).toBe(true);
    });

    test('should handle invalid regex patterns gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      expect(checkMatch('[invalid', 'example.com')).toBe(false);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should match subdomain patterns', () => {
      expect(checkMatch('api.example.com', 'api.example.com')).toBe(true);
    });
  });

  describe('getAutoProxy', () => {
    test('should return null for empty proxy list', () => {
      expect(getAutoProxy([], 'example.com')).toBe(null);
    });

    test('should return null for null proxy list', () => {
      expect(getAutoProxy(null, 'example.com')).toBe(null);
    });

    test('should return null for empty hostname', () => {
      const list = [{ ip: '192.168.1.1', port: '8080', include_rules: 'example.com' }];
      expect(getAutoProxy(list, '')).toBe(null);
    });

    test('should return null for null hostname', () => {
      const list = [{ ip: '192.168.1.1', port: '8080', include_rules: 'example.com' }];
      expect(getAutoProxy(list, null)).toBe(null);
    });

    test('should skip disabled proxies', () => {
      const list = [
        { ip: '192.168.1.1', port: '8080', include_rules: 'example.com', enabled: false },
        { ip: '10.0.0.1', port: '3128', include_rules: 'test.com' }
      ];
      expect(getAutoProxy(list, 'test.com')).toEqual(list[1]);
    });

    test('should skip proxies without ip or port', () => {
      const list = [
        { ip: '', port: '8080', include_rules: 'example.com' },
        { ip: '10.0.0.1', port: '', include_rules: 'test.com' },
        { ip: '192.168.1.1', port: '8080', include_rules: 'example.com' }
      ];
      expect(getAutoProxy(list, 'example.com')).toEqual(list[2]);
    });

    test('should return first matching proxy', () => {
      const list = [
        { name: 'Proxy1', ip: '192.168.1.1', port: '8080', include_rules: 'example.com' },
        { name: 'Proxy2', ip: '10.0.0.1', port: '3128', include_rules: 'test.com' }
      ];
      expect(getAutoProxy(list, 'example.com')).toEqual(list[0]);
      expect(getAutoProxy(list, 'test.com')).toEqual(list[1]);
    });

    test('should return null when no match found', () => {
      const list = [
        { ip: '192.168.1.1', port: '8080', include_rules: 'example.com' }
      ];
      expect(getAutoProxy(list, 'nonexistent.com')).toBe(null);
    });

    test('should handle multiple include_rules', () => {
      const list = [
        {
          ip: '192.168.1.1',
          port: '8080',
          include_rules: 'example.com\ntest.com'
        }
      ];
      expect(getAutoProxy(list, 'example.com')).toEqual(list[0]);
      expect(getAutoProxy(list, 'test.com')).toEqual(list[0]);
      expect(getAutoProxy(list, 'other.com')).toBe(null);
    });

    test('should handle wildcard patterns', () => {
      const list = [
        {
          ip: '192.168.1.1',
          port: '8080',
          include_rules: '*.example.com'
        }
      ];
      expect(getAutoProxy(list, 'www.example.com')).toEqual(list[0]);
      expect(getAutoProxy(list, 'api.example.com')).toEqual(list[0]);
    });

    test('should return null for proxy with empty include_rules', () => {
      const list = [
        { ip: '192.168.1.1', port: '8080', include_rules: '' }
      ];
      expect(getAutoProxy(list, 'example.com')).toBe(null);
    });

    test('should return null for proxy with undefined include_rules', () => {
      const list = [
        { ip: '192.168.1.1', port: '8080' }
      ];
      expect(getAutoProxy(list, 'example.com')).toBe(null);
    });

    test('should return proxy when hostname is subdomain of pattern', () => {
      const list = [
        {
          ip: '192.168.1.1',
          port: '8080',
          include_rules: '.example.com'
        }
      ];
      expect(getAutoProxy(list, 'www.example.com')).toEqual(list[0]);
      expect(getAutoProxy(list, 'example.com')).toEqual(list[0]);
    });
  });
});
