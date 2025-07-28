import { prisma } from './prisma.js'

const defaultTemplates = [
  {
    name: 'Pull',
    description: 'Pulling movements targeting back, biceps, and rear delts',
    isDefault: true,
    exercises: [
      { name: 'Pull-ups', defaultSets: 4, defaultReps: 8, orderIndex: 0, restSeconds: 90 },
      { name: 'Lat Pulldown', defaultSets: 4, defaultReps: 10, orderIndex: 1, restSeconds: 90 },
      { name: 'Barbell Rows', defaultSets: 4, defaultReps: 10, orderIndex: 2, restSeconds: 90 },
      { name: 'Cable Rows', defaultSets: 3, defaultReps: 12, orderIndex: 3, restSeconds: 60 },
      { name: 'Bicep Curls', defaultSets: 3, defaultReps: 12, orderIndex: 4, restSeconds: 60 },
      { name: 'Hammer Curls', defaultSets: 3, defaultReps: 12, orderIndex: 5, restSeconds: 60 },
      { name: 'Face Pulls', defaultSets: 3, defaultReps: 15, orderIndex: 6, restSeconds: 45 }
    ]
  },
  {
    name: 'Push',
    description: 'Pushing movements targeting chest, shoulders, and triceps',
    isDefault: true,
    exercises: [
      { name: 'Bench Press', defaultSets: 4, defaultReps: 8, orderIndex: 0, restSeconds: 120 },
      { name: 'Overhead Press', defaultSets: 4, defaultReps: 8, orderIndex: 1, restSeconds: 90 },
      { name: 'Incline Dumbbell Press', defaultSets: 3, defaultReps: 10, orderIndex: 2, restSeconds: 90 },
      { name: 'Lateral Raises', defaultSets: 3, defaultReps: 12, orderIndex: 3, restSeconds: 60 },
      { name: 'Tricep Dips', defaultSets: 3, defaultReps: 12, orderIndex: 4, restSeconds: 60 },
      { name: 'Tricep Pushdowns', defaultSets: 3, defaultReps: 12, orderIndex: 5, restSeconds: 60 },
      { name: 'Push-ups', defaultSets: 3, defaultReps: 15, orderIndex: 6, restSeconds: 45 }
    ]
  },
  {
    name: 'Legs',
    description: 'Lower body movements targeting quads, hamstrings, glutes, and calves',
    isDefault: true,
    exercises: [
      { name: 'Squats', defaultSets: 4, defaultReps: 8, orderIndex: 0, restSeconds: 120 },
      { name: 'Romanian Deadlifts', defaultSets: 4, defaultReps: 10, orderIndex: 1, restSeconds: 90 },
      { name: 'Bulgarian Split Squats', defaultSets: 3, defaultReps: 12, orderIndex: 2, restSeconds: 90 },
      { name: 'Leg Press', defaultSets: 3, defaultReps: 15, orderIndex: 3, restSeconds: 90 },
      { name: 'Leg Curls', defaultSets: 3, defaultReps: 12, orderIndex: 4, restSeconds: 60 },
      { name: 'Calf Raises', defaultSets: 4, defaultReps: 15, orderIndex: 5, restSeconds: 45 },
      { name: 'Walking Lunges', defaultSets: 3, defaultReps: 20, orderIndex: 6, restSeconds: 60 }
    ]
  },
  {
    name: 'Upper',
    description: 'Upper body focused workout combining push and pull movements',
    isDefault: true,
    exercises: [
      { name: 'Bench Press', defaultSets: 4, defaultReps: 8, orderIndex: 0, restSeconds: 120 },
      { name: 'Pull-ups', defaultSets: 4, defaultReps: 8, orderIndex: 1, restSeconds: 90 },
      { name: 'Overhead Press', defaultSets: 3, defaultReps: 10, orderIndex: 2, restSeconds: 90 },
      { name: 'Barbell Rows', defaultSets: 3, defaultReps: 10, orderIndex: 3, restSeconds: 90 },
      { name: 'Dumbbell Flyes', defaultSets: 3, defaultReps: 12, orderIndex: 4, restSeconds: 60 },
      { name: 'Bicep Curls', defaultSets: 3, defaultReps: 12, orderIndex: 5, restSeconds: 60 },
      { name: 'Tricep Extensions', defaultSets: 3, defaultReps: 12, orderIndex: 6, restSeconds: 60 }
    ]
  },
  {
    name: 'Lower',
    description: 'Lower body and core focused workout',
    isDefault: true,
    exercises: [
      { name: 'Deadlifts', defaultSets: 4, defaultReps: 6, orderIndex: 0, restSeconds: 150 },
      { name: 'Front Squats', defaultSets: 4, defaultReps: 8, orderIndex: 1, restSeconds: 120 },
      { name: 'Hip Thrusts', defaultSets: 3, defaultReps: 12, orderIndex: 2, restSeconds: 90 },
      { name: 'Single Leg Deadlifts', defaultSets: 3, defaultReps: 10, orderIndex: 3, restSeconds: 60 },
      { name: 'Leg Extensions', defaultSets: 3, defaultReps: 15, orderIndex: 4, restSeconds: 60 },
      { name: 'Plank', defaultSets: 3, defaultReps: 60, orderIndex: 5, restSeconds: 60, notes: 'Hold for 60 seconds' },
      { name: 'Russian Twists', defaultSets: 3, defaultReps: 20, orderIndex: 6, restSeconds: 45 }
    ]
  }
]

export async function seedDefaultTemplates() {
  console.log('🌱 Seeding default workout templates...')
  
  try {
    for (const templateData of defaultTemplates) {
      // Check if template already exists
      const existingTemplate = await prisma.sessionTemplate.findUnique({
        where: { name: templateData.name }
      })

      if (existingTemplate) {
        console.log(`⏭️  Template "${templateData.name}" already exists, skipping...`)
        continue
      }

      // Create template with exercises in a transaction
      await prisma.$transaction(async (prisma) => {
        // Create the template
        const template = await prisma.sessionTemplate.create({
          data: {
            name: templateData.name,
            description: templateData.description,
            isDefault: templateData.isDefault
          }
        })

        // Create template exercises
        const exercisesData = templateData.exercises.map(exercise => ({
          templateId: template.id,
          exerciseName: exercise.name,
          defaultSets: exercise.defaultSets,
          defaultReps: exercise.defaultReps,
          defaultWeight: exercise.defaultWeight || null,
          orderIndex: exercise.orderIndex,
          notes: exercise.notes || null,
          restSeconds: exercise.restSeconds
        }))

        await prisma.templateExercise.createMany({
          data: exercisesData
        })

        console.log(`✅ Created template "${templateData.name}" with ${templateData.exercises.length} exercises`)
      })
    }

    console.log('🎉 Default templates seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding default templates:', error)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDefaultTemplates()
    .then(() => {
      console.log('✅ Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
    .finally(() => {
      // Ensure prisma connection is closed
      prisma.$disconnect()
    })
}