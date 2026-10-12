import type { AmountAndValuePoint } from './asset-amount-and-value';
import { bigNumberify, TimeFramePeriod } from '@rotki/common';
import { mount, type VueWrapper } from '@vue/test-utils';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import AssetAmountAndValueOverTime from './AssetAmountAndValueOverTime.vue';
import '@test/i18n';

type UseAssetAmountAndValue = typeof import('./use-asset-amount-and-value').useAssetAmountAndValue;

const { error, loading, points, refresh, useAssetAmountAndValue } = await vi.hoisted(async () => {
  const { computed, ref } = await import('vue');
  const { get } = await import('@vueuse/shared');
  const error = ref<string>();
  const loading = ref<boolean>(false);
  const points = ref<AmountAndValuePoint[]>([]);
  const refresh = vi.fn<() => Promise<void>>();
  return {
    error,
    loading,
    points,
    refresh,
    useAssetAmountAndValue: vi.fn<UseAssetAmountAndValue>(() => ({
      error,
      loading,
      points: computed<AmountAndValuePoint[]>(() => get(points)),
      refresh,
    })),
  };
});

vi.mock('./use-asset-amount-and-value', () => ({ useAssetAmountAndValue }));

/** The arguments the component handed to the data composable. */
function dataArguments(): Parameters<UseAssetAmountAndValue> {
  const call = useAssetAmountAndValue.mock.calls.at(-1);
  assert(call);
  return call;
}

vi.mock('@/modules/statistics/use-graph', async () => {
  const { computed } = await import('vue');
  return {
    useGraph: (): Record<string, unknown> => ({
      baseColor: computed<string>(() => '#000001'),
      gradient: computed<object>(() => ({})),
      secondaryColor: computed<string>(() => '#000002'),
    }),
  };
});

vi.mock('vue-echarts', () => ({
  default: { emits: ['updateAxisPointer'], name: 'VChart', props: ['option'], template: '<div class="vchart" />' },
}));

function point(time: number, amount: number, value: number): AmountAndValuePoint {
  return { amount: bigNumberify(amount), time, value: bigNumberify(value) };
}

function createWrapper(props: { asset: string; collectionId?: number } = { asset: 'ETH' }): VueWrapper {
  return mount(AssetAmountAndValueOverTime, {
    global: {
      stubs: {
        AssetAmountDisplay: { props: ['asset', 'amount'], template: '<span class="amount" :data-asset="asset" :data-amount="amount.toFixed()" />' },
        DateDisplay: { props: ['timestamp'], template: '<span class="date" :data-timestamp="timestamp" />' },
        FiatDisplay: { props: ['value'], template: '<span class="fiat" :data-value="value.toFixed()" />' },
        RuiCard: { template: '<div><slot /></div>' },
        TimeframeSelector: { emits: ['update:modelValue'], name: 'TimeframeSelector', props: ['modelValue', 'visibleTimeframes', 'disabled'], template: '<div class="timeframe" />' },
      },
    },
    props,
  });
}

function shown(wrapper: VueWrapper): [string | undefined, string | undefined, string | undefined] {
  return [
    wrapper.find('.date').attributes('data-timestamp'),
    wrapper.find('.amount').attributes('data-amount'),
    wrapper.find('.fiat').attributes('data-value'),
  ];
}

describe('modules/statistics/graphs/AssetAmountAndValueOverTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    set(error, undefined);
    set(loading, false);
    set(points, []);
  });

  it('should load the asset and collection it is given, over the whole history by default', () => {
    createWrapper({ asset: 'ETH', collectionId: 3 });

    const [asset, collectionId, timeframe] = dataArguments();
    expect(toValue(asset)).toBe('ETH');
    expect(toValue(collectionId)).toBe(3);
    expect(toValue(timeframe)).toBe(TimeFramePeriod.ALL);
  });

  it('should hand the selected timeframe to the data', async () => {
    const wrapper = createWrapper();

    wrapper.findComponent({ name: 'TimeframeSelector' }).vm.$emit('update:modelValue', TimeFramePeriod.YEAR);
    await nextTick();

    expect(toValue(dataArguments()[2])).toBe(TimeFramePeriod.YEAR);
  });

  it('should summarize the latest point until the pointer moves over another', async () => {
    set(points, [point(100, 1, 10), point(200, 2, 30)]);
    const wrapper = createWrapper();

    expect(shown(wrapper)).toEqual(['200', '2', '30']);
    expect(wrapper.find('.amount').attributes('data-asset')).toBe('ETH');

    wrapper.findComponent({ name: 'VChart' }).vm.$emit('updateAxisPointer', { dataIndex: 0 });
    await nextTick();
    expect(shown(wrapper)).toEqual(['100', '1', '10']);

    await wrapper.find('[data-testid=asset-amount-and-value-chart]').trigger('mouseleave');
    expect(shown(wrapper)).toEqual(['200', '2', '30']);
  });

  it('should ignore a pointer event without a point index', async () => {
    set(points, [point(100, 1, 10), point(200, 2, 30)]);
    const wrapper = createWrapper();

    wrapper.findComponent({ name: 'VChart' }).vm.$emit('updateAxisPointer', { axesInfo: [] });
    await nextTick();

    expect(shown(wrapper)).toEqual(['200', '2', '30']);
  });

  it('should chart the points', () => {
    set(points, [point(100, 1, 10)]);
    const wrapper = createWrapper();

    const option = wrapper.findComponent({ name: 'VChart' }).props('option');
    expect(option.series[0].data).toEqual([[100_000, 10]]);
  });

  it('should say there is no snapshot data when the asset has none', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid=asset-amount-and-value-empty]').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'VChart' }).exists()).toBe(false);
  });

  it('should show the failure and retry on request', async () => {
    set(error, 'backend down');
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid=asset-amount-and-value-error]').text()).toContain('backend down');
    await wrapper.find('[data-testid=asset-amount-and-value-retry]').trigger('click');
    expect(refresh).toHaveBeenCalledOnce();
  });
});
