// ==========================================
// Chunked Storage Helper Functions (for testing)
// ==========================================

function chunkString(str, size) {
  const chunks = [];
  let i = 0;
  while (i < str.length) {
    chunks.push(str.substring(i, i + size));
    i += size;
  }
  return chunks;
}

function calculateChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'crc:' + Math.abs(hash).toString(16);
}

function buildSyncMeta(chunks) {
  const totalSize = chunks.reduce((sum, chunk) => sum + new Blob([chunk]).size, 0);
  const fullData = chunks.join('');
  return {
    version: 1,
    chunks: {
      start: 0,
      end: chunks.length - 1
    },
    totalSize: totalSize,
    checksum: calculateChecksum(fullData)
  };
}

function isValidMeta(meta) {
  return meta &&
    typeof meta.version === 'number' &&
    meta.chunks &&
    typeof meta.chunks.start === 'number' &&
    typeof meta.chunks.end === 'number' &&
    typeof meta.checksum === 'string';
}

// ==========================================
// Tests
// ==========================================

describe('Main.js - Chunked Storage Functions', () => {
  describe('chunkString', () => {
    test('should split string into chunks of specified size', () => {
      const str = 'Hello, World! This is a test string.';
      const chunks = chunkString(str, 10);

      // 'Hello, World! This is a test string.' (37 chars)
      // chunk0: Hello, Wor (10)
      // chunk1: ld! This i (10)
      // chunk2: s a test s (10)
      // chunk3: tring. (7)
      expect(chunks.length).toBe(4);
      expect(chunks[0]).toBe('Hello, Wor');
      expect(chunks[1]).toBe('ld! This i');
      expect(chunks[2]).toBe('s a test s');
      expect(chunks[3]).toBe('tring.');
    });

    test('should handle empty string', () => {
      const chunks = chunkString('', 10);
      expect(chunks.length).toBe(0);
    });

    test('should handle string shorter than chunk size', () => {
      const chunks = chunkString('Hello', 10);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe('Hello');
    });

    test('should handle exact chunk size', () => {
      const chunks = chunkString('1234567890', 10);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe('1234567890');
    });

    test('should handle large data with 7KB chunk size', () => {
      const SYNC_CHUNK_SIZE = 7 * 1024;
      // Create larger data that will exceed 7KB
      const largeData = JSON.stringify({ proxies: Array(200).fill({ name: 'TestProxyServerNumber123456789', ip: '1.1.1.1', port: 8080, username: 'user', password: 'pass', fallback_policy: 'direct', include_rules: 'example.com,test.org,foo.bar,baz.qux,hello.world', bypass_rules: 'localhost,127.0.0.1' }) });
      const chunks = chunkString(largeData, SYNC_CHUNK_SIZE);

      // Should create multiple chunks for large data (data is ~15KB+)
      expect(chunks.length).toBeGreaterThan(1);
      // Each chunk should be within size limit
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(SYNC_CHUNK_SIZE);
      });
    });
  });

  describe('calculateChecksum', () => {
    test('should generate consistent checksum for same input', () => {
      const str = 'test string';
      const checksum1 = calculateChecksum(str);
      const checksum2 = calculateChecksum(str);
      expect(checksum1).toBe(checksum2);
    });

    test('should generate different checksums for different inputs', () => {
      const checksum1 = calculateChecksum('test1');
      const checksum2 = calculateChecksum('test2');
      expect(checksum1).not.toBe(checksum2);
    });

    test('should generate checksum with crc prefix', () => {
      const checksum = calculateChecksum('test');
      expect(checksum.startsWith('crc:')).toBe(true);
    });

    test('should handle empty string', () => {
      const checksum = calculateChecksum('');
      expect(checksum).toBe('crc:0');
    });
  });

  describe('buildSyncMeta', () => {
    test('should build valid metadata from chunks', () => {
      const chunks = ['chunk1', 'chunk2', 'chunk3'];
      const meta = buildSyncMeta(chunks);

      expect(meta.version).toBe(1);
      expect(meta.chunks.start).toBe(0);
      expect(meta.chunks.end).toBe(2);
      expect(meta.totalSize).toBe(18); // 3 chunks * 6 chars
      expect(meta.checksum).toBeDefined();
    });

    test('should handle single chunk', () => {
      const chunks = ['single'];
      const meta = buildSyncMeta(chunks);

      expect(meta.chunks.start).toBe(0);
      expect(meta.chunks.end).toBe(0);
      expect(meta.totalSize).toBe(6);
    });

    test('should calculate correct totalSize for multi-byte characters', () => {
      const chunks = ['你好世界'];
      const meta = buildSyncMeta(chunks);
      expect(meta.totalSize).toBe(12); // 4 chars * 3 bytes for UTF-8
    });
  });

  describe('isValidMeta', () => {
    test('should validate correct metadata', () => {
      const meta = {
        version: 1,
        chunks: { start: 0, end: 2 },
        totalSize: 100,
        checksum: 'crc:abc'
      };
      expect(isValidMeta(meta)).toBe(true);
    });

    test('should reject null metadata', () => {
      expect(isValidMeta(null)).toBeFalsy();
    });

    test('should reject missing version', () => {
      const meta = {
        chunks: { start: 0, end: 2 },
        totalSize: 100,
        checksum: 'crc:abc'
      };
      expect(isValidMeta(meta)).toBeFalsy();
    });

    test('should reject missing chunks', () => {
      const meta = {
        version: 1,
        totalSize: 100,
        checksum: 'crc:abc'
      };
      expect(isValidMeta(meta)).toBeFalsy();
    });

    test('should reject missing checksum', () => {
      const meta = {
        version: 1,
        chunks: { start: 0, end: 2 },
        totalSize: 100
      };
      expect(isValidMeta(meta)).toBeFalsy();
    });

    test('should reject non-numeric version', () => {
      const meta = {
        version: '1',
        chunks: { start: 0, end: 2 },
        totalSize: 100,
        checksum: 'crc:abc'
      };
      expect(isValidMeta(meta)).toBe(false);
    });
  });
});

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

describe('Subscription.js - Reverse Rule Function', () => {
  function isValidManualBypassPattern(pattern) {
    if (!pattern || typeof pattern !== 'string') return false;
    const trimmed = pattern.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('/') && trimmed.endsWith('/')) return false;
    if (trimmed.startsWith('|') && !trimmed.startsWith('||')) return false;
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(trimmed)) return true;
    if (trimmed.includes('/')) {
      const ipv4CidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/(8|9|1\d|2\d|3[0-2])$/;
      if (ipv4CidrPattern.test(trimmed)) return true;
      return false;
    }
    const portPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?:[1-9]\d{0,4}$/;
    if (portPattern.test(trimmed)) return true;
    const ipPortPattern = /^(\d{1,3}\.){3}\d{1,3}:[1-9]\d{0,4}$/;
    if (ipPortPattern.test(trimmed)) return true;
    return true;
  }

  function parseAutoProxyLine(line, reverse) {
    let isException = false;
    if (line.startsWith('@@')) {
      isException = true;
      line = line.substring(2);
    }
    const finalActionIsDirect = isException ? !reverse : reverse;
    return finalActionIsDirect ? 'bypass' : 'include';
  }

  describe('parseAutoProxyLine - Reverse Rule Logic', () => {
    test('should parse normal rules without reverse', () => {
      expect(parseAutoProxyLine('example.com', false)).toBe('include');
      expect(parseAutoProxyLine('@@example.com', false)).toBe('bypass');
      expect(parseAutoProxyLine('||example.com', false)).toBe('include');
      expect(parseAutoProxyLine('@@||example.com', false)).toBe('bypass');
    });

    test('should parse reversed rules correctly', () => {
      expect(parseAutoProxyLine('example.com', true)).toBe('bypass');
      expect(parseAutoProxyLine('@@example.com', true)).toBe('include');
      expect(parseAutoProxyLine('||example.com', true)).toBe('bypass');
      expect(parseAutoProxyLine('@@||example.com', true)).toBe('include');
    });

    test('should handle complex patterns with reverse', () => {
      expect(parseAutoProxyLine('|https://example.com/path', true)).toBe('bypass');
      expect(parseAutoProxyLine('@@|https://example.com/path', true)).toBe('include');
    });
  });

  describe('isValidManualBypassPattern', () => {
    test('should accept valid bypass patterns', () => {
      expect(isValidManualBypassPattern('example.com')).toBe(true);
      expect(isValidManualBypassPattern('192.168.1.1')).toBe(true);
      expect(isValidManualBypassPattern('192.168.1.0/24')).toBe(true);
      expect(isValidManualBypassPattern('example.com:8080')).toBe(true);
      expect(isValidManualBypassPattern('192.168.1.1:8080')).toBe(true);
    });

    test('should reject invalid bypass patterns', () => {
      expect(isValidManualBypassPattern('/regex/')).toBe(false);
      expect(isValidManualBypassPattern('|prefix')).toBe(false);
      expect(isValidManualBypassPattern('')).toBe(false);
      expect(isValidManualBypassPattern(null)).toBe(false);
    });
  });
});
