import { prisma } from './prisma.js';

// Mock data with new sets array format
const mockWorkoutData = [
  {
    title: 'Upper Body Focus',
    date: new Date('2023-11-15'),
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { weight: 185, reps: 8 },
          { weight: 185, reps: 8 },
          { weight: 185, reps: 7 },
          { weight: 185, reps: 6 }
        ],
        orderIndex: 0
      },
      {
        name: 'Pull-ups',
        sets: [
          { weight: 0, reps: 10 },
          { weight: 0, reps: 9 },
          { weight: 0, reps: 8 }
        ],
        orderIndex: 1
      },
      {
        name: 'Shoulder Press',
        sets: [
          { weight: 65, reps: 12 },
          { weight: 65, reps: 11 },
          { weight: 65, reps: 10 }
        ],
        orderIndex: 2
      },
    ],
  },
  {
    title: 'Leg Day',
    date: new Date('2023-11-13'),
    exercises: [
      {
        name: 'Squats',
        sets: [
          { weight: 225, reps: 10 },
          { weight: 225, reps: 10 },
          { weight: 225, reps: 9 },
          { weight: 225, reps: 8 }
        ],
        orderIndex: 0
      },
      {
        name: 'Leg Press',
        sets: [
          { weight: 360, reps: 12 },
          { weight: 360, reps: 11 },
          { weight: 360, reps: 10 }
        ],
        orderIndex: 1
      },
      {
        name: 'Lunges',
        sets: [
          { weight: 40, reps: 10 },
          { weight: 40, reps: 10 },
          { weight: 40, reps: 9 }
        ],
        orderIndex: 2
      },
    ],
  },
  {
    title: 'Full Body',
    date: new Date('2023-11-10'),
    exercises: [
      {
        name: 'Deadlifts',
        sets: [
          { weight: 275, reps: 6 },
          { weight: 275, reps: 6 },
          { weight: 275, reps: 5 },
          { weight: 275, reps: 5 }
        ],
        orderIndex: 0
      },
      {
        name: 'Bench Press',
        sets: [
          { weight: 175, reps: 8 },
          { weight: 175, reps: 8 },
          { weight: 175, reps: 7 }
        ],
        orderIndex: 1
      },
      {
        name: 'Pull-ups',
        sets: [
          { weight: 0, reps: 8 },
          { weight: 0, reps: 7 },
          { weight: 0, reps: 6 }
        ],
        orderIndex: 2
      },
    ],
  },
  {
    title: 'Upper Body Focus',
    date: new Date('2023-11-08'),
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { weight: 180, reps: 8 },
          { weight: 180, reps: 8 },
          { weight: 180, reps: 7 },
          { weight: 180, reps: 6 }
        ],
        orderIndex: 0
      },
      {
        name: 'Bicep Curls',
        sets: [
          { weight: 35, reps: 12 },
          { weight: 35, reps: 11 },
          { weight: 35, reps: 10 }
        ],
        orderIndex: 1
      },
      {
        name: 'Tricep Extensions',
        sets: [
          { weight: 30, reps: 12 },
          { weight: 30, reps: 12 },
          { weight: 30, reps: 10 }
        ],
        orderIndex: 2
      },
    ],
  },
];

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.exercise.deleteMany();
    await prisma.workout.deleteMany();

    // Create workouts with exercises
    for (const workoutData of mockWorkoutData) {
      const workout = await prisma.workout.create({
        data: {
          title: workoutData.title,
          date: workoutData.date,
          duration: 45, // Default duration
        },
      });

      // Create exercises for this workout
      for (const exerciseData of workoutData.exercises) {
        await prisma.exercise.create({
          data: {
            workoutId: workout.id,
            name: exerciseData.name,
            setsData: JSON.stringify(exerciseData.sets),
            orderIndex: exerciseData.orderIndex,
          },
        });
      }
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
} else {
  // If imported as module, just export the function
  console.log('Seed function ready to be called');
}