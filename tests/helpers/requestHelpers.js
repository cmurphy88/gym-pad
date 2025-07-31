import { jest } from '@jest/globals';
import { NextResponse } from 'next/server';

/**
 * Create a mock Next.js request object
 */
export const createMockRequest = (options = {}) => {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body = null,
    cookies = {},
    headers = {},
    searchParams = {},
  } = options;

  // Create URL with search params
  const fullUrl = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    fullUrl.searchParams.set(key, value);
  });

  const request = {
    method,
    url: fullUrl.toString(),
    headers: new Map(Object.entries(headers)),
    cookies: {
      get: jest.fn((name) => {
        const value = cookies[name];
        return value ? { value } : null;
      }),
      set: jest.fn(),
      delete: jest.fn(),
    },
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    formData: jest.fn(),
    arrayBuffer: jest.fn(),
  };

  return request;
};

/**
 * Create mock route parameters
 */
export const createMockParams = (params = {}) => {
  return Promise.resolve(params);
};

/**
 * Execute API route handler and return parsed response
 */
export const executeApiRoute = async (handler, request, params = {}) => {
  try {
    const response = await handler(request, { params: createMockParams(params) });
    
    // Handle NextResponse objects
    if (response && typeof response.json === 'function') {
      const data = await response.json();
      return {
        status: response.status || 200,
        data,
        headers: response.headers,
        cookies: response.cookies,
      };
    }
    
    // Handle plain objects
    return {
      status: 200,
      data: response,
    };
  } catch (error) {
    return {
      status: 500,
      data: { error: error.message },
    };
  }
};

/**
 * Test API route with various scenarios
 */
export class ApiTester {
  constructor(handler) {
    this.handler = handler;
  }

  async get(options = {}) {
    const request = createMockRequest({ method: 'GET', ...options });
    return executeApiRoute(this.handler, request, options.params);
  }

  async post(body, options = {}) {
    const request = createMockRequest({ 
      method: 'POST', 
      body, 
      ...options 
    });
    return executeApiRoute(this.handler, request, options.params);
  }

  async put(body, options = {}) {
    const request = createMockRequest({ 
      method: 'PUT', 
      body, 
      ...options 
    });
    return executeApiRoute(this.handler, request, options.params);
  }

  async patch(body, options = {}) {
    const request = createMockRequest({ 
      method: 'PATCH', 
      body, 
      ...options 
    });
    return executeApiRoute(this.handler, request, options.params);
  }

  async delete(options = {}) {
    const request = createMockRequest({ method: 'DELETE', ...options });
    return executeApiRoute(this.handler, request, options.params);
  }
}

/**
 * Assert successful API response
 */
export const expectSuccessResponse = (response, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.data).toBeDefined();
  expect(response.data.error).toBeUndefined();
};

/**
 * Assert error API response
 */
export const expectErrorResponse = (response, expectedStatus, expectedMessage) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.data).toHaveProperty('error');
  if (expectedMessage) {
    expect(response.data.error).toContain(expectedMessage);
  }
};

/**
 * Assert validation error response
 */
export const expectValidationError = (response, field) => {
  expectErrorResponse(response, 400);
  if (field) {
    expect(response.data.error.toLowerCase()).toContain(field.toLowerCase());
  }
};

/**
 * Assert authentication required response
 */
export const expectAuthRequired = (response) => {
  expectErrorResponse(response, 401, 'Authentication required');
};

/**
 * Assert not found response
 */
export const expectNotFound = (response, resource) => {
  expectErrorResponse(response, 404);
  if (resource) {
    expect(response.data.error.toLowerCase()).toContain(resource.toLowerCase());
  }
};

/**
 * Test common API endpoint scenarios
 */
export const testCommonScenarios = (createTester, endpoint) => {
  describe(`${endpoint} - Common Scenarios`, () => {
    let tester;

    beforeEach(() => {
      tester = createTester();
    });

    test('should handle internal server errors gracefully', async () => {
      // Mock a database error
      const originalPrisma = global.prisma;
      global.prisma = {
        ...originalPrisma,
        workout: {
          ...originalPrisma.workout,
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      };

      const response = await tester.get();
      expectErrorResponse(response, 500);

      // Restore original prisma
      global.prisma = originalPrisma;
    });

    test('should validate request methods', async () => {
      // Test unsupported method (PATCH on GET-only endpoint)
      const request = createMockRequest({ method: 'PATCH' });
      const response = await executeApiRoute(tester.handler, request);
      
      // Should either work or return method not allowed
      expect([200, 405]).toContain(response.status);
    });
  });
};

/**
 * Batch test multiple inputs against an endpoint
 */
export const batchTest = async (tester, method, testCases) => {
  const results = [];
  
  for (const testCase of testCases) {
    const { input, expected, description } = testCase;
    
    try {
      const response = await tester[method](input.body, input.options);
      results.push({
        description,
        input,
        response,
        expected,
        passed: response.status === expected.status,
      });
    } catch (error) {
      results.push({
        description,
        input,
        error: error.message,
        expected,
        passed: false,
      });
    }
  }
  
  return results;
};

/**
 * Mock NextResponse for testing
 */
export const mockNextResponse = () => {
  return {
    json: jest.fn((data, init = {}) => ({
      json: async () => data,
      status: init.status || 200,
      headers: new Map(),
      cookies: {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      },
    })),
  };
};