<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import VChart from 'vue-echarts';
import { FiatDisplay } from '@/modules/assets/amount-display/components';
import AssetDetails from '@/modules/assets/AssetDetails.vue';
import LocationDisplay from '@/modules/history/LocationDisplay.vue';
import PercentageDisplay from '@/modules/shell/components/display/PercentageDisplay.vue';
import { useGraph } from '@/modules/statistics/use-graph';
import { type DistributionBy, useValueDistribution } from './use-value-distribution';
import { OTHERS_SLICE_KEY } from './value-distribution';
import { createDistributionChartOption, sliceColor } from './value-distribution-chart-option';

const { distributionBy } = defineProps<{
  distributionBy: DistributionBy;
}>();

const { t } = useI18n({ useScope: 'global' });

const { error, label, loading, refresh, slices } = useValueDistribution(distributionBy);
useGraph();

const title = computed<string>(() => (distributionBy === 'location'
  ? t('premium_components.statistics.value_distribution_by_location')
  : t('premium_components.statistics.value_distribution_by_asset')));

const chartOption = computed<EChartsOption>(() => createDistributionChartOption(get(slices), label));

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <RuiCard :data-testid="`value-distribution-${distributionBy}`">
    <template #header>
      {{ title }}
    </template>

    <div
      v-if="loading && slices.length === 0"
      class="flex justify-center py-8"
    >
      <RuiProgress
        circular
        variant="indeterminate"
        color="primary"
        size="32"
      />
    </div>

    <div
      v-else-if="error"
      class="flex flex-col items-center gap-3 py-8 text-center text-caption text-rui-text-secondary break-all"
      data-testid="value-distribution-error"
    >
      {{ error }}
      <RuiButton
        size="sm"
        color="primary"
        variant="outlined"
        data-testid="value-distribution-retry"
        @click="refresh()"
      >
        {{ t('common.actions.retry') }}
      </RuiButton>
    </div>

    <div
      v-else-if="slices.length === 0"
      class="py-8 text-center text-rui-text-secondary"
      data-testid="value-distribution-empty"
    >
      {{ t('premium_components.statistics.no_balance_snapshot_data_available') }}
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"
    >
      <VChart
        class="h-64 w-full"
        :option="chartOption"
        autoresize
      />
      <ul class="flex flex-col gap-2">
        <li
          v-for="(slice, index) in slices"
          :key="slice.key"
          class="flex items-center gap-2"
          data-testid="value-distribution-row"
        >
          <span
            class="size-3 rounded-full shrink-0"
            :style="{ backgroundColor: sliceColor(slice, index) }"
          />
          <span
            v-if="slice.key === OTHERS_SLICE_KEY"
            class="grow"
          >
            {{ label(slice.key) }}
          </span>
          <LocationDisplay
            v-else-if="distributionBy === 'location'"
            class="grow"
            :identifier="slice.key"
            horizontal
          />
          <AssetDetails
            v-else
            class="grow"
            :asset="slice.key"
          />
          <FiatDisplay :value="slice.value" />
          <PercentageDisplay
            class="w-20 shrink-0 text-rui-text-secondary"
            data-testid="value-distribution-percentage"
            :value="slice.percentage.toFixed(2)"
          />
        </li>
      </ul>
    </div>
  </RuiCard>
</template>
