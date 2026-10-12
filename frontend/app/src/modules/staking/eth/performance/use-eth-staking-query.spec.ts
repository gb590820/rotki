import type { EthStakingCombinedFilter, EthStakingFilter, EthStakingPayload } from '@rotki/common';
import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useEthStakingQuery } from './use-eth-staking-query';

function setup(): {
  pagination: Ref<EthStakingPayload>;
  selection: Ref<EthStakingFilter>;
  filter: Ref<EthStakingCombinedFilter | undefined>;
  found: Ref<number>;
  query: ReturnType<typeof useEthStakingQuery>;
} {
  const pagination = ref<EthStakingPayload>({ limit: 10, offset: 0 });
  const selection = ref<EthStakingFilter>({ validators: [] });
  const filter = ref<EthStakingCombinedFilter>();
  const found = ref<number>(35);
  return { filter, found, pagination, query: useEthStakingQuery(pagination, selection, filter, found), selection };
}

describe('modules/staking/eth/performance/use-eth-staking-query', () => {
  it('should present the query as a table page, with the matched count as total', () => {
    const { pagination, query } = setup();
    set(pagination, { limit: 10, offset: 20 });

    expect(get(query.tablePagination)).toEqual({ limit: 10, page: 3, total: 35 });
  });

  it('should turn a table page into an offset, keeping the rest of the query', () => {
    const { pagination, query } = setup();
    set(pagination, { limit: 10, offset: 0, status: 'active' });

    set(query.tablePagination, { limit: 25, page: 2, total: 35 });

    expect(get(pagination)).toEqual({ limit: 25, offset: 25, status: 'active' });
  });

  it('should not touch the query until the selection or the filter changes', async () => {
    const { pagination } = setup();
    const initial = get(pagination);
    await nextTick();

    expect(get(pagination)).toBe(initial);
  });

  it('should query the new selection from the first page', async () => {
    const { pagination, selection } = setup();
    set(pagination, { limit: 10, offset: 30 });

    set(selection, { accounts: [{ address: '0xA', chain: 'eth' }] });
    await nextTick();

    expect(get(pagination)).toEqual({ addresses: ['0xA'], limit: 10, offset: 0 });
  });

  it('should query the new period and status from the first page', async () => {
    const { filter, pagination } = setup();
    set(pagination, { limit: 10, offset: 30 });

    set(filter, { fromTimestamp: 100, status: 'exited' });
    await nextTick();

    expect(get(pagination)).toEqual({ fromTimestamp: 100, limit: 10, offset: 0, status: 'exited' });
  });
});
