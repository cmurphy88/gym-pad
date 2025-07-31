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
  // 🔒 PRODUCTION SAFETY CHECK - NEVER ALLOW TESTS TO TOUCH PRODUCTION
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neondb')) {
    console.error('🚨 CRITICAL ERROR: Tests are trying to connect to PRODUCTION database!');
    console.error('🚨 Production database URL detected. Tests MUST use isolated database.');
    console.error('🚨 Stopping tests to prevent production data damage.');
    process.exit(1);
  }
  
  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  // Set test database URL if not provided
  if (!process.env.DATABASE_URL) {
    // Default to SQLite for local development if no DATABASE_URL is set
    process.env.DATABASE_URL = 'file:./test_isolated_local.db';
    console.log('✅ Using isolated SQLite database for testing');
  } else {
    const dbUrl = process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');
    console.log('✅ Using configured isolated database:', dbUrl);
    
    // Double-check it's not production
    if (dbUrl.includes('neondb') || dbUrl.includes('production')) {
      console.error('🚨 SAFETY CHECK FAILED: Database URL appears to be production!');
      process.exit(1);
    }
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
    // Clean up all tables - with CASCADE foreign keys, deleting users will cascade to dependent tables
    // But we'll still clean up in proper order to handle any non-cascading relationships
    
    // Delete child records first (in case some FK constraints don't cascade)
    await prisma.session.deleteMany();            // References users
    await prisma.exercise.deleteMany();           // References workouts
    await prisma.workoutExerciseSwap.deleteMany(); // References workouts
    await prisma.workout.deleteMany();            // References users (should cascade now)
    await prisma.templateExercise.deleteMany();   // References session_templates
    await prisma.sessionTemplate.deleteMany();    // Independent
    await prisma.weightEntry.deleteMany();        // References users
    await prisma.weightGoal.deleteMany();         // References users
    
    // Delete parent records last
    await prisma.user.deleteMany();               // Parent table - should cascade to most others
  } catch (error) {
    console.error('Failed to clean up test data:', error);
    // Log the specific error to help debug
    if (error.code) {
      console.error('Database error code:', error.code);
      console.error('Database error message:', error.message);
    }
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