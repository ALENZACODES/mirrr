/**
 * Jest configuration for MIRRR (ESM mode).
 * Run tests with: node --experimental-vm-modules node_modules/.bin/jest
 */
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
};
