import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWorkout, validateExercise } from '@/lib/validations';
import { parseSetsData } from '@/lib/migrate-sets';
import { requireAuth } from '@/lib/middleware';

/**
 * GET /api/workouts - Get all workouts
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const workouts = await prisma.workout.findMany({
      where: {
        userId: auth.user.id
      },
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
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const data = await request.json();
    
    // Validate the workout data
    const validation = validateWorkout(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Validate exercises if provided
    if (data.exercises && data.exercises.length > 0) {
      for (let i = 0; i < data.exercises.length; i++) {
        const exerciseValidation = validateExercise(data.exercises[i]);
        if (!exerciseValidation.isValid) {
          return NextResponse.json(
            { error: `Exercise ${i + 1} validation failed`, details: exerciseValidation.errors },
            { status: 400 }
          );
        }
      }
    }

    // Create workout with exercises in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the workout
      const workout = await prisma.workout.create({
        data: {
          userId: auth.user.id,
          title: data.title,
          date: new Date(data.date),
          duration: data.duration || null,
          notes: data.notes || null,
        }
      });

      // Create exercises if provided
      if (data.exercises && data.exercises.length > 0) {
        const exercisesData = data.exercises.map((exercise, index) => ({
          workoutId: workout.id,
          name: exercise.name,
          setsData: JSON.stringify(exercise.sets),
          restSeconds: exercise.restSeconds || null,
          notes: exercise.notes || null,
          orderIndex: exercise.orderIndex !== undefined ? exercise.orderIndex : index,
        }));

        await prisma.exercise.createMany({
          data: exercisesData
        });
      }

      // Fetch the complete workout with exercises
      return await prisma.workout.findUnique({
        where: { id: workout.id },
        include: {
          exercises: {
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      });
    });

    // Parse sets data for each exercise
    const workoutWithParsedSets = {
      ...result,
      exercises: result.exercises.map(exercise => ({
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