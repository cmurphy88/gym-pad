import { jest } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';

/**
 * Create test workout data
 */
export const createTestWorkout = async (userId, workoutData = {}) => {
  const defaultData = {
    title: `Test Workout ${Date.now()}`,
    date: new Date(),
    duration: 60,
    notes: 'Test workout notes',
  };
  
  const data = { ...defaultData, ...workoutData };
  
  return await prisma.workout.create({
    data: {
      userId,
      ...data,
    },
  });
};

/**
 * Create test exercise data
 */
export const createTestExercise = async (workoutId, exerciseData = {}) => {
  const defaultData = {
    name: `Test Exercise ${Date.now()}`,
    setsData: JSON.stringify([
      { reps: 10, weight: 50 },
      { reps: 8, weight: 55 },
      { reps: 6, weight: 60 },
    ]),
    restSeconds: 90,
    notes: 'Test exercise notes',
    orderIndex: 0,
  };
  
  const data = { ...defaultData, ...exerciseData };
  
  return await prisma.exercise.create({
    data: {
      workoutId,
      ...data,
    },
  });
};

/**
 * Create test session template
 */
export const createTestTemplate = async (templateData = {}) => {
  const defaultData = {
    name: `Test Template ${Date.now()}`,
    description: 'Test template description',
    isDefault: false,
  };
  
  const data = { ...defaultData, ...templateData };
  
  return await prisma.sessionTemplate.create({
    data,
  });
};

/**
 * Create test template exercise
 */
export const createTestTemplateExercise = async (templateId, exerciseData = {}) => {
  const defaultData = {
    exerciseName: `Test Template Exercise ${Date.now()}`,
    defaultSets: 3,
    defaultReps: 10,
    targetRepRange: '8-12',
    defaultWeight: 50,
    orderIndex: 0,
    notes: 'Test template exercise notes',
    restSeconds: 90,
  };
  
  const data = { ...defaultData, ...exerciseData };
  
  return await prisma.templateExercise.create({
    data: {
      templateId,
      ...data,
    },
  });
};

/**
 * Create test weight entry
 */
export const createTestWeightEntry = async (userId, entryData = {}) => {
  const defaultData = {
    weight: 70.5,
    date: new Date(),
  };
  
  const data = { ...defaultData, ...entryData };
  
  return await prisma.weightEntry.create({
    data: {
      userId,
      ...data,
    },
  });
};

/**
 * Create test weight goal
 */
export const createTestWeightGoal = async (userId, goalData = {}) => {
  const defaultData = {
    targetWeight: 75.0,
    goalType: 'gain',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    isActive: true,
  };
  
  const data = { ...defaultData, ...goalData };
  
  return await prisma.weightGoal.create({
    data: {
      userId,
      ...data,
    },
  });
};

/**
 * Create a complete test workout with exercises
 */
export const createCompleteTestWorkout = async (userId, options = {}) => {
  const { exerciseCount = 3, ...workoutData } = options;
  
  const workout = await createTestWorkout(userId, workoutData);
  
  const exercises = [];
  for (let i = 0; i < exerciseCount; i++) {
    const exercise = await createTestExercise(workout.id, {
      name: `Exercise ${i + 1}`,
      orderIndex: i,
    });
    exercises.push(exercise);
  }
  
  return { workout, exercises };
};

/**
 * Create a complete test template with exercises
 */
export const createCompleteTestTemplate = async (options = {}) => {
  const { exerciseCount = 3, ...templateData } = options;
  
  const template = await createTestTemplate(templateData);
  
  const exercises = [];
  for (let i = 0; i < exerciseCount; i++) {
    const exercise = await createTestTemplateExercise(template.id, {
      exerciseName: `Template Exercise ${i + 1}`,
      orderIndex: i,
    });
    exercises.push(exercise);
  }
  
  return { template, exercises };
};

/**
 * Seed database with comprehensive test data
 */
export const seedTestDatabase = async (userId) => {
  // Create templates
  const templates = [];
  for (let i = 0; i < 3; i++) {
    const { template, exercises } = await createCompleteTestTemplate({
      name: `Template ${i + 1}`,
      isDefault: i === 0,
    });
    templates.push({ template, exercises });
  }
  
  // Create workouts
  const workouts = [];
  for (let i = 0; i < 5; i++) {
    const { workout, exercises } = await createCompleteTestWorkout(userId, {
      title: `Workout ${i + 1}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each day back
    });
    workouts.push({ workout, exercises });
  }
  
  // Create weight entries
  const weightEntries = [];
  for (let i = 0; i < 10; i++) {
    const entry = await createTestWeightEntry(userId, {
      weight: 70 + Math.random() * 5, // Random weight between 70-75
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each day back
    });
    weightEntries.push(entry);
  }
  
  // Create weight goal
  const weightGoal = await createTestWeightGoal(userId);
  
  return {
    templates,
    workouts,
    weightEntries,
    weightGoal,
  };
};

/**
 * Validate database record counts for a user
 */
export const validateUserDataCounts = async (userId, expectedCounts = {}) => {
  const counts = {
    workouts: await prisma.workout.count({ where: { userId } }),
    exercises: await prisma.exercise.count({
      where: { workout: { userId } },
    }),
    weightEntries: await prisma.weightEntry.count({ where: { userId } }),
    weightGoals: await prisma.weightGoal.count({ where: { userId } }),
    sessions: await prisma.session.count({ where: { userId } }),
  };
  
  Object.entries(expectedCounts).forEach(([key, expected]) => {
    expect(counts[key]).toBe(expected);
  });
  
  return counts;
};

/**
 * Clean up all test data for a user
 */
export const cleanupAllUserData = async (userId) => {
  // Delete in correct order to respect foreign key constraints
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.exercise.deleteMany({ where: { workout: { userId } } });
  await prisma.workout.deleteMany({ where: { userId } });
  await prisma.weightEntry.deleteMany({ where: { userId } });
  await prisma.weightGoal.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
};

/**
 * Create exercise template for testing
 */
export const createTestExerciseTemplate = async (templateData = {}) => {
  const defaultData = {
    name: `Test Exercise Template ${Date.now()}`,
    category: 'Strength',
    muscleGroups: JSON.stringify(['chest', 'shoulders']),
    instructions: 'Test exercise instructions',
  };
  
  const data = { ...defaultData, ...templateData };
  
  return await prisma.exerciseTemplate.create({
    data,
  });
};

/**
 * Create workout exercise swap for testing
 */
export const createTestWorkoutExerciseSwap = async (workoutId, swapData = {}) => {
  const defaultData = {
    originalExerciseName: 'Original Exercise',
    swappedExerciseName: 'Swapped Exercise',
    reason: 'Equipment unavailable',
  };
  
  const data = { ...defaultData, ...swapData };
  
  return await prisma.workoutExerciseSwap.create({
    data: {
      workoutId,
      ...data,
    },
  });
};

/**
 * Generate realistic test data with various scenarios
 */
export const generateRealisticTestData = async (userId) => {
  const baseDate = new Date();
  
  // Create templates for different workout types
  const pushTemplate = await createCompleteTestTemplate({
    name: 'Push Day',
    description: 'Chest, shoulders, triceps workout',
    exerciseCount: 4,
  });
  
  const pullTemplate = await createCompleteTestTemplate({
    name: 'Pull Day', 
    description: 'Back, biceps workout',
    exerciseCount: 4,
  });
  
  const legTemplate = await createCompleteTestTemplate({
    name: 'Leg Day',
    description: 'Quadriceps, hamstrings, glutes workout', 
    exerciseCount: 5,
  });
  
  // Create workouts over the past month
  const workouts = [];
  for (let i = 0; i < 20; i++) {
    const workoutDate = new Date(baseDate.getTime() - (i * 1.5 * 24 * 60 * 60 * 1000));
    const templateIndex = i % 3;
    const templateName = ['Push Workout', 'Pull Workout', 'Leg Workout'][templateIndex];
    
    const { workout, exercises } = await createCompleteTestWorkout(userId, {
      title: `${templateName} - Week ${Math.floor(i / 3) + 1}`,
      date: workoutDate,
      duration: 60 + Math.floor(Math.random() * 30), // 60-90 minutes
      exerciseCount: 3 + Math.floor(Math.random() * 3), // 3-5 exercises
    });
    
    workouts.push({ workout, exercises });
  }
  
  // Create weight entries with progression/regression
  const weightEntries = [];
  let currentWeight = 70;
  for (let i = 0; i < 30; i++) {
    const entryDate = new Date(baseDate.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Simulate weight fluctuation
    currentWeight += (Math.random() - 0.5) * 0.5; // +/- 0.25kg variation
    
    const entry = await createTestWeightEntry(userId, {
      weight: Math.round(currentWeight * 10) / 10, // Round to 1 decimal
      date: entryDate,
    });
    
    weightEntries.push(entry);
  }
  
  // Create active weight goal
  const weightGoal = await createTestWeightGoal(userId, {
    targetWeight: 75.0,
    goalType: 'gain',
    targetDate: new Date(baseDate.getTime() + (90 * 24 * 60 * 60 * 1000)), // 90 days from now
    isActive: true,
  });
  
  return {
    templates: [pushTemplate, pullTemplate, legTemplate],
    workouts,
    weightEntries,
    weightGoal,
  };
};

/**
 * Validate workout data structure
 */
export const validateWorkoutStructure = (workout) => {
  expect(workout).toHaveProperty('id');
  expect(workout).toHaveProperty('userId');
  expect(workout).toHaveProperty('title');
  expect(workout).toHaveProperty('date');
  expect(workout).toHaveProperty('createdAt');
  expect(workout).toHaveProperty('updatedAt');
  
  expect(typeof workout.id).toBe('number');
  expect(typeof workout.userId).toBe('number');
  expect(typeof workout.title).toBe('string');
  expect(new Date(workout.date)).toBeInstanceOf(Date);
};

/**
 * Validate exercise data structure
 */
export const validateExerciseStructure = (exercise) => {
  expect(exercise).toHaveProperty('id');
  expect(exercise).toHaveProperty('workoutId');
  expect(exercise).toHaveProperty('name');
  expect(exercise).toHaveProperty('setsData');
  expect(exercise).toHaveProperty('orderIndex');
  expect(exercise).toHaveProperty('createdAt');
  
  expect(typeof exercise.id).toBe('number');
  expect(typeof exercise.workoutId).toBe('number');
  expect(typeof exercise.name).toBe('string');
  expect(typeof exercise.orderIndex).toBe('number');
};

/**
 * Mock Prisma transaction for testing
 */
export const mockPrismaTransaction = (mockFn) => {
  const originalTransaction = prisma.$transaction;
  prisma.$transaction = mockFn;
  
  return () => {
    prisma.$transaction = originalTransaction;
  };
};

/**
 * Create test data for pagination testing
 */
export const createPaginationTestData = async (userId, count = 25) => {
  const items = [];
  
  for (let i = 0; i < count; i++) {
    const { workout } = await createCompleteTestWorkout(userId, {
      title: `Workout ${i + 1}`,
      date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
    });
    items.push(workout);
  }
  
  return items;
};