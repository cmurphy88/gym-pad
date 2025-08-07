import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/workouts/route';
import { createMockUser, createMockAuthResult } from '../../../fixtures/user.js';
import { createMockWorkout, createMockWorkoutWithExercises, validWorkoutData, invalidWorkoutData } from '../../../fixtures/workout.js';
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

describe('/api/workouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/workouts', () => {
    it('should return all workouts for authenticated user', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      // Mock successful authentication
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      // Mock database response
      const mockWorkouts = [
        createMockWorkoutWithExercises(1, { id: 1, title: 'Push Day' }),
        createMockWorkoutWithExercises(1, { id: 2, title: 'Pull Day' })
      ];
      prisma.workout.findMany.mockResolvedValue(mockWorkouts);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts', {
        'session-token': 'valid_token'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty('title', 'Push Day');
      expect(data[1]).toHaveProperty('title', 'Pull Day');
      
      // Verify database query was scoped to user
      expect(prisma.workout.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          exercises: {
            orderBy: { orderIndex: 'asc' }
          }
        },
        orderBy: { date: 'desc' }
      });
    });

    it('should return empty array when user has no workouts', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      prisma.workout.findMany.mockResolvedValue([]);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts', {
        'session-token': 'valid_token'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should return 401 for unauthenticated user', async () => {
      const { requireAuth } = await import('@/lib/middleware');
      const mockResponse = NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      requireAuth.mockResolvedValue(mockResponse);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts');

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const dbError = new Error('Database connection failed');
      prisma.workout.findMany.mockRejectedValue(dbError);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts', {
        'session-token': 'valid_token'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch workouts');
    });

    it('should parse sets data for each exercise', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const mockWorkout = createMockWorkoutWithExercises(1);
      prisma.workout.findMany.mockResolvedValue([mockWorkout]);

      const request = createMockRequestWithCookies('http://localhost:3000/api/workouts', {
        'session-token': 'valid_token'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].exercises).toBeDefined();
      expect(data[0].exercises.length).toBeGreaterThan(0);
      
      // Verify each exercise has parsed sets
      data[0].exercises.forEach(exercise => {
        expect(exercise).toHaveProperty('sets');
        expect(Array.isArray(exercise.sets)).toBe(true);
      });
    });
  });

  describe('POST /api/workouts', () => {
    it('should create a new workout with exercises', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const createdWorkout = createMockWorkoutWithExercises(1, { id: 1 });
      
      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        // Mock workout creation
        const workout = createMockWorkout(1, { id: 1 });
        prisma.workout.create.mockResolvedValue(workout);
        prisma.exercise.createMany.mockResolvedValue({ count: 2 });
        prisma.workout.findUnique.mockResolvedValue(createdWorkout);
        
        return await callback(prisma);
      });

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts',
        validWorkoutData
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 1);
      expect(data).toHaveProperty('title', 'Test Workout');
      expect(data).toHaveProperty('exercises');
      expect(Array.isArray(data.exercises)).toBe(true);
      
      // Verify workout was created with correct user ID
      expect(prisma.workout.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          title: validWorkoutData.title,
          date: new Date(validWorkoutData.date),
          duration: validWorkoutData.duration,
          notes: validWorkoutData.notes
        })
      });
    });

    it('should create workout without exercises', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const workoutData = {
        title: 'Simple Workout',
        date: '2025-01-01T10:00:00Z',
        duration: 1800
      };
      
      const createdWorkout = createMockWorkout(1, { id: 1, title: 'Simple Workout' });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        prisma.workout.create.mockResolvedValue(createdWorkout);
        prisma.workout.findUnique.mockResolvedValue(createdWorkout);
        return await callback(prisma);
      });

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts',
        workoutData
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('title', 'Simple Workout');
      expect(data.exercises).toEqual([]);
      
      // Verify exercises.createMany was not called
      expect(prisma.exercise.createMany).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid workout data', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts',
        invalidWorkoutData.missingTitle
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for invalid exercise data', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);

      const workoutDataWithInvalidExercise = {
        title: 'Test Workout',
        date: '2025-01-01T10:00:00Z',
        exercises: [
          {
            // Missing name
            sets: [{ reps: 10, weight: 135 }]
          }
        ]
      };

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts',
        workoutDataWithInvalidExercise
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Exercise 1 validation failed');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { requireAuth } = await import('@/lib/middleware');
      const mockResponse = NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      requireAuth.mockResolvedValue(mockResponse);

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts',
        validWorkoutData
      );

      const response = await POST(request);

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
        'http://localhost:3000/api/workouts',
        validWorkoutData
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create workout');
    });

    it('should handle invalid JSON request body', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);

      // Create request with invalid JSON
      const request = new Request('http://localhost:3000/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create workout');
    });

    it('should set correct exercise order indices', async () => {
      const mockUser = createMockUser({ id: 1 });
      const mockAuth = createMockAuthResult(mockUser);
      
      const { requireAuth } = await import('@/lib/middleware');
      requireAuth.mockResolvedValue(mockAuth);
      
      const workoutData = {
        ...validWorkoutData,
        exercises: [
          { name: 'Exercise 1', sets: [{ reps: 10, weight: 100 }], orderIndex: 2 },
          { name: 'Exercise 2', sets: [{ reps: 8, weight: 110 }] }, // No orderIndex
          { name: 'Exercise 3', sets: [{ reps: 12, weight: 90 }], orderIndex: 0 }
        ]
      };
      
      const createdWorkout = createMockWorkout(1, { id: 1 });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        prisma.workout.create.mockResolvedValue(createdWorkout);
        prisma.exercise.createMany.mockResolvedValue({ count: 3 });
        prisma.workout.findUnique.mockResolvedValue({ ...createdWorkout, exercises: [] });
        return await callback(prisma);
      });

      const request = createMockRequestWithBody(
        'http://localhost:3000/api/workouts',
        workoutData
      );

      const response = await POST(request);

      expect(response.status).toBe(201);
      
      // Verify exercise creation with correct order indices
      expect(prisma.exercise.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Exercise 1', orderIndex: 2 }),
          expect.objectContaining({ name: 'Exercise 2', orderIndex: 1 }), // Auto-assigned
          expect.objectContaining({ name: 'Exercise 3', orderIndex: 0 })
        ])
      });
    });
  });
});