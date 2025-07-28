'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import SessionForm from '@/components/SessionForm'
import Header from '@/components/Header'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function NewSessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templateData, setTemplateData] = useState(null)
  
  const templateId = searchParams.get('templateId')
  
  // Fetch template data if templateId is provided
  const { data: template, error, isLoading } = useSWR(
    templateId ? `/api/templates/${templateId}/latest-data` : null,
    fetcher
  )

  useEffect(() => {
    if (template && template.templateExercises) {
      // Convert template to SessionForm format
      const formattedTemplate = {
        title: template.name,
        date: new Date().toISOString().split('T')[0],
        notes: template.description || '',
        exercises: template.templateExercises.map(templateExercise => ({
          id: Date.now() + Math.random(), // Temporary ID for UI
          name: templateExercise.name || templateExercise.exerciseName,
          sets: (templateExercise.latestSets && templateExercise.latestSets.length > 0)
            ? templateExercise.latestSets 
            : Array(templateExercise.defaultSets || 3).fill(null).map(() => ({
                reps: templateExercise.defaultReps || '',
                weight: templateExercise.defaultWeight || ''
              })),
          notes: templateExercise.notes || '',
          restSeconds: templateExercise.restSeconds || 60
        }))
      }
      setTemplateData(formattedTemplate)
    }
  }, [template])

  const handleSubmit = async (workoutData) => {
    setIsSubmitting(true)
    try {
      // If we're using a template, include the templateId
      const payload = {
        ...workoutData,
        ...(templateId && { templateId: parseInt(templateId) })
      }

      const endpoint = templateId ? '/api/workouts/from-template' : '/api/workouts'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to create workout')
      }

      // Redirect back to home page after successful creation
      router.push('/')
    } catch (error) {
      console.error('Error creating workout:', error)
      // You could add error handling here (toast notification, etc.)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  // Loading state when fetching template
  if (templateId && isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading template...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state when template fetch fails
  if (templateId && error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load template</p>
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {templateId ? `New ${template?.name || 'Template'} Session` : 'New Workout Session'}
            </h1>
            <p className="text-gray-400">
              {templateId 
                ? 'Pre-filled with your latest performance data' 
                : 'Track your workout as you complete it'
              }
            </p>
          </div>
          
          <SessionForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            initialData={templateData}
          />
        </div>
      </main>
    </div>
  )
}