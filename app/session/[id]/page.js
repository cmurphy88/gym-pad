'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Header from '@/components/Header'
import SessionDetail from '@/components/SessionDetail'
import EditableSessionForm from '@/components/EditableSessionForm'
import Toast from '@/components/Toast'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function SessionPage({ params }) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [toast, setToast] = useState(null)

  // Resolve params in Next.js 15+
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setSessionId(parseInt(resolvedParams.id))
    }
    resolveParams()
  }, [params])

  const { data: session, error, isLoading, mutate } = useSWR(
    sessionId ? `/api/workouts/${sessionId}` : null,
    fetcher
  )

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      )
      if (!confirmed) return
    }
    
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }

  const handleSave = async (updatedSession) => {
    try {
      const response = await fetch(`/api/workouts/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSession),
      })

      if (!response.ok) {
        throw new Error('Failed to update session')
      }

      const savedSession = await response.json()
      
      // Update the local cache
      mutate(savedSession, false)
      
      setIsEditing(false)
      setHasUnsavedChanges(false)
      
      // Show success toast
      setToast({ message: 'Session updated successfully!', type: 'success' })
    } catch (error) {
      console.error('Error updating session:', error)
      setToast({ message: 'Failed to update session. Please try again.', type: 'error' })
    }
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) return
    }
    
    router.push('/')
  }

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (!sessionId) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load session</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading session...</p>
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
          {isEditing ? (
            <EditableSessionForm
              session={session}
              onSave={handleSave}
              onCancel={handleCancelEdit}
              onUnsavedChanges={setHasUnsavedChanges}
            />
          ) : (
            <SessionDetail
              session={session}
              onEdit={handleEdit}
              onBack={handleBack}
            />
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}