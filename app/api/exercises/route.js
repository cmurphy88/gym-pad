import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateExercise } from '@/lib/validations';
import { parseSetsData } from '@/lib/migrate-sets';
import { requireAuth } from '@/lib/middleware';

/**
 * GET /api/exercises - Get all exercises or exercises for a specific workout
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('workoutId');

    let exercises;
    
    if (workoutId) {
      const workoutIdInt = parseInt(workoutId);
      if (isNaN(workoutIdInt)) {
        return NextResponse.json(
          { error: 'Invalid workout ID' },
          { status: 400 }
        );
      }
      
      exercises = await prisma.exercise.findMany({
        where: { 
          workoutId: workoutIdInt,
          workout: {
            userId: auth.user.id
          }
        },
        orderBy: { orderIndex: 'asc' }
      });
    } else {
      exercises = await prisma.exercise.findMany({
        where: {
          workout: {
            userId: auth.user.id
          }
        },
        include: {
          workout: {
            select: {
              id: true,
              title: true,
              date: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Parse sets data for each exercise
    const parsedExercises = exercises.map(exercise => ({
      ...exercise,
      sets: parseSetsData(exercise.setsData)
    }));

    return NextResponse.json(parsedExercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exercises - Create a new exercise
 */
export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const data = await request.json();
    
    // Validate the exercise data
    const validation = validateExercise(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Verify workout exists and belongs to user
    if (data.workoutId) {
      const workout = await prisma.workout.findUnique({
        where: { 
          id: data.workoutId,
          userId: auth.user.id
        }
      });
      
      if (!workout) {
        return NextResponse.json(
          { error: 'Workout not found' },
          { status: 404 }
        );
      }
    }

    const exercise = await prisma.exercise.create({
      data: {
        workoutId: data.workoutId,
        name: data.name,
        setsData: JSON.stringify(data.sets),
        restSeconds: data.restSeconds || null,
        notes: data.notes || null,
        orderIndex: data.orderIndex || 0,
      }
    });

    // Parse sets data for response
    const exerciseWithParsedSets = {
      ...exercise,
      sets: parseSetsData(exercise.setsData)
    };

    return NextResponse.json(exerciseWithParsedSets, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}