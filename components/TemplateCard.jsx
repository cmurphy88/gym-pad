import React from 'react'
import PropTypes from 'prop-types'
import { 
  EditIcon, 
  TrashIcon, 
  DumbbellIcon, 
  ClockIcon, 
  FileTextIcon,
  LoaderIcon 
} from 'lucide-react'

const TemplateCard = ({ template, onEdit, onDelete, isDeleting }) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all shadow-lg overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-700 rounded-lg">
              <DumbbellIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                {template.isDefault && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-sm text-gray-400 mt-1">{template.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FileTextIcon className="h-3 w-3" />
            <span>{template.templateExercises?.length || 0} exercises</span>
          </div>
          {template.templateExercises?.some(ex => ex.restSeconds) && (
            <div className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              <span>Rest times included</span>
            </div>
          )}
        </div>

        {/* Exercise Preview */}
        {template.templateExercises && template.templateExercises.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {template.templateExercises.slice(0, 3).map((exercise) => (
                <span
                  key={exercise.id}
                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                >
                  {exercise.exerciseName}
                </span>
              ))}
              {template.templateExercises.length > 3 && (
                <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                  +{template.templateExercises.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            disabled={isDeleting}
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          
          <button
            onClick={onDelete}
            disabled={template.isDefault || isDeleting}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg transition-colors ${
              template.isDefault
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isDeleting ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

TemplateCard.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    isDefault: PropTypes.bool,
    templateExercises: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        exerciseName: PropTypes.string.isRequired,
        restSeconds: PropTypes.number,
      })
    ),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
}

export default TemplateCard