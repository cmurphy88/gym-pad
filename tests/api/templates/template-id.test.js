import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { GET, PUT, DELETE } from '../../../app/api/templates/[id]/route.js';
import { createTestTemplate, createTestTemplateExercise, createCompleteTestTemplate } from '../../helpers/databaseHelpers.js';
import { ApiTester } from '../../helpers/requestHelpers.js';
import { expectErrorResponse, createTestDataSets } from '../../helpers/validationHelpers.js';

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
    })),
  },
}));

describe('/api/templates/[id]', () => {
  let getTester, putTester, deleteTester;
  let testTemplate;
  const testData = createTestDataSets();

  beforeEach(async () => {
    getTester = new ApiTester(GET);
    putTester = new ApiTester(PUT);
    deleteTester = new ApiTester(DELETE);
    
    const { template } = await createCompleteTestTemplate({
      name: 'Test Template',
      exerciseCount: 2,
    });
    testTemplate = template;
  });

  describe('GET /api/templates/[id]', () => {
    describe('Successful Template Retrieval', () => {
      test('should return template by ID with exercises', async () => {
        const response = await getTester.get({
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', testTemplate.id);
        expect(response.data).toHaveProperty('name', testTemplate.name);
        expect(response.data).toHaveProperty('templateExercises');
        expect(Array.isArray(response.data.templateExercises)).toBe(true);
        expect(response.data.templateExercises).toHaveLength(2);
      });

      test('should return exercises ordered by orderIndex', async () => {
        // Create template with exercises in specific order
        const template = await createTestTemplate({ name: 'Ordered Template' });
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

        const response = await getTester.get({
          params: { id: template.id.toString() },
        });

        expect(response.status).toBe(200);
        const exercises = response.data.templateExercises;
        expect(exercises[0].exerciseName).toBe('First Exercise');
        expect(exercises[1].exerciseName).toBe('Second Exercise');
        expect(exercises[2].exerciseName).toBe('Third Exercise');
      });

      test('should include all template fields', async () => {
        const template = await createTestTemplate({
          name: 'Complete Template',
          description: 'Complete description',
          isDefault: true,
        });

        const response = await getTester.get({
          params: { id: template.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name', 'Complete Template');
        expect(response.data).toHaveProperty('description', 'Complete description');
        expect(response.data).toHaveProperty('isDefault', true);
        expect(response.data).toHaveProperty('createdAt');
        expect(response.data).toHaveProperty('updatedAt');
      });
    });

    describe('Error Cases', () => {
      test('should return 404 for non-existent template', async () => {
        const response = await getTester.get({
          params: { id: '99999' },
        });

        expectErrorResponse(response, 404, 'Template not found');
      });

      test('should return 400 for invalid template ID', async () => {
        const response = await getTester.get({
          params: { id: 'invalid-id' },
        });

        expectErrorResponse(response, 400, 'Invalid template ID');
      });

      test('should handle database errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalFindUnique = prisma.sessionTemplate.findUnique;
        prisma.sessionTemplate.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await getTester.get({
          params: { id: testTemplate.id.toString() },
        });

        expectErrorResponse(response, 500, 'Failed to fetch template');

        prisma.sessionTemplate.findUnique = originalFindUnique;
      });
    });
  });

  describe('PUT /api/templates/[id]', () => {
    describe('Successful Template Updates', () => {
      test('should update template with valid data', async () => {
        const updateData = {
          name: 'Updated Template Name',
          description: 'Updated description',
          isDefault: true,
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('name', updateData.name);
        expect(response.data).toHaveProperty('description', updateData.description);
        expect(response.data).toHaveProperty('isDefault', updateData.isDefault);
      });

      test('should update template with new exercises', async () => {
        const updateData = {
          name: 'Updated Template',
          exercises: [
            {
              name: 'New Exercise 1',
              defaultSets: 4,
              defaultReps: 8,
              defaultWeight: 120,
            },
            {
              name: 'New Exercise 2',
              defaultSets: 3,
              defaultReps: 12,
              orderIndex: 1,
            },
          ],
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data.templateExercises).toHaveLength(2);
        expect(response.data.templateExercises[0].exerciseName).toBe('New Exercise 1');
        expect(response.data.templateExercises[1].exerciseName).toBe('New Exercise 2');
      });

      test('should replace all exercises when updating', async () => {
        // Template starts with 2 exercises, update to 1
        const updateData = {
          name: testTemplate.name,
          exercises: [
            { name: 'Only Exercise' },
          ],
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data.templateExercises).toHaveLength(1);
        expect(response.data.templateExercises[0].exerciseName).toBe('Only Exercise');
      });

      test('should handle removing all exercises', async () => {
        const updateData = {
          name: testTemplate.name,
          exercises: [],
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data.templateExercises).toHaveLength(0);
      });

      test('should handle update without exercises field', async () => {
        // When exercises field is not provided, existing exercises should remain
        const updateData = {
          name: 'Updated Name Only',
          description: 'Updated description only',
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data.name).toBe('Updated Name Only');
        // Should still have original exercises since exercises field was not provided
        expect(response.data.templateExercises).toHaveLength(2);
      });

      test('should trim whitespace from fields', async () => {
        const updateData = {
          name: '  Trimmed Name  ',
          description: '  Trimmed Description  ',
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data.name).toBe('Trimmed Name');
        expect(response.data.description).toBe('Trimmed Description');
      });
    });

    describe('Validation Errors', () => {
      test('should require template name', async () => {
        const updateData = {
          description: 'No name provided',
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expectErrorResponse(response, 400, 'Template name is required');
      });

      test('should reject empty template name', async () => {
        const updateData = {
          name: '',
          description: 'Empty name',
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expectErrorResponse(response, 400, 'Template name is required');
      });

      test('should reject invalid template ID', async () => {
        const updateData = {
          name: 'Valid Name',
        };

        const response = await putTester.put(updateData, {
          params: { id: 'invalid-id' },
        });

        expectErrorResponse(response, 400, 'Invalid template ID');
      });
    });

    describe('Error Cases', () => {
      test('should return 404 for non-existent template', async () => {
        const updateData = {
          name: 'Updated Name',
        };

        const response = await putTester.put(updateData, {
          params: { id: '99999' },
        });

        expectErrorResponse(response, 404, 'Template not found');
      });

      test('should handle duplicate name conflicts', async () => {
        // Create another template
        const otherTemplate = await createTestTemplate({ name: 'Other Template' });

        // Try to update our template to have the same name
        const updateData = {
          name: 'Other Template',
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expectErrorResponse(response, 409, 'A template with this name already exists');
      });

      test('should handle database errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalTransaction = prisma.$transaction;
        prisma.$transaction = jest.fn().mockRejectedValue(new Error('Database error'));

        const updateData = {
          name: 'Updated Name',
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expectErrorResponse(response, 500, 'Failed to update template');

        prisma.$transaction = originalTransaction;
      });
    });

    describe('Transaction Handling', () => {
      test('should update template and exercises in transaction', async () => {
        const updateData = {
          name: 'Transaction Update',
          exercises: [
            { name: 'New Exercise 1' },
            { name: 'New Exercise 2' },
            { name: 'New Exercise 3' },
          ],
        };

        const response = await putTester.put(updateData, {
          params: { id: testTemplate.id.toString() },
        });

        expect(response.status).toBe(200);

        // Verify the update was completed
        const { prisma } = await import('../../setup/setupTests.js');
        const template = await prisma.sessionTemplate.findUnique({
          where: { id: testTemplate.id },
          include: { templateExercises: true },
        });

        expect(template.name).toBe('Transaction Update');
        expect(template.templateExercises).toHaveLength(3);
      });
    });
  });

  describe('DELETE /api/templates/[id]', () => {
    describe('Successful Template Deletion', () => {
      test('should delete non-default template', async () => {
        // Create a non-default template
        const nonDefaultTemplate = await createTestTemplate({
          name: 'Non-Default Template',
          isDefault: false,
        });

        const response = await deleteTester.delete({
          params: { id: nonDefaultTemplate.id.toString() },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message', 'Template deleted successfully');

        // Verify template was deleted
        const { prisma } = await import('../../setup/setupTests.js');
        const deletedTemplate = await prisma.sessionTemplate.findUnique({
          where: { id: nonDefaultTemplate.id },
        });
        expect(deletedTemplate).toBeNull();
      });

      test('should cascade delete template exercises', async () => {
        const { template } = await createCompleteTestTemplate({
          name: 'Template to Delete',
          exerciseCount: 3,
        });

        const response = await deleteTester.delete({
          params: { id: template.id.toString() },
        });

        expect(response.status).toBe(200);

        // Verify exercises were also deleted
        const { prisma } = await import('../../setup/setupTests.js');
        const exercises = await prisma.templateExercise.findMany({
          where: { templateId: template.id },
        });
        expect(exercises).toHaveLength(0);
      });
    });

    describe('Protection of Default Templates', () => {
      test('should prevent deletion of default templates', async () => {
        // Create a default template
        const defaultTemplate = await createTestTemplate({
          name: 'Default Template',
          isDefault: true,
        });

        const response = await deleteTester.delete({
          params: { id: defaultTemplate.id.toString() },
        });

        expectErrorResponse(response, 403, 'Cannot delete default templates');

        // Verify template still exists
        const { prisma } = await import('../../setup/setupTests.js');
        const stillExists = await prisma.sessionTemplate.findUnique({
          where: { id: defaultTemplate.id },
        });
        expect(stillExists).toBeTruthy();
      });
    });

    describe('Error Cases', () => {
      test('should return 404 for non-existent template', async () => {
        const response = await deleteTester.delete({
          params: { id: '99999' },
        });

        expectErrorResponse(response, 404, 'Template not found');
      });

      test('should return 400 for invalid template ID', async () => {
        const response = await deleteTester.delete({
          params: { id: 'invalid-id' },
        });

        expectErrorResponse(response, 400, 'Invalid template ID');
      });

      test('should handle database errors', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalFindUnique = prisma.sessionTemplate.findUnique;
        prisma.sessionTemplate.findUnique = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await deleteTester.delete({
          params: { id: testTemplate.id.toString() },
        });

        expectErrorResponse(response, 500, 'Failed to delete template');

        prisma.sessionTemplate.findUnique = originalFindUnique;
      });

      test('should handle deletion conflicts', async () => {
        const { prisma } = await import('../../setup/setupTests.js');
        const originalDelete = prisma.sessionTemplate.delete;
        prisma.sessionTemplate.delete = jest.fn().mockRejectedValue({
          code: 'P2025', // Record not found
        });

        const response = await deleteTester.delete({
          params: { id: testTemplate.id.toString() },
        });

        expectErrorResponse(response, 404, 'Template not found');

        prisma.sessionTemplate.delete = originalDelete;
      });
    });

    describe('Edge Cases', () => {
      test('should handle deletion of template with many exercises', async () => {
        const { template } = await createCompleteTestTemplate({
          name: 'Many Exercises Template',
          exerciseCount: 50,
        });

        const response = await deleteTester.delete({
          params: { id: template.id.toString() },
        });

        expect(response.status).toBe(200);

        // Verify all exercises were deleted
        const { prisma } = await import('../../setup/setupTests.js');
        const exercises = await prisma.templateExercise.findMany({
          where: { templateId: template.id },
        });
        expect(exercises).toHaveLength(0);
      });
    });
  });

  describe('HTTP Methods', () => {
    test('should handle unsupported HTTP methods', async () => {
      // Test PATCH method (not implemented)
      try {
        const response = await new ApiTester(GET).patch({}, {
          params: { id: testTemplate.id.toString() },
        });
        expect([405, 404, 500]).toContain(response.status);
      } catch (error) {
        expect(error.message).toContain('not a function');
      }
    });
  });

  describe('Response Format Consistency', () => {
    test('should return consistent response format for GET', async () => {
      const response = await getTester.get({
        params: { id: testTemplate.id.toString() },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('templateExercises');
      expect(Array.isArray(response.data.templateExercises)).toBe(true);
    });

    test('should return consistent response format for PUT', async () => {
      const updateData = {
        name: 'Consistent Response Template',
      };

      const response = await putTester.put(updateData, {
        params: { id: testTemplate.id.toString() },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('templateExercises');
      expect(Array.isArray(response.data.templateExercises)).toBe(true);
    });

    test('should return consistent response format for DELETE', async () => {
      const response = await deleteTester.delete({
        params: { id: testTemplate.id.toString() },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(typeof response.data.message).toBe('string');
    });
  });
});