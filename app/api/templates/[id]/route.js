import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/templates/[id] - Get a specific template
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

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/templates/[id] - Update a template
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params
    const templateId = parseInt(resolvedParams.id)
    const data = await request.json()
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    // Update template with exercises in a transaction
    const template = await prisma.$transaction(async (prisma) => {
      // Update the template
      const updatedTemplate = await prisma.sessionTemplate.update({
        where: { id: templateId },
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          isDefault: data.isDefault || false
        }
      })

      // If exercises are provided, replace all exercises
      if (data.exercises) {
        // Delete existing exercises
        await prisma.templateExercise.deleteMany({
          where: { templateId: templateId }
        })

        // Create new exercises
        if (data.exercises.length > 0) {
          const exercisesData = data.exercises.map((exercise, index) => ({
            templateId: templateId,
            exerciseName: exercise.name,
            defaultSets: exercise.defaultSets || null,
            defaultReps: exercise.defaultReps || null,
            defaultWeight: exercise.defaultWeight || null,
            orderIndex: exercise.orderIndex !== undefined ? exercise.orderIndex : index,
            notes: exercise.notes?.trim() || null,
            restSeconds: exercise.restSeconds || null
          }))

          await prisma.templateExercise.createMany({
            data: exercisesData
          })
        }
      }

      // Return the complete updated template with exercises
      return await prisma.sessionTemplate.findUnique({
        where: { id: templateId },
        include: {
          templateExercises: {
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      })
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      )
    }
    
    // Handle not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/[id] - Delete a template
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const templateId = parseInt(resolvedParams.id)
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    // Check if template exists and is not a default template
    const template = await prisma.sessionTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 403 }
      )
    }

    await prisma.sessionTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting template:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}