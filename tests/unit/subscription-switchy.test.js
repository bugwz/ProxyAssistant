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
