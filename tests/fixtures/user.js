/**
 * Test fixtures for User model
 * These are safe mock data objects that don't interact with the database
 */

export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  name: 'Test User',
  password: '$2b$10$mockedhashedpassword123',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides
});

export const createMockSession = (userId = 1, overrides = {}) => ({
  id: 'session_test_123',
  userId,
  token: 'test_session_token_123456',
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  createdAt: new Date(),
  user: createMockUser({ id: userId }),
  ...overrides
});

export const createMockAuthResult = (user = null) => {
  if (!user) {
    user = createMockUser();
  }
  
  return {
    session: createMockSession(user.id),
    user
  };
};

// Multiple users for testing different scenarios
export const mockUsers = {
  testUser1: createMockUser({
    id: 1,
    username: 'testuser1',
    name: 'Test User One'
  }),
  
  testUser2: createMockUser({
    id: 2,
    username: 'testuser2',
    name: 'Test User Two'
  }),
  
  adminUser: createMockUser({
    id: 3,
    username: 'admin',
    name: 'Admin User'
  })
};