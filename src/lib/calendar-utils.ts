export interface CalendarDayCell {
  dateString: string; // YYYY-MM-DD
  dayOfMonth: number;
  month: number; // 0-11
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function toDateString(year: number, monthZeroIndexed: number, day: number): string {
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function navigateMonth(year: number, monthZeroIndexed: number, delta: -1 | 1): {
  year: number;
  month: number;
} {
  const nextDate = new Date(year, monthZeroIndexed + delta, 1);
  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth(),
  };
}

export function formatMonthYear(year: number, monthZeroIndexed: number): string {
  const date = new Date(year, monthZeroIndexed, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getCalendarMonthMatrix(
  year: number,
  monthZeroIndexed: number,
  todayDate: Date = new Date()
): CalendarDayCell[] {
  const todayStr = toDateString(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate()
  );

  const firstDayOfMonth = new Date(year, monthZeroIndexed, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();

  const prevMonthInfo = navigateMonth(year, monthZeroIndexed, -1);
  const daysInPrevMonth = new Date(prevMonthInfo.year, prevMonthInfo.month + 1, 0).getDate();

  const cells: CalendarDayCell[] = [];

  // Leading days from previous month
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateString = toDateString(prevMonthInfo.year, prevMonthInfo.month, day);
    cells.push({
      dateString,
      dayOfMonth: day,
      month: prevMonthInfo.month,
      year: prevMonthInfo.year,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = toDateString(year, monthZeroIndexed, day);
    cells.push({
      dateString,
      dayOfMonth: day,
      month: monthZeroIndexed,
      year,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
    });
  }

  // Trailing days from next month to complete 42 cells (6 rows x 7 columns)
  const nextMonthInfo = navigateMonth(year, monthZeroIndexed, 1);
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const dateString = toDateString(nextMonthInfo.year, nextMonthInfo.month, day);
    cells.push({
      dateString,
      dayOfMonth: day,
      month: nextMonthInfo.month,
      year: nextMonthInfo.year,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
  }

  return cells;
}
