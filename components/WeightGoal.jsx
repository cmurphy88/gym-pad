import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { TargetIcon, EditIcon, CheckIcon, XIcon } from 'lucide-react'

/**
 * WeightGoal component for setting and managing weight goals
 * @param {Object} props
 * @param {Object} props.goal - Current weight goal
 * @param {Function} props.onSaveGoal - Function to save/update goal
 * @param {boolean} props.isLoading - Loading state
 */
const WeightGoal = ({ goal, onSaveGoal, isLoading }) => {
  const [isEditing, setIsEditing] = useState(!goal)
  const [targetWeight, setTargetWeight] = useState(goal?.targetWeight?.toString() || '')
  const [goalType, setGoalType] = useState(goal?.goalType || 'lose')
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (goal) {
      setTargetWeight(goal.targetWeight.toString())
      setGoalType(goal.goalType)
      setTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '')
    }
  }, [goal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!targetWeight || !goalType) return

    setIsSubmitting(true)
    try {
      await onSaveGoal({
        targetWeight: parseFloat(targetWeight),
        goalType,
        targetDate: targetDate || null,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving goal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (goal) {
      setTargetWeight(goal.targetWeight.toString())
      setGoalType(goal.goalType)
      setTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '')
      setIsEditing(false)
    } else {
      // If no goal exists, reset to defaults
      setTargetWeight('')
      setGoalType('lose')
      setTargetDate('')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TargetIcon className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-white">Weight Goal</h3>
        </div>
        {goal && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Edit goal"
          >
            <EditIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetWeight" className="block text-sm font-medium text-gray-300 mb-2">
                Target Weight (kg)
              </label>
              <input
                id="targetWeight"
                type="number"
                step="0.1"
                min="0"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter target weight"
                required
              />
            </div>
            <div>
              <label htmlFor="goalType" className="block text-sm font-medium text-gray-300 mb-2">
                Goal Type
              </label>
              <select
                id="goalType"
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="lose">Lose Weight</option>
                <option value="gain">Gain Weight</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-300 mb-2">
              Target Date (Optional)
            </label>
            <input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Goal'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <XIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </form>
      ) : goal ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Target:</span>
            <span className="text-white font-medium">{goal.targetWeight} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Goal:</span>
            <span className="text-white font-medium capitalize">{goal.goalType} Weight</span>
          </div>
          {goal.targetDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Target Date:</span>
              <span className="text-white font-medium">
                {new Date(goal.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          <p>No weight goal set. Click above to create one!</p>
        </div>
      )}
    </div>
  )
}

WeightGoal.propTypes = {
  goal: PropTypes.shape({
    id: PropTypes.number.isRequired,
    targetWeight: PropTypes.number.isRequired,
    goalType: PropTypes.string.isRequired,
    targetDate: PropTypes.string,
  }),
  onSaveGoal: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
}

export default WeightGoal