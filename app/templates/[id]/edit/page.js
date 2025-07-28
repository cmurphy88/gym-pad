'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Header from '@/components/Header'
import TemplateEditor from '@/components/TemplateEditor'
import Toast from '@/components/Toast'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function EditTemplatePage({ params }) {
  const router = useRouter()
  const [templateId, setTemplateId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  // Resolve params in Next.js 15+
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setTemplateId(parseInt(resolvedParams.id))
    }
    resolveParams()
  }, [params])

  const { data: template, error, isLoading } = useSWR(
    templateId ? `/api/templates/${templateId}` : null,
    fetcher
  )

  const handleSave = async (templateData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update template')
      }

      setToast({ message: 'Template updated successfully!', type: 'success' })
      
      // Navigate back to templates page after a short delay
      setTimeout(() => {
        router.push('/templates')
      }, 1500)
    } catch (error) {
      console.error('Error updating template:', error)
      setToast({ message: error.message || 'Failed to update template', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/templates')
  }

  if (!templateId) {
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
            <p className="text-red-400 mb-4">Failed to load template</p>
            <button
              onClick={() => router.push('/templates')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Templates
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
            <p className="text-gray-400">Loading template...</p>
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
          <TemplateEditor
            template={template}
            onSave={handleSave}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
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