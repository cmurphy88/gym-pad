import { vi } from 'vitest';

// Mock SWR hook for component testing
export default vi.fn((key, fetcher, options) => ({
  data: undefined,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
  isLoading: false
}));

// Named export for useSWR
export const useSWR = vi.fn((key, fetcher, options) => ({
  data: undefined,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
  isLoading: false
}));

// Mock mutate function for global cache mutations
export const mutate = vi.fn();