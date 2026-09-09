const fs = require('fs');
const path = require('path');

function loadVersionModule(fetchMock) {
  window.eval(fs.readFileSync(path.join(__dirname, '../../src/js/jquery.js'), 'utf8'));
  document.body.innerHTML = '<div id="store-version-value"></div>';
  const source = fs.readFileSync(path.join(__dirname, '../../src/js/version.js'), 'utf8');
  return new Function('window', '$', 'MainIcons', 'I18n', 'browser', 'fetch', source + '; return window.VersionModule;')(
    {}, window.$, { render: () => '<svg></svg>' }, { t: key => key },
    { runtime: { getBrowserInfo: () => {} } }, fetchMock
  );
}

afterEach(() => jest.useRealTimers());

test('Firefox version request failure releases its timeout', async () => {
  const module = loadVersionModule(jest.fn(async () => { throw new Error('offline'); }));
  jest.useFakeTimers();
  await expect(module.checkStoreVersion('1.8.1', true)).resolves.toBeUndefined();
  expect(jest.getTimerCount()).toBe(0);
  expect(window.$('#store-version-value').text()).toContain('check_store');
});

test('Firefox version timeout covers a stalled response body', async () => {
  const module = loadVersionModule(jest.fn(async (url, options) => ({
    ok: true,
    json: () => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    })
  })));
  jest.useFakeTimers();
  const pending = module.checkStoreVersion('1.8.1', true);
  await Promise.resolve();
  await jest.advanceTimersByTimeAsync(10000);
  await pending;
  expect(jest.getTimerCount()).toBe(0);
});


test.each([false, true])('Firefox version success stays visible after retry=%s', retry => {
  const fetchMock = jest.fn(async () => ({ ok: true, json: async () => ({
    current_version: { version: '1.9.0' }, url: 'https://addons.mozilla.org/addon/example/'
  }) }));
  if (retry) fetchMock.mockRejectedValueOnce(new Error('temporary error'));
  const module = loadVersionModule(fetchMock);
  jest.useFakeTimers();
  const pending = module.checkStoreVersion('1.8.1');
  return (async () => {
    await jest.advanceTimersByTimeAsync(retry ? 1000 : 0);
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(retry ? 2 : 1);
    expect(window.$('#store-version-value').text()).toContain('1.9.0');
    expect(window.$('#store-version-value a').attr('href')).toBe('https://addons.mozilla.org/addon/example/');
    expect(window.$('#store-version-value .github-refresh-btn')).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  })();
});
