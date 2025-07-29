import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { PlusCircleIcon, TrashIcon, ScaleIcon, TargetIcon } from 'lucide-react'
import WeightChart from './WeightChart'
import WeightGoal from './WeightGoal'
import useSWR from 'swr'

// Fetcher function for SWR
const fetcher = (url) => fetch(url, { credentials: 'include' }).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
})

/**
 * WeightTracker component for managing weight entries
 * @param {Object} props
 * @param {Array} props.weightEntries - Array of weight entries
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onAddWeight - Function to add new weight entry
 * @param {Function} props.onDeleteWeight - Function to delete weight entry
 */
const WeightTracker = ({ weightEntries = [], isLoading, onAddWeight, onDeleteWeight }) => {
  const [showForm, setShowForm] = useState(false)
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch weight goal
  const { data: weightGoal, error: goalError, isLoading: goalLoading, mutate: mutateGoal } = useSWR('/api/weight/goal', fetcher)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!weight || !date) return

    setIsSubmitting(true)
    try {
      await onAddWeight({
        weight: parseFloat(weight),
        date: date,
      })
      
      // Reset form
      setWeight('')
      setDate(new Date().toISOString().split('T')[0])
      setShowForm(false)
    } catch (error) {
      console.error('Error adding weight:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this weight entry?')) {
      try {
        await onDeleteWeight(id)
      } catch (error) {
        console.error('Error deleting weight:', error)
      }
    }
  }

  const handleSaveGoal = async (goalData) => {
    try {
      const method = weightGoal ? 'PUT' : 'POST'
      const response = await fetch('/api/weight/goal', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(goalData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to save weight goal')
      }

      // Refresh the goal data
      await mutateGoal()
    } catch (error) {
      console.error('Error saving goal:', error)
      throw error
    }
  }

  // Calculate goal progress for the latest entry
  const getGoalProgress = (entry) => {
    if (!weightGoal || !entry) return null
    
    const distance = weightGoal.targetWeight - entry.weight
    const isLosing = weightGoal.goalType === 'lose'
    
    if (isLosing) {
      // For weight loss: goal reached when current weight <= target weight (distance >= 0)
      return distance >= 0 ? '🎯 Goal Reached!' : `${Math.abs(distance).toFixed(1)} kg to lose`
    } else {
      // For weight gain: goal reached when current weight >= target weight (distance <= 0)
      return distance <= 0 ? '🎯 Goal Reached!' : `${Math.abs(distance).toFixed(1)} kg to gain`
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Weight Tracking</h2>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
          <div className="h-64 bg-gray-700 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Weight Tracking</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add Weight
        </button>
      </div>

      {/* Add Weight Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add Weight Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter weight in kg"
                  required
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Entry'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weight Goal Section */}
      <div className="mb-6">
        <WeightGoal 
          goal={weightGoal}
          onSaveGoal={handleSaveGoal}
          isLoading={goalLoading}
        />
      </div>

      {/* Weight Chart */}
      {weightEntries.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Weight Progress</h3>
          <div className="h-64">
            <WeightChart weightEntries={weightEntries} />
          </div>
        </div>
      )}

      {/* Weight Entries List */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Entries</h3>
        {weightEntries.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <ScaleIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p>No weight entries yet. Add your first entry!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weightEntries.map((entry, index) => {
              const goalProgress = getGoalProgress(entry)
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">{entry.weight} kg</div>
                    <div className="text-gray-400 text-sm">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {goalProgress && index === 0 && (
                      <div className="text-purple-400 text-sm mt-1 flex items-center space-x-1">
                        <TargetIcon className="h-3 w-3" />
                        <span>{goalProgress}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete entry"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

WeightTracker.propTypes = {
  weightEntries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      weight: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  onAddWeight: PropTypes.func.isRequired,
  onDeleteWeight: PropTypes.func.isRequired,
}

export default WeightTracker