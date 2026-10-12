import { type BigNumber, bigNumberify, type TimedBalance, TimeFramePeriod } from '@rotki/common';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useAssetAmountAndValue } from './use-asset-amount-and-value';
import '@test/i18n';

const { currency, exchangeRate, queryTimedBalancesData } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  const { bigNumberify } = await import('@rotki/common');
  return {
    currency: ref<string>('EUR'),
    exchangeRate: ref<BigNumber>(bigNumberify(1)),
    queryTimedBalancesData: vi.fn<(asset: string, from: number, to: number, collectionId?: number) => Promise<TimedBalance[]>>(),
  };
});

vi.mock('@/modules/statistics/api/use-statistics-api', () => ({
  useStatisticsApi: (): Record<string, unknown> => ({ queryTimedBalancesData }),
}));

vi.mock('@/modules/assets/prices/use-price-utils', () => ({
  usePriceUtils: (): Record<string, unknown> => ({
    getExchangeRate: (): BigNumber => get(exchangeRate),
  }),
}));

vi.mock('@/modules/settings/use-setting', () => ({
  useSetting: (): Ref<string> => currency,
}));

const NOW = new Date('2026-06-15T12:00:00Z');

describe('modules/statistics/graphs/use-asset-amount-and-value', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
    vi.clearAllMocks();
    set(exchangeRate, bigNumberify(1));
    queryTimedBalancesData.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should query the whole history of the asset up to now for the ALL timeframe', async () => {
    useAssetAmountAndValue('ETH', undefined, TimeFramePeriod.ALL);
    await flushPromises();

    expect(queryTimedBalancesData).toHaveBeenCalledWith('ETH', 0, NOW.getTime() / 1000, undefined);
  });

  it('should pass the collection along with the asset', async () => {
    useAssetAmountAndValue('ETH', 7, TimeFramePeriod.ALL);
    await flushPromises();

    expect(queryTimedBalancesData).toHaveBeenCalledWith('ETH', 0, expect.any(Number), 7);
  });

  it('should query from the start of the selected timeframe', async () => {
    useAssetAmountAndValue('ETH', undefined, TimeFramePeriod.WEEK);
    await flushPromises();

    const [, from] = queryTimedBalancesData.mock.calls[0];
    expect(from).toBe(new Date('2026-06-08T00:00:00Z').getTime() / 1000);
  });

  it('should reload when the asset or the timeframe changes', async () => {
    const asset = ref<string>('ETH');
    const timeframe = ref<TimeFramePeriod>(TimeFramePeriod.ALL);
    useAssetAmountAndValue(asset, undefined, timeframe);
    await flushPromises();

    set(asset, 'BTC');
    await flushPromises();
    set(timeframe, TimeFramePeriod.YEAR);
    await flushPromises();

    expect(queryTimedBalancesData.mock.calls.map(([queried]) => queried)).toEqual(['ETH', 'BTC', 'BTC']);
  });

  it('should not query without an asset', async () => {
    const { points } = useAssetAmountAndValue(undefined, undefined, TimeFramePeriod.ALL);
    await flushPromises();

    expect(queryTimedBalancesData).not.toHaveBeenCalled();
    expect(get(points)).toEqual([]);
  });

  it('should turn the balances into points in the main currency', async () => {
    queryTimedBalancesData.mockResolvedValue([{ amount: bigNumberify(2), time: 100, usdValue: bigNumberify(10) }]);
    set(exchangeRate, bigNumberify(3));

    const { points } = useAssetAmountAndValue('ETH', undefined, TimeFramePeriod.ALL);
    await flushPromises();

    expect(get(points).map(point => [point.time, point.amount.toFixed(), point.value.toFixed()])).toEqual([[100, '2', '30']]);
  });

  it('should expose the failure message', async () => {
    queryTimedBalancesData.mockRejectedValue(new Error('backend down'));

    const { error, loading } = useAssetAmountAndValue('ETH', undefined, TimeFramePeriod.ALL);
    await flushPromises();

    expect(get(error)).toBe('backend down');
    expect(get(loading)).toBe(false);
  });
});
