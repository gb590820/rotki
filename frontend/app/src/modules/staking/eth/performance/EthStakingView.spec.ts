import { bigNumberify, type EthStakingPerformance } from '@rotki/common';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EthStakingView from './EthStakingView.vue';
import '@test/i18n';

const performance: EthStakingPerformance = {
  entriesFound: 25,
  entriesTotal: 30,
  sums: { sum: bigNumberify(1) },
  validators: [{ index: 3 }],
};

function createWrapper(props: Partial<InstanceType<typeof EthStakingView>['$props']> = {}): VueWrapper {
  return mount(EthStakingView, {
    global: {
      stubs: {
        EthStakingOverview: { name: 'EthStakingOverview', props: ['sums', 'total', 'loading'], template: '<div />' },
        EthStakingPerformanceTable: { emits: ['update:pagination'], name: 'EthStakingPerformanceTable', props: ['validators', 'loading', 'pagination'], template: '<div />' },
      },
    },
    props: {
      accounts: { validators: [] },
      filter: undefined,
      performance,
      performancePagination: { limit: 10, offset: 10 },
      total: bigNumberify(96),
      ...props,
    },
    slots: { selection: '<div data-testid="selection" />' },
  });
}

describe('modules/staking/eth/performance/EthStakingView', () => {
  it('should render the selection controls it is given', () => {
    expect(createWrapper().find('[data-testid=selection]').exists()).toBe(true);
  });

  it('should hand the sums and the staked total to the overview', () => {
    const overview = createWrapper().findComponent({ name: 'EthStakingOverview' });

    expect(overview.props('sums')).toEqual(performance.sums);
    expect(overview.props('total').toFixed()).toBe('96');
  });

  it('should show the validators on the current page, counted by the matches', () => {
    const table = createWrapper().findComponent({ name: 'EthStakingPerformanceTable' });

    expect(table.props('validators')).toEqual(performance.validators);
    expect(table.props('pagination')).toEqual({ limit: 10, page: 2, total: 25 });
  });

  it('should show loading while either the refresh or the query runs', () => {
    expect(createWrapper({ refreshing: true }).findComponent({ name: 'EthStakingPerformanceTable' }).props('loading')).toBe(true);
    expect(createWrapper({ performanceLoading: true }).findComponent({ name: 'EthStakingOverview' }).props('loading')).toBe(true);
    expect(createWrapper().findComponent({ name: 'EthStakingOverview' }).props('loading')).toBe(false);
  });

  it('should turn a page chosen in the table into the performance query', async () => {
    const wrapper = createWrapper();

    wrapper.findComponent({ name: 'EthStakingPerformanceTable' }).vm.$emit('update:pagination', { limit: 10, page: 3, total: 25 });
    await nextTick();

    expect(wrapper.emitted('update:performancePagination')).toEqual([[{ limit: 10, offset: 20 }]]);
  });

  it('should query a new selection from the first page', async () => {
    const wrapper = createWrapper();

    await wrapper.setProps({ accounts: { validators: [{ index: 7, publicKey: '0x7', status: 'active' }] } });

    expect(wrapper.emitted('update:performancePagination')).toEqual([[{ limit: 10, offset: 0, validatorIndices: [7] }]]);
  });
});
