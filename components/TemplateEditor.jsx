import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { 
  PlusIcon, 
  TrashIcon, 
  SaveIcon, 
  XIcon, 
  ArrowLeftIcon,
  GripVerticalIcon 
} from 'lucide-react'

const TemplateEditor = ({ template, onSave, onCancel, isSubmitting }) => {
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    exercises: []
  })

  const [errors, setErrors] = useState({})

  // Initialize form data from template
  useEffect(() => {
    if (template) {
      setTemplateData({
        name: template.name || '',
        description: template.description || '',
        exercises: template.templateExercises ? template.templateExercises.map(exercise => ({
          id: exercise.id,
          name: exercise.exerciseName,
          defaultSets: exercise.defaultSets || 3,
          defaultReps: exercise.defaultReps || 8,
          defaultWeight: exercise.defaultWeight || '',
          notes: exercise.notes || '',
          restSeconds: exercise.restSeconds || 60,
          orderIndex: exercise.orderIndex
        })) : []
      })
    }
  }, [template])

  const handleTemplateChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const addExercise = () => {
    const newExercise = {
      id: Date.now(), // Temporary ID for UI
      name: '',
      defaultSets: 3,
      defaultReps: 8,
      defaultWeight: '',
      notes: '',
      restSeconds: 60,
      orderIndex: templateData.exercises.length
    }
    
    setTemplateData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
  }

  const removeExercise = (exerciseId) => {
    setTemplateData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }))
  }

  const updateExercise = (exerciseId, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    }))
  }

  const moveExercise = (exerciseId, direction) => {
    setTemplateData(prev => {
      const exercises = [...prev.exercises]
      const currentIndex = exercises.findIndex(ex => ex.id === exerciseId)
      
      if (direction === 'up' && currentIndex > 0) {
        [exercises[currentIndex], exercises[currentIndex - 1]] = [exercises[currentIndex - 1], exercises[currentIndex]]
      } else if (direction === 'down' && currentIndex < exercises.length - 1) {
        [exercises[currentIndex], exercises[currentIndex + 1]] = [exercises[currentIndex + 1], exercises[currentIndex]]
      }
      
      // Update order indices
      exercises.forEach((exercise, index) => {
        exercise.orderIndex = index
      })
      
      return { ...prev, exercises }
    })
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!templateData.name.trim()) {
      newErrors.name = 'Template name is required'
    }

    if (templateData.exercises.length === 0) {
      newErrors.exercises = 'At least one exercise is required'
    }

    // Validate each exercise
    templateData.exercises.forEach((exercise, index) => {
      if (!exercise.name.trim()) {
        newErrors[`exercise_${index}_name`] = 'Exercise name is required'
      }
      
      if (!exercise.defaultSets || exercise.defaultSets <= 0) {
        newErrors[`exercise_${index}_sets`] = 'Default sets must be a positive number'
      }
      
      if (!exercise.defaultReps || exercise.defaultReps <= 0) {
        newErrors[`exercise_${index}_reps`] = 'Default reps must be a positive number'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Format data for API
    const formattedData = {
      name: templateData.name.trim(),
      description: templateData.description.trim() || null,
      exercises: templateData.exercises.map((exercise, index) => ({
        name: exercise.name.trim(),
        defaultSets: parseInt(exercise.defaultSets),
        defaultReps: parseInt(exercise.defaultReps),
        defaultWeight: exercise.defaultWeight ? parseFloat(exercise.defaultWeight) : null,
        notes: exercise.notes.trim() || null,
        restSeconds: exercise.restSeconds ? parseInt(exercise.restSeconds) : null,
        orderIndex: index
      }))
    }

    await onSave(formattedData)
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
          <h1 className="text-3xl font-bold text-white">
            {template?.id ? 'Edit Template' : 'Create Template'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Details */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Template Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={templateData.name}
                onChange={(e) => handleTemplateChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., My Custom Push Day"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={templateData.description}
                onChange={(e) => handleTemplateChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Brief description of this template"
                disabled={isSubmitting}
              />
            </div>
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
            {templateData.exercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {/* Drag handle and order controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveExercise(exercise.id, 'up')}
                      disabled={exerciseIndex === 0 || isSubmitting}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      ▲
                    </button>
                    <GripVerticalIcon className="h-4 w-4 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => moveExercise(exercise.id, 'down')}
                      disabled={exerciseIndex === templateData.exercises.length - 1 || isSubmitting}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      ▼
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
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

                {/* Exercise defaults */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Default Sets *
                    </label>
                    <input
                      type="number"
                      value={exercise.defaultSets}
                      onChange={(e) => updateExercise(exercise.id, 'defaultSets', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      min="1"
                      disabled={isSubmitting}
                    />
                    {errors[`exercise_${exerciseIndex}_sets`] && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors[`exercise_${exerciseIndex}_sets`]}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Default Reps *
                    </label>
                    <input
                      type="number"
                      value={exercise.defaultReps}
                      onChange={(e) => updateExercise(exercise.id, 'defaultReps', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      min="1"
                      disabled={isSubmitting}
                    />
                    {errors[`exercise_${exerciseIndex}_reps`] && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors[`exercise_${exerciseIndex}_reps`]}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Default Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={exercise.defaultWeight}
                      onChange={(e) => updateExercise(exercise.id, 'defaultWeight', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      step="0.5"
                      min="0"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Rest (seconds)
                    </label>
                    <input
                      type="number"
                      value={exercise.restSeconds}
                      onChange={(e) => updateExercise(exercise.id, 'restSeconds', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      min="0"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Exercise notes */}
                <div>
                  <input
                    type="text"
                    value={exercise.notes}
                    onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
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
        <div className="flex justify-end gap-4">
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
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>
    </div>
  )
}

TemplateEditor.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    templateExercises: PropTypes.array,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
}

export default TemplateEditor