import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/me/route';
import { createMockUser, createMockAuthResult } from '../../../fixtures/user.js';

// Mock the middleware
vi.mock('@/lib/middleware', () => ({
  getOptionalAuth: vi.fn()
}));

describe('/api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user data for authenticated user', async () => {
    const mockUser = createMockUser({
      id: 1,
      username: 'testuser',
      name: 'Test User'
    });
    const mockAuth = createMockAuthResult(mockUser);

    const { getOptionalAuth } = await import('@/lib/middleware');
    getOptionalAuth.mockResolvedValue(mockAuth);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me', {
      'session-token': 'valid_token_123'
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // JSON serialization converts Date objects to strings
    const expectedUser = {
      ...mockUser,
      createdAt: mockUser.createdAt.toISOString()
    };
    expect(data.user).toEqual(expectedUser);
    expect(getOptionalAuth).toHaveBeenCalledWith(request);
  });

  it('should return 401 for unauthenticated user', async () => {
    const { getOptionalAuth } = await import('@/lib/middleware');
    getOptionalAuth.mockResolvedValue(null);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
    expect(getOptionalAuth).toHaveBeenCalledWith(request);
  });

  it('should return 401 for invalid session token', async () => {
    const { getOptionalAuth } = await import('@/lib/middleware');
    getOptionalAuth.mockResolvedValue(null); // Invalid token returns null

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me', {
      'session-token': 'invalid_token'
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should return 401 for expired session token', async () => {
    const { getOptionalAuth } = await import('@/lib/middleware');
    getOptionalAuth.mockResolvedValue(null); // Expired token returns null

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me', {
      'session-token': 'expired_token'
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should handle authentication errors gracefully', async () => {
    const { getOptionalAuth } = await import('@/lib/middleware');
    const authError = new Error('Authentication service error');
    getOptionalAuth.mockRejectedValue(authError);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me', {
      'session-token': 'valid_token'
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle database connection errors', async () => {
    const { getOptionalAuth } = await import('@/lib/middleware');
    const dbError = new Error('Database connection failed');
    getOptionalAuth.mockRejectedValue(dbError);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me', {
      'session-token': 'valid_token'
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should work without session cookie', async () => {
    const { getOptionalAuth } = await import('@/lib/middleware');
    getOptionalAuth.mockResolvedValue(null);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
    expect(getOptionalAuth).toHaveBeenCalledWith(request);
  });

  it('should return complete user object structure', async () => {
    const mockUser = createMockUser({
      id: 42,
      username: 'complexuser',
      name: 'Complex Test User'
    });
    const mockAuth = createMockAuthResult(mockUser);

    const { getOptionalAuth } = await import('@/lib/middleware');
    getOptionalAuth.mockResolvedValue(mockAuth);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me', {
      'session-token': 'valid_token_123'
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('id', 42);
    expect(data.user).toHaveProperty('username', 'complexuser');
    expect(data.user).toHaveProperty('name', 'Complex Test User');
    
    // Note: The current implementation returns the complete user object
    // In production, you might want to filter out sensitive fields
    expect(data.user).toHaveProperty('password'); // Documents current behavior
    expect(data.user).toHaveProperty('createdAt');
  });

  it('should handle multiple cookies correctly', async () => {
    const mockUser = createMockUser();
    const mockAuth = createMockAuthResult(mockUser);

    const { getOptionalAuth } = await import('@/lib/middleware');
    getOptionalAuth.mockResolvedValue(mockAuth);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/me', {
      'other-cookie': 'value',
      'session-token': 'valid_token_123',
      'another-cookie': 'another-value'
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // JSON serialization converts Date objects to strings
    const expectedUser = {
      ...mockUser,
      createdAt: mockUser.createdAt.toISOString()
    };
    expect(data.user).toEqual(expectedUser);
  });
});