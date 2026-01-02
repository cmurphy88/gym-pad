import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseSetsData, calculateExerciseSummary } from '@/lib/migrate-sets'
import { requireAuth } from '@/lib/middleware'
import { getLocalDateKey } from '@/lib/dateUtils'
import { getProgressionSuggestion, categorizeExercises, PROGRESSION_STATUS } from '@/lib/progression-suggestions'
import { calculateVolumeAnalytics, buildMuscleGroupMap } from '@/lib/volume-analytics'

/**
 * GET /api/insights - Get training insights with progression suggestions for all exercises
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    // Get all unique exercise names for this user
    const uniqueExercises = await prisma.$queryRaw`
      SELECT DISTINCT e.name
      FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE w.user_id = ${auth.user.id}
      ORDER BY e.name
    `

    // For each exercise, get recent history and calculate suggestions
    const exercisesWithSuggestions = await Promise.all(
      uniqueExercises.map(async (exercise) => {
        // Get last 5 workout sessions for this exercise
        const history = await prisma.$queryRaw`
          SELECT e.*, w.id as workout_id, w.title as workout_title, w.date as workout_date, w.template_id
          FROM exercises e
          JOIN workouts w ON e.workout_id = w.id
          WHERE LOWER(e.name) = LOWER(${exercise.name})
            AND w.user_id = ${auth.user.id}
          ORDER BY w.date DESC
          LIMIT 5
        `

        // Transform history
        const formattedHistory = history.map((h) => {
          const sets = parseSetsData(h.sets_data)
          const summary = calculateExerciseSummary(sets)
          return {
            date: getLocalDateKey(h.workout_date),
            sets,
            totalSets: summary.totalSets,
            totalReps: summary.totalReps,
            maxWeight: summary.maxWeight,
            totalVolume: summary.totalVolume,
            workoutTitle: h.workout_title
          }
        })

        // Try to find target rep range from template exercises
        let targetRepRange = null
        if (history.length > 0 && history[0].template_id) {
          const templateExercise = await prisma.templateExercise.findFirst({
            where: {
              templateId: history[0].template_id,
              exerciseName: { equals: exercise.name, mode: 'insensitive' }
            }
          })
          targetRepRange = templateExercise?.targetRepRange || null
        }

        // Get progression suggestion
        const suggestion = getProgressionSuggestion(
          formattedHistory,
          targetRepRange
        )

        return {
          name: exercise.name,
          history: formattedHistory,
          targetRepRange,
          ...suggestion
        }
      })
    )

    // Categorize exercises
    const categorized = {
      readyToProgress: [],
      maintain: [],
      needsAttention: [],
      noData: []
    }

    exercisesWithSuggestions.forEach((exercise) => {
      switch (exercise.status) {
        case PROGRESSION_STATUS.READY:
          categorized.readyToProgress.push(exercise)
          break
        case PROGRESSION_STATUS.MAINTAIN:
          categorized.maintain.push(exercise)
          break
        case PROGRESSION_STATUS.ATTENTION:
          categorized.needsAttention.push(exercise)
          break
        case PROGRESSION_STATUS.NO_DATA:
        default:
          categorized.noData.push(exercise)
          break
      }
    })

    // Calculate summary stats
    const summary = {
      totalExercises: exercisesWithSuggestions.length,
      readyCount: categorized.readyToProgress.length,
      maintainCount: categorized.maintain.length,
      attentionCount: categorized.needsAttention.length,
      noDataCount: categorized.noData.length
    }

    // Fetch workouts for volume analytics (last 8 weeks)
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const workoutsForVolume = await prisma.workout.findMany({
      where: {
        userId: auth.user.id,
        date: { gte: eightWeeksAgo },
        status: 'COMPLETED'
      },
      include: {
        exercises: true
      },
      orderBy: { date: 'desc' }
    })

    // Get all template exercises to build muscle group map
    const allTemplateExercises = await prisma.templateExercise.findMany({
      where: {
        muscleGroups: { not: null }
      }
    })

    const muscleGroupMap = buildMuscleGroupMap(allTemplateExercises)

    // Calculate volume analytics
    const volume = calculateVolumeAnalytics(workoutsForVolume, muscleGroupMap)

    return NextResponse.json({
      summary,
      categories: categorized,
      exercises: exercisesWithSuggestions,
      volume
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training insights' },
      { status: 500 }
    )
  }
}
