import { jest } from '@jest/globals';

/**
 * Test validation scenarios for API endpoints
 */
export const testValidationScenarios = (tester, method, validData, validationTests, options = {}) => {
  describe('Input Validation', () => {
    validationTests.forEach(({ field, values, expectedStatus = 400 }) => {
      values.forEach(({ value, description }) => {
        test(`should reject ${description} for ${field}`, async () => {
          const testData = { ...validData };
          
          if (value === undefined) {
            delete testData[field];
          } else {
            testData[field] = value;
          }
          
          // Call the appropriate method on the tester
          let response;
          if (method === 'post') {
            response = await tester.post(testData, options);
          } else if (method === 'get') {
            response = await tester.get({ ...options, searchParams: testData });
          } else if (method === 'put') {
            response = await tester.put(testData, options);
          } else if (method === 'patch') {
            response = await tester.patch(testData, options);
          } else if (method === 'delete') {
            response = await tester.delete({ ...options, searchParams: testData });
          } else {
            throw new Error(`Unsupported HTTP method: ${method}`);
          }
          
          expect(response.status).toBe(expectedStatus);
          expect(response.data).toHaveProperty('error');
        });
      });
    });
  });
};

/**
 * Common validation test cases
 */
export const VALIDATION_CASES = {
  required: [
    { value: undefined, description: 'missing value' },
    { value: null, description: 'null value' },
    { value: '', description: 'empty string' },
    { value: '   ', description: 'whitespace only' },
  ],
  
  string: [
    { value: 123, description: 'number instead of string' },
    { value: [], description: 'array instead of string' },
    { value: {}, description: 'object instead of string' },
    { value: true, description: 'boolean instead of string' },
  ],
  
  number: [
    { value: 'not-a-number', description: 'string instead of number' },
    { value: [], description: 'array instead of number' },
    { value: {}, description: 'object instead of number' },
    { value: null, description: 'null instead of number' },
  ],
  
  positiveNumber: [
    { value: 0, description: 'zero' },
    { value: -1, description: 'negative number' },
    { value: -10.5, description: 'negative decimal' },
  ],
  
  email: [
    { value: 'invalid-email', description: 'invalid email format' },
    { value: '@domain.com', description: 'missing username' },
    { value: 'user@', description: 'missing domain' },
    { value: 'user@domain', description: 'missing TLD' },
  ],
  
  date: [
    { value: 'invalid-date', description: 'invalid date string' },
    { value: '2024-13-01', description: 'invalid month' },
    { value: '2024-02-30', description: 'invalid day' },
    { value: 'not-a-date', description: 'non-date string' },
  ],
  
  array: [
    { value: 'not-array', description: 'string instead of array' },
    { value: 123, description: 'number instead of array' },
    { value: {}, description: 'object instead of array' },
    { value: null, description: 'null instead of array' },
  ],
  
  emptyArray: [
    { value: [], description: 'empty array' },
  ],
  
  object: [
    { value: 'not-object', description: 'string instead of object' },
    { value: 123, description: 'number instead of object' },
    { value: [], description: 'array instead of object' },
    { value: null, description: 'null instead of object' },
  ],
};

/**
 * Generate workout validation tests
 */
export const generateWorkoutValidationTests = () => [
  {
    field: 'title',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.string],
  },
  {
    field: 'date',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.date],
  },
  {
    field: 'duration',
    values: [...VALIDATION_CASES.number, ...VALIDATION_CASES.positiveNumber],
  },
];

/**
 * Generate exercise validation tests
 */
export const generateExerciseValidationTests = () => [
  {
    field: 'name',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.string],
  },
  {
    field: 'sets',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.array, ...VALIDATION_CASES.emptyArray],
  },
  {
    field: 'orderIndex',
    values: [...VALIDATION_CASES.number],
  },
];

/**
 * Generate weight entry validation tests
 */
export const generateWeightEntryValidationTests = () => [
  {
    field: 'weight',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.number, ...VALIDATION_CASES.positiveNumber],
  },
  {
    field: 'date',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.date],
  },
];

/**
 * Generate weight goal validation tests
 */
export const generateWeightGoalValidationTests = () => [
  {
    field: 'targetWeight',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.number, ...VALIDATION_CASES.positiveNumber],
  },
  {
    field: 'goalType',
    values: [
      ...VALIDATION_CASES.required,
      { value: 'invalid-type', description: 'invalid goal type' },
      { value: 'LOSE', description: 'uppercase goal type' },
      { value: 'Gain', description: 'mixed case goal type' },
    ],
  },
];

/**
 * Generate template validation tests
 */
export const generateTemplateValidationTests = () => [
  {
    field: 'name',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.string],
  },
];

/**
 * Generate user validation tests
 */
export const generateUserValidationTests = () => [
  {
    field: 'username',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.string],
  },
  {
    field: 'password',
    values: [
      ...VALIDATION_CASES.required,
      ...VALIDATION_CASES.string,
      { value: '12345', description: 'password too short' },
      { value: 'short', description: 'password under 6 characters' },
    ],
  },
  {
    field: 'name',
    values: [...VALIDATION_CASES.required, ...VALIDATION_CASES.string],
  },
];

/**
 * Validate response data structure
 */
export const validateResponseStructure = (data, expectedStructure) => {
  Object.entries(expectedStructure).forEach(([key, type]) => {
    expect(data).toHaveProperty(key);
    
    if (type === 'string') {
      expect(typeof data[key]).toBe('string');
    } else if (type === 'number') {
      expect(typeof data[key]).toBe('number');
    } else if (type === 'boolean') {
      expect(typeof data[key]).toBe('boolean');
    } else if (type === 'array') {
      expect(Array.isArray(data[key])).toBe(true);
    } else if (type === 'object') {
      expect(typeof data[key]).toBe('object');
      expect(data[key]).not.toBeNull();
    } else if (type === 'date') {
      expect(new Date(data[key])).toBeInstanceOf(Date);
      expect(new Date(data[key]).toString()).not.toBe('Invalid Date');
    }
  });
};

/**
 * Test boundary values for numeric fields
 */
export const testBoundaryValues = async (tester, method, field, boundaries) => {
  const { min, max, validValue } = boundaries;
  
  describe(`${field} boundary testing`, () => {
    if (min !== undefined) {
      test(`should reject values below minimum (${min})`, async () => {
        const data = { [field]: min - 1 };
        const response = await tester[method](data);
        expect(response.status).toBe(400);
      });
      
      test(`should accept minimum value (${min})`, async () => {
        const data = { [field]: min };
        const response = await tester[method](data);
        expect([200, 201]).toContain(response.status);
      });
    }
    
    if (max !== undefined) {
      test(`should reject values above maximum (${max})`, async () => {
        const data = { [field]: max + 1 };
        const response = await tester[method](data);
        expect(response.status).toBe(400);
      });
      
      test(`should accept maximum value (${max})`, async () => {
        const data = { [field]: max };
        const response = await tester[method](data);
        expect([200, 201]).toContain(response.status);
      });
    }
  });
};

/**
 * Create comprehensive test data sets
 */
export const createTestDataSets = () => ({
  validUser: {
    username: 'testuser',
    password: 'password123',
    name: 'Test User',
  },
  
  validWorkout: {
    title: 'Test Workout',
    date: new Date().toISOString(),
    duration: 60,
    notes: 'Test workout notes',
  },
  
  validExercise: {
    name: 'Test Exercise',
    sets: [
      { reps: 10, weight: 50 },
      { reps: 8, weight: 55 },
    ],
    restSeconds: 90,
    notes: 'Test exercise notes',
    orderIndex: 0,
  },
  
  validWeightEntry: {
    weight: 70.5,
    date: new Date().toISOString(),
  },
  
  validWeightGoal: {
    targetWeight: 75.0,
    goalType: 'gain',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  
  validTemplate: {
    name: 'Test Template',
    description: 'Test template description',
    isDefault: false,
    exercises: [
      {
        name: 'Exercise 1',
        defaultSets: 3,
        defaultReps: 10,
        defaultWeight: 50,
        orderIndex: 0,
      },
    ],
  },
});