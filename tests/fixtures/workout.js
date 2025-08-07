/**
 * Test fixtures for Workout and Exercise models
 * These are safe mock data objects that don't interact with the database
 */

export const createMockWorkout = (userId = 1, overrides = {}) => ({
  id: 1,
  userId,
  templateId: null,
  title: 'Test Workout',
  date: new Date('2025-01-01T10:00:00Z'),
  duration: 3600, // 1 hour in seconds
  notes: 'Test workout notes',
  createdAt: new Date('2025-01-01T10:00:00Z'),
  updatedAt: new Date('2025-01-01T10:00:00Z'),
  exercises: [],
  ...overrides
});

export const createMockExercise = (workoutId = 1, overrides = {}) => ({
  id: 1,
  workoutId,
  name: 'Bench Press',
  setsData: JSON.stringify([
    { reps: 10, weight: 135, completed: true },
    { reps: 8, weight: 140, completed: true },
    { reps: 6, weight: 145, completed: false }
  ]),
  restSeconds: 90,
  notes: 'Felt good today',
  orderIndex: 0,
  createdAt: new Date('2025-01-01T10:00:00Z'),
  ...overrides
});

export const createMockWorkoutWithExercises = (userId = 1, overrides = {}) => {
  const workout = createMockWorkout(userId, overrides);
  
  workout.exercises = [
    createMockExercise(workout.id, {
      id: 1,
      name: 'Bench Press',
      orderIndex: 0
    }),
    createMockExercise(workout.id, {
      id: 2,
      name: 'Incline Dumbbell Press',
      orderIndex: 1,
      setsData: JSON.stringify([
        { reps: 12, weight: 60, completed: true },
        { reps: 10, weight: 65, completed: true }
      ])
    }),
    createMockExercise(workout.id, {
      id: 3,
      name: 'Push-ups',
      orderIndex: 2,
      setsData: JSON.stringify([
        { reps: 20, weight: null, completed: true },
        { reps: 18, weight: null, completed: true }
      ])
    })
  ];
  
  return workout;
};

// Pre-defined workout scenarios
export const mockWorkouts = {
  pushDay: createMockWorkout(1, {
    id: 1,
    title: 'Push Day',
    duration: 4200, // 70 minutes
    exercises: [
      createMockExercise(1, { id: 1, name: 'Bench Press', orderIndex: 0 }),
      createMockExercise(1, { id: 2, name: 'Overhead Press', orderIndex: 1 }),
      createMockExercise(1, { id: 3, name: 'Dips', orderIndex: 2 })
    ]
  }),
  
  pullDay: createMockWorkout(1, {
    id: 2,
    title: 'Pull Day',
    date: new Date('2025-01-03T10:00:00Z'),
    exercises: [
      createMockExercise(2, { id: 4, name: 'Pull-ups', orderIndex: 0 }),
      createMockExercise(2, { id: 5, name: 'Rows', orderIndex: 1 }),
      createMockExercise(2, { id: 6, name: 'Face Pulls', orderIndex: 2 })
    ]
  }),
  
  legDay: createMockWorkout(1, {
    id: 3,
    title: 'Leg Day',
    date: new Date('2025-01-05T10:00:00Z'),
    exercises: [
      createMockExercise(3, { id: 7, name: 'Squats', orderIndex: 0 }),
      createMockExercise(3, { id: 8, name: 'Romanian Deadlifts', orderIndex: 1 }),
      createMockExercise(3, { id: 9, name: 'Leg Press', orderIndex: 2 })
    ]
  })
};

// Valid workout data for POST requests
export const validWorkoutData = {
  title: 'Test Workout',
  date: '2025-01-01T10:00:00Z',
  duration: 3600,
  notes: 'Test notes',
  exercises: [
    {
      name: 'Bench Press',
      sets: [
        { reps: 10, weight: 135 },
        { reps: 8, weight: 140 }
      ],
      restSeconds: 90,
      notes: 'Good form',
      orderIndex: 0
    },
    {
      name: 'Incline Press',
      sets: [
        { reps: 12, weight: 60 },
        { reps: 10, weight: 65 }
      ],
      restSeconds: 60,
      orderIndex: 1
    }
  ]
};

// Invalid workout data for validation testing
export const invalidWorkoutData = {
  missingTitle: {
    date: '2025-01-01T10:00:00Z',
    duration: 3600
    // title is missing
  },
  
  invalidDate: {
    title: 'Test Workout',
    date: 'not-a-date',
    duration: 3600
  },
  
  negativeDuration: {
    title: 'Test Workout',
    date: '2025-01-01T10:00:00Z',
    duration: -100
  }
};