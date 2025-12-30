import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  TargetIcon,
  HistoryIcon,
  TrendingUpIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { analyzeRPEData } from '@/lib/migrate-sets'

const TemplateGuidance = ({ exercise }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't render if there's no guidance information
  if (
    !exercise.targetRepRange &&
    !exercise.restSeconds &&
    !exercise.exerciseHistory?.length &&
    !exercise.notes
  ) {
    return null
  }

  const formatRestTime = (seconds) => {
    if (!seconds) return null
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`
  }

  const formatLatestPerformance = (sets) => {
    if (!sets || sets.length === 0) return null

    const completedSets = sets.filter((set) => set.reps && set.weight)
    if (completedSets.length === 0) return null

    // Format as individual sets: weight x reps
    const setStrings = completedSets.map((set) => `${set.weight}x${set.reps}`)

    return setStrings.join(', ')
  }

  const formatExerciseHistory = (history) => {
    if (!history || history.length === 0) return []
    
    return history.map(session => {
      const completedSets = session.sets.filter(set => set.reps && set.weight)
      if (completedSets.length === 0) return null
      
      const setStrings = completedSets.map(set => `${set.weight}x${set.reps}`)
      return {
        date: session.date,
        performance: setStrings.join(', ')
      }
    }).filter(Boolean)
  }

  const latestPerformance = formatLatestPerformance(exercise.latestSets)
  const exerciseHistory = formatExerciseHistory(exercise.exerciseHistory)
  
  // Analyze RPE data for auto-regulation
  const rpeAnalysis = analyzeRPEData(exercise.exerciseHistory, exercise.targetRepRange)

  return (
    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg mb-3">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        className="w-full px-3 py-2 flex items-center justify-between text-blue-200 hover:text-blue-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <TargetIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Extra Info</span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Target Rep Range */}
          {exercise.targetRepRange && (
            <div className="flex items-center space-x-2 text-sm pt-2">
              <TargetIcon className="h-3 w-3 text-blue-400 flex-shrink-0" />
              <span className="text-text-secondary">Target:</span>
              <span className="text-blue-200 font-medium tabular-nums">
                {exercise.targetRepRange} reps
              </span>
            </div>
          )}

          {/* Rest Time */}
          {exercise.restSeconds && (
            <div className="flex items-center space-x-2 text-sm">
              <ClockIcon className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <span className="text-text-secondary">Rest:</span>
              <span className="text-emerald-200 font-medium tabular-nums">
                {formatRestTime(exercise.restSeconds)}
              </span>
            </div>
          )}

          {/* Exercise History */}
          {exerciseHistory.length > 0 && (
            <div className="flex items-start space-x-2 text-sm">
              <HistoryIcon className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                {exerciseHistory.map((session, index) => (
                  <div key={index}>
                    <div className="flex items-center space-x-2">
                      <span className="text-text-secondary">
                        {index === 0 ? 'Last time:' : 'Before that:'}
                      </span>
                      <span className="text-blue-200 font-medium tabular-nums">
                        {session.performance}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-Regulation Insights */}
          {rpeAnalysis.hasRPEData && (
            <div className="text-sm pt-2 border-t border-blue-700/20">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUpIcon className="h-3 w-3 text-orange-400 flex-shrink-0" />
                <span className="text-text-secondary font-medium">Auto-Regulation</span>
              </div>

              <div className="space-y-1 ml-5">
                {/* Last Session RPE */}
                <div className="flex items-center space-x-2">
                  <span className="text-text-muted">Last RPE:</span>
                  <span className={`font-medium tabular-nums ${
                    rpeAnalysis.lastSessionRPE <= 6 ? 'text-emerald-500' :
                    rpeAnalysis.lastSessionRPE === 7 ? 'text-amber-400' :
                    rpeAnalysis.lastSessionRPE === 8 ? 'text-orange-500' :
                    rpeAnalysis.lastSessionRPE === 9 ? 'text-red-500' :
                    'text-red-600'
                  }`}>
                    {rpeAnalysis.lastSessionRPE}
                  </span>
                  <span className="text-xs text-text-muted">
                    ({rpeAnalysis.analysis.fatigue} fatigue)
                  </span>
                </div>

                {/* Recommendation */}
                {rpeAnalysis.recommendation && (
                  <div className="bg-surface-elevated rounded p-2 mt-2">
                    <div className="flex items-start space-x-2">
                      <AlertCircleIcon className="h-3 w-3 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-xs text-orange-200 font-medium">
                          Recommendation:
                        </div>
                        <div className="text-xs text-text-secondary">
                          {rpeAnalysis.recommendation.message}
                        </div>
                        {(rpeAnalysis.recommendation.weightChange !== 0 || rpeAnalysis.recommendation.repChange !== 0) && (
                          <div className="text-xs space-y-0.5 tabular-nums">
                            {rpeAnalysis.recommendation.weightChange !== 0 && (
                              <div className="text-blue-300">
                                Weight: {rpeAnalysis.recommendation.weightChange > 0 ? '+' : ''}
                                {rpeAnalysis.recommendation.weightChange}kg
                              </div>
                            )}
                            {rpeAnalysis.recommendation.repChange !== 0 && (
                              <div className="text-accent">
                                Reps: {rpeAnalysis.recommendation.repChange > 0 ? '+' : ''}
                                {rpeAnalysis.recommendation.repChange}
                              </div>
                            )}
                            {rpeAnalysis.recommendation.targetRPE && (
                              <div className="text-amber-300">
                                Target RPE: {rpeAnalysis.recommendation.targetRPE}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercise Notes */}
          {exercise.notes && (
            <div className="text-sm pt-1 border-t border-blue-700/20">
              <span className="text-text-secondary">Notes:</span>
              <span className="text-text-primary ml-1">{exercise.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

TemplateGuidance.propTypes = {
  exercise: PropTypes.shape({
    targetRepRange: PropTypes.string,
    restSeconds: PropTypes.number,
    notes: PropTypes.string,
    latestSets: PropTypes.array,
    lastPerformed: PropTypes.string,
    exerciseHistory: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        sets: PropTypes.array,
      })
    ),
  }).isRequired,
}

export default TemplateGuidance
