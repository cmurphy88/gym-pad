'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import HistoryModal from '@/components/HistoryModal'
import AuthForm from '@/components/AuthForm'

// Fetcher function for SWR
const fetcher = (url) => fetch(url, { credentials: 'include' }).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
})

export default function HomePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Fetch workouts data using SWR, but only if authenticated
  const { data: workouts, error, isLoading } = useSWR(
    isAuthenticated ? '/api/workouts' : null, 
    fetcher
  )

  const openHistoryModal = (exercise) => {
    setSelectedExercise(exercise)
    setIsHistoryModalOpen(true)
  }

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false)
    setSelectedExercise(null)
  }

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-gray-100">Loading...</div>
      </div>
    )
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm />
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