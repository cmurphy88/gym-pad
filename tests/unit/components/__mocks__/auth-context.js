import { vi } from 'vitest';
import React from 'react';

// Mock AuthContext for component testing
const mockAuthContext = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshAuth: vi.fn()
};

// Mock useAuth hook
export const useAuth = vi.fn(() => mockAuthContext);

// Mock AuthProvider component
export const AuthProvider = vi.fn(({ children }) => {
  return React.createElement(React.Fragment, null, children);
});

// Helper function to set mock auth state for tests
export const setMockAuthState = (newState) => {
  Object.assign(mockAuthContext, newState);
  useAuth.mockReturnValue({ ...mockAuthContext });
};

// Reset mock to default state
export const resetAuthMock = () => {
  Object.assign(mockAuthContext, {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshAuth: vi.fn()
  });
  useAuth.mockReturnValue({ ...mockAuthContext });
};