// Backend/src/services/fitnessAnalytics/dateUtils.ts

/**
 * Calculates the start of the week (Monday 00:00:00) aligned with Africa/Johannesburg (UTC+2).
 */
export const getJohannesburgWeekStart = (date: Date): Date => {
  const johannesburgNow = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const currentDay = johannesburgNow.getUTCDay();
  const daysSinceMonday = (currentDay + 6) % 7;

  const mondayUtc = Date.UTC(
    johannesburgNow.getUTCFullYear(),
    johannesburgNow.getUTCMonth(),
    johannesburgNow.getUTCDate() - daysSinceMonday
  );

  return new Date(mondayUtc - 2 * 60 * 60 * 1000);
};

/**
 * Formats a Date into 'YYYY-MM-DD' representation in Africa/Johannesburg time.
 */
export const formatAsJohannesburgDateString = (date: Date): string => {
  const johannesburgTime = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const year = johannesburgTime.getUTCFullYear();
  const month = String(johannesburgTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(johannesburgTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAnalyticsWeekWindows = (referenceDate = new Date()) => {
  const currentWeekStart = getJohannesburgWeekStart(referenceDate);

  const nextWeekStart = new Date(
    currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const previousWeekStart = new Date(
    currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  const fourWeeksAgoStart = new Date(
    currentWeekStart.getTime() - 28 * 24 * 60 * 60 * 1000
  );

  return {
    currentWeekStart,
    nextWeekStart,
    previousWeekStart,
    fourWeeksAgoStart,
  };
};
