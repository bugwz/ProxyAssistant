const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadGeneratePacScript() {
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/worker.js'), 'utf8');
  const start = source.indexOf('function isIpPattern');
  const end = source.indexOf('// -----------------------------------------------------------------------------\n// Firefox Implementation', start);
  const context = { console };

  vm.createContext(context);
  vm.runInContext(`
    const MAX_PROXY_RULES_PER_PROXY = 20000;
    const MAX_PROXY_REGEX_LENGTH = 512;
    ${source.slice(start, end)}
    this.generatePacScriptForTest = generatePacScript;
  `, context);
  return context.generatePacScriptForTest;
}

function executePacScript(script, url) {
  const hostname = new URL(url).hostname;
  const context = {
    dnsDomainIs: (host, domain) => host.endsWith(domain),
    shExpMatch: (value, pattern) => {
      const expression = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return new RegExp(`^${expression}$`).test(value);
    }
  };

  vm.createContext(context);
  vm.runInContext(script, context);
  return context.FindProxyForURL(url, hostname);
}

describe('Worker PAC generation', () => {
  const generatePacScript = loadGeneratePacScript();

  test('generates valid PAC for URL wildcard rules', () => {
    const script = generatePacScript([{
      enabled: true,
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080',
      include_rules: 'https://example.com/*'
    }]);

    expect(() => new vm.Script(script)).not.toThrow();
    expect(script).toContain('shExpMatch(url, "https://example.com/*")');
    expect(executePacScript(script, 'https://example.com/path')).toBe('PROXY 127.0.0.1:8080; DIRECT');
    expect(executePacScript(script, 'https://other.example/path')).toBe('DIRECT');
  });

  test('matches domain wildcards against host names', () => {
    const script = generatePacScript([{
      enabled: true,
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080',
      include_rules: '*.example.com'
    }]);

    expect(script).toContain('shExpMatch(host, "*.example.com")');
    expect(executePacScript(script, 'https://sub.example.com/path')).toBe('PROXY 127.0.0.1:8080; DIRECT');
  });

  test('serializes regular expressions without breaking PAC syntax', () => {
    const script = generatePacScript([{
      enabled: true,
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080',
      include_rules: '/https:\\/\\/example\\.com\\/path/i'
    }]);

    expect(() => new vm.Script(script)).not.toThrow();
    expect(script.indexOf('new RegExp')).toBeLessThan(script.indexOf('function FindProxyForURL'));
    expect(executePacScript(script, 'https://example.com/path')).toBe('PROXY 127.0.0.1:8080; DIRECT');
  });

  test('groups domain rules into a lookup map and removes subscription duplicates', () => {
    const script = generatePacScript([{
      enabled: true,
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080',
      include_rules: 'example.com',
      subscription: {
        current: 'autoproxy',
        lists: { autoproxy: { include_rules: 'example.com\nsecond.example' } }
      }
    }]);

    expect(script).toContain('proxyAssistantDomains0');
    expect(script.match(/"example\.com":1/g)).toHaveLength(1);
    expect(executePacScript(script, 'https://sub.example.com/path')).toBe('PROXY 127.0.0.1:8080; DIRECT');
    expect(executePacScript(script, 'https://second.example/path')).toBe('PROXY 127.0.0.1:8080; DIRECT');
  });

  test('skips nested quantified regular expressions', () => {
    const script = generatePacScript([{
      enabled: true,
      protocol: 'http',
      ip: '127.0.0.1',
      port: '8080',
      include_rules: '/^(a+)+$/'
    }]);

    expect(script).not.toContain('proxyAssistantRegex');
    expect(executePacScript(script, 'https://aaaaaaaa.example/path')).toBe('DIRECT');
  });
});
