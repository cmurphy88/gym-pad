import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET } from '../../../app/api/auth/me/route.js';
import { createAuthenticatedUser, expectErrorResponse } from '../../helpers/authHelpers.js';
import { ApiTester, createMockRequest } from '../../helpers/requestHelpers.js';

// Mock the middleware module at the top level
jest.mock('../../../lib/middleware.js', () => ({
  ...jest.requireActual('../../../lib/middleware.js'),
  getOptionalAuth: jest.fn(),
}));

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/auth/me', () => {
  let tester;
  let authenticatedUser;

  beforeEach(async () => {
    tester = new ApiTester(GET);
    authenticatedUser = await createAuthenticatedUser();
  });

  describe('Successful Authentication Check', () => {
    test('should return user info for authenticated user', async () => {
      const request = createMockRequest({
        cookies: { 'session-token': authenticatedUser.token },
      });

      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
      expect(response.data.user).toHaveProperty('id', authenticatedUser.user.id);
      expect(response.data.user).toHaveProperty('username', authenticatedUser.user.username);
      expect(response.data.user).toHaveProperty('name', authenticatedUser.user.name);
      expect(response.data.user).not.toHaveProperty('password');
    });

    test('should not expose sensitive user information', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expect(response.status).toBe(200);
      expect(response.data.user).not.toHaveProperty('password');
      expect(response.data.user).not.toHaveProperty('createdAt');
      expect(response.data.user).not.toHaveProperty('updatedAt');
    });

    test('should validate session token from database', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expect(response.status).toBe(200);
      
      // Verify the session exists in the database
      const { prisma } = await import('../../setup/setupTests.js');
      const session = await prisma.session.findUnique({
        where: { token: authenticatedUser.token },
      });
      
      expect(session).toBeTruthy();
      expect(session.userId).toBe(authenticatedUser.user.id);
    });
  });

  describe('Authentication Failures', () => {
    test('should reject request without session token', async () => {
      const response = await tester.get();

      expectErrorResponse(response, 401, 'Not authenticated');
    });

    test('should reject request with invalid session token', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': 'invalid-token-123' } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });

    test('should reject request with empty session token', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': '' } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });

    test('should reject request with expired session token', async () => {
      // Create an expired session
      const { prisma } = await import('../../setup/setupTests.js');
      const expiredSession = await prisma.session.create({
        data: {
          userId: authenticatedUser.user.id,
          token: 'expired-token-123',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      });

      const response = await tester.get({ 
        cookies: { 'session-token': expiredSession.token } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');

      // Verify expired session was cleaned up
      const cleanedSession = await prisma.session.findUnique({
        where: { token: expiredSession.token },
      });
      expect(cleanedSession).toBeNull();
    });

    test('should handle malformed cookies', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': null } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });
  });

  describe('Session Management', () => {
    test('should clean up expired sessions on access', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      
      // Create multiple expired sessions
      const expiredSessions = await Promise.all([
        prisma.session.create({
          data: {
            userId: authenticatedUser.user.id,
            token: 'expired-1',
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        }),
        prisma.session.create({
          data: {
            userId: authenticatedUser.user.id,
            token: 'expired-2',
            expiresAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          },
        }),
      ]);

      // Try to access with expired token
      await tester.get({ 
        cookies: { 'session-token': expiredSessions[0].token } 
      });

      // Check if expired session was cleaned up
      const remainingSession = await prisma.session.findUnique({
        where: { token: expiredSessions[0].token },
      });
      expect(remainingSession).toBeNull();
    });

    test('should handle concurrent requests with same session', async () => {
      // Make multiple concurrent requests with the same token
      const requests = Array(5).fill().map(() => 
        tester.get({ cookies: { 'session-token': authenticatedUser.token } })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.user.id).toBe(authenticatedUser.user.id);
      });
    });
  });

  describe('Error Handling', () => {
    let getOptionalAuth;

    beforeEach(async () => {
      // Get the mocked function
      const middlewareModule = await import('../../../lib/middleware.js');
      getOptionalAuth = middlewareModule.getOptionalAuth;
      
      // Reset mock before each test
      getOptionalAuth.mockReset();
    });

    test('should handle database connection errors', async () => {
      // Mock getOptionalAuth to throw an error
      getOptionalAuth.mockRejectedValue(new Error('Database connection failed'));

      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expectErrorResponse(response, 500, 'Internal server error');
    });

    test('should handle session validation errors', async () => {
      // Mock getOptionalAuth to return null (invalid session)
      getOptionalAuth.mockResolvedValue(null);

      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });

    test('should handle corrupted session data', async () => {
      // Create a session with invalid user ID
      const { prisma } = await import('../../setup/setupTests.js');
      const corruptSession = await prisma.session.create({
        data: {
          userId: 99999, // Non-existent user ID
          token: 'corrupt-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await tester.get({ 
        cookies: { 'session-token': corruptSession.token } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });
  });

  describe('Security', () => {
    test('should validate session belongs to requesting user', async () => {
      // Create another authenticated user
      const otherUser = await createAuthenticatedUser();

      // Try to use first user's token but expect second user's data
      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expect(response.status).toBe(200);
      expect(response.data.user.id).toBe(authenticatedUser.user.id);
      expect(response.data.user.id).not.toBe(otherUser.user.id);
    });

    test('should handle session hijacking attempts', async () => {
      // Try to use a token that doesn't exist but follows the pattern
      const fakeToken = 'abcd1234efgh5678ijkl9012mnop3456';
      
      const response = await tester.get({ 
        cookies: { 'session-token': fakeToken } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });

    test('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(1000);
      
      const response = await tester.get({ 
        cookies: { 'session-token': longToken } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });

    test('should handle tokens with special characters', async () => {
      const specialToken = 'token@#$%^&*()_+{}[]|\\:";\'<>?,./';
      
      const response = await tester.get({ 
        cookies: { 'session-token': specialToken } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });
  });

  describe('Response Format', () => {
    test('should return consistent response format', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
      expect(typeof response.data.user).toBe('object');
      expect(response.data.user).not.toBeNull();
      expect(Array.isArray(response.data.user)).toBe(false);
    });

    test('should include all required user fields', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expect(response.status).toBe(200);
      
      const requiredFields = ['id', 'username', 'name'];
      requiredFields.forEach(field => {
        expect(response.data.user).toHaveProperty(field);
        expect(response.data.user[field]).toBeDefined();
      });
    });

    test('should not include sensitive fields', async () => {
      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expect(response.status).toBe(200);
      
      const sensitiveFields = ['password', 'sessions'];
      sensitiveFields.forEach(field => {
        expect(response.data.user).not.toHaveProperty(field);
      });
    });
  });

  describe('HTTP Methods', () => {
    test('should only accept GET requests', async () => {
      const methods = ['post', 'put', 'patch', 'delete'];
      
      for (const method of methods) {
        try {
          const response = await tester[method]({}, { 
            cookies: { 'session-token': authenticatedUser.token } 
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

  describe('Edge Cases', () => {
    test('should handle user deletion while session exists', async () => {
      // Delete the user but keep the session
      const { prisma } = await import('../../setup/setupTests.js');
      await prisma.user.delete({
        where: { id: authenticatedUser.user.id },
      });

      const response = await tester.get({ 
        cookies: { 'session-token': authenticatedUser.token } 
      });

      expectErrorResponse(response, 401, 'Not authenticated');
    });

    test('should handle session cleanup on user deletion', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      
      // Verify session exists before deletion
      const sessionBefore = await prisma.session.findUnique({
        where: { token: authenticatedUser.token },
      });
      expect(sessionBefore).toBeTruthy();

      // Delete user (should cascade delete sessions)
      await prisma.user.delete({
        where: { id: authenticatedUser.user.id },
      });

      // Verify sessions were cleaned up
      const sessionAfter = await prisma.session.findUnique({
        where: { token: authenticatedUser.token },
      });
      expect(sessionAfter).toBeNull();
    });
  });
});