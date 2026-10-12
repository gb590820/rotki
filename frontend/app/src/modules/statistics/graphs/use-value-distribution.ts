import type { ComputedRef, Ref } from 'vue';
import { One } from '@rotki/common';
import { usePriceUtils } from '@/modules/assets/prices/use-price-utils';
import { useAssetInfoRetrieval } from '@/modules/assets/use-asset-info-retrieval';
import { isRequestCancellation } from '@/modules/core/api/request-queue/is-request-cancellation';
import { useLocations } from '@/modules/core/common/use-locations';
import { getErrorMessage } from '@/modules/core/notifications/use-notifications';
import { useSetting } from '@/modules/settings/use-setting';
import { useStatisticsApi } from '@/modules/statistics/api/use-statistics-api';
import { type DistributionEntry, type DistributionSlice, OTHERS_SLICE_KEY, toDistributionSlices } from './value-distribution';

export type DistributionBy = 'asset' | 'location';

/** Slices drawn before the smallest ones are grouped, so the pie stays legible. */
const MAX_SLICES = 10;

interface UseValueDistributionReturn {
  slices: ComputedRef<DistributionSlice[]>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | undefined>>;
  /** The display name of a slice: the location or asset name, or "others" for the grouped slice. */
  label: (key: string) => string;
  refresh: () => Promise<void>;
}

/**
 * The latest value distribution of the snapshots, by location or by asset.
 *
 * @remarks
 * The snapshots store values in USD; they are converted to the main currency at today's rate, the
 * same way the net value graph does.
 */
export function useValueDistribution(distributionBy: DistributionBy): UseValueDistributionReturn {
  const { t } = useI18n({ useScope: 'global' });
  const { queryLatestAssetValueDistribution, queryLatestLocationValueDistribution } = useStatisticsApi();
  const { getExchangeRate } = usePriceUtils();
  const { getLocationData } = useLocations();
  const { getAssetInfo } = useAssetInfoRetrieval();
  const currencySymbol = useSetting('currencySymbol');

  const entries = ref<DistributionEntry[]>([]);
  const loading = shallowRef<boolean>(false);
  const error = shallowRef<string>();

  const slices = computed<DistributionSlice[]>(() => {
    const rate = getExchangeRate(get(currencySymbol), One);
    return toDistributionSlices(
      get(entries).map(entry => ({ key: entry.key, value: entry.value.multipliedBy(rate) })),
      MAX_SLICES,
    );
  });

  async function queryEntries(): Promise<DistributionEntry[]> {
    if (distributionBy === 'location') {
      const data = await queryLatestLocationValueDistribution();
      return data.map(item => ({ key: item.location, value: item.usdValue }));
    }
    const data = await queryLatestAssetValueDistribution();
    return data.map(item => ({ key: item.asset, value: item.usdValue }));
  }

  async function refresh(): Promise<void> {
    set(loading, true);
    try {
      set(entries, await queryEntries());
      set(error, undefined);
    }
    catch (error_: unknown) {
      if (!isRequestCancellation(error_))
        set(error, getErrorMessage(error_));
    }
    finally {
      set(loading, false);
    }
  }

  function label(key: string): string {
    if (key === OTHERS_SLICE_KEY)
      return t('premium_components.statistics.others');

    if (distributionBy === 'location')
      return getLocationData(key)?.name ?? key;

    return getAssetInfo(key)?.symbol ?? key;
  }

  return {
    error: readonly(error),
    label,
    loading: readonly(loading),
    refresh,
    slices,
  };
}
