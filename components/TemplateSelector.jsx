import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { 
  PlusIcon, 
  XIcon, 
  DumbbellIcon, 
  ClockIcon, 
  FileTextIcon,
  ChevronRightIcon 
} from 'lucide-react'

const fetcher = (url) => fetch(url).then((res) => res.json())

const TemplateSelector = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  
  const { data: templates, error, isLoading } = useSWR(
    isOpen ? '/api/templates' : null,
    fetcher
  )

  const handleTemplateSelect = (template) => {
    if (template) {
      // Navigate to new session with template
      router.push(`/new-session?templateId=${template.id}`)
    } else {
      // Navigate to blank session
      router.push('/new-session')
    }
    onClose()
  }

  const handleCreateTemplate = () => {
    router.push('/templates/new')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose Template</h2>
            <p className="text-gray-400 mt-1">Select a template or start with a blank session</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading templates...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Failed to load templates</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Blank Session Option */}
              <div
                onClick={() => handleTemplateSelect(null)}
                className="group p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-600 rounded-lg group-hover:bg-purple-600 transition-colors">
                      <PlusIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Blank Session</h3>
                      <p className="text-sm text-gray-400">Start with an empty workout</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-400" />
                </div>
              </div>

              {/* Template Options */}
              {templates && templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="group p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-600 rounded-lg group-hover:bg-purple-600 transition-colors">
                        <DumbbellIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-white">{template.name}</h3>
                          {template.isDefault && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <FileTextIcon className="h-3 w-3" />
                            <span>{template.templateExercises.length} exercises</span>
                          </div>
                          {template.templateExercises.some(ex => ex.restSeconds) && (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>Rest times included</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-400" />
                  </div>

                  {/* Exercise Preview */}
                  {template.templateExercises.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex flex-wrap gap-2">
                        {template.templateExercises.slice(0, 4).map((exercise) => (
                          <span
                            key={exercise.id}
                            className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded"
                          >
                            {exercise.exerciseName}
                          </span>
                        ))}
                        {template.templateExercises.length > 4 && (
                          <span className="px-2 py-1 bg-gray-600 text-gray-400 text-xs rounded">
                            +{template.templateExercises.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Create New Template Option */}
              <div
                onClick={handleCreateTemplate}
                className="group p-4 bg-gray-700 rounded-lg border border-gray-600 border-dashed hover:border-purple-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-600 rounded-lg group-hover:bg-purple-600 transition-colors">
                      <PlusIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Create New Template</h3>
                      <p className="text-sm text-gray-400">Build a custom workout template</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-400" />
                </div>
              </div>

              {/* Manage Templates Option */}
              <div
                onClick={() => { router.push('/templates'); onClose(); }}
                className="group p-4 bg-gray-700 rounded-lg border border-gray-600 border-dashed hover:border-blue-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-600 rounded-lg group-hover:bg-blue-600 transition-colors">
                      <FileTextIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Manage All Templates</h3>
                      <p className="text-sm text-gray-400">View, edit, and organize templates</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

TemplateSelector.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default TemplateSelector