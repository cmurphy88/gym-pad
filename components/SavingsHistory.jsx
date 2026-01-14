'use client'

import { useState } from 'react'
import PropTypes from 'prop-types'
import { History, Pencil, Trash2, X, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/savings-calculations'

const SavingsHistory = ({ transactions, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        </div>
        <p className="text-gray-400 text-center py-4">
          No transactions yet. Add your first savings!
        </p>
      </div>
    )
  }

  const startEdit = (transaction) => {
    setEditingId(transaction.id)
    setEditAmount(transaction.amount.toString())
    setEditNote(transaction.note || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditAmount('')
    setEditNote('')
  }

  const handleUpdate = async (transactionId) => {
    const parsedAmount = parseFloat(editAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(transactionId, {
        amount: parsedAmount,
        note: editNote.trim() || null
      })
      cancelEdit()
    } catch (error) {
      console.error('Failed to update transaction:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await onDelete(transactionId)
      } catch (error) {
        console.error('Failed to delete transaction:', error)
      }
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <History className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        <span className="text-sm text-gray-400">({transactions.length})</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg group"
          >
            {editingId === transaction.id ? (
              // Edit mode
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-shrink-0 w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    £
                  </span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-6 pr-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="flex-1 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleUpdate(transaction.id)}
                  disabled={isUpdating}
                  className="p-1.5 text-emerald-400 hover:bg-gray-600 rounded transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1.5 text-gray-400 hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // View mode
              <>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-sm text-gray-400 flex-shrink-0 w-20">
                    {new Date(transaction.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <span className={`font-medium flex-shrink-0 ${
                    transaction.type === 'WITHDRAWAL' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {transaction.type === 'WITHDRAWAL' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </span>
                  {transaction.note && (
                    <span className="text-gray-400 text-sm truncate">
                      {transaction.note}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(transaction)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

SavingsHistory.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      amount: PropTypes.number.isRequired,
      type: PropTypes.oneOf(['DEPOSIT', 'WITHDRAWAL']),
      note: PropTypes.string,
      date: PropTypes.string.isRequired
    })
  ),
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}

export default SavingsHistory
