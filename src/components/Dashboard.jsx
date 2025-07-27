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