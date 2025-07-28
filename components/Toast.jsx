import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { CheckCircleIcon, XCircleIcon, XIcon } from 'lucide-react'

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600'
  const IconComponent = type === 'success' ? CheckCircleIcon : XCircleIcon

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 text-white rounded-lg shadow-lg transition-all duration-300 ${bgColor} ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error']),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
}

export default Toast