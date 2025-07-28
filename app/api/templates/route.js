import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/templates - Get all session templates
 */
export async function GET() {
  try {
    const templates = await prisma.sessionTemplate.findMany({
      include: {
        templateExercises: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' }, // Default templates first
        { name: 'asc' }
      ]
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates - Create a new session template
 */
export async function POST(request) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    // Create template with exercises in a transaction
    const template = await prisma.$transaction(async (prisma) => {
      // Create the template
      const newTemplate = await prisma.sessionTemplate.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          isDefault: data.isDefault || false
        }
      })

      // Create template exercises if provided
      if (data.exercises && data.exercises.length > 0) {
        const exercisesData = data.exercises.map((exercise, index) => ({
          templateId: newTemplate.id,
          exerciseName: exercise.name,
          defaultSets: exercise.defaultSets || null,
          defaultReps: exercise.defaultReps || null,
          targetRepRange: exercise.targetRepRange?.trim() || null,
          defaultWeight: exercise.defaultWeight || null,
          orderIndex: exercise.orderIndex !== undefined ? exercise.orderIndex : index,
          notes: exercise.notes?.trim() || null,
          restSeconds: exercise.restSeconds || null
        }))

        await prisma.templateExercise.createMany({
          data: exercisesData
        })
      }

      // Return the complete template with exercises
      return await prisma.sessionTemplate.findUnique({
        where: { id: newTemplate.id },
        include: {
          templateExercises: {
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      })
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}