import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  XIcon,
  ArrowLeftIcon,
} from 'lucide-react'
import TemplateGuidance from './TemplateGuidance'

const EditableSessionForm = ({
  session,
  onSave,
  onCancel,
  onUnsavedChanges,
  onDelete,
}) => {
  const [workoutData, setWorkoutData] = useState({
    title: '',
    date: '',
    notes: '',
    exercises: [],
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templateGuidance, setTemplateGuidance] = useState(null)

  // Initialize form data from session
  useEffect(() => {
    if (session) {
      setWorkoutData({
        title: session.title || '',
        date: session.date
          ? new Date(session.date).toISOString().split('T')[0]
          : '',
        notes: session.notes || '',
        exercises: session.exercises
          ? session.exercises.map((exercise) => ({
              id: exercise.id,
              name: exercise.name || '',
              sets: exercise.sets || [{ reps: '', weight: '', rpe: null }],
              notes: exercise.notes || '',
              restSeconds: exercise.restSeconds || 60,
            }))
          : [],
      })
    }
  }, [session])

  // Fetch template guidance data if session was created from a template
  useEffect(() => {
    const fetchTemplateGuidance = async () => {
      if (session?.templateId) {
        try {
          const response = await fetch(
            `/api/templates/${session.templateId}/latest-data`,
            {
              credentials: 'include',
            }
          )
          if (response.ok) {
            const templateData = await response.json()

            // Create a map of exercise name to guidance data
            const guidanceMap = {}
            templateData.templateExercises.forEach((templateExercise) => {
              guidanceMap[templateExercise.name.toLowerCase()] = {
                targetRepRange: templateExercise.targetRepRange,
                restSeconds: templateExercise.restSeconds,
                notes: templateExercise.notes,
                latestSets: templateExercise.latestSets,
                lastPerformed: templateExercise.lastPerformed,
                exerciseHistory: templateExercise.exerciseHistory,
              }
            })

            setTemplateGuidance(guidanceMap)
          } else {
            console.error(
              'Failed to fetch template data:',
              response.status,
              response.statusText
            )
          }
        } catch (error) {
          console.error('Error fetching template guidance:', error)
        }
      }
    }

    fetchTemplateGuidance()
  }, [session?.templateId])

  // Track unsaved changes
  useEffect(() => {
    if (!session) return

    const hasChanges =
      workoutData.title !== (session.title || '') ||
      workoutData.date !==
        (session.date
          ? new Date(session.date).toISOString().split('T')[0]
          : '') ||
      workoutData.notes !== (session.notes || '') ||
      JSON.stringify(workoutData.exercises) !==
        JSON.stringify(
          session.exercises
            ? session.exercises.map((exercise) => ({
                id: exercise.id,
                name: exercise.name || '',
                sets: exercise.sets || [{ reps: '', weight: '' }],
                notes: exercise.notes || '',
                restSeconds: exercise.restSeconds || 60,
              }))
            : []
        )

    onUnsavedChanges(hasChanges)
  }, [workoutData, session, onUnsavedChanges])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Format data for API
    const formattedData = {
      title: workoutData.title.trim(),
      date: workoutData.date,
      notes: workoutData.notes.trim() || null,
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

    try {
      await onSave(formattedData)
    } catch (error) {
      console.error('Error saving session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-white">Edit Session</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workout Details */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Session Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Title *
              </label>
              <input
                type="text"
                value={workoutData.title}
                onChange={(e) => handleWorkoutChange('title', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Push Day, Legs, etc."
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={workoutData.date}
                onChange={(e) => handleWorkoutChange('date', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSubmitting}
              />
              {errors.date && (
                <p className="text-red-400 text-sm mt-1">{errors.date}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={workoutData.notes}
              onChange={(e) => handleWorkoutChange('notes', e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="How did it feel? Any observations?"
              rows="3"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Exercises */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Exercises</h2>
            <button
              type="button"
              onClick={addExercise}
              className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Exercise
            </button>
          </div>

          {errors.exercises && (
            <p className="text-red-400 text-sm mb-4">{errors.exercises}</p>
          )}

          <div className="space-y-4">
            {workoutData.exercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(exercise.id, 'name', e.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Exercise name"
                      disabled={isSubmitting}
                    />
                    {errors[`exercise_${exerciseIndex}_name`] && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors[`exercise_${exerciseIndex}_name`]}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exercise.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Template Guidance */}
                {templateGuidance &&
                  templateGuidance[exercise.name.toLowerCase()] && (
                    <TemplateGuidance
                      exercise={templateGuidance[exercise.name.toLowerCase()]}
                    />
                  )}

                {/* Sets */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Sets
                    </span>
                    <button
                      type="button"
                      onClick={() => addSet(exercise.id)}
                      className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
                      disabled={isSubmitting}
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
                            <span className="text-sm text-gray-400 w-8">
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
                                className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Weight (kg)"
                                step="0.5"
                                min="0"
                                disabled={isSubmitting}
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
                                className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Reps"
                                min="1"
                                disabled={isSubmitting}
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
                                className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                                disabled={isSubmitting}
                              >
                                <XIcon className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          
                          {/* RPE Input - only show when weight and reps are filled */}
                          {hasWeightAndReps && (
                            <div className="ml-10 flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-8">RPE:</span>
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
                                  className="w-12 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  disabled={isSubmitting}
                                />
                                <span className="text-xs text-gray-500">
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
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Exercise notes (optional)"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <button
            type="button"
            onClick={onDelete}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            <TrashIcon className="h-4 w-4 mr-2 inline" />
            Delete Session
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

EditableSessionForm.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
      .isRequired,
    notes: PropTypes.string,
    exercises: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        notes: PropTypes.string,
        restSeconds: PropTypes.number,
        sets: PropTypes.arrayOf(
          PropTypes.shape({
            weight: PropTypes.number,
            reps: PropTypes.number.isRequired,
          })
        ),
      })
    ),
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onUnsavedChanges: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

export default EditableSessionForm
