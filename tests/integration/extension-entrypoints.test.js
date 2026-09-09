const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(SRC_DIR, relativePath), 'utf8'));
}

function getLocalResources(htmlFile) {
  const html = fs.readFileSync(path.join(SRC_DIR, htmlFile), 'utf8');
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  return [...parsed.querySelectorAll('script[src], link[href]')]
    .map(element => element.getAttribute('src') || element.getAttribute('href'))
    .filter(resource => resource && !resource.includes('://'))
    .map(resource => resource.replace(/^\.\//, ''));
}

describe('extension entrypoint integration', () => {
  test('源码加载入口与 Chrome 构建使用相同的清单', () => {
    expect(readJson('manifest.json')).toEqual(readJson('manifest_chrome.json'));
  });

  test.each(['manifest.json', 'manifest_chrome.json'])('%s 使用支持 importScripts 的经典后台脚本', manifestFile => {
    const manifest = readJson(manifestFile);

    expect(manifest.background.service_worker).toBe('js/worker.js');
    expect(manifest.background.type || 'classic').toBe('classic');
    expect(fs.existsSync(path.join(SRC_DIR, 'js/rule-matcher.js'))).toBe(true);
  });

  test.each([
    ['manifest.json', manifest => [manifest.background.service_worker]],
    ['manifest_chrome.json', manifest => [manifest.background.service_worker]],
    ['manifest_firefox.json', manifest => manifest.background.scripts]
  ])('%s references existing background and popup files', (manifestFile, getBackgroundFiles) => {
    const manifest = readJson(manifestFile);
    const entrypoints = [...getBackgroundFiles(manifest), manifest.action.default_popup];

    entrypoints.forEach(entrypoint => {
      expect(fs.existsSync(path.join(SRC_DIR, entrypoint))).toBe(true);
    });
  });

  test.each(['main.html', 'popup.html'])('%s references existing local resources', htmlFile => {
    const resources = getLocalResources(htmlFile);

    expect(resources.length).toBeGreaterThan(0);
    resources.forEach(resource => {
      expect(fs.existsSync(path.join(SRC_DIR, resource))).toBe(true);
    });
  });
});
