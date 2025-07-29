'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import WeightTracker from '@/components/WeightTracker'
import AuthForm from '@/components/AuthForm'

// Fetcher function for SWR
const fetcher = (url) => fetch(url, { credentials: 'include' }).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
})

export default function WeightPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  // Fetch weight entries data using SWR, but only if authenticated
  const { data: weightEntries, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/weight' : null, 
    fetcher
  )

  const handleAddWeight = useCallback(async (weightData) => {
    try {
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(weightData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add weight entry')
      }

      // Refresh the data
      await mutate()
    } catch (error) {
      console.error('Error adding weight:', error)
      throw error
    }
  }, [mutate])

  const handleDeleteWeight = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/weight/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete weight entry')
      }

      // Refresh the data
      await mutate()
    } catch (error) {
      console.error('Error deleting weight:', error)
      throw error
    }
  }, [mutate])

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
            Error loading weight data. Please try again.
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <WeightTracker 
          weightEntries={weightEntries || []}
          isLoading={isLoading}
          onAddWeight={handleAddWeight}
          onDeleteWeight={handleDeleteWeight}
        />
      </main>
    </div>
  )
}