import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET, PUT, DELETE } from '../../../app/api/workouts/[id]/route.js';
import { ApiTester, expectSuccessResponse, expectErrorResponse, expectAuthRequired, expectNotFound } from '../../helpers/requestHelpers.js';
import { createAuthenticatedUser, createAuthCookies } from '../../helpers/authHelpers.js';
import { createCompleteTestWorkout, validateWorkoutStructure } from '../../helpers/databaseHelpers.js';
import { createTestDataSets } from '../../helpers/validationHelpers.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/workouts/[id]', () => {
  let authenticatedUser;
  let testData;
  let testWorkout;

  beforeEach(async () => {
    authenticatedUser = await createAuthenticatedUser();
    testData = createTestDataSets();
    
    // Create a test workout for each test
    const { workout, exercises } = await createCompleteTestWorkout(authenticatedUser.user.id, {
      title: 'Test Workout for ID endpoints',
      exerciseCount: 3,
    });
    testWorkout = { workout, exercises };
  });

  describe('GET /api/workouts/[id]', () => {
    let tester;

    beforeEach(() => {
      tester = new ApiTester(GET);
    });

    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await tester.get({
          params: { id: testWorkout.workout.id.toString() },
        });
        expectAuthRequired(response);
      });
    });

    describe('Successful Retrieval', () => {
      test('should return workout with exercises', async () => {
        const response = await tester.get({
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        validateWorkoutStructure(response.data);
        expect(response.data.id).toBe(testWorkout.workout.id);
        expect(response.data.exercises).toHaveLength(3);
        
        response.data.exercises.forEach(exercise => {
          expect(exercise).toHaveProperty('sets');
          expect(Array.isArray(exercise.sets)).toBe(true);
        });
      });

      test('should return exercises ordered by orderIndex', async () => {
        const response = await tester.get({
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        const exercises = response.data.exercises;
        
        for (let i = 0; i < exercises.length - 1; i++) {
          expect(exercises[i].orderIndex).toBeLessThanOrEqual(exercises[i + 1].orderIndex);
        }
      });

      test('should only return workout belonging to authenticated user', async () => {
        // Create another user with a workout
        const otherUser = await createAuthenticatedUser();
        const { workout: otherWorkout } = await createCompleteTestWorkout(otherUser.user.id);

        // Try to access other user's workout
        const response = await tester.get({
          params: { id: otherWorkout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectNotFound(response, 'Workout not found');
      });
    });

    describe('Input Validation', () => {
      test('should reject invalid workout ID', async () => {
        const response = await tester.get({
          params: { id: 'invalid-id' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Invalid workout ID');
      });

      test('should reject non-numeric workout ID', async () => {
        const response = await tester.get({
          params: { id: 'abc123' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Invalid workout ID');
      });

      test('should handle non-existent workout ID', async () => {
        const response = await tester.get({
          params: { id: '999999' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectNotFound(response, 'Workout not found');
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors gracefully', async () => {
        const { prisma } = await import('../../../lib/prisma.js');
        const originalFindUnique = prisma.workout.findUnique;
        prisma.workout.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await tester.get({
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500, 'Failed to fetch workout');

        prisma.workout.findUnique = originalFindUnique;
      });
    });
  });

  describe('PUT /api/workouts/[id]', () => {
    let tester;

    beforeEach(() => {
      tester = new ApiTester(PUT);
    });

    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await tester.put(testData.validWorkout, {
          params: { id: testWorkout.workout.id.toString() },
        });
        expectAuthRequired(response);
      });
    });

    describe('Successful Updates', () => {
      test('should update workout without exercises', async () => {
        const updateData = {
          title: 'Updated Workout Title',
          date: new Date().toISOString(),
          notes: 'Updated notes',
        };

        const response = await tester.put(updateData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.title).toBe(updateData.title);
        expect(response.data.notes).toBe(updateData.notes);
        expect(new Date(response.data.date)).toEqual(new Date(updateData.date));
      });

      test('should update workout with new exercises', async () => {
        const updateData = {
          title: 'Updated Workout',
          date: new Date().toISOString(),
          exercises: [
            {
              name: 'New Exercise 1',
              sets: [{ reps: 12, weight: 70 }],
              restSeconds: 90,
              orderIndex: 0,
            },
            {
              name: 'New Exercise 2',
              sets: [{ reps: 10, weight: 80 }],
              restSeconds: 120,
              orderIndex: 1,
            },
          ],
        };

        const response = await tester.put(updateData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.exercises).toHaveLength(2);
        expect(response.data.exercises[0].name).toBe('New Exercise 1');
        expect(response.data.exercises[1].name).toBe('New Exercise 2');
      });

      test('should replace all exercises when exercises provided', async () => {
        const updateData = {
          title: 'Updated Workout',
          date: new Date().toISOString(),
          exercises: [
            {
              name: 'Only Exercise',
              sets: [{ reps: 15, weight: 50 }],
              orderIndex: 0,
            },
          ],
        };

        const response = await tester.put(updateData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.exercises).toHaveLength(1);
        expect(response.data.exercises[0].name).toBe('Only Exercise');
      });

      test('should remove all exercises when empty exercises array provided', async () => {
        const updateData = {
          title: 'Updated Workout',
          date: new Date().toISOString(),
          exercises: [],
        };

        const response = await tester.put(updateData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.exercises).toHaveLength(0);
      });

      test('should preserve existing exercises when exercises not provided', async () => {
        const updateData = {
          title: 'Updated Title Only',
          date: new Date().toISOString(),
        };

        const response = await tester.put(updateData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.title).toBe('Updated Title Only');
        expect(response.data.exercises).toHaveLength(3); // Original exercise count
      });
    });

    describe('Input Validation', () => {
      test('should reject invalid workout ID', async () => {
        const response = await tester.put(testData.validWorkout, {
          params: { id: 'invalid-id' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Invalid workout ID');
      });

      test('should validate workout data', async () => {
        const invalidData = {
          title: '', // Invalid empty title
          date: new Date().toISOString(),
        };

        const response = await tester.put(invalidData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Validation failed');
      });

      test('should validate exercise data when provided', async () => {
        const invalidData = {
          title: 'Valid Title',
          date: new Date().toISOString(),
          exercises: [
            {
              name: '', // Invalid empty name
              sets: [{ reps: 10, weight: 50 }],
            },
          ],
        };

        const response = await tester.put(invalidData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Exercise 1 validation failed');
      });

      test('should only allow updates to own workouts', async () => {
        const otherUser = await createAuthenticatedUser();
        const { workout: otherWorkout } = await createCompleteTestWorkout(otherUser.user.id);

        const response = await tester.put(testData.validWorkout, {
          params: { id: otherWorkout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500); // Prisma will throw an error for non-existent record
      });
    });

    describe('Transaction Handling', () => {
      test('should rollback on exercise update failure', async () => {
        const originalTitle = testWorkout.workout.title;
        
        const updateData = {
          title: 'Should Not Update',
          date: new Date().toISOString(),
          exercises: [testData.validExercise],
        };

        // Mock exercise creation to fail
        const { prisma } = await import('../../../lib/prisma.js');
        const originalCreateMany = prisma.exercise.createMany;
        prisma.exercise.createMany = jest.fn().mockRejectedValue(new Error('Exercise creation failed'));

        const response = await tester.put(updateData, {
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500, 'Failed to update workout');

        // Verify workout title wasn't updated
        const updatedWorkout = await prisma.workout.findUnique({
          where: { id: testWorkout.workout.id },
        });
        expect(updatedWorkout.title).toBe(originalTitle);

        prisma.exercise.createMany = originalCreateMany;
      });
    });
  });

  describe('DELETE /api/workouts/[id]', () => {
    let tester;

    beforeEach(() => {
      tester = new ApiTester(DELETE);
    });

    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await tester.delete({
          params: { id: testWorkout.workout.id.toString() },
        });
        expectAuthRequired(response);
      });
    });

    describe('Successful Deletion', () => {
      test('should delete workout and return success message', async () => {
        const response = await tester.delete({
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.message).toBe('Workout deleted successfully');
      });

      test('should delete workout and associated exercises', async () => {
        const { prisma } = await import('../../../lib/prisma.js');
        
        const response = await tester.delete({
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);

        // Verify workout is deleted
        const workout = await prisma.workout.findUnique({
          where: { id: testWorkout.workout.id },
        });
        expect(workout).toBeNull();

        // Verify exercises are deleted (cascade delete)
        const exercises = await prisma.exercise.findMany({
          where: { workoutId: testWorkout.workout.id },
        });
        expect(exercises).toHaveLength(0);
      });

      test('should only delete own workouts', async () => {
        const otherUser = await createAuthenticatedUser();
        const { workout: otherWorkout } = await createCompleteTestWorkout(otherUser.user.id);

        const response = await tester.delete({
          params: { id: otherWorkout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500); // Prisma will throw error for non-existent record
      });
    });

    describe('Input Validation', () => {
      test('should reject invalid workout ID', async () => {
        const response = await tester.delete({
          params: { id: 'invalid-id' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 400, 'Invalid workout ID');
      });

      test('should handle deletion of non-existent workout', async () => {
        const response = await tester.delete({
          params: { id: '999999' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500); // Prisma will throw error
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors gracefully', async () => {
        const { prisma } = await import('../../../lib/prisma.js');
        const originalDelete = prisma.workout.delete;
        prisma.workout.delete = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await tester.delete({
          params: { id: testWorkout.workout.id.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500, 'Failed to delete workout');

        prisma.workout.delete = originalDelete;
      });
    });
  });
});