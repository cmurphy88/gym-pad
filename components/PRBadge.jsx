'use client'

import PropTypes from 'prop-types'
import { Trophy, Star, Zap } from 'lucide-react'

/**
 * PR Badge configuration by type
 */
const PR_CONFIG = {
  e1rm: {
    icon: Trophy,
    label: 'e1RM PR',
    className: 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
  },
  '1rm': {
    icon: Trophy,
    label: '1RM PR',
    className: 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
  },
  '3rm': {
    icon: Star,
    label: '3RM PR',
    className: 'text-orange-400 bg-orange-400/20 border-orange-400/30'
  },
  '5rm': {
    icon: Star,
    label: '5RM PR',
    className: 'text-blue-400 bg-blue-400/20 border-blue-400/30'
  },
  '8rm': {
    icon: Star,
    label: '8RM PR',
    className: 'text-purple-400 bg-purple-400/20 border-purple-400/30'
  },
  '10rm': {
    icon: Star,
    label: '10RM PR',
    className: 'text-green-400 bg-green-400/20 border-green-400/30'
  },
  volume: {
    icon: Zap,
    label: 'Volume PR',
    className: 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30'
  },
  first: {
    icon: Star,
    label: 'First!',
    className: 'text-cyan-400 bg-cyan-400/20 border-cyan-400/30'
  }
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
 * PR Badge Component
 *
 * Displays a badge indicating a Personal Record achievement.
 * Supports different PR types with distinct colors and icons.
 */
function PRBadge({ type, size = 'sm', showLabel = false }) {
  const config = PR_CONFIG[type] || PR_CONFIG.e1rm
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.sm
  const IconComponent = config.icon

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.className} ${sizeConfig.wrapper}`}
    >
      <IconComponent className={sizeConfig.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

PRBadge.propTypes = {
  type: PropTypes.oneOf([
    'e1rm',
    '1rm',
    '3rm',
    '5rm',
    '8rm',
    '10rm',
    'volume',
    'first'
  ]).isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md']),
  showLabel: PropTypes.bool
}

export default PRBadge
