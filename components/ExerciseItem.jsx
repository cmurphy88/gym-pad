import React from 'react'
import PropTypes from 'prop-types'
import { ChevronRightIcon } from 'lucide-react'

/**
 * ExerciseItem component displaying individual exercise information
 * @param {Object} props
 * @param {Object} props.exercise - Exercise data
 * @param {Function} props.onClick - Function to call when exercise is clicked
 */
const ExerciseItem = ({ exercise, onClick }) => {
  // Helper function to format sets display
  const formatSetsDisplay = (sets) => {
    if (!Array.isArray(sets) || sets.length === 0) {
      return '0 sets'
    }

    const totalSets = sets.length
    const weights = sets.map((set) => set.weight || 0)
    const reps = sets.map((set) => set.reps || 0)

    // Check if all weights are the same
    const sameWeight = weights.every((w) => w === weights[0])
    // Check if all reps are the same
    const sameReps = reps.every((r) => r === reps[0])

    if (sameWeight && sameReps) {
      // All sets identical: "4 sets × 8 reps · 185 kg"
      const weightDisplay = weights[0] > 0 ? ` · ${weights[0]} kg` : ''
      return `${totalSets} sets × ${reps[0]} reps${weightDisplay}`
    } else {
      // Sets vary: "4 sets: 185×8, 185×7, 185×6, 185×5"
      const setDetails = sets
        .map((set) => {
          const weight = set.weight || 0
          const rep = set.reps || 0
          return weight > 0 ? `${weight}×${rep}` : `${rep} reps`
        })
        .join(', ')
      return `${totalSets} sets: ${setDetails}`
    }
  }

  return (
    <div
      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
      onClick={() => onClick && onClick(exercise.name)}
    >
      <div className="flex-1">
        <h4 className="font-medium text-white">{exercise.name}</h4>
        <p className="text-sm text-gray-400">
          {formatSetsDisplay(exercise.sets)}
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
    </div>
  )
}

ExerciseItem.propTypes = {
  exercise: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    sets: PropTypes.arrayOf(
      PropTypes.shape({
        weight: PropTypes.number,
        reps: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onClick: PropTypes.func,
}

export default ExerciseItem
