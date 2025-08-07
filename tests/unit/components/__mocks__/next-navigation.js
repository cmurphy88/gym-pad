import { vi } from 'vitest';

// Mock Next.js useRouter hook for component testing
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/test',
  route: '/test',
  query: {},
  asPath: '/test',
  basePath: '',
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  isReady: true,
  isPreview: false,
}));

// Mock Next.js useSearchParams hook
export const useSearchParams = vi.fn(() => ({
  get: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
  entries: vi.fn(),
  forEach: vi.fn(),
  toString: vi.fn(() => ''),
}));

// Mock Next.js usePathname hook
export const usePathname = vi.fn(() => '/test');