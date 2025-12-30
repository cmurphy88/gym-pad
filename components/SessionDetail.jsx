import React from 'react'
import PropTypes from 'prop-types'
import { CalendarIcon, EditIcon, ArrowLeftIcon, StickyNoteIcon } from 'lucide-react'

const getStatusBadge = (status) => {
  switch (status) {
    case 'CANCELLED':
      return { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
    case 'DRAFT':
      return { label: 'Draft', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    default:
      return null
  }
}

const SessionDetail = ({ session, onEdit, onBack }) => {
  const statusBadge = getStatusBadge(session.status)
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
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-text-primary">{session.title}</h1>
              {statusBadge && (
                <span className={`text-sm px-3 py-1 rounded-full border ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
              )}
            </div>
            <div className="flex items-center text-text-muted mt-1">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{formatDate(session.date)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="flex items-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors min-h-[44px]"
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit Session
        </button>
      </div>

      {/* Session Notes */}
      {session.notes && (
        <div className="bg-surface rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <StickyNoteIcon className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-text-primary">Session Notes</h2>
          </div>
          <p className="text-text-secondary">{session.notes}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="bg-surface rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Exercises</h2>

        {session.exercises && session.exercises.length > 0 ? (
          <div className="space-y-8">
            {session.exercises.map((exercise, index) => (
              <div key={exercise.id} className="border-b border-border last:border-b-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-text-primary">{exercise.name}</h3>
                    {exercise.notes && (
                      <p className="text-sm text-text-muted mt-1">{exercise.notes}</p>
                    )}
                  </div>
                  <span className="text-sm text-text-muted">#{index + 1}</span>
                </div>

                {/* Sets Table */}
                <div className="bg-surface-elevated rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-surface-highlight text-sm font-medium text-text-secondary">
                    <div>Set</div>
                    <div>Weight</div>
                    <div>Reps</div>
                    <div>RPE</div>
                  </div>

                  <div className="divide-y divide-border">
                    {exercise.sets && exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-4 p-3 text-sm">
                        <div className="text-text-muted">#{setIndex + 1}</div>
                        <div className="text-text-primary tabular-nums">{formatWeight(set.weight)}</div>
                        <div className="text-text-primary tabular-nums">{set.reps}</div>
                        <div className="text-text-primary">
                          {set.rpe ? (
                            <span className={`font-medium tabular-nums ${
                              set.rpe <= 6 ? 'text-emerald-500' :
                              set.rpe === 7 ? 'text-amber-400' :
                              set.rpe === 8 ? 'text-orange-500' :
                              set.rpe === 9 ? 'text-red-500' :
                              'text-red-600'
                            }`}>
                              {set.rpe}
                            </span>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercise Summary */}
                {exercise.sets && exercise.sets.length > 0 && (
                  <div className="mt-3 text-sm text-text-muted tabular-nums">
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
          <div className="text-center text-text-muted py-8">
            <p>No exercises recorded for this session</p>
          </div>
        )}
      </div>

      {/* Session Summary */}
      <div className="bg-surface rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Session Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-surface-elevated rounded-xl p-4">
            <div className="text-2xl font-bold text-accent tabular-nums">
              {session.exercises ? session.exercises.length : 0}
            </div>
            <div className="text-sm text-text-muted">Exercises</div>
          </div>

          <div className="bg-surface-elevated rounded-xl p-4">
            <div className="text-2xl font-bold text-accent tabular-nums">
              {session.exercises
                ? session.exercises.reduce((sum, ex) => sum + (ex.sets ? ex.sets.length : 0), 0)
                : 0
              }
            </div>
            <div className="text-sm text-text-muted">Total Sets</div>
          </div>

          <div className="bg-surface-elevated rounded-xl p-4">
            <div className="text-2xl font-bold text-accent tabular-nums">
              {session.exercises
                ? session.exercises.reduce((sum, ex) =>
                    sum + (ex.sets ? ex.sets.reduce((setSum, set) => setSum + (set.reps || 0), 0) : 0), 0
                  )
                : 0
              }
            </div>
            <div className="text-sm text-text-muted">Total Reps</div>
          </div>

          <div className="bg-surface-elevated rounded-xl p-4">
            <div className="text-2xl font-bold text-accent tabular-nums">
              {session.exercises && session.exercises.length > 0
                ? session.exercises.reduce((totalVolume, ex) =>
                    totalVolume + (ex.sets ? ex.sets.reduce((exVolume, set) =>
                      exVolume + ((set.weight || 0) * (set.reps || 0)), 0
                    ) : 0), 0
                  )
                : 0
              } kg
            </div>
            <div className="text-sm text-text-muted">Total Weight</div>
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
    status: PropTypes.oneOf(['COMPLETED', 'CANCELLED', 'DRAFT']),
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