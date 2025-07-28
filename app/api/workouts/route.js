import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWorkout } from '@/lib/validations';
import { parseSetsData } from '@/lib/migrate-sets';

/**
 * GET /api/workouts - Get all workouts
 */
export async function GET() {
  try {
    const workouts = await prisma.workout.findMany({
      include: {
        exercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Parse sets data for each exercise
    const workoutsWithParsedSets = workouts.map(workout => ({
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: parseSetsData(exercise.setsData)
      }))
    }));

    return NextResponse.json(workoutsWithParsedSets);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workouts - Create a new workout
 */
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate the workout data
    const validation = validateWorkout(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const workout = await prisma.workout.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        duration: data.duration || null,
        notes: data.notes || null,
      },
      include: {
        exercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    // Parse sets data for each exercise
    const workoutWithParsedSets = {
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: parseSetsData(exercise.setsData)
      }))
    };

    return NextResponse.json(workoutWithParsedSets, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}