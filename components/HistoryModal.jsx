import React from 'react'
import PropTypes from 'prop-types'
import useSWR from 'swr'
import { XIcon } from 'lucide-react'
import ProgressChart from './ProgressChart'

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div 
        className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">{exercise} History</h3>
          <button
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <XIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {isLoading && (
            <div className="text-center text-gray-400">
              Loading exercise history...
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-400">
              Error loading exercise history
            </div>
          )}
          
          {history && history.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No history available for this exercise
            </div>
          )}
          
          {history && history.length > 0 && (
            <>
              <div className="h-64 mb-6">
                <ProgressChart history={history} />
              </div>
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-white">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {entry.maxWeight && entry.maxWeight > 0 && (
                        <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                          Max: {entry.maxWeight} kg
                        </span>
                      )}
                    </div>
                    
                    {/* Display individual sets */}
                    {entry.sets && Array.isArray(entry.sets) && entry.sets.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {entry.sets.map((set, setIndex) => (
                          <div key={setIndex} className="bg-gray-600 rounded px-2 py-1 text-xs">
                            <span className="text-gray-300">Set {setIndex + 1}: </span>
                            <span className="text-white">
                              {set.weight && set.weight > 0 ? `${set.weight}kg × ` : ''}
                              {set.reps} reps
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback for old format data
                      <div className="text-sm text-gray-400 mb-2">
                        {entry.totalSets || entry.sets} sets × {entry.totalReps || entry.reps} reps
                      </div>
                    )}
                    
                    {/* Summary info */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-600">
                      {entry.totalVolume ? (
                        <span>Total Volume: {entry.totalVolume.toLocaleString()} kg</span>
                      ) : null}
                    </div>
                  </div>
                ))}
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