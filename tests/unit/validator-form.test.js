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
