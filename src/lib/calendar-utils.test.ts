import test from 'node:test';
import assert from 'node:assert/strict';
import {
  navigateMonth,
  getCalendarMonthMatrix,
  toDateString,
  formatMonthYear,
} from './calendar-utils.ts';

test('navigateMonth handles year boundaries accurately', () => {
  // December 2026 -> January 2027
  const decToJan = navigateMonth(2026, 11, 1);
  assert.equal(decToJan.year, 2027);
  assert.equal(decToJan.month, 0);

  // January 2026 -> December 2025
  const janToDec = navigateMonth(2026, 0, -1);
  assert.equal(janToDec.year, 2025);
  assert.equal(janToDec.month, 11);
});

test('getCalendarMonthMatrix generates a 42-cell 7-day grid and highlights today', () => {
  const mockToday = new Date(2026, 9, 19); // Oct 19, 2026
  const cells = getCalendarMonthMatrix(2026, 9, mockToday);

  assert.equal(cells.length, 42);
  const currentMonthCells = cells.filter((c) => c.isCurrentMonth);
  assert.equal(currentMonthCells.length, 31); // October has 31 days

  const todayCell = cells.find((c) => c.isToday);
  assert.ok(todayCell);
  assert.equal(todayCell.dateString, '2026-10-19');
  assert.equal(todayCell.dayOfMonth, 19);
});

test('toDateString and formatMonthYear produce expected strings', () => {
  assert.equal(toDateString(2026, 9, 5), '2026-10-05');
  assert.equal(formatMonthYear(2026, 9), 'October 2026');
});
