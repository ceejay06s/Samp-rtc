/**
 * Calculate age from birthdate
 * @param birthdate - Date object or ISO date string
 * @returns age in years
 */
export const calculateAge = (birthdate: Date | string): number => {
  const birthDate = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format date to ISO date string (YYYY-MM-DD)
 * @param date - Date object
 * @returns ISO date string
 */
export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse ISO date string to Date object
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Date object
 */
export const parseISODate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

/**
 * Check if user is at least 18 years old
 * @param birthdate - Date object or ISO date string
 * @returns boolean
 */
export const isAtLeast18 = (birthdate: Date | string): boolean => {
  return calculateAge(birthdate) >= 18;
};

/**
 * Get minimum birthdate for 18+ users (18 years ago from today)
 * @returns Date object
 */
export const getMinimumBirthdate = (): Date => {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
};

/**
 * Get maximum birthdate (reasonable limit, e.g., 100 years ago)
 * @returns Date object
 */
export const getMaximumBirthdate = (): Date => {
  const today = new Date();
  return new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
}; 