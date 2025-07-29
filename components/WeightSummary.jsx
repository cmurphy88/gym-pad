import React from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/navigation'
import { ScaleIcon, TrendingUpIcon, TrendingDownIcon, TargetIcon } from 'lucide-react'
import useSWR from 'swr'

// Fetcher function for SWR
const fetcher = (url) => fetch(url, { credentials: 'include' }).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
})

/**
 * WeightSummary component displaying recent weight information
 */
const WeightSummary = () => {
  const router = useRouter()
  const { data: weightEntries, error, isLoading } = useSWR('/api/weight', fetcher)
  const { data: weightGoal } = useSWR('/api/weight/goal', fetcher)

  if (isLoading || error || !weightEntries || weightEntries.length === 0) {
    return null // Don't show anything if there's no data
  }

  // Sort entries by date (most recent first)
  const sortedEntries = [...weightEntries].sort((a, b) => new Date(b.date) - new Date(a.date))
  const latestEntry = sortedEntries[0]
  const previousEntry = sortedEntries[1]

  // Calculate trend
  let trend = null
  let trendIcon = null
  let trendColor = 'text-gray-400'
  
  if (previousEntry) {
    const difference = latestEntry.weight - previousEntry.weight
    if (Math.abs(difference) >= 0.1) { // Only show trend if difference is significant
      trend = difference > 0 ? `+${difference.toFixed(1)} kg` : `${difference.toFixed(1)} kg`
      trendIcon = difference > 0 ? TrendingUpIcon : TrendingDownIcon
      trendColor = difference > 0 ? 'text-orange-400' : 'text-green-400'
    }
  }

  // Calculate goal progress
  let goalProgress = null
  let goalDistance = null
  let goalPercentage = null
  
  if (weightGoal) {
    goalDistance = weightGoal.targetWeight - latestEntry.weight
    const isLosing = weightGoal.goalType === 'lose'
    
    if (isLosing) {
      // For weight loss: goal reached when current weight <= target weight (goalDistance >= 0)
      goalProgress = goalDistance >= 0 ? 'Goal Reached!' : `${Math.abs(goalDistance).toFixed(1)} kg to lose`
    } else {
      // For weight gain: goal reached when current weight >= target weight (goalDistance <= 0)
      goalProgress = goalDistance <= 0 ? 'Goal Reached!' : `${Math.abs(goalDistance).toFixed(1)} kg to gain`
    }
    
    // Calculate percentage progress (rough estimate)
    if (weightEntries.length > 1) {
      const startWeight = sortedEntries[sortedEntries.length - 1].weight
      const totalDistance = Math.abs(weightGoal.targetWeight - startWeight)
      const progressMade = Math.abs(latestEntry.weight - startWeight)
      goalPercentage = totalDistance > 0 ? Math.min(100, (progressMade / totalDistance) * 100) : 0
    }
  }

  const handleClick = () => {
    router.push('/weight')
  }

  return (
    <div 
      onClick={handleClick}
      className="bg-gray-800 rounded-xl p-5 cursor-pointer hover:bg-gray-750 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ScaleIcon className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-white">Weight</h3>
        </div>
        {trend && trendIcon && (
          <div className={`flex items-center space-x-1 ${trendColor}`}>
            {React.createElement(trendIcon, { className: "h-4 w-4" })}
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="text-2xl font-bold text-white">{latestEntry.weight} kg</div>
          <div className="text-sm text-gray-400">
            {new Date(latestEntry.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
        
        {goalProgress ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TargetIcon className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">{goalProgress}</span>
            </div>
            {goalPercentage !== null && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goalPercentage}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            {weightEntries.length} {weightEntries.length === 1 ? 'entry' : 'entries'} total
          </div>
        )}
      </div>
    </div>
  )
}

WeightSummary.propTypes = {}

export default WeightSummary