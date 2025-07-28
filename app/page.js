'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import HistoryModal from '@/components/HistoryModal'

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json())

export default function HomePage() {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Fetch workouts data using SWR
  const { data: workouts, error, isLoading } = useSWR('/api/workouts', fetcher)

  const openHistoryModal = (exercise) => {
    setSelectedExercise(exercise)
    setIsHistoryModalOpen(true)
  }

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false)
    setSelectedExercise(null)
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="text-center text-red-400">
            Error loading workouts. Please try again.
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <Dashboard 
          workouts={workouts || []}
          isLoading={isLoading}
          openHistoryModal={openHistoryModal} 
        />
      </main>
      {isHistoryModalOpen && (
        <HistoryModal
          exercise={selectedExercise}
          onClose={closeHistoryModal}
        />
      )}
    </div>
  )
}