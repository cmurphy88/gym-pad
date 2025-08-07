import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/logout/route';
import { prisma } from '@/lib/prisma';

// Mock the deleteSession function
vi.mock('@/lib/auth', () => ({
  deleteSession: vi.fn()
}));

describe('/api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully logout with valid session token', async () => {
    const mockToken = 'valid_session_token_123';
    
    // Mock successful session deletion
    const { deleteSession } = await import('@/lib/auth');
    deleteSession.mockResolvedValue();

    // Create request with session cookie
    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/logout', {
      'session-token': mockToken
    }, { method: 'POST' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify session deletion was called
    expect(deleteSession).toHaveBeenCalledWith(mockToken);

    // Verify cookie was cleared
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toContain('session-token=;');
    expect(setCookieHeader).toContain('Max-Age=0');
    expect(setCookieHeader).toContain('HttpOnly');
  });

  it('should handle logout without session token', async () => {
    const { deleteSession } = await import('@/lib/auth');
    
    // Create request without session cookie
    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/logout', {}, { method: 'POST' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify session deletion was not called (no token to delete)
    expect(deleteSession).not.toHaveBeenCalled();

    // Verify cookie was still cleared (defensive measure)
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toContain('session-token=;');
    expect(setCookieHeader).toContain('Max-Age=0');
  });

  it('should handle database connection errors gracefully', async () => {
    const mockToken = 'valid_session_token_123';
    const { deleteSession } = await import('@/lib/auth');
    
    // Mock database connection error
    const dbError = new Error('Database connection failed');
    deleteSession.mockRejectedValue(dbError);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/logout', {
      'session-token': mockToken
    }, { method: 'POST' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.warning).toBe('Session cleared locally (database temporarily unavailable)');
    
    // Verify cookie was still cleared despite DB error
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toContain('session-token=;');
    expect(setCookieHeader).toContain('Max-Age=0');
  });

  it('should handle unexpected errors', async () => {
    const mockToken = 'valid_session_token_123';
    const { deleteSession } = await import('@/lib/auth');
    
    // Mock unexpected error
    const unexpectedError = new Error('Unexpected error');
    deleteSession.mockRejectedValue(unexpectedError);

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/logout', {
      'session-token': mockToken
    }, { method: 'POST' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should set secure cookie in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { deleteSession } = await import('@/lib/auth');
    deleteSession.mockResolvedValue();

    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/logout', {
      'session-token': 'test_token'
    }, { method: 'POST' });

    const response = await POST(request);
    
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toContain('Secure');

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle empty session token', async () => {
    const { deleteSession } = await import('@/lib/auth');
    
    // Create request with empty session cookie
    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/logout', {
      'session-token': ''
    }, { method: 'POST' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify session deletion was not called for empty token
    expect(deleteSession).not.toHaveBeenCalled();
  });

  it('should handle session token with whitespace', async () => {
    const { deleteSession } = await import('@/lib/auth');
    deleteSession.mockResolvedValue();
    
    const request = createMockRequestWithCookies('http://localhost:3000/api/auth/logout', {
      'session-token': '  valid_token_123  '
    }, { method: 'POST' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Cookie parsing trims trailing whitespace
    expect(deleteSession).toHaveBeenCalledWith('  valid_token_123');
  });
});