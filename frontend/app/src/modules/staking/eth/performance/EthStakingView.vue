<script setup lang="ts">
import type { BigNumber, EthStakingCombinedFilter, EthStakingFilter, EthStakingPayload, EthStakingPerformance } from '@rotki/common';
import EthStakingOverview from './EthStakingOverview.vue';
import EthStakingPerformanceTable from './EthStakingPerformanceTable.vue';
import { useEthStakingQuery } from './use-eth-staking-query';

const performancePagination = defineModel<EthStakingPayload>('performancePagination', { required: true });

const { accounts, filter, performance, performanceLoading = false, refreshing = false, total } = defineProps<{
  /** Whose staking is shown: withdrawal addresses or validators */
  accounts: EthStakingFilter;
  /** Over what period and in which status */
  filter: EthStakingCombinedFilter | undefined;
  performance: EthStakingPerformance;
  performanceLoading?: boolean;
  refreshing?: boolean;
  /** ETH staked by the validators shown */
  total: BigNumber;
}>();

defineSlots<{
  /** The controls that pick `accounts` and `filter` */
  selection: () => any;
}>();

const { tablePagination } = useEthStakingQuery(
  performancePagination,
  () => accounts,
  () => filter,
  () => performance.entriesFound,
);

const loading = computed<boolean>(() => refreshing || performanceLoading);
</script>

<template>
  <div class="flex flex-col gap-4">
    <slot name="selection" />
    <EthStakingOverview
      :sums="performance.sums"
      :total="total"
      :loading="loading"
    />
    <EthStakingPerformanceTable
      v-model:pagination="tablePagination"
      :validators="performance.validators"
      :loading="loading"
    />
  </div>
</template>
