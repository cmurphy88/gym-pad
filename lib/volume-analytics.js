/**
 * Volume Analytics Utilities
 *
 * Provides functions for calculating and aggregating training volume
 * by muscle group, time period, and training balance.
 */

import { parseSetsData, calculateExerciseSummary } from './migrate-sets.js'

/**
 * Predefined muscle groups for user selection
 */
export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Core',
  'Calves'
]

/**
 * Muscle group categories for balance calculations
 */
export const PUSH_MUSCLES = ['Chest', 'Shoulders', 'Triceps']
export const PULL_MUSCLES = ['Back', 'Biceps']
export const LEG_MUSCLES = ['Quads', 'Hamstrings', 'Glutes', 'Calves']
export const UPPER_MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps']
export const LOWER_MUSCLES = ['Quads', 'Hamstrings', 'Glutes', 'Calves']

/**
 * Calculate total volume for a single exercise
 * Volume = weight × reps (summed across all sets)
 * @param {string|Array} setsData - JSON string or array of sets
 * @returns {number} Total volume in kg
 */
export function calculateExerciseVolume(setsData) {
  const sets = typeof setsData === 'string' ? parseSetsData(setsData) : setsData
  if (!sets || !Array.isArray(sets)) return 0

  return sets.reduce((total, set) => {
    const weight = parseFloat(set.weight) || 0
    const reps = parseInt(set.reps) || 0
    return total + (weight * reps)
  }, 0)
}

/**
 * Calculate total volume for a workout
 * @param {Object} workout - Workout with exercises array
 * @returns {Object} { total, byExercise: { name: volume } }
 */
export function calculateWorkoutVolume(workout) {
  if (!workout?.exercises || !Array.isArray(workout.exercises)) {
    return { total: 0, byExercise: {} }
  }

  const byExercise = {}
  let total = 0

  workout.exercises.forEach((exercise) => {
    const volume = calculateExerciseVolume(exercise.setsData || exercise.sets_data)
    byExercise[exercise.name] = volume
    total += volume
  })

  return { total, byExercise }
}

/**
 * Get ISO week number from date
 * @param {Date|string} date - Date to get week from
 * @returns {string} Week string in format 'YYYY-Www'
 */
export function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Get week label for display
 * @param {string} weekString - Week in format 'YYYY-Www'
 * @returns {string} Display label
 */
export function getWeekLabel(weekString) {
  const [year, week] = weekString.split('-W')
  return `W${week}`
}

/**
 * Aggregate volume by week
 * @param {Array} workouts - Array of workouts with exercises
 * @param {Object} muscleGroupMap - Map of exercise name to muscle groups array
 * @param {number} weeksToInclude - Number of weeks to include (default 8)
 * @returns {Array} Weekly volume data sorted oldest to newest
 */
export function aggregateVolumeByWeek(workouts, muscleGroupMap = {}, weeksToInclude = 8) {
  if (!workouts || !Array.isArray(workouts)) return []

  const weeklyData = {}

  workouts.forEach((workout) => {
    const weekKey = getISOWeek(workout.date)

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: weekKey,
        label: getWeekLabel(weekKey),
        total: 0,
        byMuscle: {}
      }
    }

    workout.exercises?.forEach((exercise) => {
      const volume = calculateExerciseVolume(exercise.setsData || exercise.sets_data)
      weeklyData[weekKey].total += volume

      // Distribute volume to muscle groups
      const muscleGroups = muscleGroupMap[exercise.name] || ['Uncategorized']
      const volumePerMuscle = volume / muscleGroups.length

      muscleGroups.forEach((muscle) => {
        weeklyData[weekKey].byMuscle[muscle] =
          (weeklyData[weekKey].byMuscle[muscle] || 0) + volumePerMuscle
      })
    })
  })

  // Sort by week and limit to recent weeks
  const sortedWeeks = Object.values(weeklyData)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-weeksToInclude)

  return sortedWeeks
}

/**
 * Calculate volume by muscle group for a set of workouts
 * @param {Array} workouts - Array of workouts with exercises
 * @param {Object} muscleGroupMap - Map of exercise name to muscle groups array
 * @returns {Object} { muscleName: volume }
 */
export function calculateVolumeByMuscleGroup(workouts, muscleGroupMap = {}) {
  if (!workouts || !Array.isArray(workouts)) return {}

  const volumeByMuscle = {}

  workouts.forEach((workout) => {
    workout.exercises?.forEach((exercise) => {
      const volume = calculateExerciseVolume(exercise.setsData || exercise.sets_data)
      const muscleGroups = muscleGroupMap[exercise.name] || ['Uncategorized']
      const volumePerMuscle = volume / muscleGroups.length

      muscleGroups.forEach((muscle) => {
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + volumePerMuscle
      })
    })
  })

  return volumeByMuscle
}

/**
 * Calculate training balance (push/pull, upper/lower)
 * @param {Object} volumeByMuscle - { muscleName: volume }
 * @returns {Object} { push, pull, upper, lower } as percentages
 */
export function calculateTrainingBalance(volumeByMuscle) {
  let pushVolume = 0
  let pullVolume = 0
  let upperVolume = 0
  let lowerVolume = 0

  Object.entries(volumeByMuscle).forEach(([muscle, volume]) => {
    if (PUSH_MUSCLES.includes(muscle)) pushVolume += volume
    if (PULL_MUSCLES.includes(muscle)) pullVolume += volume
    if (UPPER_MUSCLES.includes(muscle)) upperVolume += volume
    if (LOWER_MUSCLES.includes(muscle)) lowerVolume += volume
  })

  const pushPullTotal = pushVolume + pullVolume
  const upperLowerTotal = upperVolume + lowerVolume

  return {
    push: pushPullTotal > 0 ? Math.round((pushVolume / pushPullTotal) * 100) : 0,
    pull: pushPullTotal > 0 ? Math.round((pullVolume / pushPullTotal) * 100) : 0,
    upper: upperLowerTotal > 0 ? Math.round((upperVolume / upperLowerTotal) * 100) : 0,
    lower: upperLowerTotal > 0 ? Math.round((lowerVolume / upperLowerTotal) * 100) : 0,
    pushVolume,
    pullVolume,
    upperVolume,
    lowerVolume
  }
}

/**
 * Check if training balance is within healthy range
 * @param {number} percentage - Balance percentage (0-100)
 * @returns {string} 'balanced' | 'slight' | 'imbalanced'
 */
export function getBalanceStatus(percentage) {
  if (percentage >= 40 && percentage <= 60) return 'balanced'
  if (percentage >= 30 && percentage <= 70) return 'slight'
  return 'imbalanced'
}

/**
 * Get workouts from the current week
 * @param {Array} workouts - Array of workouts
 * @returns {Array} Workouts from current week only
 */
export function getThisWeekWorkouts(workouts) {
  if (!workouts || !Array.isArray(workouts)) return []

  const currentWeek = getISOWeek(new Date())
  return workouts.filter((workout) => getISOWeek(workout.date) === currentWeek)
}

/**
 * Format volume for display
 * @param {number} volume - Volume in kg
 * @returns {string} Formatted string
 */
export function formatVolume(volume) {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`
  }
  return volume.toLocaleString()
}

/**
 * Build muscle group map from template exercises
 * @param {Array} templateExercises - Array of template exercises with muscleGroups
 * @returns {Object} { exerciseName: ['Muscle1', 'Muscle2'] }
 */
export function buildMuscleGroupMap(templateExercises) {
  const map = {}

  templateExercises?.forEach((te) => {
    if (te.muscleGroups) {
      // muscleGroups is stored as comma-separated string
      const muscles = te.muscleGroups.split(',').map((m) => m.trim()).filter(Boolean)
      if (muscles.length > 0) {
        map[te.exerciseName] = muscles
      }
    }
  })

  return map
}

/**
 * Calculate complete volume analytics for insights page
 * @param {Array} workouts - All user workouts with exercises
 * @param {Object} muscleGroupMap - Map of exercise name to muscle groups
 * @returns {Object} Complete volume analytics data
 */
export function calculateVolumeAnalytics(workouts, muscleGroupMap = {}) {
  const weeklyTrend = aggregateVolumeByWeek(workouts, muscleGroupMap, 8)
  const thisWeekWorkouts = getThisWeekWorkouts(workouts)
  const thisWeekByMuscle = calculateVolumeByMuscleGroup(thisWeekWorkouts, muscleGroupMap)
  const thisWeekTotal = Object.values(thisWeekByMuscle).reduce((sum, v) => sum + v, 0)
  const balance = calculateTrainingBalance(thisWeekByMuscle)

  return {
    weeklyTrend,
    thisWeek: {
      total: Math.round(thisWeekTotal),
      byMuscle: Object.fromEntries(
        Object.entries(thisWeekByMuscle).map(([k, v]) => [k, Math.round(v)])
      ),
      workoutCount: thisWeekWorkouts.length
    },
    balance
  }
}
