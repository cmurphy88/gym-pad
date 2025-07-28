'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import TemplateEditor from '@/components/TemplateEditor'
import Toast from '@/components/Toast'

export default function NewTemplatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSave = async (templateData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create template')
      }

      setToast({ message: 'Template created successfully!', type: 'success' })
      
      // Navigate back to templates page after a short delay
      setTimeout(() => {
        router.push('/templates')
      }, 1500)
    } catch (error) {
      console.error('Error creating template:', error)
      setToast({ message: error.message || 'Failed to create template', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/templates')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <TemplateEditor
            template={null}
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