import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  formatCallDuration,
  formatDurationHuman,
  isValidPhoneNumber,
  paginateRecords,
} from './formatters.ts';

test('formatCurrency formats valid numbers and handles null/undefined gracefully', () => {
  assert.equal(formatCurrency(48500), '$48,500');
  assert.equal(formatCurrency(0), '$0');
  assert.equal(formatCurrency(null), '—');
  assert.equal(formatCurrency(undefined), '—');
});

test('formatCallDuration formats seconds as MM:SS and handles unknown durations', () => {
  assert.equal(formatCallDuration(0), '00:00');
  assert.equal(formatCallDuration(65), '01:05');
  assert.equal(formatCallDuration(612), '10:12');
  assert.equal(formatCallDuration(null), 'Unknown duration');
  assert.equal(formatCallDuration(-5), 'Unknown duration');
});

test('formatDurationHuman returns concise human strings', () => {
  assert.equal(formatDurationHuman(45), '45s');
  assert.equal(formatDurationHuman(120), '2m');
  assert.equal(formatDurationHuman(194), '3m 14s');
  assert.equal(formatDurationHuman(null), 'Unknown');
});

test('isValidPhoneNumber validates E.164 and formatted numbers accurately', () => {
  assert.equal(isValidPhoneNumber('+1 (415) 890-2311'), true);
  assert.equal(isValidPhoneNumber('+44 20 7946 0921'), true);
  assert.equal(isValidPhoneNumber(null), false);
  assert.equal(isValidPhoneNumber(''), false);
  assert.equal(isValidPhoneNumber('Unlisted / Invalid'), false);
  assert.equal(isValidPhoneNumber('123'), false);
});

test('paginateRecords slices records and clamps out-of-range pages', () => {
  const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const page1 = paginateRecords(data, 1, 3);
  assert.deepEqual(page1.pageItems, ['a', 'b', 'c']);
  assert.equal(page1.totalPages, 3);
  assert.equal(page1.currentPage, 1);

  const page3 = paginateRecords(data, 99, 3);
  assert.deepEqual(page3.pageItems, ['g']);
  assert.equal(page3.currentPage, 3);
});
