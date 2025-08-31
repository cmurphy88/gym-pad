/**
 * Date utilities for consistent date handling across the application
 * Ensures dates are formatted in local timezone to prevent off-by-one issues
 */

/**
 * Formats a Date object to YYYY-MM-DD string in local timezone
 * @param {Date} date - The date to format
 * @returns {string} - Date in YYYY-MM-DD format (local timezone)
 */
export function formatDateToLocal(date) {
  if (!date) return null
  
  // Ensure we have a Date object
  const d = new Date(date)
  
  // Get local date components
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Gets today's date as YYYY-MM-DD string in local timezone
 * @returns {string} - Today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayLocal() {
  return formatDateToLocal(new Date())
}

/**
 * Converts a date string or Date object to local date key for consistent comparisons
 * @param {string|Date} date - The date to convert
 * @returns {string} - Date key in YYYY-MM-DD format (local timezone)
 */
export function getLocalDateKey(date) {
  if (!date) return null
  return formatDateToLocal(new Date(date))
}

/**
 * Checks if two dates are the same day in local timezone
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date  
 * @returns {boolean} - True if dates are the same day
 */
export function isSameLocalDay(date1, date2) {
  return getLocalDateKey(date1) === getLocalDateKey(date2)
}