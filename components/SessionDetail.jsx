import React from 'react'
import PropTypes from 'prop-types'
import { CalendarIcon, EditIcon, ArrowLeftIcon, StickyNoteIcon } from 'lucide-react'

const SessionDetail = ({ session, onEdit, onBack }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatWeight = (weight) => {
    if (!weight) return 'BW' // Body weight
    return `${weight} kg`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{session.title}</h1>
            <div className="flex items-center text-gray-400 mt-1">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{formatDate(session.date)}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onEdit}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit Session
        </button>
      </div>

      {/* Session Notes */}
      {session.notes && (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <StickyNoteIcon className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Session Notes</h2>
          </div>
          <p className="text-gray-300">{session.notes}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Exercises</h2>
        
        {session.exercises && session.exercises.length > 0 ? (
          <div className="space-y-8">
            {session.exercises.map((exercise, index) => (
              <div key={exercise.id} className="border-b border-gray-700 last:border-b-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">{exercise.name}</h3>
                    {exercise.notes && (
                      <p className="text-sm text-gray-400 mt-1">{exercise.notes}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>

                {/* Sets Table */}
                <div className="bg-gray-700 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-600 text-sm font-medium text-gray-300">
                    <div>Set</div>
                    <div>Weight</div>
                    <div>Reps</div>
                    <div>RPE</div>
                  </div>
                  
                  <div className="divide-y divide-gray-600">
                    {exercise.sets && exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-4 p-3 text-sm">
                        <div className="text-gray-400">#{setIndex + 1}</div>
                        <div className="text-white">{formatWeight(set.weight)}</div>
                        <div className="text-white">{set.reps}</div>
                        <div className="text-white">
                          {set.rpe ? (
                            <span className={`font-medium ${
                              set.rpe <= 6 ? 'text-green-400' :
                              set.rpe <= 8 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {set.rpe}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercise Summary */}
                {exercise.sets && exercise.sets.length > 0 && (
                  <div className="mt-3 text-sm text-gray-400">
                    <span className="mr-4">
                      Total Sets: {exercise.sets.length}
                    </span>
                    <span className="mr-4">
                      Total Reps: {exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0)}
                    </span>
                    {exercise.sets.some(set => set.weight) && (
                      <span>
                        Total Weight: {exercise.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0)} kg
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <p>No exercises recorded for this session</p>
          </div>
        )}
      </div>

      {/* Session Summary */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Session Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {session.exercises ? session.exercises.length : 0}
            </div>
            <div className="text-sm text-gray-400">Exercises</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {session.exercises 
                ? session.exercises.reduce((sum, ex) => sum + (ex.sets ? ex.sets.length : 0), 0)
                : 0
              }
            </div>
            <div className="text-sm text-gray-400">Total Sets</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {session.exercises 
                ? session.exercises.reduce((sum, ex) => 
                    sum + (ex.sets ? ex.sets.reduce((setSum, set) => setSum + (set.reps || 0), 0) : 0), 0
                  )
                : 0
              }
            </div>
            <div className="text-sm text-gray-400">Total Reps</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {session.exercises && session.exercises.length > 0
                ? session.exercises.reduce((totalVolume, ex) => 
                    totalVolume + (ex.sets ? ex.sets.reduce((exVolume, set) => 
                      exVolume + ((set.weight || 0) * (set.reps || 0)), 0
                    ) : 0), 0
                  )
                : 0
              } kg
            </div>
            <div className="text-sm text-gray-400">Total Weight</div>
          </div>
        </div>
      </div>
    </div>
  )
}

SessionDetail.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    notes: PropTypes.string,
    exercises: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        notes: PropTypes.string,
        sets: PropTypes.arrayOf(
          PropTypes.shape({
            weight: PropTypes.number,
            reps: PropTypes.number.isRequired,
          })
        ),
      })
    ),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default SessionDetail