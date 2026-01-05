/**
 * Calculate savings targets based on goal parameters
 * @param {number} targetAmount - The goal amount to save
 * @param {number} currentBalance - Current saved amount
 * @param {string|Date} endDate - Target end date
 * @returns {Object} - Calculated savings targets
 */
export const calculateSavingsTargets = (targetAmount, currentBalance, endDate) => {
  const remaining = targetAmount - currentBalance;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  const weeksRemaining = daysRemaining / 7;
  const monthsRemaining = daysRemaining / 30;

  const progress = targetAmount > 0 ? (currentBalance / targetAmount) * 100 : 0;

  if (daysRemaining <= 0 || remaining <= 0) {
    return {
      perDay: 0,
      perWeek: 0,
      perMonth: 0,
      daysRemaining: Math.max(0, daysRemaining),
      remaining: Math.max(0, remaining),
      progress: Math.min(100, progress),
      isComplete: remaining <= 0,
      isPastDue: daysRemaining <= 0 && remaining > 0
    };
  }

  return {
    perDay: remaining / daysRemaining,
    perWeek: remaining / weeksRemaining,
    perMonth: remaining / monthsRemaining,
    daysRemaining,
    remaining,
    progress,
    isComplete: false,
    isPastDue: false
  };
};

/**
 * Format currency for display (GBP)
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
