import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET, POST } from '../../../app/api/weight/route.js';
import { createAuthenticatedUser, expectErrorResponse } from '../../helpers/authHelpers.js';
import { createTestWeightEntry } from '../../helpers/databaseHelpers.js';
import { ApiTester } from '../../helpers/requestHelpers.js';
import { testValidationScenarios, createTestDataSets } from '../../helpers/validationHelpers.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/weight', () => {
  let getTester, postTester;
  let authenticatedUser;
  const testData = createTestDataSets();

  beforeEach(async () => {
    getTester = new ApiTester(GET);
    postTester = new ApiTester(POST);
    authenticatedUser = await createAuthenticatedUser();
  });

  describe('GET /api/weight', () => {
    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await getTester.get();
        expectErrorResponse(response, 401, 'Authentication required');
      });

      test('should reject invalid authentication', async () => {
        const response = await getTester.get({
          cookies: { 'session-token': 'invalid-token' },
        });
        expectErrorResponse(response, 401, 'Authentication required');
      });
    });

    describe('Get Weight Entries', () => {
      test('should return all weight entries for authenticated user', async () => {
        // Create weight entries for the user
        const entries = [
          { weight: 75.5, date: '2025-01-15' },
          { weight: 76.0, date: '2025-01-16' },
          { weight: 75.8, date: '2025-01-17' },
        ];

        for (const entry of entries) {
          await createTestWeightEntry(authenticatedUser.user.id, entry);
        }

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveLength(3);
        
        response.data.forEach(entry => {
          expect(entry).toHaveProperty('id');
          expect(entry).toHaveProperty('weight');
          expect(entry).toHaveProperty('date');
          expect(entry).toHaveProperty('userId', authenticatedUser.user.id);
        });
      });

      test('should return entries in descending date order', async () => {
        const entries = [
          { weight: 75.0, date: '2025-01-15' },
          { weight: 76.0, date: '2025-01-17' },
          { weight: 75.5, date: '2025-01-16' },
        ];

        for (const entry of entries) {
          await createTestWeightEntry(authenticatedUser.user.id, entry);
        }

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(3);
        
        // Should be ordered by date desc (newest first)
        expect(new Date(response.data[0].date)).toEqual(new Date('2025-01-17'));
        expect(new Date(response.data[1].date)).toEqual(new Date('2025-01-16'));
        expect(new Date(response.data[2].date)).toEqual(new Date('2025-01-15'));
      });

      test('should return empty array when user has no weight entries', async () => {
        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveLength(0);
      });

      test('should only return entries for authenticated user', async () => {
        // Create another user with weight entries
        const otherUser = await createAuthenticatedUser();
        await createTestWeightEntry(otherUser.user.id, { weight: 80.0, date: '2025-01-15' });

        // Create entry for authenticated user
        await createTestWeightEntry(authenticatedUser.user.id, { weight: 75.0, date: '2025-01-15' });

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(1);
        expect(response.data[0].weight).toBe(75.0);
        expect(response.data[0].userId).toBe(authenticatedUser.user.id);
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalFindMany = prisma.weightEntry.findMany;
        prisma.weightEntry.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 500, 'Failed to fetch weight entries');

        prisma.weightEntry.findMany = originalFindMany;
      });
    });
  });

  describe('POST /api/weight', () => {
    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await postTester.post(testData.validWeightEntry);
        expectErrorResponse(response, 401, 'Authentication required');
      });
    });

    describe('Successful Weight Entry Creation', () => {
      test('should create weight entry with valid data', async () => {
        const weightData = {
          weight: 75.5,
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('weight', weightData.weight);
        expect(response.data).toHaveProperty('userId', authenticatedUser.user.id);
        expect(new Date(response.data.date)).toEqual(new Date(weightData.date));
      });

      test('should store weight entry in database', async () => {
        const weightData = {
          weight: 78.2,
          date: '2025-01-16',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);

        // Verify in database
        const { prisma } = await import('../../setup/setupTests.js');
        const entry = await prisma.weightEntry.findUnique({
          where: { id: response.data.id },
        });

        expect(entry).toBeTruthy();
        expect(entry.weight).toBe(weightData.weight);
        expect(entry.userId).toBe(authenticatedUser.user.id);
      });

      test('should handle decimal weights', async () => {
        const weightData = {
          weight: 75.75,
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.weight).toBe(75.75);
      });

      test('should handle integer weights', async () => {
        const weightData = {
          weight: 80,
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.weight).toBe(80);
      });

      test('should handle today\'s date', async () => {
        const today = new Date().toISOString().split('T')[0];
        const weightData = {
          weight: 75.0,
          date: today,
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(new Date(response.data.date)).toEqual(new Date(today));
      });
    });

    describe('Input Validation', () => {
      const validWeightData = {
        weight: 75.5,
        date: '2025-01-15',
      };

      testValidationScenarios(postTester, 'post', validWeightData, [
        {
          field: 'weight',
          values: [
            { value: undefined, description: 'missing weight' },
            { value: null, description: 'null weight' },
            { value: '', description: 'empty weight' },
            { value: 'not-a-number', description: 'non-numeric weight' },
            { value: 0, description: 'zero weight' },
            { value: -5, description: 'negative weight' },
            { value: 1000, description: 'unrealistic high weight' },
          ],
        },
        {
          field: 'date',
          values: [
            { value: undefined, description: 'missing date' },
            { value: null, description: 'null date' },
            { value: '', description: 'empty date' },
            { value: 'invalid-date', description: 'invalid date format' },
            { value: '2025-13-01', description: 'invalid month' },
            { value: '2025-01-32', description: 'invalid day' },
            { value: 123456789, description: 'numeric date' },
          ],
        },
      ]);

      test('should validate weight range', async () => {
        const testCases = [
          { weight: 0.1, expectSuccess: false },
          { weight: 1, expectSuccess: true },
          { weight: 50, expectSuccess: true },
          { weight: 200, expectSuccess: true },
          { weight: 500, expectSuccess: true },
          { weight: 1000, expectSuccess: false },
        ];

        for (const testCase of testCases) {
          const weightData = {
            weight: testCase.weight,
            date: '2025-01-15',
          };

          const response = await postTester.post(weightData, {
            cookies: { 'session-token': authenticatedUser.token },
          });

          if (testCase.expectSuccess) {
            expect(response.status).toBe(201);
          } else {
            expect(response.status).toBe(400);
          }
        }
      });

      test('should validate date format', async () => {
        const validDates = [
          '2025-01-15',
          '2024-12-31',
          '2025-02-29', // Leap year
        ];

        for (const date of validDates) {
          const weightData = {
            weight: 75.0,
            date,
          };

          const response = await postTester.post(weightData, {
            cookies: { 'session-token': authenticatedUser.token },
          });

          expect(response.status).toBe(201);
        }
      });
    });

    describe('Duplicate Entries', () => {
      test('should allow multiple entries on same date', async () => {
        const weightData1 = { weight: 75.0, date: '2025-01-15' };
        const weightData2 = { weight: 75.5, date: '2025-01-15' };

        const response1 = await postTester.post(weightData1, {
          cookies: { 'session-token': authenticatedUser.token },
        });
        
        const response2 = await postTester.post(weightData2, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response1.data.id).not.toBe(response2.data.id);
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalCreate = prisma.weightEntry.create;
        prisma.weightEntry.create = jest.fn().mockRejectedValue(new Error('Database error'));

        const weightData = {
          weight: 75.0,
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 500, 'Failed to create weight entry');

        prisma.weightEntry.create = originalCreate;
      });

      test('should handle validation errors', async () => {
        const weightData = {
          weight: -10, // Invalid negative weight
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 400, 'Validation failed');
        expect(response.data).toHaveProperty('details');
        expect(Array.isArray(response.data.details)).toBe(true);
      });

      test('should handle malformed JSON', async () => {
        const request = {
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
          cookies: { get: jest.fn() },
        };

        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error');
      });
    });

    describe('Edge Cases', () => {
      test('should handle very precise decimal weights', async () => {
        const weightData = {
          weight: 75.123456,
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.weight).toBe(75.123456);
      });

      test('should handle past dates', async () => {
        const weightData = {
          weight: 75.0,
          date: '2020-01-01',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
      });

      test('should handle future dates', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const weightData = {
          weight: 75.0,
          date: futureDate.toISOString().split('T')[0],
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        // Depending on validation rules, this might succeed or fail
        expect([201, 400]).toContain(response.status);
      });

      test('should handle minimum valid weight', async () => {
        const weightData = {
          weight: 1, // Minimum realistic weight
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
      });

      test('should handle maximum reasonable weight', async () => {
        const weightData = {
          weight: 500, // Maximum reasonable weight
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
      });
    });

    describe('Response Format', () => {
      test('should return consistent response format', async () => {
        const weightData = {
          weight: 75.5,
          date: '2025-01-15',
        };

        const response = await postTester.post(weightData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('weight');
        expect(response.data).toHaveProperty('date');
        expect(response.data).toHaveProperty('userId');
        expect(response.data).toHaveProperty('createdAt');
        expect(response.data).toHaveProperty('updatedAt');
      });
    });
  });
});