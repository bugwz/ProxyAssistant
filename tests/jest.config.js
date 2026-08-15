module.exports = {
  rootDir: '..',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/js/**/*.js',
    '!<rootDir>/src/js/jquery.js'
  ],
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  testTimeout: 10000,
  verbose: true
};
