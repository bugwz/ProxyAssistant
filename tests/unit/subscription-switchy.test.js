const fs = require('fs');
const path = require('path');

const subscriptionJsPath = path.join(__dirname, '../../src/js/subscription.js');

function loadSubscriptionModule() {
  const source = fs.readFileSync(subscriptionJsPath, 'utf8');
  const factory = new Function(
    'window',
    'document',
    '$',
    'ProxyModule',
    'UtilsModule',
    'I18n',
    'chrome',
    'atob',
    'console',
    `${source}; return SubscriptionModule;`
  );

  return factory(
    window,
    document,
    jest.fn(),
    {},
    {},
    { t: jest.fn((key) => key) },
    global.chrome,
    atob,
    console
  );
}

describe('SubscriptionModule SwitchyOmega parsing', () => {
  test('converts trailing IP wildcards into CIDR include rules', () => {
    const subscriptionModule = loadSubscriptionModule();
    const content = [
      '[SwitchyOmega Conditions]',
      '1.2.3.*',
      '10.20.*.*',
      '172.*.*.*',
      '8.*.8.*'
    ].join('\n');

    const stats = subscriptionModule.generateSubscriptionStats(content, 'switchy_omega', false);

    expect(stats.include_rules).toContain('1.2.3.0/24');
    expect(stats.include_rules).toContain('10.20.0.0/16');
    expect(stats.include_rules).toContain('172.0.0.0/8');
    expect(stats.include_rules).not.toContain('8.*.8.*');
  });

  test('converts reversed IP wildcards into CIDR bypass rules', () => {
    const subscriptionModule = loadSubscriptionModule();
    const content = [
      '[SwitchyOmega Conditions]',
      '192.168.1.*'
    ].join('\n');

    const stats = subscriptionModule.generateSubscriptionStats(content, 'switchy_omega', true);

    expect(stats.bypass_rules).toBe('192.168.1.0/24');
    expect(stats.include_rules).toBe('');
  });
});


function parseInWorker(content, format, reverse = false, processRule) {
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/worker.js'), 'utf8');
  const parsers = source.slice(source.indexOf('function isValidManualBypassPattern'),
    source.indexOf('async function readResponseTextWithLimit'));
  const factory = new Function('atob', 'MAX_SUBSCRIPTION_PARSED_RULES',
    parsers + '; return parseSubscriptionContent;');
  return factory(atob, 20000)(content, format, reverse, processRule);
}

test.each([
  ['|https://secure.example.com/path', 'secure.example.com'],
  ['||*.news.example.co.uk', 'news.example.co.uk'],
  ['https://*.a.example.com/path', 'a.example.com'],
  ['||*.example.com', 'example.com']
])('AutoProxy parsing agrees across contexts for %s', (rule, expected) => {
  const content = '[AutoProxy 0.2]\n' + rule;
  expect(loadSubscriptionModule().generateSubscriptionStats(content, 'autoproxy', false).include_rules).toBe(expected);
  expect(parseInWorker(content, 'autoproxy').include_rules).toBe(expected);
});


test.each([false, true])('AutoProxy host boundaries and exceptions support reverse=%s', reverse => {
  const content = '[AutoProxy 0.2]\n||example.com^\n@@||direct.example.com^\n||limited.example$script';
  for (const result of [loadSubscriptionModule().generateSubscriptionStats(content, 'autoproxy', reverse),
    parseInWorker(content, 'autoproxy', reverse)]) {
    expect(result.include_rules).toBe(reverse ? 'direct.example.com' : 'example.com');
    expect(result.bypass_rules).toBe(reverse ? 'example.com' : 'direct.example.com');
  }
});


test.each(['*://*.bbci.co.uk/*', 'https://*.bbci.co.uk/*', '*.bbci.co.uk'])('Legacy preserves the complete domain in %s', rule => {
  const content = '#BEGIN\n[Wildcard]\n' + rule + '\n#END';
  for (const reverse of [false, true]) {
    for (const result of [loadSubscriptionModule().generateSubscriptionStats(content, 'switchy_legacy', reverse),
      parseInWorker(content, 'switchy_legacy', reverse)]) {
      expect(result[reverse ? 'bypass_rules' : 'include_rules']).toBe('bbci.co.uk');
    }
  }
});


test.each(['*.cn', '*.example.com', '*.example.*'])('Omega preserves the host wildcard %s', rule => {
  const content = '[SwitchyOmega Conditions]\n' + rule;
  for (const reverse of [false, true]) {
    for (const result of [loadSubscriptionModule().generateSubscriptionStats(content, 'switchy_omega', reverse),
      parseInWorker(content, 'switchy_omega', reverse)]) {
      expect(result[reverse ? 'bypass_rules' : 'include_rules']).toBe(rule);
    }
  }
});
