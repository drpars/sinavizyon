// modules/lib/date-utils.js
export function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function getMonthNumber(monthName) {
  const months = {
    OCAK: 1,
    SUBAT: 2,
    MART: 3,
    NISAN: 4,
    MAYIS: 5,
    HAZIRAN: 6,
    TEMMUZ: 7,
    AGUSTOS: 8,
    EYLUL: 9,
    EKIM: 10,
    KASIM: 11,
    ARALIK: 12,
  };
  return months[monthName] || 1;
}

export function isDateValid(selectedYear, selectedMonth, isSinaMode = false) {
  const current = getCurrentYearMonth();
  const monthIndex = selectedMonth - 1;
  if (selectedYear > current.year) return false;
  if (selectedYear === current.year && monthIndex > current.month) return false;
  if (isSinaMode) return true;
  return selectedYear === current.year && monthIndex === current.month;
}
