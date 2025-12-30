'use client'

import { useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Trophy, X } from 'lucide-react'
import { getPRTypeLabel } from '@/lib/pr-calculations'

/**
 * PR Celebration Modal
 *
 * Displays an animated celebration when the user achieves new Personal Records.
 * Auto-closes after 5 seconds or when user dismisses.
 */
function PRCelebration({ prs, onClose }) {
  const [isVisible, setIsVisible] = useState(false)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    // Wait for fade-out animation before calling onClose
    setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50)

    // Auto-close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose()
    }, 5000)

    // Handle escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(autoCloseTimer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose])

  if (!prs || prs.length === 0) return null

  // Group PRs by exercise
  const groupedPRs = prs.reduce((acc, pr) => {
    if (!acc[pr.exerciseName]) {
      acc[pr.exerciseName] = []
    }
    acc[pr.exerciseName].push(pr)
    return acc
  }, {})

  // Format the improvement delta
  const formatDelta = (value, previousValue) => {
    if (!previousValue || previousValue === 0) return null
    const delta = value - previousValue
    if (delta <= 0) return null
    return `+${delta % 1 === 0 ? delta : delta.toFixed(1)}`
  }

  // Format PR value based on type
  const formatValue = (pr) => {
    if (pr.prType === 'first') {
      return `${pr.weight}kg x ${pr.reps}`
    }
    if (pr.prType === 'volume') {
      return `${pr.value.toLocaleString()} kg`
    }
    if (pr.prType === 'e1rm') {
      return `${pr.value} kg`
    }
    // Rep maxes
    return `${pr.value} kg`
  }

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-[#1a1a1a] border border-yellow-400/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with trophy animation */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400/20 rounded-full mb-4 animate-bounce">
            <Trophy className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            New Personal Record{prs.length > 1 ? 's' : ''}!
          </h2>
          <p className="text-gray-400 mt-1">You crushed it today!</p>
        </div>

        {/* PR List grouped by exercise */}
        <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto">
          {Object.entries(groupedPRs).map(([exerciseName, exercisePRs]) => (
            <div
              key={exerciseName}
              className="bg-[#252525] border border-gray-700 rounded-xl p-4"
            >
              <h3 className="font-semibold text-white mb-3">
                {exerciseName}
              </h3>
              <div className="space-y-2">
                {exercisePRs.map((pr, index) => {
                  const delta = formatDelta(pr.value, pr.previousValue)
                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-300">
                        {getPRTypeLabel(pr.prType)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-yellow-400 tabular-nums">
                          {formatValue(pr)}
                        </span>
                        {delta && (
                          <span className="text-emerald-400 text-xs font-medium">
                            {delta}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  )
}

PRCelebration.propTypes = {
  prs: PropTypes.arrayOf(
    PropTypes.shape({
      exerciseName: PropTypes.string.isRequired,
      prType: PropTypes.string.isRequired,
      value: PropTypes.number,
      previousValue: PropTypes.number,
      weight: PropTypes.number,
      reps: PropTypes.number
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired
}

export default PRCelebration
