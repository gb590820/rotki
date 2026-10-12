import { type BigNumber, Zero } from '@rotki/common';

/** The key of the slice that groups every entry past the largest ones. */
export const OTHERS_SLICE_KEY = 'others';

/** The location row the backend adds for the sum of every location, which is not a slice. */
const TOTAL_LOCATION = 'total';

export interface DistributionEntry {
  key: string;
  value: BigNumber;
}

export interface DistributionSlice {
  key: string;
  value: BigNumber;
  /** Share of the positive total, from 0 to 100 */
  percentage: number;
}

/**
 * Turns a value distribution into the slices of a pie.
 *
 * @remarks
 * Only positive values can be drawn as a share, so zero and negative entries (liabilities) are left
 * out, as is the backend's `total` location row. The largest `maxSlices - 1` entries keep their own
 * slice and the rest are summed into one {@link OTHERS_SLICE_KEY} slice, so a long tail of dust does
 * not shrink every slice into a sliver.
 *
 * @param entries - values, already converted to the currency they are shown in
 * @param maxSlices - the most slices returned, the grouped one included
 */
export function toDistributionSlices(entries: DistributionEntry[], maxSlices: number): DistributionSlice[] {
  const positive = entries
    .filter(entry => entry.key !== TOTAL_LOCATION && entry.value.gt(0))
    .sort((a, b) => b.value.comparedTo(a.value) ?? 0);

  const total = positive.reduce((sum, entry) => sum.plus(entry.value), Zero);
  if (total.isZero())
    return [];

  const kept = positive.length > maxSlices ? positive.slice(0, maxSlices - 1) : positive;
  const grouped = positive.slice(kept.length);
  const slices = grouped.length > 0
    ? [...kept, { key: OTHERS_SLICE_KEY, value: grouped.reduce((sum, entry) => sum.plus(entry.value), Zero) }]
    : kept;

  return slices.map(slice => ({
    ...slice,
    percentage: slice.value.div(total).multipliedBy(100).toNumber(),
  }));
}
