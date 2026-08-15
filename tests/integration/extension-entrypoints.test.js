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
  test.each([
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
