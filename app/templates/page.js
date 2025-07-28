'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Header from '@/components/Header'
import TemplateCard from '@/components/TemplateCard'
import { PlusIcon, ArrowLeftIcon } from 'lucide-react'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function TemplatesPage() {
  const router = useRouter()
  const [deletingTemplate, setDeletingTemplate] = useState(null)

  const { data: templates, error, isLoading, mutate } = useSWR('/api/templates', fetcher)

  const handleBack = () => {
    router.push('/')
  }

  const handleCreateNew = () => {
    router.push('/templates/new')
  }

  const handleEdit = (template) => {
    router.push(`/templates/${template.id}/edit`)
  }

  const handleDelete = async (template) => {
    if (template.isDefault) {
      alert('Cannot delete default templates')
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete the "${template.name}" template? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingTemplate(template.id)
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      // Refresh the templates list
      mutate()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    } finally {
      setDeletingTemplate(null)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load templates</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Retry
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
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Workout Templates</h1>
                <p className="text-gray-400 mt-1">Manage your workout templates</p>
              </div>
            </div>
            
            <button
              onClick={handleCreateNew}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => handleEdit(template)}
                  onDelete={() => handleDelete(template)}
                  isDeleting={deletingTemplate === template.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No templates found</p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Create Your First Template
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}