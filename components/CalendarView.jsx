import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { DayPicker } from 'react-day-picker'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import 'react-day-picker/dist/style.css'

const CalendarView = ({ onClose }) => {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [workoutData, setWorkoutData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch workouts for the current month
  useEffect(() => {
    const fetchWorkouts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth() + 1

        const response = await fetch(
          `/api/workouts/calendar?year=${year}&month=${month}`,
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch calendar data')
        }

        const data = await response.json()
        setWorkoutData(data.workouts)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching calendar data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkouts()
  }, [currentMonth])

  // Handle day click
  const handleDayClick = (date) => {
    const dateKey = date.toISOString().split('T')[0]
    const workouts = workoutData[dateKey] || []

    if (workouts.length === 1) {
      // Navigate directly to the workout if there's only one
      router.push(`/session/${workouts[0].id}`)
      onClose()
    } else if (workouts.length > 1) {
      // Could show a list of workouts for that day
      // For now, navigate to the first one
      router.push(`/session/${workouts[0].id}`)
      onClose()
    }
  }

  // Handle month navigation
  const handleMonthChange = (month) => {
    setCurrentMonth(month)
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">Failed to load calendar data</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Workout Calendar</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div
          className="calendar-container"
          style={{
            '--workout-days': JSON.stringify(Object.keys(workoutData)),
          }}
        >
          <DayPicker
            mode="single"
            month={currentMonth}
            onMonthChange={handleMonthChange}
            onDayClick={handleDayClick}
            showOutsideDays
            modifiers={{
              hasWorkout: (date) => {
                const dateKey = date.toISOString().split('T')[0]
                const workouts = workoutData[dateKey] || []
                return workouts.length > 0
              },
            }}
            components={{
              Day: (props) => {
                const { day, ...otherProps } = props
                const date = day.date
                const dateKey = date.toISOString().split('T')[0]
                const workouts = workoutData[dateKey] || []
                const hasWorkouts = workouts.length > 0

                let workoutText = ''
                if (hasWorkouts) {
                  if (workouts.length === 1) {
                    workoutText = workouts[0].title
                  } else {
                    workoutText = `${workouts.length} workouts`
                  }
                }

                return (
                  <td
                    {...otherProps}
                    className={`${otherProps.className || ''} ${
                      hasWorkouts ? 'has-workout-day' : ''
                    }`}
                    data-workout-text={workoutText}
                  >
                    <button
                      type="button"
                      className="rdp-day_button"
                      onClick={() => handleDayClick(date)}
                      aria-label={`${date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}`}
                    >
                      <div className="day-content">
                        <span className="day-number">{date.getDate()}</span>
                        {hasWorkouts && (
                          <span className="workout-info">
                            {workouts.length === 1
                              ? workouts[0].title
                              : `${workouts.length} workouts`}
                          </span>
                        )}
                      </div>
                    </button>
                  </td>
                )
              },
              IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
              IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
            }}
          />
        </div>
      )}

      <div className="mt-4 text-sm text-gray-400 text-center">
        Click on a day with workouts to view details
      </div>
    </div>
  )
}

CalendarView.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default CalendarView
