import { type BigNumber, bigNumberify } from '@rotki/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestCancelledError } from '@/modules/core/api/request-queue/errors';
import { useValueDistribution } from './use-value-distribution';
import { OTHERS_SLICE_KEY } from './value-distribution';
import '@test/i18n';

const { currency, exchangeRate, queryAsset, queryLocation } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  const { bigNumberify } = await import('@rotki/common');
  return {
    currency: ref<string>('EUR'),
    exchangeRate: ref<BigNumber>(bigNumberify(1)),
    queryAsset: vi.fn<() => Promise<{ asset: string; time: number; usdValue: BigNumber }[]>>(),
    queryLocation: vi.fn<() => Promise<{ location: string; time: number; usdValue: BigNumber }[]>>(),
  };
});

vi.mock('@/modules/statistics/api/use-statistics-api', () => ({
  useStatisticsApi: (): Record<string, unknown> => ({
    queryLatestAssetValueDistribution: queryAsset,
    queryLatestLocationValueDistribution: queryLocation,
  }),
}));

vi.mock('@/modules/assets/prices/use-price-utils', () => ({
  usePriceUtils: (): Record<string, unknown> => ({
    getExchangeRate: (): BigNumber => get(exchangeRate),
  }),
}));

vi.mock('@/modules/core/common/use-locations', () => ({
  useLocations: (): Record<string, unknown> => ({
    getLocationData: (id: string): { name: string } | undefined => (id === 'kraken' ? { name: 'Kraken' } : undefined),
  }),
}));

vi.mock('@/modules/assets/use-asset-info-retrieval', () => ({
  useAssetInfoRetrieval: (): Record<string, unknown> => ({
    getAssetInfo: (id: string): { symbol: string } | undefined => (id === 'ETH' ? { symbol: 'ETH' } : undefined),
  }),
}));

vi.mock('@/modules/settings/use-setting', () => ({
  useSetting: (): Ref<string> => currency,
}));

describe('modules/statistics/graphs/use-value-distribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    set(exchangeRate, bigNumberify(1));
  });

  it('should slice the location distribution, without the total row', async () => {
    queryLocation.mockResolvedValue([
      { location: 'total', time: 1, usdValue: bigNumberify(100) },
      { location: 'kraken', time: 1, usdValue: bigNumberify(25) },
      { location: 'blockchain', time: 1, usdValue: bigNumberify(75) },
    ]);

    const { refresh, slices } = useValueDistribution('location');
    await refresh();

    expect(queryAsset).not.toHaveBeenCalled();
    expect(get(slices).map(slice => [slice.key, slice.percentage])).toEqual([['blockchain', 75], ['kraken', 25]]);
  });

  it('should slice the asset distribution', async () => {
    queryAsset.mockResolvedValue([
      { asset: 'ETH', time: 1, usdValue: bigNumberify(30) },
      { asset: 'BTC', time: 1, usdValue: bigNumberify(10) },
    ]);

    const { refresh, slices } = useValueDistribution('asset');
    await refresh();

    expect(queryLocation).not.toHaveBeenCalled();
    expect(get(slices).map(slice => [slice.key, slice.percentage])).toEqual([['ETH', 75], ['BTC', 25]]);
  });

  it('should convert the stored USD values to the main currency', async () => {
    queryAsset.mockResolvedValue([{ asset: 'ETH', time: 1, usdValue: bigNumberify(10) }]);
    set(exchangeRate, bigNumberify(2));

    const { refresh, slices } = useValueDistribution('asset');
    await refresh();

    expect(get(slices)[0].value.toFixed()).toBe('20');
  });

  it('should expose the failure message and keep loading false', async () => {
    queryAsset.mockRejectedValue(new Error('backend down'));

    const { error, loading, refresh, slices } = useValueDistribution('asset');
    await refresh();

    expect(get(error)).toBe('backend down');
    expect(get(loading)).toBe(false);
    expect(get(slices)).toEqual([]);
  });

  it('should not report a cancelled request as a failure', async () => {
    queryAsset.mockRejectedValue(new RequestCancelledError());

    const { error, refresh } = useValueDistribution('asset');
    await refresh();

    expect(get(error)).toBeUndefined();
  });

  it('should name slices after their location, asset or the grouped slice', () => {
    const byLocation = useValueDistribution('location');
    const byAsset = useValueDistribution('asset');

    expect(byLocation.label('kraken')).toBe('Kraken');
    expect(byLocation.label('unknown')).toBe('unknown');
    expect(byAsset.label('ETH')).toBe('ETH');
    expect(byAsset.label(OTHERS_SLICE_KEY)).toBe('premium_components.statistics.others');
  });
});
