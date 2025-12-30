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
    <div className="bg-surface rounded-2xl border border-border hover:border-accent/50 transition-all shadow-lg overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-elevated rounded-lg">
              <DumbbellIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-primary">{template.name}</h3>
                {template.isDefault && (
                  <span className="px-2 py-1 bg-accent/20 text-blue-300 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-sm text-text-muted mt-1">{template.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-text-muted">
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
                  className="px-2 py-1 bg-surface-elevated text-text-secondary text-xs rounded"
                >
                  {exercise.exerciseName}
                </span>
              ))}
              {template.templateExercises.length > 3 && (
                <span className="px-2 py-1 bg-surface-elevated text-text-muted text-xs rounded">
                  +{template.templateExercises.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-surface-elevated hover:bg-surface-highlight text-text-primary rounded-lg transition-colors min-h-[44px]"
            disabled={isDeleting}
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </button>

          <button
            onClick={onDelete}
            disabled={template.isDefault || isDeleting}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg transition-colors min-h-[44px] ${
              template.isDefault
                ? 'bg-surface-highlight text-text-muted cursor-not-allowed'
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