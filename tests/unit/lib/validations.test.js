import { describe, it, expect } from 'vitest';
import { 
  validateWorkout, 
  validateExercise, 
  validateWeightEntry,
  validateWeightGoal,
  sanitizeInput
} from '@/lib/validations';

describe('Validation Functions', () => {
  describe('validateWorkout', () => {
    it('should validate correct workout data', () => {
      const validWorkout = {
        title: 'Test Workout',
        date: '2025-01-01T10:00:00Z',
        duration: 3600
      };

      const result = validateWorkout(validWorkout);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject workout with missing title', () => {
      const invalidWorkout = {
        date: '2025-01-01T10:00:00Z',
        duration: 3600
      };

      const result = validateWorkout(invalidWorkout);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a non-empty string');
    });

    it('should reject workout with empty title', () => {
      const invalidWorkout = {
        title: '   ',
        date: '2025-01-01T10:00:00Z',
        duration: 3600
      };

      const result = validateWorkout(invalidWorkout);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a non-empty string');
    });

    it('should reject workout with invalid date', () => {
      const invalidWorkout = {
        title: 'Test Workout',
        date: 'not-a-date',
        duration: 3600
      };

      const result = validateWorkout(invalidWorkout);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid date is required');
    });

    it('should reject workout with negative duration', () => {
      const invalidWorkout = {
        title: 'Test Workout',
        date: '2025-01-01T10:00:00Z',
        duration: -100
      };

      const result = validateWorkout(invalidWorkout);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration must be a positive integer');
    });

    it('should allow workout without duration (optional field)', () => {
      const validWorkout = {
        title: 'Test Workout',
        date: '2025-01-01T10:00:00Z'
      };

      const result = validateWorkout(validWorkout);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateExercise', () => {
    it('should validate correct exercise data', () => {
      const validExercise = {
        name: 'Bench Press',
        sets: [
          { reps: 10, weight: 135 },
          { reps: 8, weight: 140 }
        ]
      };

      const result = validateExercise(validExercise);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject exercise with missing name', () => {
      const invalidExercise = {
        sets: [{ reps: 10, weight: 135 }]
      };

      const result = validateExercise(invalidExercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Exercise name is required and must be a non-empty string');
    });

    it('should reject exercise with empty sets array', () => {
      const invalidExercise = {
        name: 'Bench Press',
        sets: []
      };

      const result = validateExercise(invalidExercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sets must be a non-empty array');
    });

    it('should reject exercise with invalid reps', () => {
      const invalidExercise = {
        name: 'Bench Press',
        sets: [{ reps: -5, weight: 135 }]
      };

      const result = validateExercise(invalidExercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Set 1: reps must be a positive integer');
    });

    it('should reject exercise with invalid weight', () => {
      const invalidExercise = {
        name: 'Bench Press',
        sets: [{ reps: 10, weight: 'invalid' }]
      };

      const result = validateExercise(invalidExercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Set 1: weight must be a non-negative number');
    });

    it('should allow exercise with null weight (bodyweight)', () => {
      const validExercise = {
        name: 'Push-ups',
        sets: [{ reps: 20, weight: null }]
      };

      const result = validateExercise(validExercise);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate RPE if provided', () => {
      const exerciseWithValidRPE = {
        name: 'Bench Press',
        sets: [{ reps: 10, weight: 135, rpe: 8 }]
      };

      const result = validateExercise(exerciseWithValidRPE);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid RPE values', () => {
      const exerciseWithInvalidRPE = {
        name: 'Bench Press',
        sets: [{ reps: 10, weight: 135, rpe: 15 }]
      };

      const result = validateExercise(exerciseWithInvalidRPE);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Set 1: RPE must be an integer between 1 and 10');
    });
  });

  describe('validateWeightEntry', () => {
    it('should validate correct weight entry', () => {
      const validEntry = {
        weight: 180.5,
        date: '2025-01-01T10:00:00Z'
      };

      const result = validateWeightEntry(validEntry);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weight entry with negative weight', () => {
      const invalidEntry = {
        weight: -5,
        date: '2025-01-01T10:00:00Z'
      };

      const result = validateWeightEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight is required and must be a positive number');
    });

    it('should reject weight entry with excessive weight', () => {
      const invalidEntry = {
        weight: 1500,
        date: '2025-01-01T10:00:00Z'
      };

      const result = validateWeightEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be less than 1000 kg');
    });
  });

  describe('validateWeightGoal', () => {
    it('should validate correct weight goal', () => {
      // Use a date that's definitely in the future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const validGoal = {
        targetWeight: 175,
        goalType: 'lose',
        targetDate: futureDate.toISOString()
      };

      const result = validateWeightGoal(validGoal);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid goal type', () => {
      const invalidGoal = {
        targetWeight: 175,
        goalType: 'invalid',
        targetDate: '2025-06-01T00:00:00Z'
      };

      const result = validateWeightGoal(invalidGoal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Goal type must be either "lose" or "gain"');
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace from strings', () => {
      const input = '  test string  ';
      const result = sanitizeInput(input);
      
      expect(result).toBe('test string');
    });

    it('should return non-string inputs unchanged', () => {
      const number = 123;
      const result = sanitizeInput(number);
      
      expect(result).toBe(123);
    });

    it('should handle empty strings', () => {
      const input = '   ';
      const result = sanitizeInput(input);
      
      expect(result).toBe('');
    });
  });
});