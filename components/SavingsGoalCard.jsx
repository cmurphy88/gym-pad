'use client'

import { useState } from 'react'
import PropTypes from 'prop-types'
import { PiggyBank, Calendar, TrendingUp, Pencil, Trash2, Plus, ChevronDown, ChevronUp, Target } from 'lucide-react'
import { calculateSavingsTargets, calculateSavingsStatus, calculateSavingRate, predictGoalCompletion, formatCurrency } from '@/lib/savings-calculations'
import SavingsHistory from '@/components/SavingsHistory'

const SavingsGoalCard = ({ goal, onEdit, onDelete, onAddSavings, onUpdateTransaction, onDeleteTransaction }) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)

  const targets = calculateSavingsTargets(
    goal.targetAmount,
    goal.currentBalance,
    goal.endDate
  )

  const status = calculateSavingsStatus(
    goal.targetAmount,
    goal.currentBalance,
    goal.createdAt,
    goal.endDate
  )

  // Calculate saving rate and prediction
  const savingRate = calculateSavingRate(goal.transactions)
  const prediction = predictGoalCompletion(
    goal.targetAmount,
    goal.currentBalance,
    savingRate.ratePerDay,
    goal.endDate
  )

  const progressPercentage = Math.min(100, Math.max(0, targets.progress))

  // Status color classes mapping
  const statusColorClasses = {
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400'
  }[status.color]

  const transactionCount = goal.transactions?.length || 0

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

        {/* Status Indicator */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClasses}`}>
              {status.status}
            </span>
            {status.status !== 'Complete' && (
              <span className="text-sm text-gray-400">
                Expected: {formatCurrency(status.expectedByNow)} by today
              </span>
            )}
          </div>
          {status.catchUpAmount > 0 && (
            <span className="text-sm text-red-400 font-medium">
              Catch up: {formatCurrency(status.catchUpAmount)}
            </span>
          )}
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

      {/* Prediction Section - At your current rate */}
      {!targets.isComplete && savingRate.hasEnoughData && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">At your current rate:</span>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
            {/* Current Rate */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Saving</span>
              <span className={`text-lg font-semibold ${
                savingRate.ratePerDay > 0 ? 'text-emerald-400' : savingRate.ratePerDay < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {formatCurrency(Math.abs(savingRate.ratePerDay))}/day
                {savingRate.ratePerDay < 0 && <span className="text-xs ml-1">(losing)</span>}
              </span>
            </div>

            {/* Predicted Date - On Track */}
            {prediction.status === 'on_track' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Predicted completion</span>
                <div className="text-right">
                  <span className="text-emerald-400 font-medium">
                    {new Date(prediction.predictedDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  {prediction.daysBeforeDeadline > 0 && (
                    <span className="text-sm text-emerald-400/70 ml-2">
                      ({prediction.daysBeforeDeadline} days early)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Predicted Date - Will Miss Target */}
            {prediction.status === 'will_miss_target' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Predicted completion</span>
                <div className="text-right">
                  <span className="text-amber-400 font-medium">
                    {new Date(prediction.predictedDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-sm text-red-400 ml-2">
                    ({prediction.daysAfterDeadline} days late)
                  </span>
                </div>
              </div>
            )}

            {/* No Progress State */}
            {prediction.status === 'no_progress' && (
              <div className="text-amber-400 text-sm">
                No net savings yet - add deposits to see your predicted completion date
              </div>
            )}

            {/* Losing Money State */}
            {prediction.status === 'losing_money' && (
              <div className="text-red-400 text-sm">
                Withdrawals exceed deposits - add more savings to reach your goal
              </div>
            )}
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

      {/* Collapsible Transaction History */}
      {transactionCount > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <button
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="w-full flex items-center justify-between text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">
              Transaction History ({transactionCount})
            </span>
            {isHistoryExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isHistoryExpanded && (
            <div className="mt-3">
              <SavingsHistory
                transactions={goal.transactions}
                onUpdate={onUpdateTransaction}
                onDelete={onDeleteTransaction}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

SavingsGoalCard.propTypes = {
  goal: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    targetAmount: PropTypes.number.isRequired,
    currentBalance: PropTypes.number.isRequired,
    endDate: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    transactions: PropTypes.array
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddSavings: PropTypes.func.isRequired,
  onUpdateTransaction: PropTypes.func,
  onDeleteTransaction: PropTypes.func
}

export default SavingsGoalCard
