import { bigNumberify } from '@rotki/common';
import { describe, expect, it } from 'vitest';
import { OTHERS_SLICE_KEY, toDistributionSlices } from './value-distribution';

function entry(key: string, value: number): { key: string; value: ReturnType<typeof bigNumberify> } {
  return { key, value: bigNumberify(value) };
}

function summarize(slices: ReturnType<typeof toDistributionSlices>): [string, string, number][] {
  return slices.map(slice => [slice.key, slice.value.toFixed(), slice.percentage]);
}

describe('modules/statistics/graphs/value-distribution', () => {
  it('should order slices by value, largest first, with their share of the total', () => {
    const slices = toDistributionSlices([entry('kraken', 25), entry('blockchain', 75)], 5);

    expect(summarize(slices)).toEqual([
      ['blockchain', '75', 75],
      ['kraken', '25', 25],
    ]);
  });

  it('should leave out the total row, zero values and liabilities', () => {
    const slices = toDistributionSlices([
      entry('total', 100),
      entry('banks', 0),
      entry('loans', -40),
      entry('kraken', 50),
      entry('blockchain', 50),
    ], 5);

    expect(summarize(slices)).toEqual([
      ['kraken', '50', 50],
      ['blockchain', '50', 50],
    ]);
  });

  it('should group everything past the largest slices into one others slice', () => {
    const slices = toDistributionSlices([
      entry('a', 40),
      entry('b', 30),
      entry('c', 20),
      entry('d', 6),
      entry('e', 4),
    ], 3);

    expect(summarize(slices)).toEqual([
      ['a', '40', 40],
      ['b', '30', 30],
      [OTHERS_SLICE_KEY, '30', 30],
    ]);
  });

  it('should not group when the entries fit within the slice budget', () => {
    const slices = toDistributionSlices([entry('a', 1), entry('b', 1), entry('c', 2)], 3);

    expect(slices.map(slice => slice.key)).toEqual(['c', 'a', 'b']);
    expect(slices.some(slice => slice.key === OTHERS_SLICE_KEY)).toBe(false);
  });

  it('should return no slices when nothing has a positive value', () => {
    expect(toDistributionSlices([entry('a', 0), entry('b', -1)], 5)).toEqual([]);
  });
});
