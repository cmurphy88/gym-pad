import React from 'react'
import { CalendarIcon, ClockIcon } from 'lucide-react'
import ExerciseItem from './ExerciseItem'

const SessionCard = ({ session, openHistoryModal }) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-white">{session.title}</h3>
          <div className="flex items-center text-gray-400 text-sm">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formatDate(session.date)}</span>
          </div>
        </div>
        <div className="space-y-3 mt-4">
          {session.exercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onClick={() => openHistoryModal(exercise.name)}
            />
          ))}
        </div>
      </div>
      <div className="px-5 py-3 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
        <div className="flex items-center text-gray-400 text-sm">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>45 min</span>
        </div>
        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
          View Details
        </button>
      </div>
    </div>
  )
}

export default SessionCard