'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Header from '@/components/Header'
import SavingsGoalCard from '@/components/SavingsGoalCard'
import SavingsGoalForm from '@/components/SavingsGoalForm'
import AddSavingsModal from '@/components/AddSavingsModal'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import { Loader2, Plus } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const LifePage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)
  const [addModalGoalId, setAddModalGoalId] = useState(null)

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/savings-goals' : null,
    fetcher
  )

  const goals = data?.goals || []

  // Handle create new goal
  const handleCreateGoal = async (formData) => {
    const response = await fetch('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create goal')
    }

    await mutate()
    setShowNewGoalForm(false)
  }

  // Handle update existing goal
  const handleUpdateGoal = async (goalId, formData) => {
    const response = await fetch(`/api/savings-goals/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update goal')
    }

    await mutate()
    setEditingGoalId(null)
  }

  // Handle delete goal
  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this savings goal? All transaction history will be lost.')) {
      return
    }

    const response = await fetch(`/api/savings-goals/${goalId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to delete goal')
    }

    await mutate()
  }

  // Handle add savings transaction
  const handleAddSavings = async (goalId, transactionData) => {
    const response = await fetch(`/api/savings-goals/${goalId}/transactions`, {
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
    setAddModalGoalId(null)
  }

  // Handle update transaction
  const handleUpdateTransaction = async (goalId, transactionId, transactionData) => {
    const response = await fetch(`/api/savings-goals/${goalId}/transactions/${transactionId}`, {
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
  const handleDeleteTransaction = async (goalId, transactionId) => {
    const response = await fetch(`/api/savings-goals/${goalId}/transactions/${transactionId}`, {
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
              <p className="text-red-400">Failed to load savings goals. Please try again.</p>
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Life</h1>
            {goals.length > 0 && !showNewGoalForm && (
              <button
                onClick={() => setShowNewGoalForm(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Goal
              </button>
            )}
          </div>

          {/* Savings Goals Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Savings Goals</h2>

            {/* New Goal Form */}
            {showNewGoalForm && (
              <div className="mb-6">
                <SavingsGoalForm
                  onSubmit={handleCreateGoal}
                  onCancel={() => setShowNewGoalForm(false)}
                />
              </div>
            )}

            {/* No goals - show create form */}
            {goals.length === 0 && !showNewGoalForm && (
              <SavingsGoalForm onSubmit={handleCreateGoal} />
            )}

            {/* Goals list */}
            {goals.length > 0 && (
              <div className="space-y-6">
                {goals.map((goal) => (
                  editingGoalId === goal.id ? (
                    <SavingsGoalForm
                      key={goal.id}
                      onSubmit={(formData) => handleUpdateGoal(goal.id, formData)}
                      onCancel={() => setEditingGoalId(null)}
                      initialData={goal}
                    />
                  ) : (
                    <SavingsGoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => setEditingGoalId(goal.id)}
                      onDelete={() => handleDeleteGoal(goal.id)}
                      onAddSavings={() => setAddModalGoalId(goal.id)}
                      onUpdateTransaction={(transactionId, data) =>
                        handleUpdateTransaction(goal.id, transactionId, data)
                      }
                      onDeleteTransaction={(transactionId) =>
                        handleDeleteTransaction(goal.id, transactionId)
                      }
                    />
                  )
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add Savings Modal */}
      <AddSavingsModal
        isOpen={addModalGoalId !== null}
        onClose={() => setAddModalGoalId(null)}
        onSubmit={(transactionData) => handleAddSavings(addModalGoalId, transactionData)}
      />
    </div>
  )
}

export default LifePage
