const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const VERSION = 'jest-e2e';
let temporaryProject;
let buildDirectory;

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: temporaryProject,
    encoding: 'utf8',
    env: { ...process.env, PATH: '/usr/bin:/bin' },
    ...options
  });
}

function readZipManifest(archivePath) {
  const result = run('unzip', ['-p', archivePath, 'manifest.json']);
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout);
}

function listZipEntries(archivePath) {
  const result = run('unzip', ['-Z1', archivePath]);
  expect(result.status).toBe(0);
  return result.stdout.trim().split('\n');
}

beforeAll(() => {
  temporaryProject = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-assistant-e2e-'));
  buildDirectory = path.join(temporaryProject, 'build');
  fs.cpSync(path.join(PROJECT_ROOT, 'src'), path.join(temporaryProject, 'src'), { recursive: true });
  fs.mkdirSync(path.join(temporaryProject, 'script'));
  fs.copyFileSync(
    path.join(PROJECT_ROOT, 'script/build.sh'),
    path.join(temporaryProject, 'script/build.sh')
  );

  const result = run('bash', ['script/build.sh', VERSION]);
  if (result.status !== 0) {
    throw new Error(`Extension build failed:\n${result.stdout}\n${result.stderr}`);
  }
});

afterAll(() => {
  fs.rmSync(temporaryProject, { recursive: true, force: true });
});

describe('extension package build', () => {
  test.each([
    ['chrome', manifest => manifest.background.service_worker === 'js/worker.js'],
    ['firefox', manifest => manifest.background.scripts?.includes('js/worker.js')]
  ])('builds a complete %s archive', (browserName, hasExpectedBackground) => {
    const archivePath = path.join(
      buildDirectory,
      `ProxyAssistant_${VERSION}_${browserName}.zip`
    );
    const entries = listZipEntries(archivePath);
    const manifest = readZipManifest(archivePath);

    expect(fs.existsSync(archivePath)).toBe(true);
    expect(hasExpectedBackground(manifest)).toBe(true);
    expect(entries).toEqual(expect.arrayContaining([
      'manifest.json',
      'main.html',
      'popup.html',
      'js/worker.js'
    ]));
    expect(entries).not.toContain('manifest_chrome.json');
    expect(entries).not.toContain('manifest_firefox.json');
  });
});
