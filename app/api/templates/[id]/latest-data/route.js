import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseSetsData } from '@/lib/migrate-sets'

/**
 * GET /api/templates/[id]/latest-data - Get template with latest workout data pre-filled
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const templateId = parseInt(resolvedParams.id)
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    // Get the template
    const template = await prisma.sessionTemplate.findUnique({
      where: { id: templateId },
      include: {
        templateExercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // For each exercise in the template, find the latest workout data
    const exercisesWithLatestData = await Promise.all(
      template.templateExercises.map(async (templateExercise) => {
        let latestSets = []
        let suggestedWeight = templateExercise.defaultWeight
        let suggestedReps = templateExercise.defaultReps
        let lastPerformed = null

        try {
          // Find the most recent exercise with this name using raw query for SQLite compatibility
          const latestExercises = await prisma.$queryRaw`
            SELECT e.*, w.date as workout_date
            FROM exercises e
            JOIN workouts w ON e.workout_id = w.id
            WHERE LOWER(e.name) = LOWER(${templateExercise.exerciseName})
            ORDER BY w.date DESC
            LIMIT 1
          `

          const latestExercise = latestExercises[0]

          if (latestExercise) {
            lastPerformed = latestExercise.workout_date
            // Parse the latest sets data
            latestSets = parseSetsData(latestExercise.sets_data)
            
            // Use the latest performance as suggestions
            if (latestSets.length > 0) {
              // Get the heaviest weight from the last workout
              const weights = latestSets.map(set => set.weight || 0).filter(w => w > 0)
              if (weights.length > 0) {
                suggestedWeight = Math.max(...weights)
              }

              // Get the most common rep count
              const reps = latestSets.map(set => set.reps || 0).filter(r => r > 0)
              if (reps.length > 0) {
                suggestedReps = Math.round(reps.reduce((sum, r) => sum + r, 0) / reps.length)
              }
            }
          }
        } catch (exerciseError) {
          console.error(`Error fetching latest data for ${templateExercise.exerciseName}:`, exerciseError)
          // Continue with default values if there's an error
        }

        return {
          id: templateExercise.id,
          name: templateExercise.exerciseName,
          defaultSets: templateExercise.defaultSets,
          defaultReps: suggestedReps,
          defaultWeight: suggestedWeight,
          orderIndex: templateExercise.orderIndex,
          notes: templateExercise.notes,
          restSeconds: templateExercise.restSeconds,
          latestSets: latestSets,
          lastPerformed: lastPerformed
        }
      })
    )

    // Return template with enhanced exercise data
    const templateWithLatestData = {
      ...template,
      templateExercises: exercisesWithLatestData
    }

    return NextResponse.json(templateWithLatestData)
  } catch (error) {
    console.error('Error fetching template with latest data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template data' },
      { status: 500 }
    )
  }
}