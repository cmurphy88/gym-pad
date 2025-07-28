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
 * ProgressChart component displaying exercise progress over time
 * @param {Object} props
 * @param {Array} props.history - Array of exercise history entries
 */
const ProgressChart = ({ history }) => {
  // Format data for chart
  const chartData = history
    .map((entry) => {
      // Handle new format with sets array
      let maxWeight, totalVolume;
      
      if (entry.sets && Array.isArray(entry.sets)) {
        // New format: extract max weight and calculate volume
        maxWeight = Math.max(...entry.sets.map(set => set.weight || 0));
        totalVolume = entry.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
      } else {
        // Fallback for old format or API summary data
        maxWeight = entry.maxWeight || entry.weight || 0;
        totalVolume = entry.totalVolume || 0;
      }
      
      return {
        date: entry.date,
        maxWeight,
        totalVolume,
        displayDate: new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      };
    })
    .reverse() // Show oldest to newest for proper trend

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
          formatter={(value, name) => [`${value} lbs`, 'Weight']}
        />
        <Line
          type="monotone"
          dataKey="maxWeight"
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

ProgressChart.propTypes = {
  history: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      sets: PropTypes.arrayOf(
        PropTypes.shape({
          weight: PropTypes.number,
          reps: PropTypes.number.isRequired,
        })
      ),
      // Fallback properties for backwards compatibility
      maxWeight: PropTypes.number,
      weight: PropTypes.number,
      totalVolume: PropTypes.number,
    })
  ).isRequired,
}

export default ProgressChart