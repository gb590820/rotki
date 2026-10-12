<script setup lang="ts">
import type { DataTableColumn, TablePaginationData } from '@rotki/ui-library';
import { type EthStakingPerformance, Zero } from '@rotki/common';
import { AssetAmountDisplay } from '@/modules/assets/amount-display/components';
import PercentageDisplay from '@/modules/shell/components/display/PercentageDisplay.vue';
import { useEthValidatorUtils } from '@/modules/staking/eth/use-eth-validator-utils';

type ValidatorPerformance = EthStakingPerformance['validators'][number];

const pagination = defineModel<TablePaginationData>('pagination', { required: true });

const { loading = false, validators } = defineProps<{
  validators: ValidatorPerformance[];
  loading?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });
const { getColor } = useEthValidatorUtils();

/** The ETH-valued columns, each shown as an amount. */
const amountColumns = ['total', 'withdrawals', 'executionBlocks', 'executionMev', 'outstandingConsensusPnl', 'sum'] as const;

const headers = computed<DataTableColumn<ValidatorPerformance>[]>(() => [
  { key: 'index', label: t('premium_components.eth2_staking.performance.index') },
  { key: 'status', label: t('common.status') },
  { align: 'end', key: 'total', label: t('common.balance') },
  { align: 'end', key: 'apr', label: t('premium_components.eth2_staking.performance.apr') },
  { align: 'end', key: 'withdrawals', label: t('premium_components.eth2_staking.performance.withdrawals') },
  { align: 'end', key: 'executionBlocks', label: t('premium_components.eth2_staking.performance.execution_blocks') },
  { align: 'end', key: 'executionMev', label: t('premium_components.eth2_staking.performance.execution_mev') },
  { align: 'end', key: 'outstandingConsensusPnl', label: t('premium_components.eth2_staking.performance.outstanding') },
  { align: 'end', key: 'sum', label: t('common.total') },
]);

function aprPercentage(validator: ValidatorPerformance): string {
  return (validator.apr ?? Zero).multipliedBy(100).toFixed(2);
}
</script>

<template>
  <RuiDataTable
    v-model:pagination.external="pagination"
    outlined
    dense
    :cols="headers"
    :rows="validators"
    :loading="loading"
    row-attr="index"
    data-testid="eth-staking-performance-table"
  >
    <template #item.status="{ row }">
      <RuiChip
        v-if="row.status"
        size="sm"
        :color="getColor(row.status)"
        class="uppercase font-semibold"
      >
        {{ row.status }}
      </RuiChip>
    </template>
    <template #item.apr="{ row }">
      <PercentageDisplay :value="aprPercentage(row)" />
    </template>
    <template
      v-for="column in amountColumns"
      :key="column"
      #[`item.${column}`]="{ row }"
    >
      <AssetAmountDisplay
        asset="ETH"
        :amount="row[column] ?? Zero"
      />
    </template>
  </RuiDataTable>
</template>
