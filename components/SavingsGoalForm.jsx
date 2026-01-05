'use client'

import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PiggyBank, X } from 'lucide-react'

const SavingsGoalForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    endDate: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        targetAmount: initialData.targetAmount?.toString() || '',
        endDate: initialData.endDate
          ? new Date(initialData.endDate).toISOString().split('T')[0]
          : ''
      })
    }
  }, [initialData])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required'
    }

    const amount = parseFloat(formData.targetAmount)
    if (!formData.targetAmount || isNaN(amount) || amount <= 0) {
      newErrors.targetAmount = 'Please enter a valid amount greater than 0'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    } else {
      const selectedDate = new Date(formData.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate <= today) {
        newErrors.endDate = 'End date must be in the future'
      }
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        endDate: formData.endDate
      })
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save goal' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get minimum date (tomorrow)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <PiggyBank className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            {initialData ? 'Edit Savings Goal' : 'Create Savings Goal'}
          </h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Goal Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Emergency Fund, Holiday, New Car"
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.name ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Target Amount */}
        <div>
          <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-300 mb-2">
            Target Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              £
            </span>
            <input
              type="number"
              id="targetAmount"
              value={formData.targetAmount}
              onChange={(e) => handleChange('targetAmount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full pl-8 pr-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.targetAmount ? 'border-red-500' : 'border-gray-600'
              }`}
            />
          </div>
          {errors.targetAmount && (
            <p className="mt-1 text-sm text-red-400">{errors.targetAmount}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
            Target Date
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            min={minDateString}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.endDate ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  )
}

SavingsGoalForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialData: PropTypes.shape({
    name: PropTypes.string,
    targetAmount: PropTypes.number,
    endDate: PropTypes.string
  })
}

export default SavingsGoalForm
