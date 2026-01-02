import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { PlusIcon, TrashIcon, SaveIcon, XIcon, Lightbulb } from 'lucide-react'
import TemplateGuidance from './TemplateGuidance'
import ProgressionBadge from './ProgressionBadge'
import { getProgressionSuggestion, formatSuggestionText, PROGRESSION_STATUS } from '@/lib/progression-suggestions'

const SessionForm = ({ onSubmit, onCancel, isSubmitting, initialData }) => {
  const [workoutData, setWorkoutData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
    status: 'COMPLETED',
    exercises: [],
  })

  // Initialize form with initialData when provided
  useEffect(() => {
    if (initialData) {
      setWorkoutData(initialData)
    }
  }, [initialData])

  const [errors, setErrors] = useState({})

  const handleWorkoutChange = (field, value) => {
    setWorkoutData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const addExercise = () => {
    const newExercise = {
      id: Date.now(), // Temporary ID for UI
      name: '',
      sets: [{ reps: '', weight: '', rpe: null }],
      notes: '',
      restSeconds: 60,
    }

    setWorkoutData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }))
  }

  const removeExercise = (exerciseId) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
    }))
  }

  const updateExercise = (exerciseId, field, value) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      ),
    }))
  }

  const addSet = (exerciseId) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: '', weight: '', rpe: null }] }
          : ex
      ),
    }))
  }

  const removeSet = (exerciseId, setIndex) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((_, index) => index !== setIndex) }
          : ex
      ),
    }))
  }

  const updateSet = (exerciseId, setIndex, field, value) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, index) =>
                index === setIndex ? { ...set, [field]: value } : set
              ),
            }
          : ex
      ),
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!workoutData.title.trim()) {
      newErrors.title = 'Workout title is required'
    }

    if (!workoutData.date) {
      newErrors.date = 'Date is required'
    }

    if (workoutData.exercises.length === 0) {
      newErrors.exercises = 'At least one exercise is required'
    }

    // Validate each exercise
    workoutData.exercises.forEach((exercise, index) => {
      if (!exercise.name.trim()) {
        newErrors[`exercise_${index}_name`] = 'Exercise name is required'
      }

      if (exercise.sets.length === 0) {
        newErrors[`exercise_${index}_sets`] = 'At least one set is required'
      }

      exercise.sets.forEach((set, setIndex) => {
        if (!set.reps || set.reps <= 0) {
          newErrors[`exercise_${index}_set_${setIndex}_reps`] =
            'Reps must be a positive number'
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Format data for API
    const formattedData = {
      title: workoutData.title.trim(),
      date: workoutData.date,
      notes: workoutData.notes.trim() || null,
      status: workoutData.status,
      exercises: workoutData.exercises.map((exercise, index) => ({
        name: exercise.name.trim(),
        sets: exercise.sets.map((set) => ({
          reps: parseInt(set.reps),
          weight: set.weight ? parseFloat(set.weight) : null,
          rpe: set.rpe ? parseInt(set.rpe) : null,
        })),
        notes: exercise.notes.trim() || null,
        restSeconds: exercise.restSeconds || null,
        orderIndex: index,
      })),
    }

    onSubmit(formattedData)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workout Details */}
      <div className="bg-surface rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Workout Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Workout Title *
            </label>
            <input
              type="text"
              value={workoutData.title}
              onChange={(e) => handleWorkoutChange('title', e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
              placeholder="e.g., Push Day, Legs, etc."
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Date *
            </label>
            <input
              type="date"
              value={workoutData.date}
              onChange={(e) => handleWorkoutChange('date', e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            />
            {errors.date && (
              <p className="text-red-400 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Status
            </label>
            <select
              value={workoutData.status}
              onChange={(e) => handleWorkoutChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Notes
          </label>
          <input
            type="text"
            value={workoutData.notes}
            onChange={(e) => handleWorkoutChange('notes', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            placeholder="How did it feel? Any observations?"
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="bg-surface rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Exercises</h2>
          <button
            type="button"
            onClick={addExercise}
            className="flex items-center px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Exercise
          </button>
        </div>

        {errors.exercises && (
          <p className="text-red-400 text-sm mb-4">{errors.exercises}</p>
        )}

        <div className="space-y-4">
          {workoutData.exercises.map((exercise, exerciseIndex) => {
            // Calculate progression suggestion if template guidance exists
            const suggestion = exercise.templateGuidance?.exerciseHistory
              ? getProgressionSuggestion(
                  exercise.templateGuidance.exerciseHistory,
                  exercise.templateGuidance.targetRepRange
                )
              : null
            const showSuggestion = suggestion && suggestion.status !== PROGRESSION_STATUS.NO_DATA

            return (
            <div key={exercise.id} className="bg-surface-elevated rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(exercise.id, 'name', e.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-3 py-2 bg-surface-highlight border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                      placeholder="Exercise name"
                    />
                    {showSuggestion && (
                      <ProgressionBadge
                        status={suggestion.status}
                        size="sm"
                        showLabel
                        shortMessage={suggestion.shortMessage}
                      />
                    )}
                  </div>
                  {errors[`exercise_${exerciseIndex}_name`] && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors[`exercise_${exerciseIndex}_name`]}
                    </p>
                  )}
                  {/* Progression Suggestion Tip */}
                  {showSuggestion && suggestion.status === PROGRESSION_STATUS.READY && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-emerald-300">
                        {formatSuggestionText(suggestion)}
                      </span>
                    </div>
                  )}
                  {showSuggestion && suggestion.status === PROGRESSION_STATUS.ATTENTION && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-orange-400/10 border border-orange-400/20 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-orange-300">
                        {formatSuggestionText(suggestion)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(exercise.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Template Guidance */}
              {exercise.templateGuidance && (
                <TemplateGuidance exercise={exercise.templateGuidance} />
              )}

              {/* Sets */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-text-secondary">
                    Sets
                  </span>
                  <button
                    type="button"
                    onClick={() => addSet(exercise.id)}
                    className="text-sm text-accent hover:text-accent-hover"
                  >
                    + Add Set
                  </button>
                </div>

                {errors[`exercise_${exerciseIndex}_sets`] && (
                  <p className="text-red-400 text-sm mb-2">
                    {errors[`exercise_${exerciseIndex}_sets`]}
                  </p>
                )}

                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => {
                    const hasWeightAndReps = set.weight && set.reps;
                    return (
                      <div key={setIndex} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-muted w-8">
                            #{setIndex + 1}
                          </span>
                          <div className="flex-1">
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) =>
                                updateSet(
                                  exercise.id,
                                  setIndex,
                                  'weight',
                                  e.target.value
                                )
                              }
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-2 bg-surface-highlight border border-border rounded-lg text-text-primary text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                              placeholder="Weight (kg)"
                              step="0.5"
                              min="0"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                updateSet(
                                  exercise.id,
                                  setIndex,
                                  'reps',
                                  e.target.value
                                )
                              }
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-2 bg-surface-highlight border border-border rounded-lg text-text-primary text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                              placeholder="Reps"
                              min="1"
                            />
                            {errors[
                              `exercise_${exerciseIndex}_set_${setIndex}_reps`
                            ] && (
                              <p className="text-red-400 text-xs mt-1">
                                {
                                  errors[
                                    `exercise_${exerciseIndex}_set_${setIndex}_reps`
                                  ]
                                }
                              </p>
                            )}
                          </div>
                          {exercise.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(exercise.id, setIndex)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {/* RPE Input - only show when weight and reps are filled */}
                        {hasWeightAndReps && (
                          <div className="ml-10 flex items-center gap-3">
                            <span className="text-xs text-text-muted w-8">RPE:</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                step="1"
                                value={set.rpe || ''}
                                placeholder="7"
                                onChange={(e) =>
                                  updateSet(
                                    exercise.id,
                                    setIndex,
                                    'rpe',
                                    parseInt(e.target.value)
                                  )
                                }
                                onKeyDown={handleKeyDown}
                                className="w-12 px-2 py-1 bg-surface-highlight border border-border rounded text-text-primary text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                              <span className="text-xs text-text-muted">
                                {!set.rpe ? 'Not set' :
                                 set.rpe <= 6 ? 'Easy' :
                                 set.rpe <= 8 ? 'Moderate' :
                                 'Hard'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exercise Notes */}
              <div>
                <input
                  type="text"
                  value={exercise.notes}
                  onChange={(e) =>
                    updateExercise(exercise.id, 'notes', e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 bg-surface-highlight border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                  placeholder="Exercise notes (optional)"
                />
              </div>
            </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-surface-elevated hover:bg-surface-highlight text-text-primary rounded-lg transition-colors min-h-[44px]"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center px-6 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg transition-colors min-h-[44px]"
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Workout'}
        </button>
      </div>
    </form>
  )
}

SessionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  initialData: PropTypes.shape({
    title: PropTypes.string,
    date: PropTypes.string,
    notes: PropTypes.string,
    status: PropTypes.oneOf(['COMPLETED', 'CANCELLED', 'DRAFT']),
    exercises: PropTypes.array,
  }),
}

export default SessionForm
