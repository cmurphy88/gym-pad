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