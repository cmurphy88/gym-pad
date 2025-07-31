import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET } from '../../../app/api/workouts/calendar/route.js';
import { ApiTester, expectSuccessResponse, expectErrorResponse, expectAuthRequired } from '../../helpers/requestHelpers.js';
import { createAuthenticatedUser, createAuthCookies } from '../../helpers/authHelpers.js';
import { createTestWorkout } from '../../helpers/databaseHelpers.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/workouts/calendar', () => {
  let authenticatedUser;

  beforeEach(async () => {
    authenticatedUser = await createAuthenticatedUser();
  });

  describe('GET /api/workouts/calendar', () => {
    let tester;

    beforeEach(() => {
      tester = new ApiTester(GET);
    });

    describe('Authentication', () => {
      test('should require authentication', async () => {
        const response = await tester.get();
        expectAuthRequired(response);
      });
    });

    describe('Successful Retrieval', () => {
      test('should return calendar data for current month by default', async () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data).toHaveProperty('year', currentYear);
        expect(response.data).toHaveProperty('month', currentMonth);
        expect(response.data).toHaveProperty('workouts');
        expect(typeof response.data.workouts).toBe('object');
      });

      test('should return calendar data for specified year and month', async () => {
        const year = 2024;
        const month = 6;

        const response = await tester.get({
          searchParams: { year: year.toString(), month: month.toString() },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.year).toBe(year);
        expect(response.data.month).toBe(month);
        expect(response.data).toHaveProperty('workouts');
      });

      test('should group workouts by date', async () => {
        const testDate = new Date(2024, 5, 15); // June 15, 2024
        const expectedDateKey = '2024-06-15';

        // Create workouts on the same day
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Morning Workout',
          date: new Date(2024, 5, 15, 8, 0), // 8 AM
        });

        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Evening Workout',
          date: new Date(2024, 5, 15, 18, 0), // 6 PM
        });

        const response = await tester.get({
          searchParams: { year: '2024', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.workouts).toHaveProperty(expectedDateKey);
        expect(response.data.workouts[expectedDateKey]).toHaveLength(2);
        expect(response.data.workouts[expectedDateKey][0]).toHaveProperty('id');
        expect(response.data.workouts[expectedDateKey][0]).toHaveProperty('title');
        expect(response.data.workouts[expectedDateKey][0]).toHaveProperty('notes');
        expect(response.data.workouts[expectedDateKey][0]).not.toHaveProperty('date');
      });

      test('should only include workouts within the specified month', async () => {
        // Create workouts in different months
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'May Workout',
          date: new Date(2024, 4, 15), // May 15, 2024
        });

        await createTestWorkout(authenticatedUser.user.id, {
          title: 'June Workout',
          date: new Date(2024, 5, 15), // June 15, 2024
        });

        await createTestWorkout(authenticatedUser.user.id, {
          title: 'July Workout',
          date: new Date(2024, 6, 15), // July 15, 2024
        });

        const response = await tester.get({
          searchParams: { year: '2024', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        
        const allWorkouts = Object.values(response.data.workouts).flat();
        expect(allWorkouts).toHaveLength(1);
        expect(allWorkouts[0].title).toBe('June Workout');
      });

      test('should return empty workouts object when no workouts in month', async () => {
        const response = await tester.get({
          searchParams: { year: '2025', month: '12' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.workouts).toEqual({});
      });

      test('should only return workouts for authenticated user', async () => {
        // Create another user with workouts
        const otherUser = await createAuthenticatedUser();
        await createTestWorkout(otherUser.user.id, {
          title: 'Other User Workout',
          date: new Date(2024, 5, 15),
        });

        // Create workout for authenticated user
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'My Workout',
          date: new Date(2024, 5, 16),
        });

        const response = await tester.get({
          searchParams: { year: '2024', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        
        const allWorkouts = Object.values(response.data.workouts).flat();
        expect(allWorkouts).toHaveLength(1);
        expect(allWorkouts[0].title).toBe('My Workout');
      });

      test('should order workouts within the same date by time', async () => {
        const testDate = new Date(2024, 5, 15);

        // Create workouts at different times on the same day
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Evening Workout',
          date: new Date(2024, 5, 15, 18, 0),
        });

        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Morning Workout',
          date: new Date(2024, 5, 15, 8, 0),
        });

        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Afternoon Workout',
          date: new Date(2024, 5, 15, 14, 0),
        });

        const response = await tester.get({
          searchParams: { year: '2024', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        
        const dateKey = '2024-06-15';
        expect(response.data.workouts[dateKey]).toHaveLength(3);
        
        // Should be ordered by time (ascending - earliest first)
        expect(response.data.workouts[dateKey][0].title).toBe('Morning Workout');
        expect(response.data.workouts[dateKey][1].title).toBe('Afternoon Workout');
        expect(response.data.workouts[dateKey][2].title).toBe('Evening Workout');
      });
    });

    describe('Input Validation', () => {
      test('should handle invalid year parameter', async () => {
        const response = await tester.get({
          searchParams: { year: 'invalid', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        // Should default to current year
        expect(response.data.year).toBe(new Date().getFullYear());
      });

      test('should handle invalid month parameter', async () => {
        const response = await tester.get({
          searchParams: { year: '2024', month: 'invalid' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        // Should default to current month
        expect(response.data.month).toBe(new Date().getMonth() + 1);
      });

      test('should handle missing parameters', async () => {
        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        const now = new Date();
        expect(response.data.year).toBe(now.getFullYear());
        expect(response.data.month).toBe(now.getMonth() + 1);
      });

      test('should handle month out of range', async () => {
        const response = await tester.get({
          searchParams: { year: '2024', month: '13' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        // Should handle the out-of-range month gracefully
        // The exact behavior depends on how JavaScript Date constructor handles it
        expect(typeof response.data.month).toBe('number');
      });

      test('should handle negative month', async () => {
        const response = await tester.get({
          searchParams: { year: '2024', month: '-1' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(typeof response.data.month).toBe('number');
      });
    });

    describe('Edge Cases', () => {
      test('should handle leap year February', async () => {
        // Create workout on February 29, 2024 (leap year)
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Leap Day Workout',
          date: new Date(2024, 1, 29), // February 29, 2024
        });

        const response = await tester.get({
          searchParams: { year: '2024', month: '2' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.workouts).toHaveProperty('2024-02-29');
        expect(response.data.workouts['2024-02-29'][0].title).toBe('Leap Day Workout');
      });

      test('should handle month boundaries correctly', async () => {
        // Create workouts at month boundaries
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Last Day of May',
          date: new Date(2024, 4, 31, 23, 59, 59), // May 31, 2024 23:59:59
        });

        await createTestWorkout(authenticatedUser.user.id, {
          title: 'First Day of June',
          date: new Date(2024, 5, 1, 0, 0, 0), // June 1, 2024 00:00:00
        });

        const response = await tester.get({
          searchParams: { year: '2024', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        
        const allWorkouts = Object.values(response.data.workouts).flat();
        expect(allWorkouts).toHaveLength(1);
        expect(allWorkouts[0].title).toBe('First Day of June');
      });

      test('should handle timezone edge cases', async () => {
        // This test ensures the date filtering works correctly regardless of timezone
        const utcDate = new Date('2024-06-15T12:00:00.000Z');
        
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'UTC Workout',
          date: utcDate,
        });

        const response = await tester.get({
          searchParams: { year: '2024', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        
        const allWorkouts = Object.values(response.data.workouts).flat();
        expect(allWorkouts.length).toBeGreaterThan(0);
        expect(allWorkouts.some(w => w.title === 'UTC Workout')).toBe(true);
      });

      test('should handle very old dates', async () => {
        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Ancient Workout',
          date: new Date(1900, 0, 1),
        });

        const response = await tester.get({
          searchParams: { year: '1900', month: '1' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        expect(response.data.workouts).toHaveProperty('1900-01-01');
      });

      test('should handle future dates', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        await createTestWorkout(authenticatedUser.user.id, {
          title: 'Future Workout',
          date: futureDate,
        });

        const response = await tester.get({
          searchParams: { 
            year: futureDate.getFullYear().toString(), 
            month: (futureDate.getMonth() + 1).toString() 
          },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectSuccessResponse(response, 200);
        
        const allWorkouts = Object.values(response.data.workouts).flat();
        expect(allWorkouts.some(w => w.title === 'Future Workout')).toBe(true);
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors gracefully', async () => {
        const { prisma } = await import('../../../lib/prisma.js');
        const originalFindMany = prisma.workout.findMany;
        prisma.workout.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await tester.get({
          cookies: createAuthCookies(authenticatedUser.token),
        });

        expectErrorResponse(response, 500, 'Failed to fetch calendar data');

        prisma.workout.findMany = originalFindMany;
      });

      test('should handle malformed date objects gracefully', async () => {
        // This test ensures robustness against potential date-related errors
        const response = await tester.get({
          searchParams: { year: '999999', month: '999999' },
          cookies: createAuthCookies(authenticatedUser.token),
        });

        // Should either work or fail gracefully
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    describe('Performance', () => {
      test('should handle months with many workouts efficiently', async () => {
        // Create many workouts in the same month
        const promises = [];
        for (let day = 1; day <= 30; day++) {
          for (let workout = 1; workout <= 3; workout++) {
            promises.push(
              createTestWorkout(authenticatedUser.user.id, {
                title: `Day ${day} Workout ${workout}`,
                date: new Date(2024, 5, day), // June 2024
              })
            );
          }
        }
        await Promise.all(promises);

        const startTime = Date.now();
        const response = await tester.get({
          searchParams: { year: '2024', month: '6' },
          cookies: createAuthCookies(authenticatedUser.token),
        });
        const endTime = Date.now();

        expectSuccessResponse(response, 200);
        
        const allWorkouts = Object.values(response.data.workouts).flat();
        expect(allWorkouts).toHaveLength(90); // 30 days × 3 workouts per day
        
        // Should complete reasonably quickly (adjust threshold as needed)
        expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
      });
    });
  });
});