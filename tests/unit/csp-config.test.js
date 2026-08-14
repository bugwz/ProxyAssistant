const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '../..');
const expectedPolicy = "default-src 'self'; script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: http:;";

describe('extension content security policy', () => {
  test.each(['manifest_chrome.json', 'manifest_firefox.json'])(
    '%s allows extension data requests without remote scripts',
    (manifestName) => {
      const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', manifestName), 'utf8'));

      expect(manifest.content_security_policy.extension_pages).toBe(expectedPolicy);
    }
  );

  test.each(['main.html', 'popup.html'])(
    '%s does not override the manifest policy',
    (htmlName) => {
      const html = fs.readFileSync(path.join(projectRoot, 'src', htmlName), 'utf8');

      expect(html).not.toContain('http-equiv="Content-Security-Policy"');
    }
  );
});
