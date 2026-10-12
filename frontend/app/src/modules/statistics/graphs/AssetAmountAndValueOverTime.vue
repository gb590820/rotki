<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { TimeFramePeriod, TimeFramePersist, type TimeFrameSetting } from '@rotki/common';
import VChart from 'vue-echarts';
import { AssetAmountDisplay, FiatDisplay } from '@/modules/assets/amount-display/components';
import DateDisplay from '@/modules/shell/components/display/DateDisplay.vue';
import TimeframeSelector from '@/modules/statistics/TimeframeSelector.vue';
import { useGraph } from '@/modules/statistics/use-graph';
import { type AmountAndValuePoint, createAmountAndValueChartOption } from './asset-amount-and-value';
import { useAssetAmountAndValue } from './use-asset-amount-and-value';

const { asset, collectionId } = defineProps<{
  asset: string;
  collectionId?: number;
}>();

const { t } = useI18n({ useScope: 'global' });

const timeframe = ref<TimeFramePeriod>(TimeFramePeriod.ALL);
const hoveredIndex = shallowRef<number>();

const { error, loading, points, refresh } = useAssetAmountAndValue(() => asset, () => collectionId, timeframe);
const { baseColor, gradient, secondaryColor } = useGraph();

const timeframeOptions = Object.values(TimeFramePeriod);

const chartOption = computed<EChartsOption>(() => createAmountAndValueChartOption(get(points), {
  amount: get(secondaryColor),
  value: get(baseColor),
  valueArea: get(gradient),
}));

/** The point summarized above the chart: the one under the pointer, else the latest. */
const shownPoint = computed<AmountAndValuePoint | undefined>(() => {
  const all = get(points);
  const index = get(hoveredIndex);
  return (index === undefined ? undefined : all[index]) ?? all.at(-1);
});

/** Follows the chart's axis pointer, whose event carries the index of the point under it. */
function followPointer(event: unknown): void {
  const dataIndex = typeof event === 'object' && event !== null ? Reflect.get(event, 'dataIndex') : undefined;
  if (typeof dataIndex === 'number')
    set(hoveredIndex, dataIndex);
}

function selectTimeframe(value: TimeFrameSetting): void {
  if (value !== TimeFramePersist.REMEMBER)
    set(timeframe, value);
}

function resetPointer(): void {
  set(hoveredIndex, undefined);
}

watch(points, resetPointer);
</script>

<template>
  <RuiCard data-testid="asset-amount-and-value">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div class="text-h6">
        {{ t('premium_components.statistics.asset_amount_and_value_over_time') }}
      </div>
      <TimeframeSelector
        :model-value="timeframe"
        :visible-timeframes="timeframeOptions"
        :disabled="loading"
        @update:model-value="selectTimeframe($event)"
      />
    </div>

    <div
      v-if="error"
      class="flex flex-col items-center gap-3 py-8 text-center text-caption text-rui-text-secondary break-all"
      data-testid="asset-amount-and-value-error"
    >
      {{ error }}
      <RuiButton
        size="sm"
        color="primary"
        variant="outlined"
        data-testid="asset-amount-and-value-retry"
        @click="refresh()"
      >
        {{ t('common.actions.retry') }}
      </RuiButton>
    </div>

    <div
      v-else-if="!loading && points.length === 0"
      class="py-8 text-center text-rui-text-secondary"
      data-testid="asset-amount-and-value-empty"
    >
      {{ t('premium_components.statistics.no_balance_snapshot_data_available') }}
    </div>

    <div
      v-else
      class="relative"
      data-testid="asset-amount-and-value-chart"
      @mouseleave="resetPointer()"
    >
      <div
        v-if="shownPoint"
        class="flex flex-wrap items-baseline gap-x-6 gap-y-1"
        data-testid="asset-amount-and-value-point"
      >
        <DateDisplay
          class="text-rui-text-secondary"
          :timestamp="shownPoint.time"
        />
        <AssetAmountDisplay
          class="font-medium"
          :asset="asset"
          :amount="shownPoint.amount"
        />
        <FiatDisplay
          class="font-medium"
          :value="shownPoint.value"
        />
      </div>
      <VChart
        class="h-72 w-full"
        :option="chartOption"
        autoresize
        @update-axis-pointer="followPointer($event)"
      />
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-white/[0.8] dark:bg-dark-elevated/[0.9]"
      >
        <RuiProgress
          circular
          variant="indeterminate"
          color="primary"
          size="32"
        />
      </div>
    </div>
  </RuiCard>
</template>
