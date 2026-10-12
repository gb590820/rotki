import type { EChartsOption } from 'echarts';
import { type DistributionSlice, OTHERS_SLICE_KEY } from './value-distribution';

/** One color per slice, in slice order; the grouped slice always takes {@link OTHERS_COLOR}. */
const SLICE_COLORS = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
  '#2f4554',
] as const;

const OTHERS_COLOR = '#a0a7b4';

/** The color a slice is drawn with, so a legend beside the chart can match it. */
export function sliceColor(slice: DistributionSlice, index: number): string {
  if (slice.key === OTHERS_SLICE_KEY)
    return OTHERS_COLOR;
  return SLICE_COLORS[index % SLICE_COLORS.length];
}

/**
 * The donut chart of a value distribution.
 *
 * @remarks
 * The tooltip names the slice, through `label`, and its share only. The absolute value stays in
 * the legend, where the amount display components apply privacy mode and scrambling.
 */
export function createDistributionChartOption(
  slices: DistributionSlice[],
  label: (key: string) => string,
): EChartsOption {
  return {
    series: [{
      avoidLabelOverlap: true,
      data: slices.map((slice, index) => ({
        itemStyle: { color: sliceColor(slice, index) },
        name: label(slice.key),
        value: Number(slice.percentage.toFixed(2)),
      })),
      label: { show: false },
      radius: ['45%', '75%'],
      type: 'pie',
    }],
    tooltip: {
      formatter: '{b}: {c}%',
      trigger: 'item',
    },
  };
}
