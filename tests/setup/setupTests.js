import { jest } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';

// Global test configuration
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup test database before all tests
beforeAll(async () => {
  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  // Set test database URL if not provided
  if (!process.env.DATABASE_URL) {
    // Default to SQLite for local development if no DATABASE_URL is set
    process.env.DATABASE_URL = 'file:./test.db';
    console.log('Using default SQLite database for testing');
  } else {
    console.log('Using configured database:', process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@'));
  }
  
  try {
    // Connect to database
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Clean up database after each test to ensure isolation
afterEach(async () => {
  try {
    // Clean up all tables in reverse dependency order
    await prisma.session.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.workout.deleteMany();
    await prisma.templateExercise.deleteMany();
    await prisma.sessionTemplate.deleteMany();
    await prisma.weightEntry.deleteMany();
    await prisma.weightGoal.deleteMany();
    await prisma.workoutExerciseSwap.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Failed to clean up test data:', error);
  }
});

// Close database connection after all tests
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to disconnect from test database:', error);
  }
});

// Mock Next.js cookies
global.mockCookies = new Map();

// Mock NextResponse for testing
export const mockNextResponse = {
  json: jest.fn((data, options = {}) => ({
    json: async () => data,
    status: options.status || 200,
    headers: new Map(),
    cookies: {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    },
  })),
};

// Mock Request object
export const createMockRequest = (options = {}) => {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body = null,
    cookies = {},
    headers = {},
  } = options;

  const request = {
    method,
    url,
    headers: new Map(Object.entries(headers)),
    cookies: {
      get: jest.fn((name) => ({ value: cookies[name] })),
      set: jest.fn(),
      delete: jest.fn(),
    },
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    formData: jest.fn(),
    arrayBuffer: jest.fn(),
  };

  return request;
};

// Export for use in tests
export { prisma };