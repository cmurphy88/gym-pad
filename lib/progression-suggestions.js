/**
 * Progressive Overload Suggestions
 *
 * Provides utilities for generating and categorizing progression suggestions
 * based on RPE trends and workout history.
 */

import { analyzeRPEData, calculateExerciseSummary } from './migrate-sets.js'

/**
 * Progression status types
 */
export const PROGRESSION_STATUS = {
  READY: 'ready',           // Ready to increase weight/reps
  MAINTAIN: 'maintain',     // On track, keep current load
  ATTENTION: 'attention',   // Needs attention (stalled, high RPE)
  NO_DATA: 'no_data'        // Not enough data to suggest
}

/**
 * Minimum sessions required before showing suggestions
 */
const MIN_SESSIONS_FOR_SUGGESTION = 2

/**
 * Get progression suggestion for a single exercise
 * @param {Array} exerciseHistory - History from /api/exercises/history/[name]
 * @param {string} targetRepRange - Target rep range (e.g., "8-12")
 * @param {number} currentWeight - Current weight being used
 * @returns {Object} Suggestion with status, message, and recommended changes
 */
export function getProgressionSuggestion(exerciseHistory, targetRepRange, currentWeight = 0) {
  // Not enough data
  if (!exerciseHistory || exerciseHistory.length < MIN_SESSIONS_FOR_SUGGESTION) {
    return {
      status: PROGRESSION_STATUS.NO_DATA,
      message: 'Need more sessions for suggestions',
      shortMessage: 'Not enough data',
      suggestedWeight: null,
      suggestedReps: null,
      weightChange: 0,
      repChange: 0,
      sessionsAnalyzed: exerciseHistory?.length || 0,
      lastSession: null
    }
  }

  // Get RPE analysis from existing function
  const rpeAnalysis = analyzeRPEData(exerciseHistory, targetRepRange)

  // No RPE data recorded
  if (!rpeAnalysis.hasRPEData) {
    return {
      status: PROGRESSION_STATUS.NO_DATA,
      message: 'Record RPE to get suggestions',
      shortMessage: 'No RPE data',
      suggestedWeight: null,
      suggestedReps: null,
      weightChange: 0,
      repChange: 0,
      sessionsAnalyzed: exerciseHistory.length,
      lastSession: getLastSessionSummary(exerciseHistory)
    }
  }

  const { recommendation, lastSessionRPE, rpeTrend, analysis } = rpeAnalysis
  const lastSession = getLastSessionSummary(exerciseHistory)
  const lastWeight = lastSession?.maxWeight || currentWeight

  // Determine status based on recommendation type
  let status
  let shortMessage

  switch (recommendation.type) {
    case 'increase_weight':
      status = PROGRESSION_STATUS.READY
      shortMessage = `+${recommendation.weightChange}kg`
      break
    case 'increase_reps':
      status = PROGRESSION_STATUS.READY
      shortMessage = `+${recommendation.repChange} reps`
      break
    case 'maintain':
      status = PROGRESSION_STATUS.MAINTAIN
      shortMessage = 'On track'
      break
    case 'decrease_weight':
      status = PROGRESSION_STATUS.ATTENTION
      shortMessage = 'Consider deload'
      break
    default:
      status = PROGRESSION_STATUS.MAINTAIN
      shortMessage = 'Maintain'
  }

  // Check for stalled progress (same weight for 4+ sessions with high RPE)
  if (isStalled(exerciseHistory)) {
    status = PROGRESSION_STATUS.ATTENTION
    shortMessage = 'Stalled'
  }

  return {
    status,
    message: recommendation.message,
    shortMessage,
    suggestedWeight: lastWeight + recommendation.weightChange,
    suggestedReps: lastSession?.avgReps ? Math.round(lastSession.avgReps + recommendation.repChange) : null,
    weightChange: recommendation.weightChange,
    repChange: recommendation.repChange,
    lastSessionRPE,
    rpeTrend,
    fatigue: analysis.fatigue,
    readiness: analysis.readiness,
    sessionsAnalyzed: exerciseHistory.length,
    lastSession
  }
}

/**
 * Get summary of last session
 */
function getLastSessionSummary(history) {
  if (!history || history.length === 0) return null

  const lastEntry = history[0]
  const summary = calculateExerciseSummary(lastEntry.sets || [])

  return {
    date: lastEntry.date,
    maxWeight: summary.maxWeight,
    totalReps: summary.totalReps,
    totalSets: summary.totalSets,
    avgReps: summary.totalSets > 0 ? Math.round(summary.totalReps / summary.totalSets) : 0,
    avgRPE: summary.averageRPE
  }
}

/**
 * Check if exercise progress has stalled
 * (Same weight for 4+ sessions with RPE >= 8.5)
 */
function isStalled(history) {
  if (!history || history.length < 4) return false

  const recentSessions = history.slice(0, 4)
  const weights = recentSessions.map(s => {
    const summary = calculateExerciseSummary(s.sets || [])
    return summary.maxWeight
  })

  // Check if all weights are the same
  const allSameWeight = weights.every(w => w === weights[0])
  if (!allSameWeight) return false

  // Check if average RPE is high
  const rpes = recentSessions
    .map(s => calculateExerciseSummary(s.sets || []).averageRPE)
    .filter(Boolean)

  if (rpes.length === 0) return false

  const avgRPE = rpes.reduce((a, b) => a + b, 0) / rpes.length
  return avgRPE >= 8.5
}

/**
 * Categorize multiple exercises by progression status
 * @param {Array} exercises - Array of { name, history, targetRepRange }
 * @returns {Object} Categorized exercises
 */
export function categorizeExercises(exercises) {
  const categories = {
    readyToProgress: [],
    maintain: [],
    needsAttention: [],
    noData: []
  }

  exercises.forEach(exercise => {
    const suggestion = getProgressionSuggestion(
      exercise.history,
      exercise.targetRepRange,
      exercise.currentWeight
    )

    const exerciseWithSuggestion = {
      name: exercise.name,
      ...suggestion
    }

    switch (suggestion.status) {
      case PROGRESSION_STATUS.READY:
        categories.readyToProgress.push(exerciseWithSuggestion)
        break
      case PROGRESSION_STATUS.MAINTAIN:
        categories.maintain.push(exerciseWithSuggestion)
        break
      case PROGRESSION_STATUS.ATTENTION:
        categories.needsAttention.push(exerciseWithSuggestion)
        break
      case PROGRESSION_STATUS.NO_DATA:
      default:
        categories.noData.push(exerciseWithSuggestion)
        break
    }
  })

  return categories
}

/**
 * Get badge color and icon for status
 * @param {string} status - PROGRESSION_STATUS value
 * @returns {Object} { color, bgColor, borderColor, icon }
 */
export function getStatusStyle(status) {
  switch (status) {
    case PROGRESSION_STATUS.READY:
      return {
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-400/20',
        borderColor: 'border-emerald-400/30',
        icon: 'TrendingUp'
      }
    case PROGRESSION_STATUS.MAINTAIN:
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/20',
        borderColor: 'border-blue-400/30',
        icon: 'Check'
      }
    case PROGRESSION_STATUS.ATTENTION:
      return {
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/20',
        borderColor: 'border-orange-400/30',
        icon: 'AlertCircle'
      }
    case PROGRESSION_STATUS.NO_DATA:
    default:
      return {
        color: 'text-gray-400',
        bgColor: 'bg-gray-400/20',
        borderColor: 'border-gray-400/30',
        icon: 'HelpCircle'
      }
  }
}

/**
 * Format suggestion for display
 * @param {Object} suggestion - From getProgressionSuggestion
 * @returns {string} Human-readable suggestion text
 */
export function formatSuggestionText(suggestion) {
  if (!suggestion || suggestion.status === PROGRESSION_STATUS.NO_DATA) {
    return 'Complete more sessions to get suggestions'
  }

  const { lastSession, weightChange, repChange, lastSessionRPE } = suggestion

  if (!lastSession) return suggestion.message

  let text = `Last: ${lastSession.maxWeight}kg × ${lastSession.avgReps} `
  if (lastSessionRPE) {
    text += `@ RPE ${lastSessionRPE}`
  }

  if (weightChange > 0) {
    text += ` → Try ${lastSession.maxWeight + weightChange}kg`
  } else if (repChange > 0) {
    text += ` → Aim for ${lastSession.avgReps + repChange} reps`
  } else if (weightChange < 0) {
    text += ` → Consider ${lastSession.maxWeight + weightChange}kg (deload)`
  }

  return text
}
