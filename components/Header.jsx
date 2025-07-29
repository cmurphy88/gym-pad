import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { DumbbellIcon, CalendarIcon, UserIcon, SettingsIcon, LogOutIcon, ScaleIcon } from 'lucide-react'
import CalendarModal from './CalendarModal'

/**
 * Header component with navigation and branding
 */
const Header = () => {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const menuRef = useRef(null)

  const handleHomeClick = () => {
    router.push('/')
  }

  const handleTemplatesClick = () => {
    router.push('/templates')
  }

  const handleWeightClick = () => {
    router.push('/weight')
  }

  const handleCalendarClick = () => {
    setShowCalendar(true)
  }

  const handleCalendarClose = () => {
    setShowCalendar(false)
  }

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleHomeClick}
        >
          <DumbbellIcon className="h-6 w-6 text-purple-500" />
          <h1 className="text-xl font-bold text-white">GymPad</h1>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={handleTemplatesClick}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
            title="Manage Templates"
          >
            <SettingsIcon className="h-4 w-4 text-gray-300" />
          </button>
          <button 
            onClick={handleWeightClick}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
            title="Weight Tracking"
          >
            <ScaleIcon className="h-4 w-4 text-gray-300" />
          </button>
          <button 
            onClick={handleCalendarClick}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
            title="View Calendar"
          >
            <CalendarIcon className="h-4 w-4 text-gray-300" />
          </button>
          
          {/* Separator */}
          <div className="h-6 w-px bg-gray-600 mx-2"></div>
          
          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-1.5 rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
              title={user?.name || 'User menu'}
            >
              <UserIcon className="h-4 w-4 text-gray-300" />
              {user && (
                <span className="text-sm text-gray-300 hidden sm:inline">
                  {user.name}
                </span>
              )}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                    Signed in as<br />
                    <span className="font-medium">{user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <CalendarModal 
        isOpen={showCalendar} 
        onClose={handleCalendarClose} 
      />
    </header>
  )
}

Header.propTypes = {}

export default Header