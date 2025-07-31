import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET, POST } from '../../../app/api/exercises/route.js';
import { createAuthenticatedUser, expectErrorResponse } from '../../helpers/authHelpers.js';
import { createTestWorkout, createTestExercise, createCompleteTestWorkout } from '../../helpers/databaseHelpers.js';
import { ApiTester } from '../../helpers/requestHelpers.js';
import { testValidationScenarios, generateExerciseValidationTests, createTestDataSets } from '../../helpers/validationHelpers.js';
import * as middleware from '../../../lib/middleware.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/exercises', () => {
  let getTester, postTester;
  let authenticatedUser;
  let testWorkout;
  const testData = createTestDataSets();

  beforeEach(async () => {
    getTester = new ApiTester(GET);
    postTester = new ApiTester(POST);
    authenticatedUser = await createAuthenticatedUser();
    testWorkout = await createTestWorkout(authenticatedUser.user.id);
  });

  describe('GET /api/exercises', () => {
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

    describe('Get All Exercises', () => {
      test('should return all exercises for authenticated user', async () => {
        // Create exercises for the user
        const { workout, exercises } = await createCompleteTestWorkout(authenticatedUser.user.id, {
          exerciseCount: 3,
        });

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveLength(3);
        
        response.data.forEach(exercise => {
          expect(exercise).toHaveProperty('id');
          expect(exercise).toHaveProperty('name');
          expect(exercise).toHaveProperty('sets');
          expect(exercise).toHaveProperty('workout');
          expect(Array.isArray(exercise.sets)).toBe(true);
        });
      });

      test('should return empty array when user has no exercises', async () => {
        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveLength(0);
      });

      test('should include workout information', async () => {
        const exercise = await createTestExercise(testWorkout.id, {
          name: 'Test Exercise with Workout Info',
        });

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data[0]).toHaveProperty('workout');
        expect(response.data[0].workout).toHaveProperty('id', testWorkout.id);
        expect(response.data[0].workout).toHaveProperty('title', testWorkout.title);
        expect(response.data[0].workout).toHaveProperty('date');
      });

      test('should parse sets data correctly', async () => {
        const setsData = [
          { reps: 10, weight: 50 },
          { reps: 8, weight: 55 },
          { reps: 6, weight: 60 },
        ];

        await createTestExercise(testWorkout.id, {
          name: 'Sets Test Exercise',
          setsData: JSON.stringify(setsData),
        });

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data[0].sets).toEqual(setsData);
      });

      test('should only return exercises for authenticated user', async () => {
        // Create another user with exercises
        const otherUser = await createAuthenticatedUser();
        const otherWorkout = await createTestWorkout(otherUser.user.id);
        await createTestExercise(otherWorkout.id, { name: 'Other User Exercise' });

        // Create exercise for authenticated user
        await createTestExercise(testWorkout.id, { name: 'My Exercise' });

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(1);
        expect(response.data[0].name).toBe('My Exercise');
      });
    });

    describe('Get Exercises by Workout ID', () => {
      test('should return exercises for specific workout', async () => {
        // Create exercises in the test workout
        const exercise1 = await createTestExercise(testWorkout.id, {
          name: 'Exercise 1',
          orderIndex: 0,
        });
        const exercise2 = await createTestExercise(testWorkout.id, {
          name: 'Exercise 2',
          orderIndex: 1,
        });

        // Create another workout with an exercise
        const otherWorkout = await createTestWorkout(authenticatedUser.user.id);
        await createTestExercise(otherWorkout.id, { name: 'Other Workout Exercise' });

        const response = await getTester.get({
          searchParams: { workoutId: testWorkout.id.toString() },
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(2);
        expect(response.data[0].name).toBe('Exercise 1');
        expect(response.data[1].name).toBe('Exercise 2');
      });

      test('should return exercises in correct order', async () => {
        const exercises = [
          { name: 'Third Exercise', orderIndex: 2 },
          { name: 'First Exercise', orderIndex: 0 },
          { name: 'Second Exercise', orderIndex: 1 },
        ];

        for (const exerciseData of exercises) {
          await createTestExercise(testWorkout.id, exerciseData);
        }

        const response = await getTester.get({
          searchParams: { workoutId: testWorkout.id.toString() },
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(3);
        expect(response.data[0].name).toBe('First Exercise');
        expect(response.data[1].name).toBe('Second Exercise');
        expect(response.data[2].name).toBe('Third Exercise');
      });

      test('should reject invalid workout ID', async () => {
        const response = await getTester.get({
          searchParams: { workoutId: 'invalid-id' },
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 400, 'Invalid workout ID');
      });

      test('should return empty array for non-existent workout', async () => {
        const response = await getTester.get({
          searchParams: { workoutId: '99999' },
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(0);
      });

      test('should not return exercises from other user\'s workout', async () => {
        // Create another user with a workout
        const otherUser = await createAuthenticatedUser();
        const otherWorkout = await createTestWorkout(otherUser.user.id);
        await createTestExercise(otherWorkout.id, { name: 'Other User Exercise' });

        const response = await getTester.get({
          searchParams: { workoutId: otherWorkout.id.toString() },
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(0);
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors', async () => {
        // Mock requireAuth to throw an error after auth succeeds
        const { prisma } = await import('../../setup/setupTests.js');
        const originalFindMany = prisma.exercise.findMany;
        prisma.exercise.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await getTester.get({
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 500, 'Failed to fetch exercises');

        prisma.exercise.findMany = originalFindMany;
      });
    });
  });

  describe('POST /api/exercises', () => {
    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await postTester.post(testData.validExercise);
        expectErrorResponse(response, 401, 'Authentication required');
      });
    });

    describe('Successful Exercise Creation', () => {
      test('should create exercise with valid data', async () => {
        const exerciseData = {
          ...testData.validExercise,
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name', exerciseData.name);
        expect(response.data).toHaveProperty('sets');
        expect(response.data.sets).toEqual(exerciseData.sets);
      });

      test('should store sets data as JSON string in database', async () => {
        const exerciseData = {
          ...testData.validExercise,
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);

        // Check database directly
        const { prisma } = await import('../../setup/setupTests.js');
        const exercise = await prisma.exercise.findUnique({
          where: { id: response.data.id },
        });

        expect(typeof exercise.setsData).toBe('string');
        expect(JSON.parse(exercise.setsData)).toEqual(exerciseData.sets);
      });

      test('should set default order index if not provided', async () => {
        const exerciseData = {
          name: 'Default Order Exercise',
          sets: [{ reps: 10, weight: 50 }],
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('orderIndex', 0);
      });

      test('should handle optional fields', async () => {
        const exerciseData = {
          name: 'Minimal Exercise',
          sets: [{ reps: 10, weight: 50 }],
          workoutId: testWorkout.id,
          restSeconds: 120,
          notes: 'Test notes',
          orderIndex: 5,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('restSeconds', 120);
        expect(response.data).toHaveProperty('notes', 'Test notes');
        expect(response.data).toHaveProperty('orderIndex', 5);
      });

      test('should handle null optional fields', async () => {
        const exerciseData = {
          name: 'Null Fields Exercise',
          sets: [{ reps: 10, weight: 50 }],
          workoutId: testWorkout.id,
          restSeconds: null,
          notes: null,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.restSeconds).toBeNull();
        expect(response.data.notes).toBeNull();
      });
    });

    describe('Workout Validation', () => {
      test('should verify workout exists', async () => {
        const exerciseData = {
          ...testData.validExercise,
          workoutId: 99999, // Non-existent workout
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 404, 'Workout not found');
      });

      test('should verify workout belongs to authenticated user', async () => {
        // Create workout for another user
        const otherUser = await createAuthenticatedUser();
        const otherWorkout = await createTestWorkout(otherUser.user.id);

        const exerciseData = {
          ...testData.validExercise,
          workoutId: otherWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 404, 'Workout not found');
      });

      test('should allow creating exercise without workoutId', async () => {
        const exerciseData = {
          name: 'Standalone Exercise',
          sets: [{ reps: 10, weight: 50 }],
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.workoutId).toBeNull();
      });
    });

    describe('Input Validation', () => {
      const validExerciseData = {
        ...testData.validExercise,
        workoutId: 1, // Will be set to actual workout ID in tests
      };

      beforeEach(() => {
        validExerciseData.workoutId = testWorkout.id;
      });

      testValidationScenarios(postTester, 'post', validExerciseData, [
        {
          field: 'name',
          values: [
            { value: undefined, description: 'missing name' },
            { value: null, description: 'null name' },
            { value: '', description: 'empty name' },
            { value: '   ', description: 'whitespace-only name' },
            { value: 123, description: 'numeric name' },
          ],
        },
        {
          field: 'sets',
          values: [
            { value: undefined, description: 'missing sets' },
            { value: null, description: 'null sets' },
            { value: [], description: 'empty sets array' },
            { value: 'not-array', description: 'string instead of array' },
            { value: 123, description: 'number instead of array' },
          ],
        },
      ]);

      test('should validate individual sets', async () => {
        const invalidSetsTests = [
          {
            sets: [{ reps: 0, weight: 50 }],
            description: 'zero reps',
          },
          {
            sets: [{ reps: -1, weight: 50 }],
            description: 'negative reps',
          },
          {
            sets: [{ reps: 'ten', weight: 50 }],
            description: 'non-numeric reps',
          },
          {
            sets: [{ reps: 10, weight: -5 }],
            description: 'negative weight',
          },
          {
            sets: [{ reps: 10, weight: 'fifty' }],
            description: 'non-numeric weight',
          },
          {
            sets: [{}],
            description: 'missing reps and weight',
          },
          {
            sets: ['invalid-set'],
            description: 'non-object set',
          },
        ];

        for (const testCase of invalidSetsTests) {
          const exerciseData = {
            ...validExerciseData,
            sets: testCase.sets,
          };

          const response = await postTester.post(exerciseData, {
            cookies: { 'session-token': authenticatedUser.token },
          });

          expect(response.status).toBe(400);
          expect(response.data).toHaveProperty('error');
        }
      });

      test('should accept valid sets with optional weight', async () => {
        const exerciseData = {
          ...validExerciseData,
          sets: [
            { reps: 10, weight: 50 },
            { reps: 8 }, // No weight
            { reps: 6, weight: null }, // Explicit null weight
          ],
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.sets).toEqual(exerciseData.sets);
      });

      test('should validate order index', async () => {
        const exerciseData = {
          ...validExerciseData,
          orderIndex: -1,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 400);
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalCreate = prisma.exercise.create;
        prisma.exercise.create = jest.fn().mockRejectedValue(new Error('Database error'));

        const exerciseData = {
          ...testData.validExercise,
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 500, 'Failed to create exercise');

        prisma.exercise.create = originalCreate;
      });

      test('should handle validation errors', async () => {
        const exerciseData = {
          name: '', // Invalid empty name
          sets: [{ reps: 10, weight: 50 }],
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expectErrorResponse(response, 400, 'Validation failed');
        expect(response.data).toHaveProperty('details');
        expect(Array.isArray(response.data.details)).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      test('should handle very long exercise names', async () => {
        const exerciseData = {
          name: 'A'.repeat(1000),
          sets: [{ reps: 10, weight: 50 }],
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        // Depending on database constraints, this might succeed or fail
        expect([201, 400, 500]).toContain(response.status);
      });

      test('should handle large number of sets', async () => {
        const sets = Array(100).fill().map((_, i) => ({
          reps: 10 + i,
          weight: 50 + i,
        }));

        const exerciseData = {
          name: 'Many Sets Exercise',
          sets,
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.sets).toHaveLength(100);
      });

      test('should handle special characters in exercise name', async () => {
        const exerciseData = {
          name: 'Exercise @#$%^&*()_+-={}[]|\\:";\'<>?,./',
          sets: [{ reps: 10, weight: 50 }],
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.name).toBe(exerciseData.name);
      });

      test('should handle unicode characters in exercise name', async () => {
        const exerciseData = {
          name: '举重 🏋️‍♂️ Deadlift בר', 
          sets: [{ reps: 10, weight: 50 }],
          workoutId: testWorkout.id,
        };

        const response = await postTester.post(exerciseData, {
          cookies: { 'session-token': authenticatedUser.token },
        });

        expect(response.status).toBe(201);
        expect(response.data.name).toBe(exerciseData.name);
      });
    });
  });
});