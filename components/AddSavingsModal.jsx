'use client'

import { useState } from 'react'
import PropTypes from 'prop-types'
import { X, Plus } from 'lucide-react'

const AddSavingsModal = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrors({ amount: 'Please enter a valid amount greater than 0' })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        amount: parsedAmount,
        note: note.trim() || null
      })
      // Reset form
      setAmount('')
      setNote('')
      setErrors({})
      onClose()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to add savings' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setNote('')
    setErrors({})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            Add Savings
          </h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                £
              </span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }))
                }}
                placeholder="0.00"
                step="0.01"
                min="0"
                autoFocus
                className={`w-full pl-8 pr-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
            )}
          </div>

          {/* Note (optional) */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-300 mb-2">
              Note <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Weekly savings, Bonus, etc."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Savings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

AddSavingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
}

export default AddSavingsModal
