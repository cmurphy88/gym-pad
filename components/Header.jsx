import React from 'react'
import PropTypes from 'prop-types'
import { DumbbellIcon, CalendarIcon, UserIcon } from 'lucide-react'

/**
 * Header component with navigation and branding
 */
const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DumbbellIcon className="h-6 w-6 text-purple-500" />
          <h1 className="text-xl font-bold text-white">GymPad</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <CalendarIcon className="h-5 w-5 text-gray-300" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <UserIcon className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  )
}

Header.propTypes = {}

export default Header