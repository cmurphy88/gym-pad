import { jest } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, createSession } from '../../lib/auth.js';

/**
 * Create a test user with default or custom data
 */
export const createTestUser = async (userData = {}) => {
  const defaultData = {
    username: `testuser_${Date.now()}`,
    password: 'password123',
    name: 'Test User',
  };
  
  const data = { ...defaultData, ...userData };
  const hashedPassword = await hashPassword(data.password);
  
  const user = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      name: data.name,
    },
  });
  
  return { ...user, plainPassword: data.password };
};

/**
 * Create a test session for a user
 */
export const createTestSession = async (userId) => {
  return await createSession(userId);
};

/**
 * Create a test user and return with session token
 */
export const createAuthenticatedUser = async (userData = {}) => {
  const user = await createTestUser(userData);
  const session = await createSession(user.id);
  
  return {
    user,
    session,
    token: session.token,
  };
};

/**
 * Mock authentication middleware to always return authenticated user
 */
export const mockRequireAuth = (user) => {
  return jest.fn().mockResolvedValue({
    user,
    session: { id: 'test-session', token: 'test-token' },
  });
};

/**
 * Mock authentication middleware to return unauthenticated
 */
export const mockRequireAuthUnauthenticated = () => {
  const { NextResponse } = require('next/server');
  return jest.fn().mockResolvedValue(
    NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  );
};

/**
 * Create mock cookies with authentication token
 */
export const createAuthCookies = (token) => ({
  'session-token': token,
});

/**
 * Create a mock request with authentication
 */
export const createAuthenticatedRequest = (options = {}) => {
  const { token, ...requestOptions } = options;
  
  return {
    ...requestOptions,
    cookies: {
      get: jest.fn((name) => {
        if (name === 'session-token' && token) {
          return { value: token };
        }
        return null;
      }),
    },
  };
};

/**
 * Validate authentication response format
 */
export const expectAuthResponse = (response, expectedUser) => {
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('user');
  expect(response.user).toHaveProperty('id', expectedUser.id);
  expect(response.user).toHaveProperty('username', expectedUser.username);
  expect(response.user).toHaveProperty('name', expectedUser.name);
  expect(response.user).not.toHaveProperty('password');
};

/**
 * Validate error response format
 */
export const expectErrorResponse = (response, status, message) => {
  expect(response.status).toBe(status);
  expect(response.data).toHaveProperty('error');
  if (message) {
    expect(response.data.error).toContain(message);
  }
};

/**
 * Clean up user-related test data
 */
export const cleanupUserData = async (userId) => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.workout.deleteMany({ where: { userId } });
  await prisma.weightEntry.deleteMany({ where: { userId } });
  await prisma.weightGoal.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
};