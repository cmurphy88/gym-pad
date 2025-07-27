import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const ProgressChart = ({ history }) => {
  // Format data for chart
  const chartData = history
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
    }))
    .reverse()

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
          dataKey="date"
          tick={{
            fill: '#9ca3af',
            fontSize: 12,
          }}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          }}
        />
        <YAxis
          tick={{
            fill: '#9ca3af',
            fontSize: 12,
          }}
          domain={['dataMin - 10', 'dataMax + 10']}
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

export default ProgressChart