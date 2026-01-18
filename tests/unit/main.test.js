describe('Main.js - Validation Functions', () => {
  function validateIPAddress(ip) {
    if (!ip || ip.trim() === '') return { isValid: false, error: 'IP地址不能为空' };
    var parts = ip.split('.');
    if (parts.length !== 4) return { isValid: false, error: 'IP地址格式错误' };
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === '') return { isValid: false, error: 'IP 地址的部分数字块不能为空' };
      if (!/^\d+$/.test(part)) return { isValid: false, error: 'IP 地址的数字块必须为数字' };
      if (part.length > 1 && part[0] === '0') return { isValid: false, error: 'IP 地址的数字块不能有前导零' };
      var num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) return { isValid: false, error: 'IP 地址的数字块必须在 0-255 范围内' };
    }
    return { isValid: true, error: '' };
  }

  function isValidHost(val) {
    var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(val)) return true;
    var hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
    return hostnameRegex.test(val);
  }

  describe('validateIPAddress', () => {
    test('should validate valid IPv4 addresses', () => {
      expect(validateIPAddress('192.168.1.1').isValid).toBe(true);
      expect(validateIPAddress('10.0.0.1').isValid).toBe(true);
      expect(validateIPAddress('255.255.255.255').isValid).toBe(true);
      expect(validateIPAddress('0.0.0.0').isValid).toBe(true);
    });

    test('should reject empty IP addresses', () => {
      const result = validateIPAddress('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject IP addresses with wrong number of parts', () => {
      expect(validateIPAddress('192.168.1').isValid).toBe(false);
      expect(validateIPAddress('192.168.1.1.1').isValid).toBe(false);
    });

    test('should reject IP addresses with non-numeric parts', () => {
      expect(validateIPAddress('192.168.1.a').isValid).toBe(false);
      expect(validateIPAddress('abc.def.ghi.jkl').isValid).toBe(false);
    });

    test('should reject IP addresses with out-of-range values', () => {
      expect(validateIPAddress('256.1.1.1').isValid).toBe(false);
      expect(validateIPAddress('1.256.1.1').isValid).toBe(false);
      expect(validateIPAddress('1.1.256.1').isValid).toBe(false);
      expect(validateIPAddress('1.1.1.256').isValid).toBe(false);
    });

    test('should reject IP addresses with leading zeros', () => {
      expect(validateIPAddress('192.168.01.1').isValid).toBe(false);
      expect(validateIPAddress('01.1.1.1').isValid).toBe(false);
    });

    test('should reject IP addresses with empty parts', () => {
      expect(validateIPAddress('192.168..1').isValid).toBe(false);
      expect(validateIPAddress('.1.1.1').isValid).toBe(false);
    });

    test('should accept single-digit octets', () => {
      expect(validateIPAddress('1.1.1.1').isValid).toBe(true);
      expect(validateIPAddress('0.0.0.1').isValid).toBe(true);
    });

    test('should accept two-digit octets', () => {
      expect(validateIPAddress('10.20.30.40').isValid).toBe(true);
      expect(validateIPAddress('99.88.77.66').isValid).toBe(true);
    });
  });

  describe('isValidHost', () => {
    test('should validate valid IPv4 addresses', () => {
      expect(isValidHost('192.168.1.1')).toBe(true);
      expect(isValidHost('10.0.0.1')).toBe(true);
    });

    test('should validate valid hostnames', () => {
      expect(isValidHost('example.com')).toBe(true);
      expect(isValidHost('sub.example.com')).toBe(true);
      expect(isValidHost('my-proxy-server')).toBe(true);
      expect(isValidHost('proxy123.example.org')).toBe(true);
    });

    test('should reject invalid hostnames', () => {
      expect(isValidHost('-invalid.com')).toBe(false);
      expect(isValidHost('invalid-.com')).toBe(false);
      expect(isValidHost('')).toBe(false);
    });
  });
});
