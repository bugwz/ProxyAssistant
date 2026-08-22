const fs = require('fs');
const path = require('path');

const jqueryPath = path.join(__dirname, '../../src/js/jquery.js');
const iconsPath = path.join(__dirname, '../../src/js/icons.js');
const versionPath = path.join(__dirname, '../../src/js/version.js');

function loadVersionModule(fetchMock) {
  window.eval(fs.readFileSync(jqueryPath, 'utf8'));
  const MainIcons = require(iconsPath);
  const I18n = {
    t: jest.fn(key => key),
    getCurrentLanguage: jest.fn(() => 'zh-CN')
  };
  const chrome = {
    runtime: {
      id: 'extension-id',
      getManifest: jest.fn(() => ({ version: '1.0.0' }))
    }
  };
  const source = fs.readFileSync(versionPath, 'utf8');
  const factory = new Function(
    'window',
    'document',
    '$',
    'MainIcons',
    'I18n',
    'chrome',
    'fetch',
    'AbortController',
    'setTimeout',
    'clearTimeout',
    'console',
    `${source}; return window.VersionModule;`
  );

  return factory(
    window,
    document,
    window.$,
    MainIcons,
    I18n,
    chrome,
    fetchMock,
    AbortController,
    setTimeout,
    clearTimeout,
    console
  );
}

describe('version refresh feedback', () => {
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
    delete window.$;
    delete window.jQuery;
    delete window.VersionModule;
  });

  test('keeps a fast GitHub refresh visible for 600ms without replacing its icon', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 22, 8, 0, 0));
    document.body.innerHTML = '<div id="github-version-value"></div>';
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        tag_name: 'v1.0.1',
        html_url: 'https://example.com/release'
      })
    }));
    const VersionModule = loadVersionModule(fetchMock);
    VersionModule.updateVersionUI($('#github-version-value'), '1.0.0', '1.0.0', 'https://example.com/release');

    const refreshPromise = VersionModule.checkGitHubVersion('1.0.0', true);

    await Promise.resolve();
    await Promise.resolve();
    expect($('.version-row-retry-btn .version-refresh-icon')).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(599);
    expect($('.version-row-retry-btn .version-refresh-icon')).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(1);
    await refreshPromise;

    expect($('#github-version-value').text()).toContain('1.0.1');
    expect($('.version-row-retry-btn .version-refresh-icon')).toHaveLength(1);
  });
});
