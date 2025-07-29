import React from 'react'
import PropTypes from 'prop-types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/**
 * WeightChart component displaying weight progress over time
 * @param {Object} props
 * @param {Array} props.weightEntries - Array of weight entries
 */
const WeightChart = ({ weightEntries }) => {
  // Format data for chart
  const chartData = weightEntries
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
      displayDate: new Date(entry.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort chronologically for proper trend

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No weight data to display</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 5,
          bottom: 5,
          left: 0,
        }}
      >
        <XAxis
          dataKey="displayDate"
          tick={{
            fill: '#9ca3af',
            fontSize: 12,
          }}
        />
        <YAxis
          tick={{
            fill: '#9ca3af',
            fontSize: 12,
          }}
          domain={['dataMin - 2', 'dataMax + 2']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            borderRadius: '0.375rem',
            color: '#f3f4f6',
          }}
          labelStyle={{
            color: '#e5e7eb',
            fontWeight: 'bold',
          }}
          formatter={(value, name) => [`${value} kg`, 'Weight']}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{
            stroke: '#8b5cf6',
            strokeWidth: 2,
            r: 4,
            fill: '#1f2937',
          }}
          activeDot={{
            r: 6,
            stroke: '#8b5cf6',
            strokeWidth: 2,
            fill: '#8b5cf6',
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

WeightChart.propTypes = {
  weightEntries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      weight: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default WeightChart