# Unit Testing Implementation Plan for Gym Pad

## Overview

This document outlines a comprehensive unit testing strategy for the Gym Pad application with **strict database protection** to prevent any data loss incidents while ensuring CI/CD readiness for PR validation.

## Critical Safety Requirements

⚠️ **NEVER CONNECT TO PRODUCTION DATABASE DURING TESTING** ⚠️

### Database Protection Strategy
1. **Separate Test Database**: Use completely isolated test database (never production)
2. **Database Mocking**: Mock all Prisma client calls for unit tests
3. **In-Memory Testing**: Use SQLite in-memory for integration tests
4. **Environment Isolation**: Strict test environment separation
5. **Multiple Safety Checks**: Environment validation, URL checking, emergency stops

## Phase 1: Testing Infrastructure Setup

### 1.1 Install Testing Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jsdom": "^23.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "msw": "^2.0.0",
    "prisma-mock": "^1.0.0"
  }
}
```

### 1.2 Configuration Files

#### vitest.config.js
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '.next/**'
      ]
    },
    // Database safety: ensure no real DB connections
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file::memory:?cache=shared'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
```

#### .env.test
```env
NODE_ENV=test
DATABASE_URL=file::memory:?cache=shared
NEXTAUTH_SECRET=test-secret-key
```

### 1.3 Test Database Safety Implementation

#### tests/setup/vitest.setup.js
```javascript
import { beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { vi } from 'vitest';

// CRITICAL: Validate we're in test environment
beforeAll(() => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests can only run in test environment!');
  }
  
  if (process.env.DATABASE_URL?.includes('postgres://') && 
      !process.env.DATABASE_URL.includes('test')) {
    throw new Error('DANGER: Tests cannot connect to production database!');
  }
});

// Mock Prisma client completely
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    workout: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    exercise: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

// Clean up mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Phase 2: API Unit Tests (Starting Point)

### 2.1 Test Structure & Organization

```
tests/
├── __mocks__/              # Database & API mocks
│   ├── prisma.js          # Mocked Prisma client
│   ├── auth.js            # Mocked auth functions
│   └── fixtures.js        # Test data fixtures
├── unit/                  # Pure unit tests (no DB)
│   ├── api/              # API route tests
│   │   ├── auth/         # Authentication endpoints
│   │   ├── workouts/     # Workout endpoints
│   │   ├── exercises/    # Exercise endpoints
│   │   └── weight/       # Weight tracking endpoints
│   ├── lib/              # Utility function tests
│   └── components/       # React component tests
├── integration/          # Integration tests (in-memory DB)
├── fixtures/             # Test data factories
└── setup/                # Test setup and helpers
```

### 2.2 Authentication API Tests

#### tests/unit/api/auth/login.test.js
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/prisma';

describe('/api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for missing credentials', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username and password are required');
  });

  it('should return 401 for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'wrongpassword'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid username or password');
  });

  // Additional tests for successful login, session creation, etc.
});
```

### 2.3 Workout API Tests

#### tests/unit/api/workouts/route.test.js
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/workouts/route';
import { prisma } from '@/lib/prisma';

describe('/api/workouts', () => {
  const mockUser = { id: 1, username: 'testuser', name: 'Test User' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authentication
    vi.mock('@/lib/middleware', () => ({
      requireAuth: vi.fn().mockResolvedValue({ user: mockUser })
    }));
  });

  describe('GET /api/workouts', () => {
    it('should return user workouts with exercises', async () => {
      const mockWorkouts = [
        {
          id: 1,
          title: 'Test Workout',
          date: new Date('2025-01-01'),
          exercises: [
            {
              id: 1,
              name: 'Bench Press',
              setsData: '[{"reps":10,"weight":135}]'
            }
          ]
        }
      ];

      prisma.workout.findMany.mockResolvedValue(mockWorkouts);

      const request = new Request('http://localhost:3000/api/workouts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Test Workout');
      expect(prisma.workout.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { exercises: { orderBy: { orderIndex: 'asc' } } },
        orderBy: { date: 'desc' }
      });
    });
  });

  describe('POST /api/workouts', () => {
    it('should create workout with validation', async () => {
      const workoutData = {
        title: 'New Workout',
        date: '2025-01-01T10:00:00Z',
        duration: 3600,
        exercises: [
          {
            name: 'Squat',
            sets: [{ reps: 10, weight: 185 }],
            restSeconds: 90
          }
        ]
      };

      const mockCreatedWorkout = {
        id: 2,
        ...workoutData,
        userId: mockUser.id,
        exercises: []
      };

      prisma.$transaction.mockResolvedValue(mockCreatedWorkout);

      const request = new Request('http://localhost:3000/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('New Workout');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
```

### 2.4 Core Service Tests

#### tests/unit/lib/validations.test.js
```javascript
import { describe, it, expect } from 'vitest';
import { validateWorkout, validateExercise, validateWeightEntry } from '@/lib/validations';

describe('Validation Functions', () => {
  describe('validateWorkout', () => {
    it('should validate correct workout data', () => {
      const validWorkout = {
        title: 'Test Workout',
        date: '2025-01-01T10:00:00Z',
        duration: 3600
      };

      const result = validateWorkout(validWorkout);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject workout with missing title', () => {
      const invalidWorkout = {
        date: '2025-01-01T10:00:00Z',
        duration: 3600
      };

      const result = validateWorkout(invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a non-empty string');
    });
  });

  describe('validateExercise', () => {
    it('should validate correct exercise data', () => {
      const validExercise = {
        name: 'Bench Press',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 8, weight: 140 }
        ]
      };

      const result = validateExercise(validExercise);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject exercise with invalid sets data', () => {
      const invalidExercise = {
        name: 'Bench Press',
        sets: [{ reps: -5, weight: 'invalid' }]
      };

      const result = validateExercise(invalidExercise);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Set 1: reps must be a positive integer');
      expect(result.errors).toContain('Set 1: weight must be a non-negative number');
    });
  });
});
```

## Phase 3: Test Data Management

### 3.1 Test Fixtures and Factories

#### tests/fixtures/user.js
```javascript
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  name: 'Test User',
  password: '$2b$10$hashedpassword',
  createdAt: new Date('2025-01-01'),
  ...overrides
});

export const createMockSession = (userId = 1, overrides = {}) => ({
  id: 'session_123',
  userId,
  token: 'test_token_123',
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  ...overrides
});
```

#### tests/fixtures/workout.js
```javascript
export const createMockWorkout = (userId = 1, overrides = {}) => ({
  id: 1,
  userId,
  title: 'Test Workout',
  date: new Date('2025-01-01T10:00:00Z'),
  duration: 3600,
  notes: 'Test notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  exercises: [],
  ...overrides
});

export const createMockExercise = (workoutId = 1, overrides = {}) => ({
  id: 1,
  workoutId,
  name: 'Bench Press',
  setsData: '[{"reps":10,"weight":135,"completed":true}]',
  restSeconds: 90,
  notes: null,
  orderIndex: 0,
  createdAt: new Date(),
  ...overrides
});
```

## Phase 4: CI/CD Integration

### 4.1 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=verbose",
    "test:watch": "vitest watch"
  }
}
```

### 4.2 GitHub Actions Workflow

#### .github/workflows/test.yml
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:ci
        env:
          NODE_ENV: test
          DATABASE_URL: file::memory:?cache=shared
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```

## Phase 5: Implementation Timeline

### Week 1: Infrastructure
- [x] Create unit-test-plan.md
- [ ] Install testing dependencies
- [ ] Set up Vitest configuration
- [ ] Create database safety measures
- [ ] Set up Prisma mocking

### Week 2: Core Tests
- [ ] Authentication API tests
- [ ] Validation function tests
- [ ] Middleware tests
- [ ] Error handling tests

### Week 3: API Coverage
- [ ] Workout API tests
- [ ] Exercise API tests
- [ ] Weight tracking API tests
- [ ] Template API tests

### Week 4: Integration & CI
- [ ] Integration test setup
- [ ] GitHub Actions configuration
- [ ] Coverage reporting
- [ ] Documentation updates

## Safety Checklist

Before running any tests, ensure:

- [ ] NODE_ENV is set to 'test'
- [ ] DATABASE_URL points to test database or memory
- [ ] No production environment variables are loaded
- [ ] All database calls are mocked in unit tests
- [ ] Test cleanup runs after each test
- [ ] Emergency stops are in place for production DB detection

## Coverage Goals

- **API Routes**: 85%+ coverage
- **Core Utilities**: 90%+ coverage
- **Authentication**: 95%+ coverage
- **Validation Functions**: 95%+ coverage

## Risk Mitigation

### Database Protection
- Multiple layers of environment validation
- Automatic test environment detection
- Emergency stop mechanisms
- Complete Prisma client mocking

### Test Isolation
- No shared state between tests
- Fresh mocks for each test
- Comprehensive cleanup procedures
- Separate test data fixtures

This comprehensive testing strategy prioritizes safety above all else while creating a robust foundation for catching regressions before they reach production.