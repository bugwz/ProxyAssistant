#!/usr/bin/env node

const fs = require('fs');

function removeManifestKey(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  delete manifest.key;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 3)}\n`);
}

if (require.main === module) {
  const manifestPath = process.argv[2];

  if (!manifestPath) {
    console.error('Usage: prepare_chrome_manifest.js <manifest-path>');
    process.exit(1);
  }

  removeManifestKey(manifestPath);
}

module.exports = { removeManifestKey };
