import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { createMockUser, createMockSession } from '../../../fixtures/user.js';
import bcrypt from 'bcryptjs';

// Mock bcrypt for password hashing
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn()
  }
}));

describe('/api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for missing username', async () => {
    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      password: 'password123',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username, password, and name are required');
  });

  it('should return 400 for missing password', async () => {
    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username, password, and name are required');
  });

  it('should return 400 for missing name', async () => {
    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: 'password123'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username, password, and name are required');
  });

  it('should return 400 for short password', async () => {
    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: '123',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Password must be at least 6 characters long');
  });

  it('should return 409 for existing username', async () => {
    const existingUser = createMockUser({ username: 'existinguser' });
    
    // Mock user already exists
    prisma.user.findUnique.mockResolvedValue(existingUser);

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'existinguser',
      password: 'password123',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Username already exists');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'existinguser' }
    });
  });

  it('should successfully register a new user', async () => {
    const newUserData = {
      username: 'newuser',
      password: 'password123',
      name: 'New User'
    };
    
    const hashedPassword = '$2b$10$hashedpassword123';
    const mockUser = createMockUser({
      username: newUserData.username,
      name: newUserData.name,
      password: hashedPassword
    });
    const mockSession = createMockSession(mockUser.id);

    // Mock registration flow
    prisma.user.findUnique.mockResolvedValue(null); // Username available
    bcrypt.hash.mockResolvedValue(hashedPassword);
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.session.create.mockResolvedValue(mockSession);

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', newUserData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toEqual({
      id: mockUser.id,
      username: mockUser.username,
      name: mockUser.name
    });

    // Verify password was hashed
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

    // Verify user was created with hashed password
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        username: 'newuser',
        password: hashedPassword,
        name: 'New User'
      }
    });

    // Verify session was created
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        token: expect.any(String),
        expiresAt: expect.any(Date)
      }
    });

    // Verify cookie was set
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toContain('session-token=');
    expect(setCookieHeader).toContain('HttpOnly');
  });

  it('should handle database connection errors during user lookup', async () => {
    const dbError = new Error('Database connection failed');
    prisma.user.findUnique.mockRejectedValue(dbError);

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: 'password123',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database temporarily unavailable. Please try again later.');
  });

  it('should handle database connection errors during user creation', async () => {
    const dbError = new Error('Database connection failed');
    
    prisma.user.findUnique.mockResolvedValue(null); // Username available
    bcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    prisma.user.create.mockRejectedValue(dbError); // Error during creation

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: 'password123',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database temporarily unavailable. Please try again later.');
  });

  it('should handle password hashing errors', async () => {
    const hashError = new Error('Hashing failed');
    
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockRejectedValue(hashError);

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: 'password123',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle session creation errors', async () => {
    const sessionError = new Error('Session creation failed');
    const mockUser = createMockUser();
    
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.session.create.mockRejectedValue(sessionError);

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: 'password123',
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should accept exactly 6 character password', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser.id);
    
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.session.create.mockResolvedValue(mockSession);

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: '123456', // Exactly 6 characters
      name: 'Test User'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should set secure cookie in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser.id);
    
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.session.create.mockResolvedValue(mockSession);

    const request = createMockRequestWithBody('http://localhost:3000/api/auth/register', {
      username: 'testuser',
      password: 'password123',
      name: 'Test User'
    });

    const response = await POST(request);
    
    const setCookieHeader = response.headers.get('Set-Cookie');
    expect(setCookieHeader).toContain('Secure');

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });
});