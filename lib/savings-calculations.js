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

  // Cap per week/month at remaining amount (no point showing more than what's needed)
  const perDay = remaining / daysRemaining;
  const perWeek = Math.min(remaining, remaining / weeksRemaining);
  const perMonth = Math.min(remaining, remaining / monthsRemaining);

  return {
    perDay,
    perWeek,
    perMonth,
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

/**
 * Calculate savings status based on time elapsed vs amount saved
 * @param {number} targetAmount - Total goal amount
 * @param {number} currentBalance - Amount saved so far
 * @param {string|Date} createdAt - When the goal was created
 * @param {string|Date} endDate - Target completion date
 * @returns {Object} Status object with type, color, and catch-up amount
 */
export const calculateSavingsStatus = (targetAmount, currentBalance, createdAt, endDate) => {
  // Normalize all dates to start of day for fair day-based calculation
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = new Date(createdAt);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  // If goal is complete (100%+), return Complete status
  if (currentBalance >= targetAmount) {
    return {
      status: 'Complete',
      color: 'purple',
      expectedByNow: targetAmount,
      difference: currentBalance - targetAmount,
      catchUpAmount: 0
    };
  }

  // If past due date, always behind
  if (now > end) {
    return {
      status: 'Behind',
      color: 'red',
      expectedByNow: targetAmount,
      difference: currentBalance - targetAmount,
      catchUpAmount: targetAmount - currentBalance
    };
  }

  // Calculate days elapsed and total days
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay);
  const daysElapsed = Math.round((now.getTime() - start.getTime()) / msPerDay);

  // Handle edge case: goal created today (day 0)
  if (daysElapsed <= 0) {
    return {
      status: currentBalance > 0 ? 'Ahead' : 'On Track',
      color: currentBalance > 0 ? 'green' : 'blue',
      expectedByNow: 0,
      difference: currentBalance,
      catchUpAmount: 0
    };
  }

  // Calculate expected amount by today (linear interpolation based on days)
  const progressRatio = Math.min(daysElapsed / totalDays, 1);
  const expectedByNow = Math.round(targetAmount * progressRatio * 100) / 100; // Round to pence

  // Determine status (round to pence for fair comparison)
  const roundedBalance = Math.round(currentBalance * 100) / 100;
  const difference = roundedBalance - expectedByNow;

  if (roundedBalance >= expectedByNow) {
    return {
      status: roundedBalance > expectedByNow ? 'Ahead' : 'On Track',
      color: roundedBalance > expectedByNow ? 'green' : 'blue',
      expectedByNow,
      difference,
      catchUpAmount: 0
    };
  } else {
    return {
      status: 'Behind',
      color: 'red',
      expectedByNow,
      difference,
      catchUpAmount: Math.round((expectedByNow - roundedBalance) * 100) / 100
    };
  }
};
