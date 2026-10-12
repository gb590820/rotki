import type { EChartsOption, LineSeriesOption } from 'echarts';
import { type BigNumber, type GradientArea, type TimedBalance, Zero } from '@rotki/common';

export interface AmountAndValuePoint {
  /** Seconds since the epoch */
  time: number;
  amount: BigNumber;
  /** In the main currency */
  value: BigNumber;
}

interface ChartColors {
  value: string;
  valueArea: GradientArea;
  amount: string;
}

/**
 * Turns the snapshot balances of an asset into chart points, oldest first.
 *
 * @remarks
 * A collection reports one row per member asset at each snapshot, so rows sharing a timestamp are
 * summed into one point. Values are stored in USD and converted with `rate`, today's rate of the
 * main currency, the same approximation the net value graph makes.
 */
export function toAmountAndValuePoints(balances: TimedBalance[], rate: BigNumber): AmountAndValuePoint[] {
  const byTime = new Map<number, AmountAndValuePoint>();
  for (const balance of balances) {
    const point = byTime.get(balance.time) ?? { amount: Zero, time: balance.time, value: Zero };
    byTime.set(balance.time, {
      amount: point.amount.plus(balance.amount),
      time: balance.time,
      value: point.value.plus(balance.usdValue.multipliedBy(rate)),
    });
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

const MILLISECONDS = 1000;

/**
 * The chart of an asset's amount and value over time, each on its own hidden axis.
 *
 * @remarks
 * Axis labels and the built-in tooltip are off, as on the net value graph: amounts are shown beside
 * the chart through the amount display components, which apply privacy mode and scrambling.
 */
export function createAmountAndValueChartOption(points: AmountAndValuePoint[], colors: ChartColors): EChartsOption {
  const valueSeries: LineSeriesOption = {
    areaStyle: colors.valueArea,
    data: points.map(point => [point.time * MILLISECONDS, point.value.toNumber()]),
    itemStyle: { color: colors.value },
    lineStyle: { color: colors.value },
    showSymbol: false,
    type: 'line',
    yAxisIndex: 0,
  };
  const amountSeries: LineSeriesOption = {
    data: points.map(point => [point.time * MILLISECONDS, point.amount.toNumber()]),
    itemStyle: { color: colors.amount },
    lineStyle: { color: colors.amount, type: 'dashed' },
    showSymbol: false,
    type: 'line',
    yAxisIndex: 1,
  };
  const hiddenValueAxis = {
    axisLabel: { show: false },
    scale: true,
    splitLine: { show: false },
    type: 'value',
  } as const;

  return {
    backgroundColor: 'transparent',
    grid: { bottom: 24, left: 16, right: 16, top: 16 },
    series: [valueSeries, amountSeries],
    tooltip: { showContent: false, trigger: 'axis' },
    xAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      type: 'time',
    },
    yAxis: [hiddenValueAxis, hiddenValueAxis],
  };
}
