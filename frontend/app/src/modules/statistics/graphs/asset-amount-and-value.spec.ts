import { bigNumberify, type GradientArea } from '@rotki/common';
import { describe, expect, it } from 'vitest';
import { createAmountAndValueChartOption, toAmountAndValuePoints } from './asset-amount-and-value';

function balance(time: number, amount: number, usdValue: number): { amount: ReturnType<typeof bigNumberify>; time: number; usdValue: ReturnType<typeof bigNumberify> } {
  return { amount: bigNumberify(amount), time, usdValue: bigNumberify(usdValue) };
}

const valueArea: GradientArea = { color: { colorStops: [], type: 'linear', x: 0, x2: 0, y: 0, y2: 1 } };

describe('modules/statistics/graphs/asset-amount-and-value', () => {
  describe('toAmountAndValuePoints', () => {
    it('should order the points oldest first and convert values with the rate', () => {
      const points = toAmountAndValuePoints([balance(200, 2, 20), balance(100, 1, 10)], bigNumberify(3));

      expect(points.map(point => [point.time, point.amount.toFixed(), point.value.toFixed()])).toEqual([
        [100, '1', '30'],
        [200, '2', '60'],
      ]);
    });

    it('should sum the rows a collection reports at the same snapshot', () => {
      const points = toAmountAndValuePoints([balance(100, 1, 10), balance(100, 2.5, 25)], bigNumberify(1));

      expect(points.map(point => [point.time, point.amount.toFixed(), point.value.toFixed()])).toEqual([
        [100, '3.5', '35'],
      ]);
    });
  });

  describe('createAmountAndValueChartOption', () => {
    const points = toAmountAndValuePoints([balance(100, 1, 10), balance(200, 2, 30)], bigNumberify(1));
    const option = createAmountAndValueChartOption(points, { amount: '#111111', value: '#222222', valueArea });

    it('should plot value and amount against millisecond timestamps, each on its own axis', () => {
      expect(option.series).toEqual([
        expect.objectContaining({ data: [[100_000, 10], [200_000, 30]], yAxisIndex: 0 }),
        expect.objectContaining({ data: [[100_000, 1], [200_000, 2]], yAxisIndex: 1 }),
      ]);
    });

    it('should hide the axis labels and the built-in tooltip, which would bypass privacy mode', () => {
      expect(option.yAxis).toEqual([
        expect.objectContaining({ axisLabel: { show: false } }),
        expect.objectContaining({ axisLabel: { show: false } }),
      ]);
      expect(option.tooltip).toEqual(expect.objectContaining({ showContent: false }));
    });
  });
});
