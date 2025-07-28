import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWorkout } from '@/lib/validations';
import { parseSetsData } from '@/lib/migrate-sets';

/**
 * GET /api/workouts/[id] - Get a specific workout
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const workoutId = parseInt(resolvedParams.id);
    
    if (isNaN(workoutId)) {
      return NextResponse.json(
        { error: 'Invalid workout ID' },
        { status: 400 }
      );
    }

    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Parse sets data for each exercise
    const workoutWithParsedSets = {
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: parseSetsData(exercise.setsData)
      }))
    };

    return NextResponse.json(workoutWithParsedSets);
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workouts/[id] - Update a workout
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const workoutId = parseInt(resolvedParams.id);
    const data = await request.json();
    
    if (isNaN(workoutId)) {
      return NextResponse.json(
        { error: 'Invalid workout ID' },
        { status: 400 }
      );
    }

    // Validate the workout data
    const validation = validateWorkout(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const workout = await prisma.workout.update({
      where: { id: workoutId },
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

    return NextResponse.json(workoutWithParsedSets);
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workouts/[id] - Delete a workout
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const workoutId = parseInt(resolvedParams.id);
    
    if (isNaN(workoutId)) {
      return NextResponse.json(
        { error: 'Invalid workout ID' },
        { status: 400 }
      );
    }

    await prisma.workout.delete({
      where: { id: workoutId }
    });

    return NextResponse.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
}