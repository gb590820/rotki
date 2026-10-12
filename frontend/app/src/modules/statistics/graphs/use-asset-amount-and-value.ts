import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import { One, type TimedBalance, type TimeFramePeriod, timeframes, TimeUnit } from '@rotki/common';
import dayjs from 'dayjs';
import { usePriceUtils } from '@/modules/assets/prices/use-price-utils';
import { isRequestCancellation } from '@/modules/core/api/request-queue/is-request-cancellation';
import { getErrorMessage } from '@/modules/core/notifications/use-notifications';
import { useSetting } from '@/modules/settings/use-setting';
import { useStatisticsApi } from '@/modules/statistics/api/use-statistics-api';
import { type AmountAndValuePoint, toAmountAndValuePoints } from './asset-amount-and-value';

interface UseAssetAmountAndValueReturn {
  points: ComputedRef<AmountAndValuePoint[]>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | undefined>>;
  refresh: () => Promise<void>;
}

/**
 * The snapshot amounts and values of an asset, or of a whole collection, over a timeframe.
 *
 * @remarks
 * Reloads whenever the asset, the collection or the timeframe changes. Without an asset nothing is
 * queried and there are no points.
 */
export function useAssetAmountAndValue(
  asset: MaybeRefOrGetter<string | undefined>,
  collectionId: MaybeRefOrGetter<number | undefined>,
  timeframe: MaybeRefOrGetter<TimeFramePeriod>,
): UseAssetAmountAndValueReturn {
  const { queryTimedBalancesData } = useStatisticsApi();
  const { getExchangeRate } = usePriceUtils();
  const currencySymbol = useSetting('currencySymbol');

  const balances = shallowRef<TimedBalance[]>([]);
  const loading = shallowRef<boolean>(false);
  const error = shallowRef<string>();

  const points = computed<AmountAndValuePoint[]>(() =>
    toAmountAndValuePoints(get(balances), getExchangeRate(get(currencySymbol), One)),
  );

  function startOf(period: TimeFramePeriod): number {
    const all = timeframes((unit, amount) => dayjs().subtract(amount, unit).startOf(TimeUnit.DAY).unix());
    return all[period].startingDate();
  }

  async function refresh(): Promise<void> {
    const identifier = toValue(asset);
    if (!identifier) {
      set(balances, []);
      return;
    }

    set(loading, true);
    try {
      set(balances, await queryTimedBalancesData(identifier, startOf(toValue(timeframe)), dayjs().unix(), toValue(collectionId)));
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

  watchImmediate(() => [toValue(asset), toValue(collectionId), toValue(timeframe)], refresh);

  return {
    error: readonly(error),
    loading: readonly(loading),
    points,
    refresh,
  };
}
