import { describe, expect, it } from 'vitest';
import { toPerformancePayload } from './eth-staking-payload';

const page = { limit: 10, offset: 20 };

describe('modules/staking/eth/performance/eth-staking-payload', () => {
  it('should ask for every validator when nothing is selected or filtered', () => {
    expect(toPerformancePayload({ validators: [] }, undefined, page)).toEqual({ limit: 10, offset: 20 });
    expect(toPerformancePayload({ accounts: [] }, undefined, page)).toEqual({ limit: 10, offset: 20 });
  });

  it('should narrow to the withdrawal addresses selected', () => {
    const selection = { accounts: [{ address: '0xA', chain: 'eth' }, { address: '0xB', chain: 'eth' }] };

    expect(toPerformancePayload(selection, undefined, page)).toEqual({ addresses: ['0xA', '0xB'], limit: 10, offset: 20 });
  });

  it('should narrow to the validators selected, by index', () => {
    const selection = { validators: [{ index: 7, publicKey: '0x7', status: 'active' }] };

    expect(toPerformancePayload(selection, undefined, page)).toEqual({ limit: 10, offset: 20, validatorIndices: [7] });
  });

  it('should carry the period and the status', () => {
    const payload = toPerformancePayload({ validators: [] }, { fromTimestamp: 100, status: 'exited', toTimestamp: 200 }, page);

    expect(payload).toEqual({ fromTimestamp: 100, limit: 10, offset: 20, status: 'exited', toTimestamp: 200 });
  });
});
