import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/navigation'
import { CalendarIcon, ClockIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import ExerciseItem from './ExerciseItem'

/**
 * SessionCard component displaying a workout session
 * @param {Object} props
 * @param {Object} props.session - Workout session data
 * @param {Function} props.openHistoryModal - Function to open exercise history modal
 */
const SessionCard = ({ session, openHistoryModal }) => {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleViewDetails = () => {
    router.push(`/session/${session.id}`)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }
  // Format date - handle both Date objects and strings
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
      {/* Collapsible Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button className="text-gray-400 hover:text-purple-400 transition-colors">
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
            <h3 className="text-lg font-bold text-white">{session.title}</h3>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formatDate(session.date)}</span>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          <div className="p-5">
            <div className="space-y-3">
              {session.exercises && session.exercises.map((exercise) => (
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
              <span>{session.duration || 45} min</span>
            </div>
            <button 
              onClick={handleViewDetails}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

SessionCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    duration: PropTypes.number,
    exercises: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        sets: PropTypes.number.isRequired,
        reps: PropTypes.number.isRequired,
        weight: PropTypes.number,
      })
    ),
  }).isRequired,
  openHistoryModal: PropTypes.func.isRequired,
}

export default SessionCard