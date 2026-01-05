'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Header from '@/components/Header'
import SavingsGoalCard from '@/components/SavingsGoalCard'
import SavingsGoalForm from '@/components/SavingsGoalForm'
import SavingsHistory from '@/components/SavingsHistory'
import AddSavingsModal from '@/components/AddSavingsModal'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import { Loader2 } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const LifePage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/savings-goal' : null,
    fetcher
  )

  const goal = data?.goal

  // Handle create/update goal
  const handleSubmitGoal = async (formData) => {
    const method = goal && !isEditing ? 'POST' : goal ? 'PUT' : 'POST'

    const response = await fetch('/api/savings-goal', {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save goal')
    }

    await mutate()
    setIsEditing(false)
  }

  // Handle delete goal
  const handleDeleteGoal = async () => {
    if (!window.confirm('Are you sure you want to delete this savings goal? All transaction history will be lost.')) {
      return
    }

    const response = await fetch('/api/savings-goal', {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to delete goal')
    }

    await mutate()
  }

  // Handle add savings transaction
  const handleAddSavings = async (transactionData) => {
    const response = await fetch('/api/savings-goal/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transactionData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add savings')
    }

    await mutate()
  }

  // Handle update transaction
  const handleUpdateTransaction = async (transactionId, transactionData) => {
    const response = await fetch(`/api/savings-goal/transactions/${transactionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transactionData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update transaction')
    }

    await mutate()
  }

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    const response = await fetch(`/api/savings-goal/transactions/${transactionId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to delete transaction')
    }

    await mutate()
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </main>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto max-w-md">
            <AuthForm />
          </div>
        </main>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">Failed to load savings goal. Please try again.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-6">Life</h1>

          {/* Savings Goal Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Savings Goal</h2>

            {!goal && !isEditing ? (
              // No goal - show create form
              <SavingsGoalForm onSubmit={handleSubmitGoal} />
            ) : isEditing ? (
              // Editing existing goal
              <SavingsGoalForm
                onSubmit={handleSubmitGoal}
                onCancel={() => setIsEditing(false)}
                initialData={goal}
              />
            ) : (
              // Show goal card and history
              <div className="space-y-6">
                <SavingsGoalCard
                  goal={goal}
                  onEdit={() => setIsEditing(true)}
                  onDelete={handleDeleteGoal}
                  onAddSavings={() => setShowAddModal(true)}
                />

                <SavingsHistory
                  transactions={goal.transactions}
                  onUpdate={handleUpdateTransaction}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add Savings Modal */}
      <AddSavingsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSavings}
      />
    </div>
  )
}

export default LifePage
