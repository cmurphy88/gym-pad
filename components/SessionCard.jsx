import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/navigation'
import { CalendarIcon, WeightIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import ExerciseItem from './ExerciseItem'

/**
 * Get badge styling for workout status
 */
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

/**
 * SessionCard component displaying a workout session
 * @param {Object} props
 * @param {Object} props.session - Workout session data
 * @param {Function} props.openHistoryModal - Function to open exercise history modal
 */
const SessionCard = ({ session, openHistoryModal }) => {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const statusBadge = getStatusBadge(session.status)

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

  // Calculate total load (weight * reps) for all sets in the session
  const calculateTotalLoad = () => {
    if (!session.exercises || session.exercises.length === 0) return 0
    
    return session.exercises.reduce((sessionTotal, exercise) => {
      if (!Array.isArray(exercise.sets)) return sessionTotal
      
      const exerciseLoad = exercise.sets.reduce((exerciseTotal, set) => {
        const weight = set.weight || 0
        const reps = set.reps || 0
        return exerciseTotal + (weight * reps)
      }, 0)
      
      return sessionTotal + exerciseLoad
    }, 0)
  }

  return (
    <div className="bg-surface rounded-2xl overflow-hidden border border-border hover:border-accent/50 transition-all shadow-lg">
      {/* Collapsible Header */}
      <div
        className="p-4 cursor-pointer hover:bg-surface-elevated transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button className="text-text-muted hover:text-accent transition-colors">
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
            <h3 className="text-lg font-bold text-text-primary">{session.title}</h3>
            {statusBadge && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            )}
          </div>
          <div className="flex items-center text-text-muted text-sm">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formatDate(session.date)}</span>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t border-border">
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
          <div className="px-5 py-3 bg-background border-t border-border flex justify-between items-center">
            <div className="flex items-center text-text-muted text-sm">
              <WeightIcon className="h-4 w-4 mr-1" />
              <span className="tabular-nums">{calculateTotalLoad()} kg total</span>
            </div>
            <button
              onClick={handleViewDetails}
              className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
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
    status: PropTypes.oneOf(['COMPLETED', 'CANCELLED', 'DRAFT']),
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