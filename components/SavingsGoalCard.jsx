'use client'

import PropTypes from 'prop-types'
import { PiggyBank, Calendar, TrendingUp, Pencil, Trash2, Plus } from 'lucide-react'
import { calculateSavingsTargets, formatCurrency } from '@/lib/savings-calculations'

const SavingsGoalCard = ({ goal, onEdit, onDelete, onAddSavings }) => {
  const targets = calculateSavingsTargets(
    goal.targetAmount,
    goal.currentBalance,
    goal.endDate
  )

  const progressPercentage = Math.min(100, Math.max(0, targets.progress))

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <PiggyBank className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{goal.name}</h2>
            <p className="text-sm text-gray-400">
              Target: {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit goal"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold text-white">
            {formatCurrency(goal.currentBalance)}
          </span>
          <span className="text-lg font-medium text-emerald-400">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              targets.isComplete
                ? 'bg-emerald-500'
                : targets.isPastDue
                ? 'bg-red-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>Saved</span>
          <span>{formatCurrency(goal.targetAmount)}</span>
        </div>
      </div>

      {/* Status Messages */}
      {targets.isComplete && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
          <p className="text-emerald-400 font-medium text-center">
            Goal achieved! You did it!
          </p>
        </div>
      )}
      {targets.isPastDue && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 font-medium text-center">
            Target date has passed. {formatCurrency(targets.remaining)} remaining.
          </p>
        </div>
      )}

      {/* Savings Targets */}
      {!targets.isComplete && !targets.isPastDue && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Need to save:</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-white">
                {formatCurrency(targets.perDay)}
              </p>
              <p className="text-xs text-gray-400">per day</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-white">
                {formatCurrency(targets.perWeek)}
              </p>
              <p className="text-xs text-gray-400">per week</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-white">
                {formatCurrency(targets.perMonth)}
              </p>
              <p className="text-xs text-gray-400">per month</p>
            </div>
          </div>
        </div>
      )}

      {/* Days Remaining */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Target date:</span>
        </div>
        <div className="text-right">
          <span className="text-white">
            {new Date(goal.endDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          {targets.daysRemaining > 0 && (
            <span className="text-gray-400 ml-2">
              ({targets.daysRemaining} days left)
            </span>
          )}
        </div>
      </div>

      {/* Add Savings Button */}
      <button
        onClick={onAddSavings}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Savings
      </button>
    </div>
  )
}

SavingsGoalCard.propTypes = {
  goal: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    targetAmount: PropTypes.number.isRequired,
    currentBalance: PropTypes.number.isRequired,
    endDate: PropTypes.string.isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddSavings: PropTypes.func.isRequired
}

export default SavingsGoalCard
