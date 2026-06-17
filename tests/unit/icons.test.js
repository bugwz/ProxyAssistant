const path = require('path');

describe('MainIcons', () => {
  test('should expose unified linear svg icons for main page actions', () => {
    const iconsPath = path.join(__dirname, '../../src/js/icons.js');
    const MainIcons = require(iconsPath);

    expect(typeof MainIcons.render).toBe('function');

    const testAllIcon = MainIcons.render('testAll');
    const chevronDownIcon = MainIcons.render('chevronDown');
    const eyeOffIcon = MainIcons.render('eyeOff');
    const scenarioSwitchIcon = MainIcons.render('scenarioSwitch');

    [testAllIcon, chevronDownIcon, eyeOffIcon, scenarioSwitchIcon].forEach((svg) => {
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).toContain('stroke-width="2"');
      expect(svg).toContain('stroke-linecap="round"');
      expect(svg).toContain('stroke-linejoin="round"');
    });

    expect(scenarioSwitchIcon).toContain('M12 3 4 7l8 4 8-4-8-4Z');
  });
});
