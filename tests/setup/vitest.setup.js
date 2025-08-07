import { beforeAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// CRITICAL SAFETY CHECK: Ensure we're in test environment
beforeAll(() => {
  console.log('🔒 Running test environment safety checks...');
  
  // Environment validation
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('🚨 DANGER: Tests can only run in test environment! Current: ' + process.env.NODE_ENV);
  }
  
  // Database URL validation - prevent production database access
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes('postgres://') && !dbUrl.includes(':memory:') && !dbUrl.includes('test')) {
    throw new Error('🚨 DANGER: Tests cannot connect to production database! URL: ' + dbUrl.substring(0, 20) + '...');
  }
  
  if (dbUrl && dbUrl.includes('vercel') && !dbUrl.includes('test')) {
    throw new Error('🚨 DANGER: Tests cannot connect to Vercel production database!');
  }
  
  console.log('✅ Environment safety checks passed');
  console.log('✅ Database URL safe:', dbUrl || 'not set');
});

// Mock Prisma client completely to prevent any database connections
vi.mock('@/lib/prisma', () => {
  console.log('🔧 Mocking Prisma client for database safety');
  
  return {
    prisma: {
      // User model methods
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn()
      },
      
      // Workout model methods
      workout: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn()
      },
      
      // Exercise model methods
      exercise: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn()
      },
      
      // Session model methods
      session: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn()
      },
      
      // Template model methods
      sessionTemplate: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      },
      
      templateExercise: {
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn()
      },
      
      // Weight tracking methods
      weightEntry: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      },
      
      weightGoal: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      },
      
      // Transaction method
      $transaction: vi.fn(),
      
      // Connection methods (should never be called)
      $connect: vi.fn(),
      $disconnect: vi.fn()
    }
  };
});

// Mock Next.js cookies for testing
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}));

// Mock navigator.clipboard for @testing-library/user-event
// This is critical for component tests that use userEvent
beforeAll(() => {
  console.log('🔧 Setting up navigator.clipboard mock for user-event');
  
  // Ensure global.navigator exists
  if (!global.navigator) {
    global.navigator = {};
  }
  
  // Mock clipboard API completely
  global.navigator.clipboard = {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
    write: vi.fn(() => Promise.resolve()),
    read: vi.fn(() => Promise.resolve())
  };
  
  // Also set it on window.navigator for browser-like environments
  if (typeof window !== 'undefined') {
    if (!window.navigator) {
      window.navigator = {};
    }
    window.navigator.clipboard = global.navigator.clipboard;
  }
  
  console.log('✅ Navigator.clipboard mock initialized');
});

// Clean up mocks between tests
beforeEach(() => {
  console.log('🧹 Cleaning up mocks for fresh test state');
  vi.clearAllMocks();
});

// Additional safety check after each test
afterEach(async () => {
  // Verify no real database connections were attempted
  const { prisma } = vi.mocked(await import('@/lib/prisma'));
  
  // Check if any connection methods were called (they shouldn't be)
  if (prisma.$connect.mock && prisma.$connect.mock.calls.length > 0) {
    console.warn('⚠️  WARNING: Test attempted database connection!');
  }
});

// Global test helpers
global.createMockRequest = (url = 'http://localhost:3000', options = {}) => {
  const request = new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  
  // Mock cookies functionality
  mockRequestCookies(request, options.headers?.Cookie);
  
  return request;
};

global.createMockRequestWithBody = (url, body, method = 'POST') => {
  const request = new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  // Mock cookies functionality
  mockRequestCookies(request);
  
  return request;
};

global.createMockRequestWithCookies = (url, cookies = {}, options = {}) => {
  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
    
  const request = new Request(url, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      ...(cookieString && { 'Cookie': cookieString }),
      ...options.headers 
    },
    ...options
  });
  
  // Mock cookies functionality
  mockRequestCookies(request, cookieString);
  
  return request;
};

// Helper to mock request.cookies
function mockRequestCookies(request, cookieString) {
  const cookies = new Map();
  
  if (cookieString) {
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value !== undefined) {
        cookies.set(name, value);
      }
    });
  }
  
  request.cookies = {
    get: (name) => {
      const value = cookies.get(name);
      return value ? { value } : undefined;
    },
    set: vi.fn(),
    delete: vi.fn(),
    has: (name) => cookies.has(name),
    forEach: (callback) => cookies.forEach((value, name) => callback({ name, value }))
  };
}

console.log('✅ Test setup complete with database safety measures');