import type { EthStakingCombinedFilter, EthStakingFilter, EthStakingPayload } from '@rotki/common';
import type { TablePaginationData } from '@rotki/ui-library';
import type { MaybeRefOrGetter, Ref, WritableComputedRef } from 'vue';
import { toPerformancePayload } from './eth-staking-payload';

interface UseEthStakingQueryReturn {
  /** The table's page, read from and written back to the performance query. */
  tablePagination: WritableComputedRef<TablePaginationData>;
}

/**
 * Keeps the performance query in step with what the page selects and the table pages through.
 *
 * @remarks
 * Writing `performancePagination` is what fetches: the staking composable that owns it watches it.
 * A new selection or filter goes back to the first page, since the old offset may be past the end
 * of the new result. The first values are left alone: the page fetches them itself on mount.
 * `entriesFound` is how many validators the current query matches, which sets the page count.
 */
export function useEthStakingQuery(
  performancePagination: Ref<EthStakingPayload>,
  selection: MaybeRefOrGetter<EthStakingFilter>,
  filter: MaybeRefOrGetter<EthStakingCombinedFilter | undefined>,
  entriesFound: MaybeRefOrGetter<number>,
): UseEthStakingQueryReturn {
  const tablePagination = computed<TablePaginationData>({
    get: () => {
      const { limit, offset } = get(performancePagination);
      return { limit, page: Math.floor(offset / limit) + 1, total: toValue(entriesFound) };
    },
    set: ({ limit, page }) => {
      set(performancePagination, { ...get(performancePagination), limit, offset: (page - 1) * limit });
    },
  });

  watch([(): EthStakingFilter => toValue(selection), (): EthStakingCombinedFilter | undefined => toValue(filter)], ([newSelection, newFilter]) => {
    set(performancePagination, toPerformancePayload(newSelection, newFilter, {
      limit: get(performancePagination).limit,
      offset: 0,
    }));
  }, { deep: true });

  return { tablePagination };
}
