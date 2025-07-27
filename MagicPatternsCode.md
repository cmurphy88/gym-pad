```index.tsx
import './index.css'
import React from "react";
import { render } from "react-dom";
import { App } from "./App";

render(<App />, document.getElementById("root"));

```

```App.tsx
import React, { useState } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import HistoryModal from './components/HistoryModal'
import { WorkoutProvider } from './context/WorkoutContext'
export function App() {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const openHistoryModal = (exercise) => {
    setSelectedExercise(exercise)
    setIsHistoryModalOpen(true)
  }
  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false)
  }
  return (
    <WorkoutProvider>
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <Dashboard openHistoryModal={openHistoryModal} />
        </main>
        {isHistoryModalOpen && (
          <HistoryModal
            exercise={selectedExercise}
            onClose={closeHistoryModal}
          />
        )}
      </div>
    </WorkoutProvider>
  )
}

```

```tailwind.config.js
export default {}
```

```index.css
/* PLEASE NOTE: THESE TAILWIND IMPORTS SHOULD NEVER BE DELETED */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
/* DO NOT DELETE THESE TAILWIND IMPORTS, OTHERWISE THE STYLING WILL NOT RENDER AT ALL */
```

```context/WorkoutContext.tsx
import React, { useState, createContext, useContext } from 'react'
// Mock data for workout sessions
const mockWorkoutData = [
  {
    id: 1,
    date: '2023-11-15',
    title: 'Upper Body Focus',
    exercises: [
      {
        id: 1,
        name: 'Bench Press',
        sets: 4,
        reps: 8,
        weight: 185,
      },
      {
        id: 2,
        name: 'Pull-ups',
        sets: 3,
        reps: 10,
        weight: 0,
      },
      {
        id: 3,
        name: 'Shoulder Press',
        sets: 3,
        reps: 12,
        weight: 65,
      },
    ],
  },
  {
    id: 2,
    date: '2023-11-13',
    title: 'Leg Day',
    exercises: [
      {
        id: 4,
        name: 'Squats',
        sets: 4,
        reps: 10,
        weight: 225,
      },
      {
        id: 5,
        name: 'Leg Press',
        sets: 3,
        reps: 12,
        weight: 360,
      },
      {
        id: 6,
        name: 'Lunges',
        sets: 3,
        reps: 10,
        weight: 40,
      },
    ],
  },
  {
    id: 3,
    date: '2023-11-10',
    title: 'Full Body',
    exercises: [
      {
        id: 7,
        name: 'Deadlifts',
        sets: 4,
        reps: 6,
        weight: 275,
      },
      {
        id: 8,
        name: 'Bench Press',
        sets: 3,
        reps: 8,
        weight: 175,
      },
      {
        id: 9,
        name: 'Pull-ups',
        sets: 3,
        reps: 8,
        weight: 0,
      },
    ],
  },
  {
    id: 4,
    date: '2023-11-08',
    title: 'Upper Body Focus',
    exercises: [
      {
        id: 10,
        name: 'Bench Press',
        sets: 4,
        reps: 8,
        weight: 180,
      },
      {
        id: 11,
        name: 'Bicep Curls',
        sets: 3,
        reps: 12,
        weight: 35,
      },
      {
        id: 12,
        name: 'Tricep Extensions',
        sets: 3,
        reps: 12,
        weight: 30,
      },
    ],
  },
]
// Mock exercise history data
const mockExerciseHistory = {
  'Bench Press': [
    {
      date: '2023-11-15',
      sets: 4,
      reps: 8,
      weight: 185,
    },
    {
      date: '2023-11-10',
      sets: 3,
      reps: 8,
      weight: 175,
    },
    {
      date: '2023-11-08',
      sets: 4,
      reps: 8,
      weight: 180,
    },
    {
      date: '2023-11-01',
      sets: 4,
      reps: 8,
      weight: 170,
    },
    {
      date: '2023-10-25',
      sets: 3,
      reps: 10,
      weight: 165,
    },
  ],
  'Pull-ups': [
    {
      date: '2023-11-15',
      sets: 3,
      reps: 10,
      weight: 0,
    },
    {
      date: '2023-11-10',
      sets: 3,
      reps: 8,
      weight: 0,
    },
    {
      date: '2023-11-01',
      sets: 3,
      reps: 7,
      weight: 0,
    },
    {
      date: '2023-10-25',
      sets: 3,
      reps: 6,
      weight: 0,
    },
  ],
  Squats: [
    {
      date: '2023-11-13',
      sets: 4,
      reps: 10,
      weight: 225,
    },
    {
      date: '2023-11-06',
      sets: 4,
      reps: 8,
      weight: 215,
    },
    {
      date: '2023-10-30',
      sets: 3,
      reps: 12,
      weight: 205,
    },
    {
      date: '2023-10-23',
      sets: 3,
      reps: 10,
      weight: 195,
    },
  ],
  Deadlifts: [
    {
      date: '2023-11-10',
      sets: 4,
      reps: 6,
      weight: 275,
    },
    {
      date: '2023-11-03',
      sets: 4,
      reps: 5,
      weight: 265,
    },
    {
      date: '2023-10-27',
      sets: 3,
      reps: 8,
      weight: 255,
    },
    {
      date: '2023-10-20',
      sets: 3,
      reps: 6,
      weight: 245,
    },
  ],
}
const WorkoutContext = createContext()
export function WorkoutProvider({ children }) {
  const [workouts, setWorkouts] = useState(mockWorkoutData)
  const [exerciseHistory, setExerciseHistory] = useState(mockExerciseHistory)
  const getExerciseHistory = (exerciseName) => {
    return exerciseHistory[exerciseName] || []
  }
  const value = {
    workouts,
    exerciseHistory,
    getExerciseHistory,
  }
  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  )
}
export function useWorkout() {
  return useContext(WorkoutContext)
}

```

```components/Header.tsx
import React from 'react'
import { DumbbellIcon, CalendarIcon, UserIcon } from 'lucide-react'
const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DumbbellIcon className="h-6 w-6 text-purple-500" />
          <h1 className="text-xl font-bold text-white">GymTrack</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <CalendarIcon className="h-5 w-5 text-gray-300" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <UserIcon className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  )
}
export default Header

```

```components/Dashboard.tsx
import React from 'react'
import { useWorkout } from '../context/WorkoutContext'
import SessionCard from './SessionCard'
import { PlusCircleIcon } from 'lucide-react'
const Dashboard = ({ openHistoryModal }) => {
  const { workouts } = useWorkout()
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Your Workouts</h2>
        <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          New Session
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            openHistoryModal={openHistoryModal}
          />
        ))}
      </div>
    </div>
  )
}
export default Dashboard

```

```components/SessionCard.tsx
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
      <div className="px-5 py-3 bg-gray-850 border-t border-gray-700 flex justify-between items-center">
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

```

```components/ExerciseItem.tsx
import React from 'react'
import { ChevronRightIcon } from 'lucide-react'
const ExerciseItem = ({ exercise, onClick }) => {
  return (
    <div
      className="flex items-center justify-between p-3 bg-gray-750 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
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

```

```components/HistoryModal.tsx
import React from 'react'
import { useWorkout } from '../context/WorkoutContext'
import { XIcon } from 'lucide-react'
import ProgressChart from './ProgressChart'
const HistoryModal = ({ exercise, onClose }) => {
  const { getExerciseHistory } = useWorkout()
  const history = getExerciseHistory(exercise)
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">{exercise} History</h3>
          <button
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <XIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {history.length > 0 ? (
            <>
              <div className="h-64 mb-6">
                <ProgressChart history={history} />
              </div>
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={index} className="bg-gray-750 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">
                        {entry.date}
                      </span>
                      <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        {entry.weight} lbs
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {entry.sets} sets × {entry.reps} reps
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No history available for this exercise
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default HistoryModal

```

```components/ProgressChart.tsx
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
const ProgressChart = ({ history }) => {
  // Format data for chart
  const chartData = history
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
    }))
    .reverse()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 5,
          bottom: 5,
          left: 0,
        }}
      >
        <XAxis
          dataKey="date"
          tick={{
            fill: '#9ca3af',
            fontSize: 12,
          }}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          }}
        />
        <YAxis
          tick={{
            fill: '#9ca3af',
            fontSize: 12,
          }}
          domain={['dataMin - 10', 'dataMax + 10']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            borderRadius: '0.375rem',
            color: '#f3f4f6',
          }}
          labelStyle={{
            color: '#e5e7eb',
            fontWeight: 'bold',
          }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{
            stroke: '#8b5cf6',
            strokeWidth: 2,
            r: 4,
            fill: '#1f2937',
          }}
          activeDot={{
            r: 6,
            stroke: '#8b5cf6',
            strokeWidth: 2,
            fill: '#8b5cf6',
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
export default ProgressChart

```
