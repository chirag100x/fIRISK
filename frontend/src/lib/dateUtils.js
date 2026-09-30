/**
 * Computes start and end date strings (YYYY-MM-DD) for a given range preset.
 * @param {string} rangePreset - '1M' | '3M' | '6M' | '1Y'
 * @returns {{ start: string, end: string }}
 */
export function getDateRange(rangePreset = '1Y') {
  const end = new Date();
  const start = new Date();
  if (rangePreset === '1M') {
    start.setMonth(start.getMonth() - 1);
  } else if (rangePreset === '3M') {
    start.setMonth(start.getMonth() - 3);
  } else if (rangePreset === '6M') {
    start.setMonth(start.getMonth() - 6);
  } else {
    // 1Y
    start.setFullYear(start.getFullYear() - 1);
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
