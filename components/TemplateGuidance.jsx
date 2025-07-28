import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  TargetIcon,
  HistoryIcon,
} from 'lucide-react'

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
              <span className="text-gray-300">Target:</span>
              <span className="text-blue-200 font-medium">
                {exercise.targetRepRange} reps
              </span>
            </div>
          )}

          {/* Rest Time */}
          {exercise.restSeconds && (
            <div className="flex items-center space-x-2 text-sm">
              <ClockIcon className="h-3 w-3 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">Rest:</span>
              <span className="text-green-200 font-medium">
                {formatRestTime(exercise.restSeconds)}
              </span>
            </div>
          )}

          {/* Exercise History */}
          {exerciseHistory.length > 0 && (
            <div className="flex items-start space-x-2 text-sm">
              <HistoryIcon className="h-3 w-3 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                {exerciseHistory.map((session, index) => (
                  <div key={index}>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">
                        {index === 0 ? 'Last time:' : 'Before that:'}
                      </span>
                      <span className="text-purple-200 font-medium">
                        {session.performance}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Notes */}
          {exercise.notes && (
            <div className="text-sm pt-1 border-t border-blue-700/20">
              <span className="text-gray-300">Notes:</span>
              <span className="text-gray-200 ml-1">{exercise.notes}</span>
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
