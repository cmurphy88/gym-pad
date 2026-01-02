'use client'

import PropTypes from 'prop-types'
import { TrendingUp, Check, AlertCircle, HelpCircle } from 'lucide-react'
import { PROGRESSION_STATUS, getStatusStyle } from '@/lib/progression-suggestions'

/**
 * Icon mapping for status types
 */
const ICONS = {
  TrendingUp,
  Check,
  AlertCircle,
  HelpCircle
}

/**
 * Size configuration for badges
 */
const SIZE_CONFIG = {
  xs: {
    wrapper: 'px-1.5 py-0.5 text-xs gap-0.5',
    icon: 'h-3 w-3'
  },
  sm: {
    wrapper: 'px-2 py-1 text-xs gap-1',
    icon: 'h-3.5 w-3.5'
  },
  md: {
    wrapper: 'px-3 py-1.5 text-sm gap-1.5',
    icon: 'h-4 w-4'
  }
}

/**
 * Labels for each status
 */
const STATUS_LABELS = {
  [PROGRESSION_STATUS.READY]: 'Ready to progress',
  [PROGRESSION_STATUS.MAINTAIN]: 'On track',
  [PROGRESSION_STATUS.ATTENTION]: 'Needs attention',
  [PROGRESSION_STATUS.NO_DATA]: 'Not enough data'
}

/**
 * ProgressionBadge Component
 *
 * Displays a badge indicating the progression status of an exercise.
 * Shows different colors and icons based on whether the exercise is
 * ready for progression, should maintain, or needs attention.
 */
function ProgressionBadge({ status, size = 'sm', showLabel = false, shortMessage = null }) {
  const style = getStatusStyle(status)
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.sm
  const IconComponent = ICONS[style.icon] || HelpCircle
  const label = shortMessage || STATUS_LABELS[status]

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${style.color} ${style.bgColor} ${style.borderColor} ${sizeConfig.wrapper}`}
    >
      <IconComponent className={sizeConfig.icon} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}

ProgressionBadge.propTypes = {
  status: PropTypes.oneOf(Object.values(PROGRESSION_STATUS)).isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md']),
  showLabel: PropTypes.bool,
  shortMessage: PropTypes.string
}

export default ProgressionBadge
