const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadGeneratePacScript() {
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/worker.js'), 'utf8');
  const start = source.indexOf('function isIpPattern');
  const end = source.indexOf('// -----------------------------------------------------------------------------\n// Firefox Implementation', start);
  const context = { console };

  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end)}\nthis.generatePacScriptForTest = generatePacScript;`, context);
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
    expect(executePacScript(script, 'https://example.com/path')).toBe('PROXY 127.0.0.1:8080; DIRECT');
  });
});
