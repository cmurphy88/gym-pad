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
  ChevronRightIcon,
} from 'lucide-react'

const fetcher = (url) => fetch(url).then((res) => res.json())

const TemplateSelector = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const {
    data: templates,
    error,
    isLoading,
  } = useSWR(isOpen ? '/api/templates' : null, fetcher)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="bg-[#1c1c1e] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4 border border-[#3a3a3c]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Choose Template</h2>
            <p className="text-text-muted mt-1">
              Select a template or start with a blank session
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-text-muted">Loading templates...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Failed to load templates</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors min-h-[44px]"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Blank Session Option */}
              <div
                onClick={() => handleTemplateSelect(null)}
                className="group p-4 bg-[#2c2c2e] rounded-xl border border-[#3a3a3c] hover:border-blue-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#3a3a3c] rounded-lg group-hover:bg-blue-500 transition-colors">
                      <PlusIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">
                        Blank Session
                      </h3>
                      <p className="text-sm text-text-muted">
                        Start with an empty workout
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-text-muted group-hover:text-accent" />
                </div>
              </div>

              {/* Template Options */}
              {templates &&
                templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="group p-4 bg-[#2c2c2e] rounded-xl border border-[#3a3a3c] hover:border-blue-500 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#3a3a3c] rounded-lg group-hover:bg-blue-500 transition-colors">
                          <DumbbellIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-text-primary">
                              {template.name}
                            </h3>
                            {template.isDefault && (
                              <span className="px-2 py-1 bg-accent/20 text-blue-300 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-text-muted mt-1">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                            <div className="flex items-center gap-1">
                              <FileTextIcon className="h-3 w-3" />
                              <span>
                                {template.templateExercises.length} exercises
                              </span>
                            </div>
                            {template.templateExercises.some(
                              (ex) => ex.restSeconds
                            ) && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                <span>Rest times included</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-text-muted group-hover:text-accent" />
                    </div>

                    {/* Exercise Preview */}
                    {template.templateExercises.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#3a3a3c]">
                        <div className="flex flex-wrap gap-2">
                          {template.templateExercises
                            .slice(0, 4)
                            .map((exercise) => (
                              <span
                                key={exercise.id}
                                className="px-2 py-1 bg-[#3a3a3c] text-gray-300 text-xs rounded"
                              >
                                {exercise.exerciseName}
                              </span>
                            ))}
                          {template.templateExercises.length > 4 && (
                            <span className="px-2 py-1 bg-[#3a3a3c] text-gray-400 text-xs rounded">
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
                className="group p-4 bg-[#2c2c2e] rounded-xl border border-[#3a3a3c] border-dashed hover:border-blue-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#3a3a3c] rounded-lg group-hover:bg-blue-500 transition-colors">
                      <PlusIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">
                        Create New Template
                      </h3>
                      <p className="text-sm text-text-muted">
                        Build a custom workout template
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-text-muted group-hover:text-accent" />
                </div>
              </div>

              {/* Manage Templates Option */}
              <div
                onClick={() => {
                  router.push('/templates')
                  onClose()
                }}
                className="group p-4 bg-[#2c2c2e] rounded-xl border border-[#3a3a3c] border-dashed hover:border-blue-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#3a3a3c] rounded-lg group-hover:bg-blue-500 transition-colors">
                      <FileTextIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">
                        Manage All Templates
                      </h3>
                      <p className="text-sm text-text-muted">
                        View, edit, and organize templates
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-text-muted group-hover:text-accent" />
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
  onClose: PropTypes.func.isRequired,
}

export default TemplateSelector
