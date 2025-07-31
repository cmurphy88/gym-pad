import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET, POST } from '../../../app/api/workouts/route.js';
import { ApiTester, expectSuccessResponse, expectErrorResponse, expectAuthRequired } from '../../helpers/requestHelpers.js';
import { createAuthenticatedUser, createAuthCookies } from '../../helpers/authHelpers.js';
import { createTestWorkout, createCompleteTestWorkout, validateWorkoutStructure } from '../../helpers/databaseHelpers.js';
import { generateWorkoutValidationTests, createTestDataSets, testValidationScenarios } from '../../helpers/validationHelpers.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/workouts', () => {
  let authenticatedUser;
  let testData;

  beforeEach(async () => {
    authenticatedUser = await createAuthenticatedUser();
    testData = createTestDataSets();
  });

  describe('GET /api/workouts', () => {
    let tester;

    beforeEach(() => {
      tester = new ApiTester(GET);
    });

    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await tester.get();
        expectAuthRequired(response);
      });

      test('should accept valid authentication', async () => {
        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });
        
        expectSuccessResponse(response, 200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('Successful Retrieval', () => {
      test('should return empty array when no workouts exist', async () => {
        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data).toEqual([]);
      });

      test('should return user workouts with exercises', async () => {
        // Create test workouts
        const { workout: workout1 } = await createCompleteTestWorkout(authenticatedUser.user.id, {
          title: 'Morning Workout',
          exerciseCount: 2,
        });
        
        const { workout: workout2 } = await createCompleteTestWorkout(authenticatedUser.user.id, {
          title: 'Evening Workout',
          exerciseCount: 3,
        });

        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data).toHaveLength(2);
        
        response.data.forEach(workout => {
          validateWorkoutStructure(workout);
          expect(workout.exercises).toBeDefined();
          expect(Array.isArray(workout.exercises)).toBe(true);
          
          workout.exercises.forEach(exercise => {
            expect(exercise).toHaveProperty('sets');
            expect(Array.isArray(exercise.sets)).toBe(true);
          });
        });
      });

      test('should return workouts ordered by date descending', async () => {
        const dates = [
          new Date('2024-01-01'),
          new Date('2024-01-03'),
          new Date('2024-01-02'),
        ];

        for (const [index, date] of dates.entries()) {
          await createTestWorkout(authenticatedUser.user.id, {
            title: `Workout ${index + 1}`,
            date,
          });
        }

        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data).toHaveLength(3);
        
        // Should be ordered by date descending (newest first)
        expect(new Date(response.data[0].date)).toEqual(new Date('2024-01-03'));
        expect(new Date(response.data[1].date)).toEqual(new Date('2024-01-02'));
        expect(new Date(response.data[2].date)).toEqual(new Date('2024-01-01'));
      });

      test('should only return workouts belonging to authenticated user', async () => {
        // Create another user with workouts
        const otherUser = await createAuthenticatedUser();
        await createTestWorkout(otherUser.user.id, { title: 'Other User Workout' });
        
        // Create workout for authenticated user
        await createTestWorkout(authenticatedUser.user.id, { title: 'My Workout' });

        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data).toHaveLength(1);
        expect(response.data[0].title).toBe('My Workout');
        expect(response.data[0].userId).toBe(authenticatedUser.user.id);
      });

      test('should include exercises ordered by orderIndex', async () => {
        const { workout } = await createCompleteTestWorkout(authenticatedUser.user.id, {
          exerciseCount: 3,
        });

        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data).toHaveLength(1);
        
        const returnedWorkout = response.data[0];
        expect(returnedWorkout.exercises).toHaveLength(3);
        
        // Should be ordered by orderIndex
        for (let i = 0; i < returnedWorkout.exercises.length - 1; i++) {
          expect(returnedWorkout.exercises[i].orderIndex).toBeLessThanOrEqual(
            returnedWorkout.exercises[i + 1].orderIndex
          );
        }
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors gracefully', async () => {
        // Mock prisma to throw an error
        const { prisma } = await import('../../../lib/prisma.js');
        const originalFindMany = prisma.workout.findMany;
        prisma.workout.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500, 'Failed to fetch workouts');

        // Restore original function
        prisma.workout.findMany = originalFindMany;
      });
    });
  });

  describe('POST /api/workouts', () => {
    let tester;

    beforeEach(() => {
      tester = new ApiTester(POST);
    });

    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await tester.post(testData.validWorkout);
        expectAuthRequired(response);
      });
    });

    describe('Successful Creation', () => {
      test('should create workout with valid data', async () => {
        const workoutData = {
          ...testData.validWorkout,
          title: 'Test Workout Creation',
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 201);
        validateWorkoutStructure(response.data);
        expect(response.data.title).toBe(workoutData.title);
        expect(response.data.userId).toBe(authenticatedUser.user.id);
        expect(new Date(response.data.date)).toEqual(new Date(workoutData.date));
      });

      test('should create workout with exercises', async () => {
        const workoutData = {
          ...testData.validWorkout,
          exercises: [
            {
              name: 'Bench Press',
              sets: [
                { reps: 10, weight: 60 },
                { reps: 8, weight: 65 },
              ],
              restSeconds: 120,
              notes: 'Focus on form',
              orderIndex: 0,
            },
            {
              name: 'Squats',
              sets: [
                { reps: 12, weight: 80 },
                { reps: 10, weight: 85 },
              ],
              restSeconds: 180,
              orderIndex: 1,
            },
          ],
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 201);
        expect(response.data.exercises).toHaveLength(2);
        
        response.data.exercises.forEach((exercise, index) => {
          expect(exercise.name).toBe(workoutData.exercises[index].name);
          expect(exercise.sets).toEqual(workoutData.exercises[index].sets);
          expect(exercise.orderIndex).toBe(index);
        });
      });

      test('should handle workout creation without exercises', async () => {
        const workoutData = {
          title: 'Empty Workout',
          date: new Date().toISOString(),
          duration: 30,
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 201);
        expect(response.data.exercises).toEqual([]);
      });

      test('should assign default orderIndex to exercises', async () => {
        const workoutData = {
          ...testData.validWorkout,
          exercises: [
            {
              name: 'Exercise 1',
              sets: [{ reps: 10, weight: 50 }],
            },
            {
              name: 'Exercise 2',
              sets: [{ reps: 8, weight: 60 }],
            },
          ],
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 201);
        expect(response.data.exercises[0].orderIndex).toBe(0);
        expect(response.data.exercises[1].orderIndex).toBe(1);
      });
    });

    describe('Input Validation', () => {
      testValidationScenarios(
        new ApiTester(POST),
        'post',
        testData.validWorkout,
        generateWorkoutValidationTests(),
        { cookies: createAuthCookies }
      );

      test('should validate exercise data when provided', async () => {
        const workoutData = {
          ...testData.validWorkout,
          exercises: [
            {
              name: '', // Invalid: empty name
              sets: [{ reps: 10, weight: 50 }],
            },
          ],
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Exercise 1 validation failed');
      });

      test('should validate exercise sets', async () => {
        const workoutData = {
          ...testData.validWorkout,
          exercises: [
            {
              name: 'Test Exercise',
              sets: [
                { reps: -5, weight: 50 }, // Invalid: negative reps
              ],
            },
          ],
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Exercise 1 validation failed');
      });

      test('should require non-empty exercise sets array', async () => {
        const workoutData = {
          ...testData.validWorkout,
          exercises: [
            {
              name: 'Test Exercise',
              sets: [], // Invalid: empty sets array
            },
          ],
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Exercise 1 validation failed');
      });
    });

    describe('Transaction Handling', () => {
      test('should rollback on exercise creation failure', async () => {
        const workoutData = {
          ...testData.validWorkout,
          exercises: [testData.validExercise],
        };

        // Mock exercise creation to fail
        const { prisma } = await import('../../../lib/prisma.js');
        const originalCreateMany = prisma.exercise.createMany;
        prisma.exercise.createMany = jest.fn().mockRejectedValue(new Error('Exercise creation failed'));

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500, 'Failed to create workout');

        // Verify no workout was created
        const workouts = await prisma.workout.findMany({
          where: { userId: authenticatedUser.user.id },
        });
        expect(workouts).toHaveLength(0);

        // Restore original function
        prisma.exercise.createMany = originalCreateMany;
      });
    });

    describe('Edge Cases', () => {
      test('should handle very long workout titles', async () => {
        const workoutData = {
          ...testData.validWorkout,
          title: 'A'.repeat(1000), // Very long title
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        // Should either succeed or fail gracefully
        expect([201, 400, 500]).toContain(response.status);
      });

      test('should handle future dates', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const workoutData = {
          ...testData.validWorkout,
          date: futureDate.toISOString(),
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 201);
        expect(new Date(response.data.date)).toEqual(futureDate);
      });

      test('should handle workouts with many exercises', async () => {
        const exercises = [];
        for (let i = 0; i < 20; i++) {
          exercises.push({
            name: `Exercise ${i + 1}`,
            sets: [{ reps: 10, weight: 50 }],
            orderIndex: i,
          });
        }

        const workoutData = {
          ...testData.validWorkout,
          exercises,
        };

        const response = await tester.post(workoutData, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 201);
        expect(response.data.exercises).toHaveLength(20);
      });
    });

    describe('Error Handling', () => {
      test('should handle malformed JSON', async () => {
        const request = {
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
          cookies: { get: jest.fn(() => ({ value: authenticatedUser.token })) },
        };

        const response = await POST(request);
        const data = await response.json();
        
        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error');
      });

      test('should handle database connection errors', async () => {
        const { prisma } = await import('../../../lib/prisma.js');
        const originalTransaction = prisma.$transaction;
        prisma.$transaction = jest.fn().mockRejectedValue(new Error('Database connection failed'));

        const response = await tester.post(testData.validWorkout, {
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500, 'Failed to create workout');

        // Restore original function
        prisma.$transaction = originalTransaction;
      });
    });
  });
});