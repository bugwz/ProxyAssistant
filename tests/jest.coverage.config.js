const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  // Most extension scripts are loaded in tests through eval/vm to preserve the
  // browser-global runtime shape. Those files are not instrumented by Jest's
  // module loader, so listing them here reports misleading 0% coverage.
  collectCoverageFrom: [
    '<rootDir>/src/js/icons.js'
  ]
};
