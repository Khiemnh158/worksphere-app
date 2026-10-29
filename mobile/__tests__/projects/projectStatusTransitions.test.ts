import {
  canTransitionStatus,
  getAllowedTargetStatuses,
  getStatusLabel,
  isTerminalStatus,
} from '../../src/features/projects/domain/projectStatusTransitions';

describe('projectStatusTransitions domain logic', () => {
  it('1. returns exact allowed targets for DRAFT', () => {
    expect(getAllowedTargetStatuses('DRAFT')).toEqual(['ACTIVE', 'CANCELLED']);
    expect(canTransitionStatus('DRAFT', 'ACTIVE')).toBe(true);
    expect(canTransitionStatus('DRAFT', 'CANCELLED')).toBe(true);
    expect(canTransitionStatus('DRAFT', 'ON_HOLD')).toBe(false);
    expect(canTransitionStatus('DRAFT', 'COMPLETED')).toBe(false);
    expect(canTransitionStatus('DRAFT', 'DRAFT')).toBe(false);
  });

  it('2. returns exact allowed targets for ACTIVE', () => {
    expect(getAllowedTargetStatuses('ACTIVE')).toEqual(['ON_HOLD', 'COMPLETED', 'CANCELLED']);
    expect(canTransitionStatus('ACTIVE', 'ON_HOLD')).toBe(true);
    expect(canTransitionStatus('ACTIVE', 'COMPLETED')).toBe(true);
    expect(canTransitionStatus('ACTIVE', 'CANCELLED')).toBe(true);
    expect(canTransitionStatus('ACTIVE', 'DRAFT')).toBe(false);
    expect(canTransitionStatus('ACTIVE', 'ACTIVE')).toBe(false);
  });

  it('3. returns exact allowed targets for ON_HOLD', () => {
    expect(getAllowedTargetStatuses('ON_HOLD')).toEqual(['ACTIVE', 'CANCELLED']);
    expect(canTransitionStatus('ON_HOLD', 'ACTIVE')).toBe(true);
    expect(canTransitionStatus('ON_HOLD', 'CANCELLED')).toBe(true);
    expect(canTransitionStatus('ON_HOLD', 'COMPLETED')).toBe(false);
    expect(canTransitionStatus('ON_HOLD', 'DRAFT')).toBe(false);
    expect(canTransitionStatus('ON_HOLD', 'ON_HOLD')).toBe(false);
  });

  it('4. terminal states COMPLETED and CANCELLED have zero allowed targets', () => {
    expect(getAllowedTargetStatuses('COMPLETED')).toEqual([]);
    expect(getAllowedTargetStatuses('CANCELLED')).toEqual([]);

    expect(isTerminalStatus('COMPLETED')).toBe(true);
    expect(isTerminalStatus('CANCELLED')).toBe(true);
    expect(isTerminalStatus('ACTIVE')).toBe(false);
    expect(isTerminalStatus('DRAFT')).toBe(false);
    expect(isTerminalStatus('ON_HOLD')).toBe(false);

    expect(canTransitionStatus('COMPLETED', 'ACTIVE')).toBe(false);
    expect(canTransitionStatus('CANCELLED', 'ACTIVE')).toBe(false);
  });

  it('5. provides human-readable Vietnamese labels', () => {
    expect(getStatusLabel('DRAFT')).toBe('Bản nháp');
    expect(getStatusLabel('ACTIVE')).toBe('Đang chạy');
    expect(getStatusLabel('ON_HOLD')).toBe('Tạm dừng');
    expect(getStatusLabel('COMPLETED')).toBe('Hoàn thành');
    expect(getStatusLabel('CANCELLED')).toBe('Đã hủy');
  });
});
