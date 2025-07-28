import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSetsData, calculateExerciseSummary } from '@/lib/migrate-sets';

/**
 * GET /api/exercises/history/[name] - Get exercise history by name
 */
export async function GET(request, { params }) {
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    const exerciseName = decodeURIComponent(resolvedParams.name);
    
    if (!exerciseName || exerciseName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      );
    }

    const exercises = await prisma.exercise.findMany({
      where: {
        name: exerciseName // SQLite doesn't support mode: 'insensitive'
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
      orderBy: {
        workout: {
          date: 'desc'
        }
      }
    });

    // Transform the data to match the expected format
    const history = exercises.map(exercise => {
      const sets = parseSetsData(exercise.setsData);
      const summary = calculateExerciseSummary(sets);
      
      return {
        date: exercise.workout.date.toISOString().split('T')[0],
        sets: sets,
        // For backwards compatibility, provide summary data
        totalSets: summary.totalSets,
        totalReps: summary.totalReps,
        maxWeight: summary.maxWeight,
        totalVolume: summary.totalVolume,
        workoutTitle: exercise.workout.title
      };
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise history' },
      { status: 500 }
    );
  }
}