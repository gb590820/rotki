import { bigNumberify } from '@rotki/common';
import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type DistributionSlice, OTHERS_SLICE_KEY } from './value-distribution';
import ValueDistributionCard from './ValueDistributionCard.vue';
import '@test/i18n';

const { error, loading, refresh, slices } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  return {
    error: ref<string>(),
    loading: ref<boolean>(false),
    refresh: vi.fn<() => Promise<void>>(),
    slices: ref<DistributionSlice[]>([]),
  };
});

vi.mock('./use-value-distribution', () => ({
  useValueDistribution: (): ReturnType<typeof import('./use-value-distribution').useValueDistribution> => ({
    error,
    label: (key: string): string => `label:${key}`,
    loading,
    refresh,
    slices: computed<DistributionSlice[]>(() => get(slices)),
  }),
}));

vi.mock('@/modules/statistics/use-graph', () => ({
  useGraph: vi.fn(),
}));

vi.mock('vue-echarts', () => ({
  default: { name: 'VChart', props: ['option'], template: '<div class="vchart" />' },
}));

function createWrapper(distributionBy: 'asset' | 'location'): VueWrapper {
  return mount(ValueDistributionCard, {
    global: {
      stubs: {
        AssetDetails: { props: ['asset'], template: '<span class="asset-details" :data-asset="asset" />' },
        FiatDisplay: { props: ['value'], template: '<span class="fiat" :data-value="value.toFixed()" />' },
        LocationDisplay: { props: ['identifier'], template: '<span class="location" :data-location="identifier" />' },
        PercentageDisplay: { props: ['value'], template: '<span :data-value="value" />' },
        RuiCard: { template: '<div><slot name="header" /><slot /></div>' },
      },
    },
    props: { distributionBy },
  });
}

const twoSlices: DistributionSlice[] = [
  { key: 'kraken', percentage: 75, value: bigNumberify(300) },
  { key: OTHERS_SLICE_KEY, percentage: 25, value: bigNumberify(100) },
];

describe('modules/statistics/graphs/ValueDistributionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    set(error, undefined);
    set(loading, false);
    set(slices, []);
  });

  it('should load the distribution when mounted', () => {
    createWrapper('location');

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('should show a spinner and no rows while the first load runs', () => {
    set(loading, true);

    const wrapper = createWrapper('location');

    expect(wrapper.findComponent({ name: 'RuiProgress' }).exists()).toBe(true);
    expect(wrapper.findAll('[data-testid=value-distribution-row]')).toHaveLength(0);
  });

  it('should show the failure and retry on request', async () => {
    set(error, 'backend down');

    const wrapper = createWrapper('location');
    refresh.mockClear();

    expect(wrapper.find('[data-testid=value-distribution-error]').text()).toContain('backend down');
    await wrapper.find('[data-testid=value-distribution-retry]').trigger('click');
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('should say there is no snapshot data when nothing has a value', () => {
    const wrapper = createWrapper('asset');

    expect(wrapper.find('[data-testid=value-distribution-empty]').text())
      .toBe('premium_components.statistics.no_balance_snapshot_data_available');
  });

  it('should list each location slice with its value and share, and chart them', () => {
    set(slices, twoSlices);

    const wrapper = createWrapper('location');

    const rows = wrapper.findAll('[data-testid=value-distribution-row]');
    expect(rows).toHaveLength(2);
    expect(rows[0].find('.location').attributes('data-location')).toBe('kraken');
    expect(rows[0].find('.fiat').attributes('data-value')).toBe('300');
    expect(rows[0].find('[data-testid=value-distribution-percentage]').attributes('data-value')).toBe('75.00');
    expect(rows[1].text()).toContain(`label:${OTHERS_SLICE_KEY}`);
    expect(rows[1].find('.location').exists()).toBe(false);

    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.series[0].data.map((item: { name: string }) => item.name))
      .toEqual(['label:kraken', `label:${OTHERS_SLICE_KEY}`]);
  });

  it('should show assets rather than locations when distributed by asset', () => {
    set(slices, [{ key: 'ETH', percentage: 100, value: bigNumberify(1) }]);

    const wrapper = createWrapper('asset');

    expect(wrapper.find('.asset-details').attributes('data-asset')).toBe('ETH');
    expect(wrapper.find('.location').exists()).toBe(false);
    expect(wrapper.text()).toContain('premium_components.statistics.value_distribution_by_asset');
  });
});
