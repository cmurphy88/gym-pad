'use client'

import PropTypes from 'prop-types'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { TrendingUp, Activity, Scale } from 'lucide-react'
import { formatVolume, getBalanceStatus } from '@/lib/volume-analytics'

/**
 * Color palette for muscle groups
 */
const MUSCLE_COLORS = {
  Chest: '#3B82F6',      // blue
  Back: '#10B981',       // emerald
  Shoulders: '#F59E0B',  // amber
  Biceps: '#EC4899',     // pink
  Triceps: '#8B5CF6',    // purple
  Quads: '#06B6D4',      // cyan
  Hamstrings: '#F97316', // orange
  Glutes: '#EF4444',     // red
  Core: '#84CC16',       // lime
  Calves: '#6366F1',     // indigo
  Uncategorized: '#6B7280' // gray
}

/**
 * Weekly Volume Trend Chart
 */
function WeeklyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No volume data available
      </div>
    )
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatVolume(value)}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              borderColor: '#374151',
              borderRadius: '0.5rem',
              color: '#F9FAFB'
            }}
            formatter={(value) => [`${value.toLocaleString()} kg`, 'Volume']}
            labelFormatter={(label) => `Week ${label}`}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#volumeGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

WeeklyTrendChart.propTypes = {
  data: PropTypes.array
}

/**
 * Volume by Muscle Group Chart
 */
function MuscleBreakdownChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No muscle group data. Assign muscle groups in template editor.
      </div>
    )
  }

  // Convert to array and sort by volume
  const chartData = Object.entries(data)
    .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8) // Show top 8

  const maxVolume = Math.max(...chartData.map((d) => d.volume))

  return (
    <div className="space-y-2">
      {chartData.map(({ muscle, volume }) => {
        const percentage = maxVolume > 0 ? (volume / maxVolume) * 100 : 0
        const color = MUSCLE_COLORS[muscle] || MUSCLE_COLORS.Uncategorized

        return (
          <div key={muscle} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-400 truncate">{muscle}</span>
            <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
            </div>
            <span className="w-20 text-sm text-gray-300 text-right tabular-nums">
              {volume.toLocaleString()} kg
            </span>
          </div>
        )
      })}
    </div>
  )
}

MuscleBreakdownChart.propTypes = {
  data: PropTypes.object
}

/**
 * Training Balance Indicator
 */
function BalanceIndicator({ balance }) {
  if (!balance) return null

  const { push, pull, upper, lower } = balance
  const pushPullStatus = getBalanceStatus(push)
  const upperLowerStatus = getBalanceStatus(upper)

  const getStatusColor = (status) => {
    switch (status) {
      case 'balanced':
        return 'text-emerald-400'
      case 'slight':
        return 'text-yellow-400'
      default:
        return 'text-orange-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'balanced':
        return 'Balanced'
      case 'slight':
        return 'Slight imbalance'
      default:
        return 'Imbalanced'
    }
  }

  return (
    <div className="space-y-4">
      {/* Push/Pull Balance */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Push / Pull</span>
          <span className={`text-xs ${getStatusColor(pushPullStatus)}`}>
            {getStatusText(pushPullStatus)}
          </span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-800">
          <div
            className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${push}%` }}
          >
            {push > 20 && <span className="text-[10px] text-white font-medium">{push}%</span>}
          </div>
          <div
            className="bg-emerald-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${pull}%` }}
          >
            {pull > 20 && <span className="text-[10px] text-white font-medium">{pull}%</span>}
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-blue-400">Push</span>
          <span className="text-xs text-emerald-400">Pull</span>
        </div>
      </div>

      {/* Upper/Lower Balance */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Upper / Lower</span>
          <span className={`text-xs ${getStatusColor(upperLowerStatus)}`}>
            {getStatusText(upperLowerStatus)}
          </span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-800">
          <div
            className="bg-purple-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${upper}%` }}
          >
            {upper > 20 && <span className="text-[10px] text-white font-medium">{upper}%</span>}
          </div>
          <div
            className="bg-orange-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${lower}%` }}
          >
            {lower > 20 && <span className="text-[10px] text-white font-medium">{lower}%</span>}
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-purple-400">Upper</span>
          <span className="text-xs text-orange-400">Lower</span>
        </div>
      </div>
    </div>
  )
}

BalanceIndicator.propTypes = {
  balance: PropTypes.shape({
    push: PropTypes.number,
    pull: PropTypes.number,
    upper: PropTypes.number,
    lower: PropTypes.number
  })
}

/**
 * Main VolumeCharts Component
 */
function VolumeCharts({ volumeData }) {
  if (!volumeData) return null

  const { weeklyTrend, thisWeek, balance } = volumeData
  const hasData = weeklyTrend?.length > 0 || Object.keys(thisWeek?.byMuscle || {}).length > 0

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Volume Analytics</h2>
        {thisWeek && (
          <span className="ml-auto text-sm text-gray-400">
            This week: <span className="text-white font-medium">{thisWeek.total.toLocaleString()} kg</span>
            {thisWeek.workoutCount > 0 && (
              <span className="text-gray-500"> ({thisWeek.workoutCount} workouts)</span>
            )}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-6 text-center">
          <Activity className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No volume data available yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Complete workouts with assigned muscle groups to see analytics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Trend */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <h3 className="font-medium text-white">Weekly Volume Trend</h3>
            </div>
            <WeeklyTrendChart data={weeklyTrend} />
          </div>

          {/* Muscle Breakdown */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-emerald-400" />
              <h3 className="font-medium text-white">This Week by Muscle</h3>
            </div>
            <MuscleBreakdownChart data={thisWeek?.byMuscle} />
          </div>

          {/* Balance Indicator - Full width on mobile */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-4 w-4 text-purple-400" />
              <h3 className="font-medium text-white">Training Balance</h3>
            </div>
            <BalanceIndicator balance={balance} />
          </div>
        </div>
      )}
    </div>
  )
}

VolumeCharts.propTypes = {
  volumeData: PropTypes.shape({
    weeklyTrend: PropTypes.array,
    thisWeek: PropTypes.shape({
      total: PropTypes.number,
      byMuscle: PropTypes.object,
      workoutCount: PropTypes.number
    }),
    balance: PropTypes.object
  })
}

export default VolumeCharts
