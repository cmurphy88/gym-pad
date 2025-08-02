/**
 * Validates workout data
 * @param {Object} data - The workout data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateWorkout = (data) => {
  const errors = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }
  
  if (!data.date || !isValidDate(data.date)) {
    errors.push('Valid date is required');
  }
  
  if (data.duration !== undefined && (!Number.isInteger(data.duration) || data.duration <= 0)) {
    errors.push('Duration must be a positive integer');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Validates exercise data with new sets array format
 * @param {Object} data - The exercise data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateExercise = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Exercise name is required and must be a non-empty string');
  }
  
  // Validate sets array
  if (!data.sets || !Array.isArray(data.sets) || data.sets.length === 0) {
    errors.push('Sets must be a non-empty array');
  } else {
    // Validate each set in the array
    data.sets.forEach((set, index) => {
      if (!set || typeof set !== 'object') {
        errors.push(`Set ${index + 1} must be an object`);
        return;
      }
      
      if (!Number.isInteger(set.reps) || set.reps <= 0) {
        errors.push(`Set ${index + 1}: reps must be a positive integer`);
      }
      
      if (set.weight !== undefined && set.weight !== null && (typeof set.weight !== 'number' || set.weight < 0)) {
        errors.push(`Set ${index + 1}: weight must be a non-negative number`);
      }
      
      // Validate RPE if provided (optional field)
      if (set.rpe !== undefined && set.rpe !== null && (!Number.isInteger(set.rpe) || set.rpe < 1 || set.rpe > 10)) {
        errors.push(`Set ${index + 1}: RPE must be an integer between 1 and 10`);
      }
    });
  }
  
  if (data.orderIndex !== undefined && (!Number.isInteger(data.orderIndex) || data.orderIndex < 0)) {
    errors.push('Order index must be a non-negative integer');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Validates exercise template data
 * @param {Object} data - The exercise template data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateExerciseTemplate = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Exercise name is required and must be a non-empty string');
  }
  
  if (data.category && typeof data.category !== 'string') {
    errors.push('Category must be a string');
  }
  
  if (data.muscleGroups && typeof data.muscleGroups !== 'string') {
    errors.push('Muscle groups must be a JSON string');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Helper function to validate date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - true if valid date
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validates weight entry data
 * @param {Object} data - The weight entry data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateWeightEntry = (data) => {
  const errors = [];
  
  if (!data.weight || typeof data.weight !== 'number' || data.weight <= 0) {
    errors.push('Weight is required and must be a positive number');
  }
  
  if (data.weight && data.weight > 1000) {
    errors.push('Weight must be less than 1000 kg');
  }
  
  if (!data.date || !isValidDate(data.date)) {
    errors.push('Valid date is required');
  }
  
  // Check if date is not in the future
  const entryDate = new Date(data.date);
  const now = new Date();
  if (entryDate > now) {
    errors.push('Weight entry date cannot be in the future');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Validates weight goal data
 * @param {Object} data - The weight goal data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateWeightGoal = (data) => {
  const errors = [];
  
  if (!data.targetWeight || typeof data.targetWeight !== 'number' || data.targetWeight <= 0) {
    errors.push('Target weight is required and must be a positive number');
  }
  
  if (data.targetWeight && data.targetWeight > 1000) {
    errors.push('Target weight must be less than 1000 kg');
  }
  
  if (!data.goalType || !['lose', 'gain'].includes(data.goalType)) {
    errors.push('Goal type must be either "lose" or "gain"');
  }
  
  if (data.targetDate && !isValidDate(data.targetDate)) {
    errors.push('Target date must be a valid date');
  }
  
  // Check if target date is not in the past (allow today)
  if (data.targetDate) {
    const targetDate = new Date(data.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    if (targetDate < today) {
      errors.push('Target date cannot be in the past');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Sanitizes input by trimming whitespace
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim();
};