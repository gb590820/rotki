import type { NetValueChartData } from '@/modules/dashboard/graph/types';
import { TimeFramePeriod, TimeFramePersist } from '@rotki/common';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NetValueOverTimeCard from './NetValueOverTimeCard.vue';
import '@test/i18n';

const { fetchNetValue, getNetValue, resetZoom } = vi.hoisted(() => ({
  fetchNetValue: vi.fn<() => Promise<void>>(),
  getNetValue: vi.fn<(startingDate: number) => NetValueChartData>((startingDate: number) => ({
    data: [],
    snapshotCount: 0,
    times: [startingDate],
  })),
  resetZoom: vi.fn<() => void>(),
}));

vi.mock('@/modules/statistics/use-statistics-store', () => ({
  useStatisticsStore: (): Record<string, unknown> => ({ getNetValue }),
}));

vi.mock('@/modules/statistics/use-statistics-data-fetching', () => ({
  useStatisticsDataFetching: (): Record<string, unknown> => ({ fetchNetValue }),
}));

const NOW = new Date('2026-06-15T12:00:00Z');

function createWrapper(): VueWrapper {
  return mount(NetValueOverTimeCard, {
    global: {
      stubs: {
        NetWorthChart: { methods: { resetZoom }, name: 'NetWorthChart', props: ['chartData', 'zoomRange'], template: '<div />' },
        RuiCard: { template: '<div><slot /></div>' },
        TimeframeSelector: { emits: ['update:modelValue'], name: 'TimeframeSelector', props: ['modelValue', 'visibleTimeframes'], template: '<div />' },
      },
    },
  });
}

function chartStart(wrapper: VueWrapper): number {
  return wrapper.findComponent({ name: 'NetWorthChart' }).props('chartData').times[0];
}

describe('modules/statistics/graphs/NetValueOverTimeCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should refresh the net value when mounted', async () => {
    createWrapper();
    await flushPromises();

    expect(fetchNetValue).toHaveBeenCalledOnce();
  });

  it('should chart the whole history by default', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent({ name: 'TimeframeSelector' }).props('modelValue')).toBe(TimeFramePeriod.ALL);
    expect(chartStart(wrapper)).toBe(0);
  });

  it('should chart from the start of the selected timeframe and reset the zoom', async () => {
    const wrapper = createWrapper();

    wrapper.findComponent({ name: 'TimeframeSelector' }).vm.$emit('update:modelValue', TimeFramePeriod.WEEK);
    await nextTick();

    expect(chartStart(wrapper)).toBe(new Date('2026-06-08T00:00:00Z').getTime() / 1000);
    expect(resetZoom).toHaveBeenCalledOnce();
  });

  it('should ignore the remember option, which is not a period', async () => {
    const wrapper = createWrapper();

    wrapper.findComponent({ name: 'TimeframeSelector' }).vm.$emit('update:modelValue', TimeFramePersist.REMEMBER);
    await nextTick();

    expect(chartStart(wrapper)).toBe(0);
    expect(resetZoom).not.toHaveBeenCalled();
  });
});
