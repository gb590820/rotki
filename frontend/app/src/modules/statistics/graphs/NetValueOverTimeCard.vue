<script setup lang="ts">
import type { NetValueZoomRange } from '@/modules/dashboard/graph/net-value-stats';
import type { NetValueChartData } from '@/modules/dashboard/graph/types';
import { TimeFramePeriod, TimeFramePersist, timeframes, type TimeFrameSetting, TimeUnit } from '@rotki/common';
import dayjs from 'dayjs';
import NetWorthChart from '@/modules/dashboard/graph/NetWorthChart.vue';
import TimeframeSelector from '@/modules/statistics/TimeframeSelector.vue';
import { useStatisticsDataFetching } from '@/modules/statistics/use-statistics-data-fetching';
import { useStatisticsStore } from '@/modules/statistics/use-statistics-store';

const { t } = useI18n({ useScope: 'global' });

const netWorthChart = useTemplateRef<InstanceType<typeof NetWorthChart>>('netWorthChart');

/** Its own timeframe, so browsing history here leaves the dashboard's selection alone. */
const timeframe = ref<TimeFramePeriod>(TimeFramePeriod.ALL);
const zoomRange = ref<NetValueZoomRange>();

const { getNetValue } = useStatisticsStore();
const { fetchNetValue } = useStatisticsDataFetching();

const timeframeOptions = Object.values(TimeFramePeriod);

const chartData = computed<NetValueChartData>(() => {
  const all = timeframes((unit, amount) => dayjs().subtract(amount, unit).startOf(TimeUnit.DAY).unix());
  return getNetValue(all[get(timeframe)].startingDate());
});

function selectTimeframe(value: TimeFrameSetting): void {
  if (value === TimeFramePersist.REMEMBER)
    return;
  set(timeframe, value);
  set(zoomRange, undefined);
  get(netWorthChart)?.resetZoom();
}

onMounted(async () => {
  await fetchNetValue();
});
</script>

<template>
  <RuiCard data-testid="net-value-over-time">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div class="text-h6">
        {{ t('premium_components.statistics.netvalue_over_time') }}
      </div>
      <TimeframeSelector
        :model-value="timeframe"
        :visible-timeframes="timeframeOptions"
        @update:model-value="selectTimeframe($event)"
      />
    </div>
    <div class="relative">
      <NetWorthChart
        ref="netWorthChart"
        v-model:zoom-range="zoomRange"
        :chart-data="chartData"
      />
    </div>
  </RuiCard>
</template>
