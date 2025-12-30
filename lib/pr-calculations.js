/**
 * PR (Personal Record) Calculation Utilities
 *
 * Provides functions for calculating and detecting Personal Records from exercise history.
 * PRs are calculated on-the-fly from existing data - no database storage required.
 */

/**
 * Calculate Estimated 1RM using Epley formula
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of reps performed
 * @returns {number} Estimated 1RM (rounded to 1 decimal)
 */
export function calculateE1RM(weight, reps) {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula: weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Rep counts that we track for rep max PRs
 */
export const TRACKED_REP_COUNTS = [1, 3, 5, 8, 10];

/**
 * Calculate all PRs from exercise history
 * @param {Array} history - Exercise history from /api/exercises/history/[name]
 * @returns {Object} PR data with e1rm, repMaxes, volumePR
 */
export function calculatePRsFromHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      e1rm: null,
      repMaxes: {},
      volumePR: null,
      hasData: false
    };
  }

  let bestE1RM = { value: 0, date: null, weight: 0, reps: 0 };
  const repMaxes = {}; // { 1: { weight, date }, 3: {...}, ... }
  let bestVolume = { value: 0, date: null, weight: 0, reps: 0 };

  history.forEach(entry => {
    const { date, sets } = entry;
    if (!Array.isArray(sets)) return;

    sets.forEach(set => {
      const { weight, reps } = set;
      if (!weight || !reps || weight <= 0 || reps <= 0) return;

      // Track e1RM
      const e1rm = calculateE1RM(weight, reps);
      if (e1rm > bestE1RM.value) {
        bestE1RM = { value: e1rm, date, weight, reps };
      }

      // Track rep maxes for specific rep counts
      TRACKED_REP_COUNTS.forEach(targetReps => {
        if (reps === targetReps) {
          if (!repMaxes[targetReps] || weight > repMaxes[targetReps].weight) {
            repMaxes[targetReps] = { weight, date };
          }
        }
      });

      // Track volume PR (single set)
      const volume = weight * reps;
      if (volume > bestVolume.value) {
        bestVolume = { value: volume, date, weight, reps };
      }
    });
  });

  return {
    e1rm: bestE1RM.value > 0 ? bestE1RM : null,
    repMaxes,
    volumePR: bestVolume.value > 0 ? bestVolume : null,
    hasData: true
  };
}

/**
 * Check if a set is a PR compared to existing PRs
 * @param {Object} set - Current set { weight, reps }
 * @param {Object} existingPRs - Existing PRs from calculatePRsFromHistory
 * @returns {Object} { isE1RMPR, isRepMaxPR, isVolumePR, repMaxType }
 */
export function checkSetForPRs(set, existingPRs) {
  const { weight, reps } = set;

  if (!weight || !reps || weight <= 0 || reps <= 0) {
    return { isE1RMPR: false, isRepMaxPR: false, isVolumePR: false, repMaxType: null };
  }

  // No existing PRs means this is the first data
  if (!existingPRs || !existingPRs.hasData) {
    return {
      isE1RMPR: true,
      isRepMaxPR: TRACKED_REP_COUNTS.includes(reps),
      isVolumePR: true,
      repMaxType: TRACKED_REP_COUNTS.includes(reps) ? reps : null
    };
  }

  const setE1RM = calculateE1RM(weight, reps);
  const setVolume = weight * reps;

  // Check e1RM PR
  const isE1RMPR = existingPRs.e1rm ? setE1RM > existingPRs.e1rm.value : true;

  // Check rep max PR (only for tracked rep counts)
  let isRepMaxPR = false;
  let repMaxType = null;
  if (TRACKED_REP_COUNTS.includes(reps)) {
    const existingRepMax = existingPRs.repMaxes?.[reps];
    if (!existingRepMax || weight > existingRepMax.weight) {
      isRepMaxPR = true;
      repMaxType = reps;
    }
  }

  // Check volume PR
  const isVolumePR = existingPRs.volumePR ? setVolume > existingPRs.volumePR.value : true;

  return { isE1RMPR, isRepMaxPR, isVolumePR, repMaxType };
}

/**
 * Detect new PRs in a workout compared to previous history
 * @param {Array} workoutExercises - Exercises from the new workout
 * @param {Object} exerciseHistories - Map of exercise name to history array
 * @returns {Array} Array of new PRs { exerciseName, prType, value, previousValue, weight, reps }
 */
export function detectNewPRs(workoutExercises, exerciseHistories) {
  const newPRs = [];

  workoutExercises.forEach(exercise => {
    const history = exerciseHistories[exercise.name];
    const sets = exercise.sets || [];

    if (!history || history.length === 0) {
      // First time doing this exercise - mark best set as "first" PR
      let bestSet = null;
      let bestE1RM = 0;

      sets.forEach(set => {
        if (set.weight && set.reps) {
          const e1rm = calculateE1RM(set.weight, set.reps);
          if (e1rm > bestE1RM) {
            bestE1RM = e1rm;
            bestSet = set;
          }
        }
      });

      if (bestSet) {
        newPRs.push({
          exerciseName: exercise.name,
          prType: 'first',
          weight: bestSet.weight,
          reps: bestSet.reps,
          e1rm: calculateE1RM(bestSet.weight, bestSet.reps),
          previousValue: 0
        });
      }
      return;
    }

    const existingPRs = calculatePRsFromHistory(history);

    // Track the best new PR for each type to avoid duplicates
    let bestNewE1RM = null;
    const bestNewRepMaxes = {}; // { 5: { weight, reps, value, previousValue }, ... }
    let bestNewVolume = null;

    sets.forEach(set => {
      if (!set.weight || !set.reps) return;

      const prCheck = checkSetForPRs(set, existingPRs);

      // Track best e1RM PR
      if (prCheck.isE1RMPR) {
        const e1rm = calculateE1RM(set.weight, set.reps);
        if (!bestNewE1RM || e1rm > bestNewE1RM.value) {
          bestNewE1RM = {
            value: e1rm,
            previousValue: existingPRs.e1rm?.value || 0,
            weight: set.weight,
            reps: set.reps
          };
        }
      }

      // Track best rep max PRs
      if (prCheck.isRepMaxPR && prCheck.repMaxType) {
        const repCount = prCheck.repMaxType;
        if (!bestNewRepMaxes[repCount] || set.weight > bestNewRepMaxes[repCount].weight) {
          bestNewRepMaxes[repCount] = {
            weight: set.weight,
            reps: set.reps,
            value: set.weight,
            previousValue: existingPRs.repMaxes?.[repCount]?.weight || 0
          };
        }
      }

      // Track best volume PR
      if (prCheck.isVolumePR) {
        const volume = set.weight * set.reps;
        if (!bestNewVolume || volume > bestNewVolume.value) {
          bestNewVolume = {
            value: volume,
            previousValue: existingPRs.volumePR?.value || 0,
            weight: set.weight,
            reps: set.reps
          };
        }
      }
    });

    // Add e1RM PR (most important)
    if (bestNewE1RM) {
      newPRs.push({
        exerciseName: exercise.name,
        prType: 'e1rm',
        value: bestNewE1RM.value,
        previousValue: bestNewE1RM.previousValue,
        weight: bestNewE1RM.weight,
        reps: bestNewE1RM.reps
      });
    }

    // Add rep max PRs
    Object.entries(bestNewRepMaxes).forEach(([repCount, data]) => {
      newPRs.push({
        exerciseName: exercise.name,
        prType: `${repCount}rm`,
        value: data.value,
        previousValue: data.previousValue,
        weight: data.weight,
        reps: parseInt(repCount)
      });
    });

    // Add volume PR
    if (bestNewVolume) {
      newPRs.push({
        exerciseName: exercise.name,
        prType: 'volume',
        value: bestNewVolume.value,
        previousValue: bestNewVolume.previousValue,
        weight: bestNewVolume.weight,
        reps: bestNewVolume.reps
      });
    }
  });

  return newPRs;
}

/**
 * Check if a history entry contains any PR sets
 * @param {Object} entry - History entry with date and sets
 * @param {Object} allPRs - All PRs from calculatePRsFromHistory
 * @returns {Object} { hasPR, prTypes } - PR info for the entry
 */
export function getEntryPRInfo(entry, allPRs) {
  if (!entry || !entry.sets || !allPRs) {
    return { hasPR: false, prTypes: [] };
  }

  const prTypes = [];
  const { date, sets } = entry;

  sets.forEach(set => {
    if (!set.weight || !set.reps) return;

    // Check if this set matches the e1RM PR
    if (allPRs.e1rm && allPRs.e1rm.date === date) {
      const e1rm = calculateE1RM(set.weight, set.reps);
      if (e1rm === allPRs.e1rm.value && !prTypes.includes('e1rm')) {
        prTypes.push('e1rm');
      }
    }

    // Check rep maxes
    TRACKED_REP_COUNTS.forEach(repCount => {
      const repMax = allPRs.repMaxes?.[repCount];
      if (repMax && repMax.date === date && set.reps === repCount && set.weight === repMax.weight) {
        const prType = `${repCount}rm`;
        if (!prTypes.includes(prType)) {
          prTypes.push(prType);
        }
      }
    });

    // Check volume PR
    if (allPRs.volumePR && allPRs.volumePR.date === date) {
      const volume = set.weight * set.reps;
      if (volume === allPRs.volumePR.value && !prTypes.includes('volume')) {
        prTypes.push('volume');
      }
    }
  });

  return { hasPR: prTypes.length > 0, prTypes };
}

/**
 * Format PR value for display
 * @param {string} prType - Type of PR (e1rm, 5rm, volume, etc.)
 * @param {number} value - PR value
 * @returns {string} Formatted string
 */
export function formatPRValue(prType, value) {
  if (prType === 'volume') {
    return `${value.toLocaleString()} kg`;
  }
  return `${value} kg`;
}

/**
 * Get display label for PR type
 * @param {string} prType - Type of PR
 * @returns {string} Human-readable label
 */
export function getPRTypeLabel(prType) {
  if (prType === 'e1rm') return 'Estimated 1RM';
  if (prType === 'volume') return 'Volume PR';
  if (prType === 'first') return 'First Time';
  if (prType.endsWith('rm')) {
    const reps = prType.replace('rm', '');
    return `${reps} Rep Max`;
  }
  return prType;
}
