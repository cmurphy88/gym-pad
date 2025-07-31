import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { POST } from '../../../app/api/auth/logout/route.js';
import { createAuthenticatedUser, expectErrorResponse } from '../../helpers/authHelpers.js';
import { ApiTester } from '../../helpers/requestHelpers.js';
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

describe('/api/auth/logout', () => {
  let tester;
  let authenticatedUser;

  beforeEach(async () => {
    tester = new ApiTester(POST);
    authenticatedUser = await createAuthenticatedUser();
  });

  describe('Successful Logout', () => {
    test('should logout successfully with valid session', async () => {
      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should delete session from database', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      
      // Verify session exists before logout
      const sessionBefore = await prisma.session.findUnique({
        where: { token: authenticatedUser.token },
      });
      expect(sessionBefore).toBeTruthy();

      await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      // Verify session is deleted after logout
      const sessionAfter = await prisma.session.findUnique({
        where: { token: authenticatedUser.token },
      });
      expect(sessionAfter).toBeNull();
    });

    test('should clear session cookie', async () => {
      const mockSetCookie = jest.fn();
      const { NextResponse } = require('next/server');
      NextResponse.json.mockReturnValue({
        json: async () => ({ success: true }),
        status: 200,
        cookies: { set: mockSetCookie },
      });

      await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(mockSetCookie).toHaveBeenCalledWith(
        'session-token',
        '',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 0, // Expire immediately
        })
      );
    });

    test('should work even without valid session', async () => {
      // Should not fail even if no session token is provided
      const response = await tester.post({});

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should work with invalid session token', async () => {
      const response = await tester.post({}, {
        cookies: { 'session-token': 'invalid-token-123' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should clear cookie even with invalid token', async () => {
      const mockSetCookie = jest.fn();
      const { NextResponse } = require('next/server');
      NextResponse.json.mockReturnValue({
        json: async () => ({ success: true }),
        status: 200,
        cookies: { set: mockSetCookie },
      });

      await tester.post({}, {
        cookies: { 'session-token': 'invalid-token' },
      });

      expect(mockSetCookie).toHaveBeenCalledWith(
        'session-token',
        '',
        expect.objectContaining({
          maxAge: 0,
        })
      );
    });
  });

  describe('Multiple Sessions', () => {
    test('should only delete the specific session token', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      
      // Create another session for the same user
      const secondSession = await prisma.session.create({
        data: {
          userId: authenticatedUser.user.id,
          token: 'second-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Logout with first session token
      await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      // First session should be deleted
      const firstSession = await prisma.session.findUnique({
        where: { token: authenticatedUser.token },
      });
      expect(firstSession).toBeNull();

      // Second session should still exist
      const remainingSession = await prisma.session.findUnique({
        where: { token: secondSession.token },
      });
      expect(remainingSession).toBeTruthy();
    });

    test('should handle logout when user has no sessions', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      
      // Delete all sessions for the user
      await prisma.session.deleteMany({
        where: { userId: authenticatedUser.user.id },
      });

      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('Cookie Handling', () => {
    test('should handle missing cookie gracefully', async () => {
      const response = await tester.post({});

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should handle empty cookie value', async () => {
      const response = await tester.post({}, {
        cookies: { 'session-token': '' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should handle null cookie value', async () => {
      const response = await tester.post({}, {
        cookies: { 'session-token': null },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should use secure cookie settings in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockSetCookie = jest.fn();
      const { NextResponse } = require('next/server');
      NextResponse.json.mockReturnValue({
        json: async () => ({ success: true }),
        status: 200,
        cookies: { set: mockSetCookie },
      });

      await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(mockSetCookie).toHaveBeenCalledWith(
        'session-token',
        '',
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Mock deleteSession to throw an error
      const mockDeleteSession = jest.spyOn(auth, 'deleteSession');
      mockDeleteSession.mockRejectedValue(new Error('Database connection failed'));

      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expectErrorResponse(response, 500, 'Internal server error');

      mockDeleteSession.mockRestore();
    });

    test('should handle session deletion errors', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      
      // Mock prisma session deletion to fail
      const originalDeleteMany = prisma.session.deleteMany;
      prisma.session.deleteMany = jest.fn().mockRejectedValue(new Error('Delete failed'));

      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expectErrorResponse(response, 500, 'Internal server error');

      // Restore original method
      prisma.session.deleteMany = originalDeleteMany;
    });

    test('should handle cookie parsing errors', async () => {
      // Create a mock request with malformed cookies
      const request = {
        cookies: {
          get: jest.fn().mockImplementation(() => {
            throw new Error('Cookie parsing error');
          }),
        },
      };

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Security', () => {
    test('should handle concurrent logout requests', async () => {
      // Make multiple concurrent logout requests with the same token
      const requests = Array(5).fill().map(() => 
        tester.post({}, {
          cookies: { 'session-token': authenticatedUser.token },
        })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed (idempotent behavior)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      // Session should be deleted
      const { prisma } = await import('../../setup/setupTests.js');
      const session = await prisma.session.findUnique({
        where: { token: authenticatedUser.token },
      });
      expect(session).toBeNull();
    });

    test('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(1000);
      
      const response = await tester.post({}, {
        cookies: { 'session-token': longToken },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should handle tokens with special characters', async () => {
      const specialToken = 'token@#$%^&*()_+{}[]|\\:";\'<>?,./';
      
      const response = await tester.post({}, {
        cookies: { 'session-token': specialToken },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    test('should not leak sensitive information in errors', async () => {
      // Mock deleteSession to throw an error with sensitive info
      const mockDeleteSession = jest.spyOn(auth, 'deleteSession');
      mockDeleteSession.mockRejectedValue(new Error('Database password: secret123'));

      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(response.status).toBe(500);
      expect(response.data.error).toBe('Internal server error');
      expect(response.data.error).not.toContain('secret123');

      mockDeleteSession.mockRestore();
    });
  });

  describe('HTTP Methods', () => {
    test('should only accept POST requests', async () => {
      const methods = ['get', 'put', 'patch', 'delete'];
      
      for (const method of methods) {
        try {
          const response = await tester[method]({}, {
            cookies: { 'session-token': authenticatedUser.token },
          });
          // If the method is not supported, it should return 405 or similar
          expect([405, 404, 500]).toContain(response.status);
        } catch (error) {
          // Method not implemented is also acceptable
          expect(error.message).toContain('not a function');
        }
      }
    });
  });

  describe('Response Format', () => {
    test('should return consistent response format', async () => {
      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
      expect(typeof response.data.success).toBe('boolean');
      expect(response.data.success).toBe(true);
    });

    test('should not include additional data in success response', async () => {
      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(response.status).toBe(200);
      expect(Object.keys(response.data)).toEqual(['success']);
    });
  });

  describe('Idempotent Behavior', () => {
    test('should be idempotent - multiple logouts should succeed', async () => {
      // First logout
      const response1 = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });
      expect(response1.status).toBe(200);

      // Second logout with same token should still succeed
      const response2 = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });
      expect(response2.status).toBe(200);

      // Third logout should still succeed
      const response3 = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });
      expect(response3.status).toBe(200);
    });

    test('should handle logout after session expiration', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      
      // Manually expire the session
      await prisma.session.update({
        where: { token: authenticatedUser.token },
        data: { expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      const response = await tester.post({}, {
        cookies: { 'session-token': authenticatedUser.token },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });
});