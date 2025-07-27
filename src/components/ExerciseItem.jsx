import React from 'react'
import { ChevronRightIcon } from 'lucide-react'

const ExerciseItem = ({ exercise, onClick }) => {
  return (
    <div
      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
      onClick={() => onClick(exercise.name)}
    >
      <div className="flex-1">
        <h4 className="font-medium text-white">{exercise.name}</h4>
        <p className="text-sm text-gray-400">
          {exercise.sets} sets × {exercise.reps} reps
          {exercise.weight > 0 ? ` · ${exercise.weight} lbs` : ''}
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
    </div>
  )
}

export default ExerciseItem