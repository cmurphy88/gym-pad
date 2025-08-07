import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/workouts/[id]/route';
import { createMockUser, createMockAuthResult } from '../../../../fixtures/user.js';
import { createMockWorkout, createMockWorkoutWithExercises, validWorkoutData, invalidWorkoutData } from '../../../../fixtures/workout.js';
import { prisma } from '@/lib/prisma';

// Mock the middleware and utilities
vi.mock('@/lib/middleware', () => ({
  requireAuth: vi.fn()
}));

vi.mock('@/lib/migrate-sets', () => ({
  parseSetsData: vi.fn((setsData) => {
    try {
      return JSON.parse(setsData);
    } catch {
      return [];
    }
  })
}));

describe('/api/workouts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/workouts/[id]', () => {
    it('should return specific workout for authenticated user', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const mockWorkout = createMockWorkoutWithExercises(1, { id: 1, title: 'Push Day' });
      prisma.workout.findUnique.mockResolvedValue(mockWorkout);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/1', {
        'session-token': 'valid_token'
      });

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 1);
      expect(data).toHaveProperty('title', 'Push Day');
      expect(data).toHaveProperty('exercises');
      expect(Array.isArray(data.exercises)).toBe(true);
      
      // Verify database query was scoped to user and workout ID
      expect(prisma.workout.findUnique).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        include: {
          exercises: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });
    });

    it('should return 404 when workout not found', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      prisma.workout.findUnique.mockResolvedValue(null);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/999', {
        'session-token': 'valid_token'
      });

      const response = await GET(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Workout not found');
    });

    it('should return 400 for invalid workout ID', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/abc', {
        'session-token': 'valid_token'
      });

      const response = await GET(request, { params: Promise.resolve({ id: 'abc' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid workout ID');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { requireAuth } = await import('@/lib/middleware');
      const mockResponse = NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      requireAuth.mockResolvedValue(mockResponse);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/1');

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const dbError = new Error('Database connection failed');
      prisma.workout.findUnique.mockRejectedValue(dbError);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/1', {
        'session-token': 'valid_token'
      });

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch workout');
    });

    it('should not return workouts from other users', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      // Mock returns null for workout belonging to different user
      prisma.workout.findUnique.mockResolvedValue(null);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/1', {
        'session-token': 'valid_token'
      });

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Workout not found');
      
      // Verify query included user ID filter
      expect(prisma.workout.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 1 })
        })
      );
    });
  });

  describe('PUT /api/workouts/[id]', () => {
    it('should update workout successfully', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const updatedWorkout = createMockWorkoutWithExercises(1, { 
        id: 1, 
        title: 'Updated Push Day',
        notes: 'Updated notes'
      });
      
      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        prisma.workout.update.mockResolvedValue(updatedWorkout);
        prisma.exercise.deleteMany.mockResolvedValue({ count: 2 });
        prisma.exercise.createMany.mockResolvedValue({ count: 2 });
        prisma.workout.findUnique.mockResolvedValue(updatedWorkout);
        
        return await callback(prisma);
      });

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts/1',
        { ...validWorkoutData, title: 'Updated Push Day' },
        'PUT'
      );

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('title', 'Updated Push Day');
      expect(data).toHaveProperty('exercises');
      
      // Verify workout was updated with user ID constraint
      expect(prisma.workout.update).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        data: expect.objectContaining({
          title: 'Updated Push Day',
          date: new Date(validWorkoutData.date),
          notes: validWorkoutData.notes
        })
      });
    });

    it('should update workout without exercises', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const updateData = {
        title: 'Updated Workout',
        date: '2025-01-02T10:00:00Z',
        notes: 'Updated notes'
        // No exercises array
      };
      
      const updatedWorkout = createMockWorkout(1, { id: 1, ...updateData });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        prisma.workout.update.mockResolvedValue(updatedWorkout);
        prisma.workout.findUnique.mockResolvedValue(updatedWorkout);
        return await callback(prisma);
      });

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts/1',
        updateData,
        'PUT'
      );

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('title', 'Updated Workout');
      
      // Verify exercises were not modified (no deleteMany/createMany calls)
      expect(prisma.exercise.deleteMany).not.toHaveBeenCalled();
      expect(prisma.exercise.createMany).not.toHaveBeenCalled();
    });

    it('should replace all exercises when provided', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const updateData = {
        ...validWorkoutData,
        exercises: [
          {
            name: 'New Exercise',
            sets: [{ reps: 15, weight: 100 }],
            restSeconds: 120
          }
        ]
      };
      
      const updatedWorkout = createMockWorkout(1, { id: 1 });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        prisma.workout.update.mockResolvedValue(updatedWorkout);
        prisma.exercise.deleteMany.mockResolvedValue({ count: 3 });
        prisma.exercise.createMany.mockResolvedValue({ count: 1 });
        prisma.workout.findUnique.mockResolvedValue(updatedWorkout);
        return await callback(prisma);
      });

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts/1',
        updateData,
        'PUT'
      );

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(200);
      
      // Verify old exercises were deleted
      expect(prisma.exercise.deleteMany).toHaveBeenCalledWith({
        where: { workoutId: 1 }
      });
      
      // Verify new exercises were created
      expect(prisma.exercise.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            workoutId: 1,
            name: 'New Exercise',
            setsData: JSON.stringify([{ reps: 15, weight: 100 }]),
            restSeconds: 120,
            orderIndex: 0
          })
        ]
      });
    });

    it('should return 400 for invalid workout ID', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts/abc',
        validWorkoutData,
        'PUT'
      );

      const response = await PUT(request, { params: Promise.resolve({ id: 'abc' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid workout ID');
    });

    it('should return 400 for invalid workout data', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts/1',
        invalidWorkoutData.missingTitle,
        'PUT'
      );

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { requireAuth } = await import('@/lib/middleware');
      const mockResponse = NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      requireAuth.mockResolvedValue(mockResponse);

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts/1',
        validWorkoutData,
        'PUT'
      );

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(401);
    });

    it('should handle database transaction errors', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const dbError = new Error('Transaction failed');
      prisma.$transaction.mockRejectedValue(dbError);

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts/1',
        validWorkoutData,
        'PUT'
      );

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update workout');
    });
  });

  describe('DELETE /api/workouts/[id]', () => {
    it('should delete workout successfully', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      prisma.workout.delete.mockResolvedValue({ id: 1 });

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/1', {
        'session-token': 'valid_token'
      }, { method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Workout deleted successfully');
      
      // Verify delete was scoped to user
      expect(prisma.workout.delete).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 }
      });
    });

    it('should return 400 for invalid workout ID', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/abc', {
        'session-token': 'valid_token'
      }, { method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'abc' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid workout ID');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { requireAuth } = await import('@/lib/middleware');
      const mockResponse = NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      requireAuth.mockResolvedValue(mockResponse);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/1', {}, { method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const dbError = new Error('Delete failed - workout not found');
      prisma.workout.delete.mockRejectedValue(dbError);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/1', {
        'session-token': 'valid_token'
      }, { method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete workout');
    });

    it('should not delete workouts from other users', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      // Simulate workout not found due to user constraint
      const notFoundError = new Error('Record to delete does not exist.');
      prisma.workout.delete.mockRejectedValue(notFoundError);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts/999', {
        'session-token': 'valid_token'
      }, { method: 'DELETE' });

      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete workout');
      
      // Verify delete was called with user constraint
      expect(prisma.workout.delete).toHaveBeenCalledWith({
        where: { id: 999, userId: 1 }
      });
    });
  });
});