import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/navigation'
import SessionCard from './SessionCard'
import TemplateSelector from './TemplateSelector'
import WeightSummary from './WeightSummary'
import { PlusCircleIcon, DumbbellIcon } from 'lucide-react'

/**
 * Groups workouts by year and month
 * @param {Array} workouts - Array of workout sessions
 * @returns {Object} Grouped workouts by year and month
 */
const groupWorkoutsByDate = (workouts) => {
  const grouped = {}

  workouts.forEach((workout) => {
    const date = new Date(workout.date)
    const year = date.getFullYear()
    const month = date.toLocaleString('default', { month: 'long' })

    if (!grouped[year]) {
      grouped[year] = {}
    }
    if (!grouped[year][month]) {
      grouped[year][month] = []
    }

    grouped[year][month].push(workout)
  })

  // Sort months within each year chronologically
  Object.keys(grouped).forEach((year) => {
    const months = Object.keys(grouped[year])
    const sortedMonths = {}

    // Create array of month objects with date for sorting
    const monthsWithDates = months.map((month) => ({
      name: month,
      date: new Date(`${month} 1, ${year}`),
    }))

    // Sort by date and rebuild object
    monthsWithDates
      .sort((a, b) => b.date - a.date) // Most recent first
      .forEach(({ name }) => {
        sortedMonths[name] = grouped[year][name]
      })

    grouped[year] = sortedMonths
  })

  return grouped
}

/**
 * Dashboard component displaying workout sessions
 * @param {Object} props
 * @param {Array} props.workouts - Array of workout sessions
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.openHistoryModal - Function to open exercise history modal
 */
const Dashboard = ({ workouts = [], isLoading, openHistoryModal }) => {
  const router = useRouter()
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false)

  const handleNewSession = () => {
    setIsTemplateSelectorOpen(true)
  }
  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Workouts</h2>
          <button
            onClick={handleNewSession}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            New Session
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-6 bg-gray-700 rounded mb-3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Weight</h2>
        <button
          onClick={handleNewSession}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          New Session
        </button>
      </div>
      {/* Weight Summary */}
      <div className="mb-6">
        <WeightSummary />
      </div>

      <div className="space-y-8">
        <h2 className="text-xl font-bold text-white">Workouts</h2>
        {workouts.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <DumbbellIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p>No workouts yet. Create your first session!</p>
          </div>
        ) : (
          (() => {
            const groupedWorkouts = groupWorkoutsByDate(workouts)
            const years = Object.keys(groupedWorkouts).sort((a, b) => b - a) // Most recent year first

            return years.map((year) => (
              <div key={year} className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-300">{year}</h3>
                {Object.entries(groupedWorkouts[year]).map(
                  ([month, monthWorkouts]) => (
                    <div key={`${year}-${month}`} className="space-y-4">
                      <h4 className="text-md font-medium text-gray-400">
                        {month}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monthWorkouts.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            openHistoryModal={openHistoryModal}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ))
          })()
        )}
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
      />
    </div>
  )
}

Dashboard.propTypes = {
  workouts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      exercises: PropTypes.arrayOf(PropTypes.object),
    })
  ),
  isLoading: PropTypes.bool,
  openHistoryModal: PropTypes.func.isRequired,
}

export default Dashboard
