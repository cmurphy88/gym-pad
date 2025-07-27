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

export default App
