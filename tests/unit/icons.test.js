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
    const tagIcon = MainIcons.render('tag');
    const foldAllIcon = MainIcons.render('foldAll');
    const unfoldAllIcon = MainIcons.render('unfoldAll');
    const disabledCircleIcon = MainIcons.render('disabledCircle');
    const manualModeIcon = MainIcons.render('manualMode');
    const autoModeIcon = MainIcons.render('autoMode');

    [testAllIcon, chevronDownIcon, eyeOffIcon, scenarioSwitchIcon, tagIcon, foldAllIcon, unfoldAllIcon, disabledCircleIcon, manualModeIcon, autoModeIcon].forEach((svg) => {
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).toContain('stroke-width="2"');
      expect(svg).toContain('stroke-linecap="round"');
      expect(svg).toContain('stroke-linejoin="round"');
    });

    expect(scenarioSwitchIcon).toContain('M12 3 4 7l8 4 8-4-8-4Z');
    expect(tagIcon).toContain('M6 3h12v18l-6-4-6 4V3Z');
    expect(tagIcon).toContain('M6 7h12');
    expect(disabledCircleIcon).toContain('M8 12h8');
    expect(manualModeIcon).toContain('M9 15V9l3 4 3-4v6');
    expect(autoModeIcon).toContain('m9 15 3-6 3 6');
    expect(autoModeIcon).toContain('M10.5 12.5h3');
    expect(manualModeIcon).toContain('<circle cx="12" cy="12" r="9"/>');
    expect(autoModeIcon).toContain('<circle cx="12" cy="12" r="9"/>');
    expect(manualModeIcon).toContain('M9 15V9l3 4 3-4v6" stroke-width="1.5"');
    expect(autoModeIcon.match(/stroke-width="1\.5"/g)).toHaveLength(2);
  });
});
