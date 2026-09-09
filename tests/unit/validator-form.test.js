const fs = require('fs');
const path = require('path');
window.eval(fs.readFileSync(path.join(__dirname, '../../src/js/jquery.js'), 'utf8'));
const $ = window.$;

function loadValidator() {
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/validator.js'), 'utf8');
  return new Function('$', 'I18n', 'window', source + '; return window.ValidatorModule;')(
    $, { t: key => key === 'alert_include_rules_conflict' ? '{pattern}: {proxy}' : key }, {}
  );
}

test('include rule validation flags conflicts and clears resolved errors', () => {
  document.body.innerHTML = '<div class="proxy-card" data-id="0"><textarea class="include_rules"></textarea></div>';
  const validator = loadValidator();
  const list = [
    { name: 'Current', ip: 'a.example', port: '8080', include_rules: 'example.com' },
    { name: 'Other', ip: 'b.example', port: '8080', include_rules: 'example.com' }
  ];
  expect(validator.validateProxy(list, 0, 'include_rules', 'example.com')).toBe(false);
  expect($('.include_rules').hasClass('input-error')).toBe(true);
  expect($('.include_rules').attr('title')).toBe('example.com: Other');
  expect(validator.validateProxy(list, 0, 'include_rules', 'unique.example')).toBe(true);
  expect($('.include_rules').hasClass('input-error')).toBe(false);
});


test.each(['999.1.1.1', 'example.com:65536', '1.2.3.999:80', '10.0.0.0/33', '/example/', 'bad host', 'https://example.com/path'])('rejects invalid bypass rule %s', rule => {
  expect(loadValidator().validateBypassUrls(rule).isValid).toBe(false);
});

test.each(['example.com', '*.example.com', '127.0.0.1', '10.0.0.0/8', '0.0.0.0/0', 'example.com:65535', '<local>'])('accepts valid bypass rule %s', rule => {
  expect(loadValidator().validateBypassUrls(rule).isValid).toBe(true);
});

test('saving a proxy rejects invalid bypass rules and accepts corrected rules', async () => {
  document.body.innerHTML = '<div id="proxy-list"><div class="proxy-card" data-id="0"><textarea class="bypass_rules"></textarea></div></div>';
  const storage = { save: jest.fn(async () => {}) };
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/proxy.js'), 'utf8');
  const module = new Function('$', 'StorageModule', 'ValidatorModule', 'ScenariosModule', 'UtilsModule', 'I18n', 'SyncModule', 'generateProxyId', source + '; return ProxyModule;')(
    $, storage, loadValidator(), { checkNameGlobalUniqueness: () => ({ isDuplicate: false }) },
    { showTip: jest.fn(), normalizeProxyColor: value => value || '' }, { t: key => key }, { getSyncConfig: () => ({}) }, () => 'proxy-id'
  );
  const proxy = { name: 'Proxy', ip: '127.0.0.1', port: '8080', bypass_rules: 'example.com:99999' };
  module.setList([proxy]);
  module.saveSingleProxy(0);
  expect(storage.save).not.toHaveBeenCalled();
  expect($('.bypass_rules').hasClass('input-error')).toBe(true);
  proxy.bypass_rules = 'example.com';
  module.saveSingleProxy(0);
  expect(storage.save).toHaveBeenCalledTimes(1);
  expect($('.bypass_rules').hasClass('input-error')).toBe(false);
});
