import {
  ownPublishedIncomes,
  parseAttendanceQr,
  personalWorks,
  validLocalDay,
} from '../../src/features/workspace/rules';
import type { Income, Work } from '../../src/features/workspace/api';

describe('mobile workplace boundaries', () => {
  test('only the exact attendance payload is accepted, never another URL or malformed token', () => {
    const nonce = 'a'.repeat(43);
    expect(parseAttendanceQr(`worksphere-attendance:${nonce}`)).toBe(nonce);
    for (const value of [
      'https://example.com',
      nonce,
      `worksphere-attendance:${nonce}/extra`,
      `worksphere-attendance:${'a'.repeat(42)}`,
    ]) {
      expect(() => parseAttendanceQr(value)).toThrow('QR chấm công');
    }
  });
  test('personal income excludes another person and every unpublished state even for a specialist', () => {
    const rows = [
      { id: 'one', user_id: 'me', approval_state: 'PUBLISHED' },
      { id: 'draft', user_id: 'me', approval_state: 'DRAFT' },
      { id: 'approved', user_id: 'me', approval_state: 'APPROVED' },
      { id: 'other', user_id: 'other', approval_state: 'PUBLISHED' },
    ] as Income[];
    expect(ownPublishedIncomes(rows, 'me').map(r => r.id)).toEqual(['one']);
  });
  test('personal schedule does not show a reviewer task as assigned to the reviewer', () => {
    const rows = [
      { id: 'assigned', assignee_id: 'me' },
      { id: 'review', assignee_id: 'other', reviewer_id: 'me' },
    ] as Work[];
    expect(personalWorks(rows, 'me').map(r => r.id)).toEqual(['assigned']);
  });
});

test('invalid and normalized calendar dates are rejected before a time request', () => {
  expect(validLocalDay('2026-02-30')).toBe(false);
  expect(validLocalDay('2026-13-01')).toBe(false);
  expect(validLocalDay('2026-02-29')).toBe(false);
  expect(validLocalDay('2028-02-29')).toBe(true);
});
