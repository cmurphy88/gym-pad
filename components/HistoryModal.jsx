import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import useSWR from 'swr'
import { XIcon, Trophy } from 'lucide-react'
import ProgressChart from './ProgressChart'
import PRBadge from './PRBadge'
import {
  calculatePRsFromHistory,
  getEntryPRInfo,
  TRACKED_REP_COUNTS
} from '@/lib/pr-calculations'

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json())

/**
 * HistoryModal component displaying exercise history with progress chart
 * @param {Object} props
 * @param {string} props.exercise - Exercise name
 * @param {Function} props.onClose - Function to close the modal
 */
const HistoryModal = ({ exercise, onClose }) => {
  const { data: history, error, isLoading } = useSWR(
    exercise ? `/api/exercises/history/${encodeURIComponent(exercise)}` : null,
    fetcher
  )

  // Calculate PRs from history
  const prs = useMemo(() => {
    if (!history || history.length === 0) return null
    return calculatePRsFromHistory(history)
  }, [history])

  // Get PR info for each entry
  const getEntryPRs = (entry) => {
    if (!prs) return { hasPR: false, prTypes: [] }
    return getEntryPRInfo(entry, prs)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        className="bg-surface rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">{exercise} History</h3>
          <button
            className="p-1 rounded-full hover:bg-surface-elevated transition-colors"
            onClick={onClose}
          >
            <XIcon className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {isLoading && (
            <div className="text-center text-text-muted">
              Loading exercise history...
            </div>
          )}

          {error && (
            <div className="text-center text-red-400">
              Error loading exercise history
            </div>
          )}

          {history && history.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No history available for this exercise
            </div>
          )}

          {history && history.length > 0 && (
            <>
              <div className="h-64 mb-6">
                <ProgressChart history={history} />
              </div>

              {/* PR Summary Section */}
              {prs && prs.e1rm && (
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold text-text-primary">Personal Records</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {/* Best e1RM */}
                    <div className="col-span-2 flex justify-between items-center pb-2 border-b border-yellow-400/20">
                      <span className="text-text-muted">Best e1RM</span>
                      <span className="text-yellow-400 font-semibold tabular-nums">
                        {prs.e1rm.value} kg
                      </span>
                    </div>
                    {/* Rep Maxes */}
                    {TRACKED_REP_COUNTS.map((reps) => {
                      const repMax = prs.repMaxes[reps]
                      if (!repMax) return null
                      return (
                        <div key={reps} className="flex justify-between items-center">
                          <span className="text-text-muted">{reps}RM</span>
                          <span className="text-text-primary font-medium tabular-nums">
                            {repMax.weight} kg
                          </span>
                        </div>
                      )
                    })}
                    {/* Volume PR */}
                    {prs.volumePR && (
                      <div className="col-span-2 flex justify-between items-center pt-2 border-t border-yellow-400/20 mt-1">
                        <span className="text-text-muted">Best Set Volume</span>
                        <span className="text-emerald-400 font-medium tabular-nums">
                          {prs.volumePR.value.toLocaleString()} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {history.map((entry, index) => {
                  const entryPRInfo = getEntryPRs(entry)
                  return (
                  <div key={index} className="bg-surface-elevated rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {/* PR Badges */}
                        {entryPRInfo.hasPR && (
                          <div className="flex gap-1">
                            {entryPRInfo.prTypes.slice(0, 2).map((prType) => (
                              <PRBadge key={prType} type={prType} size="xs" />
                            ))}
                            {entryPRInfo.prTypes.length > 2 && (
                              <span className="text-xs text-text-muted">
                                +{entryPRInfo.prTypes.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {entry.maxWeight && entry.maxWeight > 0 && (
                        <span className="text-sm bg-accent/20 text-blue-300 px-2 py-1 rounded tabular-nums">
                          Max: {entry.maxWeight} kg
                        </span>
                      )}
                    </div>

                    {/* Display individual sets */}
                    {entry.sets && Array.isArray(entry.sets) && entry.sets.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {entry.sets.map((set, setIndex) => (
                          <div key={setIndex} className="bg-surface-highlight rounded px-2 py-1 text-xs">
                            <span className="text-text-secondary">Set {setIndex + 1}: </span>
                            <span className="text-text-primary tabular-nums">
                              {set.weight && set.weight > 0 ? `${set.weight}kg × ` : ''}
                              {set.reps} reps
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback for old format data
                      <div className="text-sm text-text-muted mb-2 tabular-nums">
                        {entry.totalSets || entry.sets} sets × {entry.totalReps || entry.reps} reps
                      </div>
                    )}

                    {/* Summary info */}
                    <div className="text-xs text-text-muted pt-2 border-t border-border tabular-nums">
                      {entry.totalVolume ? (
                        <span>Total Volume: {entry.totalVolume.toLocaleString()} kg</span>
                      ) : null}
                    </div>
                  </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

HistoryModal.propTypes = {
  exercise: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default HistoryModal