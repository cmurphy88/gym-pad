import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSetsData, calculateExerciseSummary } from '@/lib/migrate-sets';
import { requireAuth } from '@/lib/middleware';

/**
 * GET /api/exercises/history/[name] - Get exercise history by name
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    // Await params in Next.js 15+
    const resolvedParams = await params;
    const exerciseName = decodeURIComponent(resolvedParams.name);
    
    if (!exerciseName || exerciseName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      );
    }

    const exercises = await prisma.$queryRaw`
      SELECT e.*, w.id as workout_id, w.title as workout_title, w.date as workout_date
      FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE LOWER(e.name) = LOWER(${exerciseName})
        AND w.user_id = ${auth.user.id}
      ORDER BY w.date DESC
    `;

    // Transform the data to match the expected format
    const history = exercises.map(exercise => {
      const sets = parseSetsData(exercise.sets_data);
      const summary = calculateExerciseSummary(sets);
      
      return {
        date: exercise.workout_date.toISOString().split('T')[0],
        sets: sets,
        // For backwards compatibility, provide summary data
        totalSets: summary.totalSets,
        totalReps: summary.totalReps,
        maxWeight: summary.maxWeight,
        totalVolume: summary.totalVolume,
        workoutTitle: exercise.workout_title
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