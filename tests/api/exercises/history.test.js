import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET } from '../../../app/api/exercises/history/[name]/route.js';
import { createAuthenticatedUser, expectErrorResponse } from '../../helpers/authHelpers.js';
import { createTestWorkout, createTestExercise, createCompleteTestWorkout } from '../../helpers/databaseHelpers.js';
import { ApiTester, createMockParams } from '../../helpers/requestHelpers.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/exercises/history/[name]', () => {
  let tester;
  let authenticatedUser;
  const testExerciseName = 'Bench Press';

  beforeEach(async () => {
    tester = new ApiTester(GET);
    authenticatedUser = await createAuthenticatedUser();
  });

  describe('Authentication', () => {
    test('should require authentication', async () => {
      const response = await tester.get({
        params: { name: testExerciseName },
      });
      expectErrorResponse(response, 401, 'Authentication required');
    });

    test('should reject invalid authentication', async () => {
      const response = await tester.get({
        cookies: { 'session-token': 'invalid-token' },
        params: { name: testExerciseName },
      });
      expectErrorResponse(response, 401, 'Authentication required');
    });
  });

  describe('Successful History Retrieval', () => {
    test('should return exercise history for valid exercise name', async () => {
      // Create workouts with the same exercise over time
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
      ];

      const workouts = [];
      for (const date of dates) {
        const workout = await createTestWorkout(authenticatedUser.user.id, { date });
        await createTestExercise(workout.id, {
          name: testExerciseName,
          setsData: JSON.stringify([
            { reps: 10, weight: 100 },
            { reps: 8, weight: 105 },
            { reps: 6, weight: 110 },
          ]),
        });
        workouts.push(workout);
      }

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(3);

      // Should be ordered by date descending (most recent first)
      expect(new Date(response.data[0].date)).toEqual(dates[2]);
      expect(new Date(response.data[1].date)).toEqual(dates[1]);
      expect(new Date(response.data[2].date)).toEqual(dates[0]);
    });

    test('should include complete exercise data in history', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id);
      const setsData = [
        { reps: 10, weight: 100 },
        { reps: 8, weight: 105 },
        { reps: 6, weight: 110 },
      ];

      await createTestExercise(workout.id, {
        name: testExerciseName,
        setsData: JSON.stringify(setsData),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);

      const historyEntry = response.data[0];
      expect(historyEntry).toHaveProperty('date');
      expect(historyEntry).toHaveProperty('sets');
      expect(historyEntry).toHaveProperty('totalSets');
      expect(historyEntry).toHaveProperty('totalReps');
      expect(historyEntry).toHaveProperty('maxWeight');
      expect(historyEntry).toHaveProperty('totalVolume');
      expect(historyEntry).toHaveProperty('workoutTitle');

      expect(historyEntry.sets).toEqual(setsData);
      expect(historyEntry.totalSets).toBe(3);
      expect(historyEntry.totalReps).toBe(24); // 10 + 8 + 6
      expect(historyEntry.maxWeight).toBe(110);
      expect(historyEntry.totalVolume).toBe(2730); // (10*100) + (8*105) + (6*110)
    });

    test('should handle case-insensitive exercise name matching', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id);
      await createTestExercise(workout.id, {
        name: 'BENCH PRESS', // Uppercase in database
        setsData: JSON.stringify([{ reps: 10, weight: 100 }]),
      });

      // Search with lowercase
      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: 'bench press' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
    });

    test('should handle URL encoded exercise names', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id);
      const exerciseName = 'Dumbbell Fly';
      
      await createTestExercise(workout.id, {
        name: exerciseName,
        setsData: JSON.stringify([{ reps: 10, weight: 50 }]),
      });

      // Exercise name will be URL encoded in real requests
      const encodedName = encodeURIComponent(exerciseName);
      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: encodedName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
    });

    test('should only return exercises for authenticated user', async () => {
      // Create exercise for authenticated user
      const userWorkout = await createTestWorkout(authenticatedUser.user.id);
      await createTestExercise(userWorkout.id, {
        name: testExerciseName,
        setsData: JSON.stringify([{ reps: 10, weight: 100 }]),
      });

      // Create exercise for another user with same name
      const otherUser = await createAuthenticatedUser();
      const otherWorkout = await createTestWorkout(otherUser.user.id);
      await createTestExercise(otherWorkout.id, {
        name: testExerciseName,
        setsData: JSON.stringify([{ reps: 12, weight: 120 }]),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].maxWeight).toBe(100); // Should be user's exercise, not other user's
    });

    test('should return empty array for non-existent exercise', async () => {
      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: 'Non Existent Exercise' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(0);
    });
  });

  describe('Exercise Name Validation', () => {
    test('should reject empty exercise name', async () => {
      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: '' },
      });

      expectErrorResponse(response, 400, 'Exercise name is required');
    });

    test('should reject whitespace-only exercise name', async () => {
      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: '   ' },
      });

      expectErrorResponse(response, 400, 'Exercise name is required');
    });

    test('should handle exercise names with special characters', async () => {
      const specialName = 'Exercise @#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const workout = await createTestWorkout(authenticatedUser.user.id);
      await createTestExercise(workout.id, {
        name: specialName,
        setsData: JSON.stringify([{ reps: 10, weight: 50 }]),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: specialName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
    });

    test('should handle unicode exercise names', async () => {
      const unicodeName = '举重 🏋️‍♂️ Deadlift בר';
      const workout = await createTestWorkout(authenticatedUser.user.id);
      await createTestExercise(workout.id, {
        name: unicodeName,
        setsData: JSON.stringify([{ reps: 10, weight: 50 }]),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: unicodeName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('Sets Data Processing', () => {
    test('should handle exercises with no weight data', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id);
      const setsData = [
        { reps: 10 }, // No weight
        { reps: 8 },  // No weight
        { reps: 6 },  // No weight
      ];

      await createTestExercise(workout.id, {
        name: testExerciseName,
        setsData: JSON.stringify(setsData),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);

      const historyEntry = response.data[0];
      expect(historyEntry.totalReps).toBe(24); // 10 + 8 + 6
      expect(historyEntry.maxWeight).toBe(0);
      expect(historyEntry.totalVolume).toBe(0);
    });

    test('should handle mixed sets with and without weight', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id);
      const setsData = [
        { reps: 10, weight: 100 },
        { reps: 8 }, // No weight
        { reps: 6, weight: 110 },
      ];

      await createTestExercise(workout.id, {
        name: testExerciseName,
        setsData: JSON.stringify(setsData),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);

      const historyEntry = response.data[0];
      expect(historyEntry.totalReps).toBe(24); // 10 + 8 + 6
      expect(historyEntry.maxWeight).toBe(110);
      expect(historyEntry.totalVolume).toBe(1660); // (10*100) + 0 + (6*110)
    });

    test('should handle zero weights correctly', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id);
      const setsData = [
        { reps: 10, weight: 0 }, // Bodyweight
        { reps: 8, weight: 0 },  // Bodyweight
      ];

      await createTestExercise(workout.id, {
        name: testExerciseName,
        setsData: JSON.stringify(setsData),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);

      const historyEntry = response.data[0];
      expect(historyEntry.totalReps).toBe(18);
      expect(historyEntry.maxWeight).toBe(0);
      expect(historyEntry.totalVolume).toBe(0);
    });

    test('should handle corrupted sets data', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id);
      
      // Create exercise with invalid JSON in sets_data
      const { prisma } = await import('../../setup/setupTests.js');
      await prisma.exercise.create({
        data: {
          workoutId: workout.id,
          name: testExerciseName,
          setsData: 'invalid-json', // Corrupted data
          orderIndex: 0,
        },
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      // Should handle gracefully - might return empty array or default values
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Performance and Pagination', () => {
    test('should handle large number of exercise records', async () => {
      // Create many workouts with the same exercise
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const workout = createTestWorkout(authenticatedUser.user.id, {
          date: new Date(2024, 0, i + 1), // Different dates
        });
        promises.push(workout);
      }

      const workouts = await Promise.all(promises);
      
      const exercisePromises = workouts.map(workout =>
        createTestExercise(workout.id, {
          name: testExerciseName,
          setsData: JSON.stringify([{ reps: 10, weight: 100 + Math.random() * 50 }]),
        })
      );

      await Promise.all(exercisePromises);

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(50);
      
      // Should be ordered by date descending
      for (let i = 1; i < response.data.length; i++) {
        const currentDate = new Date(response.data[i - 1].date);
        const nextDate = new Date(response.data[i].date);
        expect(currentDate >= nextDate).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors', async () => {
      const { prisma } = await import('../../setup/setupTests.js');
      const originalQueryRaw = prisma.$queryRaw;
      prisma.$queryRaw = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expectErrorResponse(response, 500, 'Failed to fetch exercise history');

      prisma.$queryRaw = originalQueryRaw;
    });

    test('should handle SQL injection attempts', async () => {
      const maliciousName = "'; DROP TABLE exercises; --";
      
      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: maliciousName },
      });

      // Should handle safely without SQL injection
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      // Verify tables still exist by making another query
      const normalResponse = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: 'Normal Exercise' },
      });
      expect(normalResponse.status).toBe(200);
    });

    test('should handle very long exercise names', async () => {
      const longName = 'A'.repeat(1000);
      
      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: longName },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Date Formatting', () => {
    test('should return dates in ISO format', async () => {
      const workout = await createTestWorkout(authenticatedUser.user.id, {
        date: new Date('2024-01-15T10:30:00Z'),
      });
      
      await createTestExercise(workout.id, {
        name: testExerciseName,
        setsData: JSON.stringify([{ reps: 10, weight: 100 }]),
      });

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: testExerciseName },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      
      const historyEntry = response.data[0];
      expect(historyEntry.date).toBe('2024-01-15');
      expect(typeof historyEntry.date).toBe('string');
    });

    test('should handle timezone differences correctly', async () => {
      // Create workouts at different times on the same day
      const dates = [
        new Date('2024-01-15T02:00:00Z'), // Early UTC
        new Date('2024-01-15T14:00:00Z'), // Mid UTC
        new Date('2024-01-15T23:00:00Z'), // Late UTC
      ];

      for (const date of dates) {
        const workout = await createTestWorkout(authenticatedUser.user.id, { date });
        await createTestExercise(workout.id, {
          name: `${testExerciseName}_${date.getHours()}`,
          setsData: JSON.stringify([{ reps: 10, weight: 100 }]),
        });
      }

      const response = await tester.get({
        cookies: { 'session-token': authenticatedUser.token },
        params: { name: `${testExerciseName}_2` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].date).toBe('2024-01-15');
    });
  });

  describe('HTTP Methods', () => {
    test('should only accept GET requests', async () => {
      const methods = ['post', 'put', 'patch', 'delete'];
      
      for (const method of methods) {
        try {
          const response = await tester[method]({}, {
            cookies: { 'session-token': authenticatedUser.token },
            params: { name: testExerciseName },
          });
          // If the method is not supported, it should return 405 or similar
          expect([405, 404, 500]).toContain(response.status);
        } catch (error) {
          // Method not implemented is also acceptable
          expect(error.message).toContain('not a function');
        }
      }
    });
  });
});