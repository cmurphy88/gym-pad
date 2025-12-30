import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWorkout, validateExercise } from '@/lib/validations'
import { requireAuth } from '@/lib/middleware'

/**
 * POST /api/workouts/from-template - Create a workout from a template
 */
export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    if (!data.title || !data.title.trim()) {
      return NextResponse.json(
        { error: 'Workout title is required' },
        { status: 400 }
      )
    }

    if (!data.date) {
      return NextResponse.json(
        { error: 'Workout date is required' },
        { status: 400 }
      )
    }

    // Validate the workout data
    const validation = validateWorkout(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Validate exercises if provided
    if (data.exercises && data.exercises.length > 0) {
      for (let i = 0; i < data.exercises.length; i++) {
        const exerciseValidation = validateExercise(data.exercises[i])
        if (!exerciseValidation.isValid) {
          return NextResponse.json(
            { error: `Exercise ${i + 1} validation failed`, details: exerciseValidation.errors },
            { status: 400 }
          )
        }
      }
    }

    // Verify template exists
    const template = await prisma.sessionTemplate.findUnique({
      where: { id: data.templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Create workout with exercises in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the workout
      const workout = await prisma.workout.create({
        data: {
          userId: auth.user.id,
          templateId: data.templateId,
          title: data.title.trim(),
          date: new Date(data.date),
          notes: data.notes?.trim() || null,
          status: data.status || 'COMPLETED'
        }
      })

      // Create exercises if provided
      if (data.exercises && data.exercises.length > 0) {
        const exercisesData = data.exercises.map((exercise, index) => ({
          workoutId: workout.id,
          name: exercise.name,
          setsData: JSON.stringify(exercise.sets),
          restSeconds: exercise.restSeconds || null,
          notes: exercise.notes?.trim() || null,
          orderIndex: exercise.orderIndex !== undefined ? exercise.orderIndex : index
        }))

        await prisma.exercise.createMany({
          data: exercisesData
        })
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
      })
    })

    // Parse sets data for each exercise
    const workoutWithParsedSets = {
      ...result,
      exercises: result.exercises.map(exercise => ({
        ...exercise,
        sets: JSON.parse(exercise.setsData)
      }))
    }

    return NextResponse.json(workoutWithParsedSets, { status: 201 })
  } catch (error) {
    console.error('Error creating workout from template:', error)
    return NextResponse.json(
      { error: 'Failed to create workout from template' },
      { status: 500 }
    )
  }
}