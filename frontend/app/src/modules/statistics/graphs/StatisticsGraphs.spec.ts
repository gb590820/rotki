import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import StatisticsGraphs from './StatisticsGraphs.vue';
import '@test/i18n';

/** How many times the net value card was set up, which a remount increments. */
let netValueMounts = 0;

function createWrapper(): VueWrapper {
  return mount(StatisticsGraphs, {
    global: {
      stubs: {
        AssetAmountAndValueOverTime: { name: 'AssetAmountAndValueOverTime', props: ['asset'], template: '<div />' },
        AssetSelect: { emits: ['update:modelValue'], name: 'AssetSelect', props: ['modelValue'], template: '<div />' },
        NetValueOverTimeCard: {
          name: 'NetValueOverTimeCard',
          setup: (): void => {
            netValueMounts++;
          },
          template: '<div />',
        },
        RuiCard: { template: '<div v-bind="$attrs"><slot /></div>' },
        StatisticsGraphSettings: { emits: ['updated'], name: 'StatisticsGraphSettings', template: '<div />' },
        ValueDistributionCard: { name: 'ValueDistributionCard', props: ['distributionBy'], template: '<div />' },
      },
    },
  });
}

describe('modules/statistics/graphs/StatisticsGraphs', () => {
  beforeEach(() => {
    netValueMounts = 0;
  });

  it('should show the net value and both value distributions', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent({ name: 'NetValueOverTimeCard' }).exists()).toBe(true);
    expect(wrapper.findAllComponents({ name: 'ValueDistributionCard' }).map(card => card.props('distributionBy')))
      .toEqual(['location', 'asset']);
  });

  it('should ask for an asset before drawing its amount and value', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid=statistics-graphs-no-asset]').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'AssetAmountAndValueOverTime' }).exists()).toBe(false);
  });

  it('should draw the amount and value of the selected asset', async () => {
    const wrapper = createWrapper();

    wrapper.findComponent({ name: 'AssetSelect' }).vm.$emit('update:modelValue', 'ETH');
    await nextTick();

    expect(wrapper.findComponent({ name: 'AssetAmountAndValueOverTime' }).props('asset')).toBe('ETH');
    expect(wrapper.find('[data-testid=statistics-graphs-no-asset]').exists()).toBe(false);
  });

  it('should reload the over-time charts after a graph setting changes', async () => {
    const wrapper = createWrapper();
    expect(netValueMounts).toBe(1);

    wrapper.findComponent({ name: 'StatisticsGraphSettings' }).vm.$emit('updated');
    await nextTick();

    expect(netValueMounts).toBe(2);
  });
});
