import { bigNumberify } from '@rotki/common';
import { describe, expect, it } from 'vitest';
import { OTHERS_SLICE_KEY } from './value-distribution';
import { createDistributionChartOption, sliceColor } from './value-distribution-chart-option';

const slices = [
  { key: 'blockchain', percentage: 66.666_666, value: bigNumberify(200) },
  { key: OTHERS_SLICE_KEY, percentage: 33.333_333, value: bigNumberify(100) },
];

describe('modules/statistics/graphs/value-distribution-chart-option', () => {
  it('should draw one named slice per entry, valued by its rounded share', () => {
    const option = createDistributionChartOption(slices, key => `label:${key}`);

    expect(option.series).toEqual([expect.objectContaining({
      data: [
        { itemStyle: { color: sliceColor(slices[0], 0) }, name: 'label:blockchain', value: 66.67 },
        { itemStyle: { color: sliceColor(slices[1], 1) }, name: `label:${OTHERS_SLICE_KEY}`, value: 33.33 },
      ],
      type: 'pie',
    })]);
  });

  it('should not put absolute values in the tooltip', () => {
    const option = createDistributionChartOption(slices, key => key);

    expect(option.tooltip).toEqual(expect.objectContaining({ formatter: '{b}: {c}%' }));
  });

  it('should give the grouped slice its own color, whatever its position', () => {
    expect(sliceColor(slices[1], 0)).toBe(sliceColor(slices[1], 5));
    expect(sliceColor(slices[0], 0)).not.toBe(sliceColor(slices[1], 0));
  });
});
