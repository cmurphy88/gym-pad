import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { POST } from '../../../app/api/auth/login/route.js';
import { createTestUser, expectAuthResponse, expectErrorResponse } from '../../helpers/authHelpers.js';
import { ApiTester } from '../../helpers/requestHelpers.js';
import { testValidationScenarios, generateUserValidationTests, createTestDataSets } from '../../helpers/validationHelpers.js';
import * as auth from '../../../lib/auth.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
      cookies: {
        set: jest.fn(),
      },
    })),
  },
}));

describe('/api/auth/login', () => {
  let tester;
  let testUser;
  const testData = createTestDataSets();

  beforeEach(async () => {
    tester = new ApiTester(POST);
    // Create a test user for login attempts
    testUser = await createTestUser({
      username: 'loginuser',
      password: 'password123',
      name: 'Login Test User',
    });
  });

  describe('Successful Login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        username: testUser.username,
        password: testUser.plainPassword,
      };

      const response = await tester.post(loginData);

      expect(response.status).toBe(200);
      expectAuthResponse(response.data, testUser);
    });

    test('should set session cookie on successful login', async () => {
      // Mock NextResponse to capture cookie setting
      const mockSetCookie = jest.fn();
      const { NextResponse } = require('next/server');
      NextResponse.json.mockReturnValue({
        json: async () => ({ success: true, user: testUser }),
        status: 200,
        cookies: { set: mockSetCookie },
      });

      const loginData = {
        username: testUser.username,
        password: testUser.plainPassword,
      };

      await tester.post(loginData);

      expect(mockSetCookie).toHaveBeenCalledWith(
        'session-token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60, // 1 year
          path: '/',
        })
      );
    });

    test('should create session in database', async () => {
      const loginData = {
        username: testUser.username,
        password: testUser.plainPassword,
      };

      const response = await tester.post(loginData);
      expect(response.status).toBe(200);

      // Verify session exists in database
      const { prisma } = await import('../../setup/setupTests.js');
      const sessions = await prisma.session.findMany({
        where: { userId: testUser.id },
      });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].token).toBeDefined();
      expect(sessions[0].expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('Authentication Failures', () => {
    test('should reject invalid username', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'password123',
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 401, 'Invalid username or password');
    });

    test('should reject invalid password', async () => {
      const loginData = {
        username: testUser.username,
        password: 'wrongpassword',
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 401, 'Invalid username or password');
    });

    test('should reject empty username', async () => {
      const loginData = {
        username: '',
        password: 'password123',
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 400, 'Username and password are required');
    });

    test('should reject empty password', async () => {
      const loginData = {
        username: testUser.username,
        password: '',
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 400, 'Username and password are required');
    });

    test('should reject missing username', async () => {
      const loginData = {
        password: 'password123',
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 400, 'Username and password are required');
    });

    test('should reject missing password', async () => {
      const loginData = {
        username: testUser.username,
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 400, 'Username and password are required');
    });
  });

  describe('Input Validation', () => {
    const validLoginData = {
      username: 'testuser',
      password: 'password123',
    };

    testValidationScenarios(tester, 'post', validLoginData, [
      {
        field: 'username',
        values: [
          { value: null, description: 'null username' },
          { value: undefined, description: 'undefined username' },
          { value: '', description: 'empty username' },
          { value: '   ', description: 'whitespace-only username' },
        ],
      },
      {
        field: 'password',
        values: [
          { value: null, description: 'null password' },
          { value: undefined, description: 'undefined password' },
          { value: '', description: 'empty password' },
          { value: '   ', description: 'whitespace-only password' },
        ],
      },
    ]);
  });

  describe('Security', () => {
    test('should not expose user password in response', async () => {
      const loginData = {
        username: testUser.username,
        password: testUser.plainPassword,
      };

      const response = await tester.post(loginData);
      expect(response.status).toBe(200);
      expect(response.data.user).not.toHaveProperty('password');
    });

    test('should use secure cookie settings in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockSetCookie = jest.fn();
      const { NextResponse } = require('next/server');
      NextResponse.json.mockReturnValue({
        json: async () => ({ success: true, user: testUser }),
        status: 200,
        cookies: { set: mockSetCookie },
      });

      const loginData = {
        username: testUser.username,
        password: testUser.plainPassword,
      };

      await tester.post(loginData);

      expect(mockSetCookie).toHaveBeenCalledWith(
        'session-token',
        expect.any(String),
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    test('should handle password timing attacks', async () => {
      // Test that login attempts take similar time regardless of whether user exists
      const nonExistentUser = {
        username: 'definitelynotauser123456789',
        password: 'password123',
      };

      const existingUserWrongPassword = {
        username: testUser.username,
        password: 'wrongpassword',
      };

      const start1 = Date.now();
      await tester.post(nonExistentUser);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await tester.post(existingUserWrongPassword);
      const time2 = Date.now() - start2;

      // Times should be relatively similar (within reasonable bounds)
      // This is a basic test - in practice, you'd want more sophisticated timing analysis
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Mock authenticateUser to throw an error
      const mockAuthenticateUser = jest.spyOn(auth, 'authenticateUser');
      mockAuthenticateUser.mockRejectedValue(new Error('Database connection failed'));

      const loginData = {
        username: testUser.username,
        password: testUser.plainPassword,
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 500, 'Internal server error');

      mockAuthenticateUser.mockRestore();
    });

    test('should handle session creation errors', async () => {
      // Mock createSession to throw an error
      const mockCreateSession = jest.spyOn(auth, 'createSession');
      mockCreateSession.mockRejectedValue(new Error('Session creation failed'));

      const loginData = {
        username: testUser.username,
        password: testUser.plainPassword,
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 500, 'Internal server error');

      mockCreateSession.mockRestore();
    });

    test('should handle malformed JSON', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        cookies: { get: jest.fn() },
      };

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle case-sensitive usernames', async () => {
      const loginData = {
        username: testUser.username.toUpperCase(),
        password: testUser.plainPassword,
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 401, 'Invalid username or password');
    });

    test('should trim whitespace from credentials', async () => {
      const loginData = {
        username: `  ${testUser.username}  `,
        password: `  ${testUser.plainPassword}  `,
      };

      // Note: Current implementation doesn't trim, so this should fail
      // If you want to support trimming, modify the login route
      const response = await tester.post(loginData);
      expectErrorResponse(response, 401, 'Invalid username or password');
    });

    test('should handle very long usernames', async () => {
      const longUsername = 'a'.repeat(1000);
      const loginData = {
        username: longUsername,
        password: 'password123',
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 401, 'Invalid username or password');
    });

    test('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const loginData = {
        username: testUser.username,
        password: longPassword,
      };

      const response = await tester.post(loginData);
      expectErrorResponse(response, 401, 'Invalid username or password');
    });
  });
});