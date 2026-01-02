'use client'

import PropTypes from 'prop-types'
import { TrendingUp, Check, AlertCircle, HelpCircle, ChevronRight } from 'lucide-react'
import ProgressionBadge from './ProgressionBadge'
import VolumeCharts from './VolumeCharts'
import { PROGRESSION_STATUS, formatSuggestionText } from '@/lib/progression-suggestions'

/**
 * Section component for each category
 */
function CategorySection({ title, icon: Icon, iconColor, count, exercises, emptyMessage }) {
  if (exercises.length === 0) {
    return null
  }

  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="font-semibold text-white">{title}</span>
        </div>
        <span className="text-sm text-gray-400">{count}</span>
      </div>
      <div className="divide-y divide-gray-800">
        {exercises.map((exercise) => (
          <ExerciseRow key={exercise.name} exercise={exercise} />
        ))}
      </div>
    </div>
  )
}

CategorySection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  iconColor: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  exercises: PropTypes.array.isRequired,
  emptyMessage: PropTypes.string
}

/**
 * Individual exercise row
 */
function ExerciseRow({ exercise }) {
  const { name, status, shortMessage, lastSession, weightChange, suggestedWeight } = exercise

  return (
    <div className="px-4 py-3 hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{name}</span>
            <ProgressionBadge status={status} size="xs" />
          </div>
          {lastSession && (
            <p className="text-sm text-gray-400 mt-1">
              Last: {lastSession.maxWeight}kg × {lastSession.avgReps} reps
              {lastSession.avgRPE && ` @ RPE ${lastSession.avgRPE}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {status === PROGRESSION_STATUS.READY && suggestedWeight && (
            <span className="text-sm font-medium text-emerald-400 tabular-nums">
              → {suggestedWeight}kg
            </span>
          )}
          {status === PROGRESSION_STATUS.ATTENTION && (
            <span className="text-sm text-orange-400">
              {shortMessage}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  )
}

ExerciseRow.propTypes = {
  exercise: PropTypes.shape({
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    shortMessage: PropTypes.string,
    lastSession: PropTypes.object,
    weightChange: PropTypes.number,
    suggestedWeight: PropTypes.number
  }).isRequired
}

/**
 * Summary stats component
 */
function SummaryStats({ summary }) {
  const stats = [
    { label: 'Ready to Progress', value: summary.readyCount, color: 'text-emerald-400' },
    { label: 'On Track', value: summary.maintainCount, color: 'text-blue-400' },
    { label: 'Needs Attention', value: summary.attentionCount, color: 'text-orange-400' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 text-center"
        >
          <p className={`text-2xl font-bold ${stat.color} tabular-nums`}>
            {stat.value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

SummaryStats.propTypes = {
  summary: PropTypes.shape({
    readyCount: PropTypes.number.isRequired,
    maintainCount: PropTypes.number.isRequired,
    attentionCount: PropTypes.number.isRequired
  }).isRequired
}

/**
 * InsightsDashboard Component
 *
 * Displays training insights with exercises categorized by progression status.
 */
function InsightsDashboard({ data }) {
  const { summary, categories, volume } = data

  const isEmpty =
    categories.readyToProgress.length === 0 &&
    categories.maintain.length === 0 &&
    categories.needsAttention.length === 0

  if (isEmpty && categories.noData.length === 0) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Training Data</h3>
        <p className="text-gray-400">
          Complete some workouts with RPE tracking to see insights.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SummaryStats summary={summary} />

      <VolumeCharts volumeData={volume} />

      <div className="space-y-4">
        <CategorySection
          title="Ready to Progress"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          count={categories.readyToProgress.length}
          exercises={categories.readyToProgress}
          emptyMessage="No exercises ready for progression"
        />

        <CategorySection
          title="On Track"
          icon={Check}
          iconColor="text-blue-400"
          count={categories.maintain.length}
          exercises={categories.maintain}
          emptyMessage="No exercises in maintenance"
        />

        <CategorySection
          title="Needs Attention"
          icon={AlertCircle}
          iconColor="text-orange-400"
          count={categories.needsAttention.length}
          exercises={categories.needsAttention}
          emptyMessage="No exercises need attention"
        />

        {categories.noData.length > 0 && (
          <CategorySection
            title="Not Enough Data"
            icon={HelpCircle}
            iconColor="text-gray-400"
            count={categories.noData.length}
            exercises={categories.noData}
            emptyMessage=""
          />
        )}
      </div>
    </div>
  )
}

InsightsDashboard.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.object.isRequired,
    categories: PropTypes.shape({
      readyToProgress: PropTypes.array.isRequired,
      maintain: PropTypes.array.isRequired,
      needsAttention: PropTypes.array.isRequired,
      noData: PropTypes.array.isRequired
    }).isRequired,
    volume: PropTypes.object
  }).isRequired
}

export default InsightsDashboard
