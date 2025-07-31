import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom Jest configuration
const customJestConfig = {
  // Environment setup
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Module path mapping (corrected property name)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'app/api/**/*.js',
    'lib/**/*.js',
    '!lib/seed*.js',
    '!lib/migrate*.js',
    '!**/*.config.js',
    '!**/node_modules/**',
  ],
  
  // Coverage thresholds (temporarily lowered for initial setup)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Maximum concurrent workers
  maxWorkers: 4,
};

// Create and export the Jest configuration
export default createJestConfig(customJestConfig);