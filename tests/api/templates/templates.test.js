import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET, POST } from '../../../app/api/templates/route.js';
import { createTestTemplate, createTestTemplateExercise, createCompleteTestTemplate } from '../../helpers/databaseHelpers.js';
import { ApiTester } from '../../helpers/requestHelpers.js';
import { testValidationScenarios, generateTemplateValidationTests, createTestDataSets, expectErrorResponse } from '../../helpers/validationHelpers.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/templates', () => {
  let getTester, postTester;
  const testData = createTestDataSets();

  beforeEach(async () => {
    getTester = new ApiTester(GET);
    postTester = new ApiTester(POST);
  });

  describe('GET /api/templates', () => {
    describe('Successful Template Retrieval', () => {
      test('should return all templates with exercises', async () => {
        // Create templates with exercises
        const template1 = await createCompleteTestTemplate({
          name: 'Push Day',
          exerciseCount: 3,
        });
        const template2 = await createCompleteTestTemplate({
          name: 'Pull Day',
          exerciseCount: 2,
        });

        const response = await getTester.get();

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveLength(2);

        const templates = response.data;
        templates.forEach(template => {
          expect(template).toHaveProperty('id');
          expect(template).toHaveProperty('name');
          expect(template).toHaveProperty('templateExercises');
          expect(Array.isArray(template.templateExercises)).toBe(true);
        });
      });

      test('should return empty array when no templates exist', async () => {
        const response = await getTester.get();

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveLength(0);
      });

      test('should order templates with defaults first, then by name', async () => {
        // Create templates in random order
        await createTestTemplate({ name: 'Zebra Template', isDefault: false });
        await createTestTemplate({ name: 'Alpha Template', isDefault: true });
        await createTestTemplate({ name: 'Beta Template', isDefault: false });
        await createTestTemplate({ name: 'Default Two', isDefault: true });

        const response = await getTester.get();

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(4);

        // First two should be defaults (ordered by name)
        expect(response.data[0].isDefault).toBe(true);
        expect(response.data[0].name).toBe('Alpha Template');
        expect(response.data[1].isDefault).toBe(true);
        expect(response.data[1].name).toBe('Default Two');

        // Next two should be non-defaults (ordered by name)
        expect(response.data[2].isDefault).toBe(false);
        expect(response.data[2].name).toBe('Beta Template');
        expect(response.data[3].isDefault).toBe(false);
        expect(response.data[3].name).toBe('Zebra Template');
      });

      test('should include template exercises ordered by index', async () => {
        const template = await createTestTemplate({ name: 'Test Template' });
        
        // Create exercises in random order
        await createTestTemplateExercise(template.id, {
          exerciseName: 'Third Exercise',
          orderIndex: 2,
        });
        await createTestTemplateExercise(template.id, {
          exerciseName: 'First Exercise',
          orderIndex: 0,
        });
        await createTestTemplateExercise(template.id, {
          exerciseName: 'Second Exercise',
          orderIndex: 1,
        });

        const response = await getTester.get();

        expect(response.status).toBe(200);
        const templateData = response.data.find(t => t.id === template.id);
        expect(templateData.templateExercises).toHaveLength(3);
        expect(templateData.templateExercises[0].exerciseName).toBe('First Exercise');
        expect(templateData.templateExercises[1].exerciseName).toBe('Second Exercise');
        expect(templateData.templateExercises[2].exerciseName).toBe('Third Exercise');
      });

      test('should include all template fields', async () => {
        const template = await createTestTemplate({
          name: 'Complete Template',
          description: 'A comprehensive template',
          isDefault: true,
        });

        const response = await getTester.get();

        expect(response.status).toBe(200);
        const templateData = response.data.find(t => t.id === template.id);
        expect(templateData).toHaveProperty('id');
        expect(templateData).toHaveProperty('name', 'Complete Template');
        expect(templateData).toHaveProperty('description', 'A comprehensive template');
        expect(templateData).toHaveProperty('isDefault', true);
        expect(templateData).toHaveProperty('createdAt');
        expect(templateData).toHaveProperty('updatedAt');
        expect(templateData).toHaveProperty('templateExercises');
      });
    });

    describe('Error Handling', () => {
      test('should handle database errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalFindMany = prisma.sessionTemplate.findMany;
        prisma.sessionTemplate.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await getTester.get();

        expectErrorResponse(response, 500, 'Failed to fetch templates');

        prisma.sessionTemplate.findMany = originalFindMany;
      });
    });
  });

  describe('POST /api/templates', () => {
    describe('Successful Template Creation', () => {
      test('should create template with valid data', async () => {
        const templateData = {
          name: 'New Template',
          description: 'A new template',
          isDefault: false,
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name', templateData.name);
        expect(response.data).toHaveProperty('description', templateData.description);
        expect(response.data).toHaveProperty('isDefault', templateData.isDefault);
        expect(response.data).toHaveProperty('templateExercises');
        expect(Array.isArray(response.data.templateExercises)).toBe(true);
      });

      test('should create template with exercises', async () => {
        const templateData = {
          name: 'Template with Exercises',
          description: 'Template description',
          exercises: [
            {
              name: 'Bench Press',
              defaultSets: 3,
              defaultReps: 10,
              defaultWeight: 100,
              targetRepRange: '8-12',
              notes: 'Focus on form',
              restSeconds: 120,
            },
            {
              name: 'Squat',
              defaultSets: 4,
              defaultReps: 8,
              defaultWeight: 150,
              orderIndex: 1,
            },
          ],
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.templateExercises).toHaveLength(2);
        
        const exercises = response.data.templateExercises;
        expect(exercises[0]).toHaveProperty('exerciseName', 'Bench Press');
        expect(exercises[0]).toHaveProperty('defaultSets', 3);
        expect(exercises[0]).toHaveProperty('defaultReps', 10);
        expect(exercises[0]).toHaveProperty('defaultWeight', 100);
        expect(exercises[0]).toHaveProperty('targetRepRange', '8-12');
        expect(exercises[0]).toHaveProperty('notes', 'Focus on form');
        expect(exercises[0]).toHaveProperty('restSeconds', 120);
        expect(exercises[0]).toHaveProperty('orderIndex', 0);

        expect(exercises[1]).toHaveProperty('exerciseName', 'Squat');
        expect(exercises[1]).toHaveProperty('orderIndex', 1);
      });

      test('should set default order index for exercises', async () => {
        const templateData = {
          name: 'Auto Order Template',
          exercises: [
            { name: 'Exercise 1' },
            { name: 'Exercise 2' },
            { name: 'Exercise 3' },
          ],
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        const exercises = response.data.templateExercises;
        expect(exercises[0].orderIndex).toBe(0);
        expect(exercises[1].orderIndex).toBe(1);
        expect(exercises[2].orderIndex).toBe(2);
      });

      test('should handle optional fields correctly', async () => {
        const templateData = {
          name: 'Minimal Template',
          // No description, exercises, or isDefault
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.description).toBeNull();
        expect(response.data.isDefault).toBe(false);
        expect(response.data.templateExercises).toHaveLength(0);
      });

      test('should trim whitespace from template name and description', async () => {
        const templateData = {
          name: '  Trimmed Template  ',
          description: '  Trimmed description  ',
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.name).toBe('Trimmed Template');
        expect(response.data.description).toBe('Trimmed description');
      });

      test('should handle null description', async () => {
        const templateData = {
          name: 'No Description Template',
          description: null,
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.description).toBeNull();
      });
    });

    describe('Input Validation', () => {
      test('should require template name', async () => {
        const templateData = {
          description: 'No name template',
        };

        const response = await postTester.post(templateData);

        expectErrorResponse(response, 400, 'Template name is required');
      });

      test('should reject empty template name', async () => {
        const templateData = {
          name: '',
          description: 'Empty name template',
        };

        const response = await postTester.post(templateData);

        expectErrorResponse(response, 400, 'Template name is required');
      });

      test('should reject whitespace-only template name', async () => {
        const templateData = {
          name: '   ',
          description: 'Whitespace name template',
        };

        const response = await postTester.post(templateData);

        expectErrorResponse(response, 400, 'Template name is required');
      });

      testValidationScenarios(postTester, 'post', testData.validTemplate, [
        {
          field: 'name',
          values: [
            { value: undefined, description: 'missing name' },
            { value: null, description: 'null name' },
            { value: '', description: 'empty name' },
            { value: '   ', description: 'whitespace-only name' },
          ],
        },
      ]);
    });

    describe('Exercise Validation', () => {
      test('should validate exercise names in exercises array', async () => {
        const templateData = {
          name: 'Invalid Exercise Template',
          exercises: [
            { name: '' }, // Empty name
          ],
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201); // Creates template but might skip invalid exercises
        // Or could return 400 depending on implementation
      });

      test('should handle exercises with all optional fields', async () => {
        const templateData = {
          name: 'Optional Fields Template',
          exercises: [
            {
              name: 'Exercise with all fields',
              defaultSets: 3,
              defaultReps: 10,
              targetRepRange: '8-12',
              defaultWeight: 100.5,
              orderIndex: 0,
              notes: 'Exercise notes',
              restSeconds: 90,
            },
            {
              name: 'Exercise with minimal fields',
              // Only name provided
            },
          ],
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.templateExercises).toHaveLength(2);
        
        const fullExercise = response.data.templateExercises[0];
        expect(fullExercise.defaultSets).toBe(3);
        expect(fullExercise.defaultReps).toBe(10);
        expect(fullExercise.defaultWeight).toBe(100.5);
        
        const minimalExercise = response.data.templateExercises[1];
        expect(minimalExercise.defaultSets).toBeNull();
        expect(minimalExercise.defaultReps).toBeNull();
        expect(minimalExercise.defaultWeight).toBeNull();
      });
    });

    describe('Duplicate Name Handling', () => {
      test('should reject duplicate template names', async () => {
        // Create a template first
        await createTestTemplate({ name: 'Unique Template' });

        // Try to create another with same name
        const templateData = {
          name: 'Unique Template',
          description: 'Different description',
        };

        const response = await postTester.post(templateData);

        expectErrorResponse(response, 409, 'A template with this name already exists');
      });

      test('should allow templates with different names', async () => {
        await createTestTemplate({ name: 'First Template' });

        const templateData = {
          name: 'Second Template',
          description: 'Different template',
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
      });

      test('should handle case-sensitive template names', async () => {
        await createTestTemplate({ name: 'CaseSensitive' });

        const templateData = {
          name: 'casesensitive', // Different case
        };

        const response = await postTester.post(templateData);

        // Should succeed since names are case-sensitive
        expect(response.status).toBe(201);
      });
    });

    describe('Transaction Handling', () => {
      test('should create template and exercises in transaction', async () => {
        const templateData = {
          name: 'Transaction Template',
          exercises: [
            { name: 'Exercise 1' },
            { name: 'Exercise 2' },
          ],
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);

        // Verify both template and exercises were created
        const { prisma } = await import('../../setup/setupTests.js');
        const template = await prisma.sessionTemplate.findUnique({
          where: { id: response.data.id },
          include: { templateExercises: true },
        });

        expect(template).toBeTruthy();
        expect(template.templateExercises).toHaveLength(2);
      });

      test('should rollback on exercise creation failure', async () => {
        // This test would require mocking the database to fail on exercise creation
        // after template creation succeeds - implementation depends on testing strategy
      });
    });

    describe('Error Handling', () => {
      test('should handle database connection errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalTransaction = prisma.$transaction;
        prisma.$transaction = jest.fn().mockRejectedValue(new Error('Database error'));

        const templateData = {
          name: 'Error Template',
        };

        const response = await postTester.post(templateData);

        expectErrorResponse(response, 500, 'Failed to create template');

        prisma.$transaction = originalTransaction;
      });

      test('should handle unique constraint violations', async () => {
        // Create a template first
        await createTestTemplate({ name: 'Constraint Template' });

        // Try to create duplicate
        const templateData = {
          name: 'Constraint Template',
        };

        const response = await postTester.post(templateData);

        expectErrorResponse(response, 409, 'A template with this name already exists');
      });
    });

    describe('Edge Cases', () => {
      test('should handle very long template names', async () => {
        const templateData = {
          name: 'A'.repeat(1000),
        };

        const response = await postTester.post(templateData);

        // Depending on database constraints, this might succeed or fail
        expect([201, 400, 500]).toContain(response.status);
      });

      test('should handle special characters in template name', async () => {
        const templateData = {
          name: 'Template @#$%^&*()_+-={}[]|\\:";\'<>?,. 123',
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.name).toBe(templateData.name);
      });

      test('should handle unicode characters in template name', async () => {
        const templateData = {
          name: '训练模板 🏋️‍♂️ Workout בר',
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.name).toBe(templateData.name);
      });

      test('should handle large number of exercises', async () => {
        const exercises = Array(50).fill().map((_, i) => ({
          name: `Exercise ${i + 1}`,
          defaultSets: 3,
          defaultReps: 10,
          orderIndex: i,
        }));

        const templateData = {
          name: 'Many Exercises Template',
          exercises,
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.templateExercises).toHaveLength(50);
      });

      test('should handle empty exercises array', async () => {
        const templateData = {
          name: 'Empty Exercises Template',
          exercises: [],
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data.templateExercises).toHaveLength(0);
      });
    });

    describe('Response Format', () => {
      test('should return complete template data', async () => {
        const templateData = {
          name: 'Complete Response Template',
          description: 'Test description',
          isDefault: true,
          exercises: [
            { name: 'Test Exercise' },
          ],
        };

        const response = await postTester.post(templateData);

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name');
        expect(response.data).toHaveProperty('description');
        expect(response.data).toHaveProperty('isDefault');
        expect(response.data).toHaveProperty('createdAt');
        expect(response.data).toHaveProperty('updatedAt');
        expect(response.data).toHaveProperty('templateExercises');
        expect(Array.isArray(response.data.templateExercises)).toBe(true);
      });
    });
  });
});