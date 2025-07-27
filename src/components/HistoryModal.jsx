import React from 'react'
import { useWorkout } from '../context/WorkoutContext'
import { XIcon } from 'lucide-react'
import ProgressChart from './ProgressChart'

const HistoryModal = ({ exercise, onClose }) => {
  const { getExerciseHistory } = useWorkout()
  const history = getExerciseHistory(exercise)

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
          {history.length > 0 ? (
            <>
              <div className="h-64 mb-6">
                <ProgressChart history={history} />
              </div>
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">
                        {entry.date}
                      </span>
                      <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        {entry.weight} lbs
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {entry.sets} sets × {entry.reps} reps
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No history available for this exercise
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryModal