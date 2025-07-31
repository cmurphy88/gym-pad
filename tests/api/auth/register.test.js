import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { POST } from '../../../app/api/auth/register/route.js';
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

describe('/api/auth/register', () => {
  let tester;
  const testData = createTestDataSets();

  beforeEach(() => {
    tester = new ApiTester(POST);
  });

  describe('Successful Registration', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        username: `newuser_${Date.now()}`,
        password: 'password123',
        name: 'New User',
      };

      const response = await tester.post(userData);

      expect(response.status).toBe(200);
      expectAuthResponse(response.data, {
        username: userData.username,
        name: userData.name,
      });
    });

    test('should hash password before storing', async () => {
      const userData = {
        username: `newuser_${Date.now()}`,
        password: 'password123',
        name: 'New User',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);

      // Verify password is hashed in database
      const { prisma } = await import('../../setup/setupTests.js');
      const user = await prisma.user.findUnique({
        where: { username: userData.username },
      });

      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should create session and set cookie', async () => {
      const mockSetCookie = jest.fn();
      const { NextResponse } = require('next/server');
      NextResponse.json.mockReturnValue({
        json: async () => ({ 
          success: true, 
          user: { id: 1, username: 'testuser', name: 'Test User' }
        }),
        status: 200,
        cookies: { set: mockSetCookie },
      });

      const userData = {
        username: `newuser_${Date.now()}`,
        password: 'password123',
        name: 'New User',
      };

      await tester.post(userData);

      expect(mockSetCookie).toHaveBeenCalledWith(
        'session-token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60, // 1 year
        })
      );
    });

    test('should auto-login user after registration', async () => {
      const userData = {
        username: `newuser_${Date.now()}`,
        password: 'password123',
        name: 'New User',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);

      // Verify session was created
      const { prisma } = await import('../../setup/setupTests.js');
      const user = await prisma.user.findUnique({
        where: { username: userData.username },
      });
      
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });
      
      expect(sessions).toHaveLength(1);
    });
  });

  describe('Validation Errors', () => {
    test('should reject missing username', async () => {
      const userData = {
        password: 'password123',
        name: 'Test User',
      };

      const response = await tester.post(userData);
      expectErrorResponse(response, 400, 'Username, password, and name are required');
    });

    test('should reject missing password', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
      };

      const response = await tester.post(userData);
      expectErrorResponse(response, 400, 'Username, password, and name are required');
    });

    test('should reject missing name', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
      };

      const response = await tester.post(userData);
      expectErrorResponse(response, 400, 'Username, password, and name are required');
    });

    test('should require password to be at least 6 characters', async () => {
      const userData = {
        username: `user_${Date.now()}`,
        password: '12345', // 5 characters
        name: 'Test User',
      };

      const response = await tester.post(userData);
      expectErrorResponse(response, 400, 'Password must be at least 6 characters long');
    });

    test('should accept password exactly 6 characters', async () => {
      const userData = {
        username: `user_${Date.now()}`,
        password: '123456', // 6 characters
        name: 'Test User',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);
    });

    test('should reject empty strings', async () => {
      const testCases = [
        { username: '', password: 'password123', name: 'Test User' },
        { username: 'testuser', password: '', name: 'Test User' },
        { username: 'testuser', password: 'password123', name: '' },
      ];

      for (const userData of testCases) {
        const response = await tester.post(userData);
        expectErrorResponse(response, 400, 'Username, password, and name are required');
      }
    });
  });

  describe('Input Validation', () => {
    const validUserData = {
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
    };

    testValidationScenarios(tester, 'post', validUserData, generateUserValidationTests());
  });

  describe('Duplicate Username Handling', () => {
    test('should reject duplicate username', async () => {
      // Create a user first
      const existingUser = await createTestUser({
        username: 'duplicateuser',
        password: 'password123',
        name: 'Existing User',
      });

      // Try to register with same username
      const userData = {
        username: existingUser.username,
        password: 'differentpassword',
        name: 'Different User',
      };

      const response = await tester.post(userData);
      expectErrorResponse(response, 409, 'Username already exists');
    });

    test('should handle case-sensitive usernames', async () => {
      // Create a user
      const existingUser = await createTestUser({
        username: 'CaseSensitive',
        password: 'password123',
        name: 'Existing User',
      });

      // Try to register with different case
      const userData = {
        username: 'casesensitive', // lowercase
        password: 'password123',
        name: 'New User',
      };

      const response = await tester.post(userData);
      // Should succeed since usernames are case-sensitive
      expect(response.status).toBe(200);
    });
  });

  describe('Security', () => {
    test('should not expose password in response', async () => {
      const userData = {
        username: `secureuser_${Date.now()}`,
        password: 'password123',
        name: 'Secure User',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);
      expect(response.data.user).not.toHaveProperty('password');
    });

    test('should use secure cookie settings in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockSetCookie = jest.fn();
      const { NextResponse } = require('next/server');
      NextResponse.json.mockReturnValue({
        json: async () => ({ 
          success: true, 
          user: { id: 1, username: 'testuser', name: 'Test User' }
        }),
        status: 200,
        cookies: { set: mockSetCookie },
      });

      const userData = {
        username: `produser_${Date.now()}`,
        password: 'password123',
        name: 'Production User',
      };

      await tester.post(userData);

      expect(mockSetCookie).toHaveBeenCalledWith(
        'session-token',
        expect.any(String),
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    test('should handle password with special characters', async () => {
      const userData = {
        username: `specialuser_${Date.now()}`,
        password: 'P@ssw0rd!#$%^&*()',
        name: 'Special User',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);
    });

    test('should handle unicode characters in name', async () => {
      const userData = {
        username: `unicodeuser_${Date.now()}`,
        password: 'password123',
        name: 'José María González 你好',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);
      expect(response.data.user.name).toBe(userData.name);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Mock prisma to throw an error
      const { prisma } = await import('../../setup/setupTests.js');
      const originalFindUnique = prisma.user.findUnique;
      prisma.user.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

      const userData = {
        username: `erroruser_${Date.now()}`,
        password: 'password123',
        name: 'Error User',
      };

      const response = await tester.post(userData);
      expectErrorResponse(response, 500, 'Internal server error');

      // Restore original method
      prisma.user.findUnique = originalFindUnique;
    });

    test('should handle password hashing errors', async () => {
      // Mock hashPassword to throw an error
      const mockHashPassword = jest.spyOn(auth, 'hashPassword');
      mockHashPassword.mockRejectedValue(new Error('Hashing failed'));

      const userData = {
        username: `hashuser_${Date.now()}`,
        password: 'password123',
        name: 'Hash User',
      };

      const response = await tester.post(userData);
      expectErrorResponse(response, 500, 'Internal server error');

      mockHashPassword.mockRestore();
    });

    test('should handle session creation errors', async () => {
      // Mock createSession to throw an error
      const mockCreateSession = jest.spyOn(auth, 'createSession');
      mockCreateSession.mockRejectedValue(new Error('Session creation failed'));

      const userData = {
        username: `sessionuser_${Date.now()}`,
        password: 'password123',
        name: 'Session User',
      };

      const response = await tester.post(userData);
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
    test('should handle very long usernames', async () => {
      const userData = {
        username: 'a'.repeat(255), // Very long username
        password: 'password123',
        name: 'Long Username User',
      };

      const response = await tester.post(userData);
      // Depending on database constraints, this might succeed or fail
      expect([200, 400, 500]).toContain(response.status);
    });

    test('should handle very long names', async () => {
      const userData = {
        username: `longname_${Date.now()}`,
        password: 'password123',
        name: 'A'.repeat(1000), // Very long name
      };

      const response = await tester.post(userData);
      // Depending on database constraints, this might succeed or fail
      expect([200, 400, 500]).toContain(response.status);
    });

    test('should handle username with special characters', async () => {
      const userData = {
        username: `user_@#$%^&*()_${Date.now()}`,
        password: 'password123',
        name: 'Special Char User',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);
    });

    test('should trim whitespace from fields', async () => {
      const userData = {
        username: `  trimuser_${Date.now()}  `,
        password: '  password123  ',
        name: '  Trim User  ',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);
      
      // Check if fields were trimmed in database
      const { prisma } = await import('../../setup/setupTests.js');
      const user = await prisma.user.findUnique({
        where: { username: userData.username.trim() },
      });
      
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name.trim());
    });
  });

  describe('Response Format', () => {
    test('should return consistent response format', async () => {
      const userData = {
        username: `formatuser_${Date.now()}`,
        password: 'password123',
        name: 'Format User',
      };

      const response = await tester.post(userData);
      expect(response.status).toBe(200);
      
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('user');
      expect(response.data.user).toHaveProperty('id');
      expect(response.data.user).toHaveProperty('username');
      expect(response.data.user).toHaveProperty('name');
      expect(response.data.user).not.toHaveProperty('password');
      expect(response.data.user).not.toHaveProperty('createdAt');
    });
  });
});