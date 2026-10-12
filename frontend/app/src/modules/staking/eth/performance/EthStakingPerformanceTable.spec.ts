import { bigNumberify } from '@rotki/common';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EthStakingPerformanceTable from './EthStakingPerformanceTable.vue';
import '@test/i18n';

/** Renders every column's slot for every row, like the real table, without its layout. */
const RuiDataTable = {
  emits: ['update:pagination'],
  name: 'RuiDataTable',
  props: ['cols', 'rows', 'loading', 'pagination'],
  template: `
    <div>
      <div v-for="row in rows" :key="row.index" data-testid="row">
        <span v-for="col in cols" :key="col.key" :data-col="col.key">
          <slot :name="'item.' + col.key" :row="row">{{ row[col.key] }}</slot>
        </span>
      </div>
    </div>`,
};

function createWrapper(): VueWrapper {
  return mount(EthStakingPerformanceTable, {
    global: {
      stubs: {
        AssetAmountDisplay: { props: ['amount', 'asset'], template: '<span class="amount" :data-asset="asset">{{ amount.toFixed() }}</span>' },
        PercentageDisplay: { props: ['value'], template: '<span class="percentage">{{ value }}</span>' },
        RuiChip: { template: '<span class="chip"><slot /></span>' },
        RuiDataTable,
      },
    },
    props: {
      pagination: { limit: 10, page: 1, total: 2 },
      validators: [
        { apr: bigNumberify(0.05), index: 1, status: 'active', sum: bigNumberify(2), total: bigNumberify(32) },
        { index: 2 },
      ],
    },
  });
}

function cell(wrapper: VueWrapper, row: number, column: string): string {
  return wrapper.findAll('[data-testid=row]')[row].find(`[data-col=${column}]`).text();
}

describe('modules/staking/eth/performance/EthStakingPerformanceTable', () => {
  it('should show one row per validator with its index and status', () => {
    const wrapper = createWrapper();

    expect(wrapper.findAll('[data-testid=row]')).toHaveLength(2);
    expect(cell(wrapper, 0, 'index')).toBe('1');
    expect(cell(wrapper, 0, 'status')).toBe('active');
    expect(cell(wrapper, 1, 'status')).toBe('');
  });

  it('should show the ETH columns as ETH amounts, zero when missing', () => {
    const wrapper = createWrapper();

    expect(cell(wrapper, 0, 'total')).toBe('32');
    expect(cell(wrapper, 0, 'sum')).toBe('2');
    expect(cell(wrapper, 1, 'withdrawals')).toBe('0');
    expect(wrapper.find('[data-col=total] .amount').attributes('data-asset')).toBe('ETH');
  });

  it('should show the APR as a percentage', () => {
    const wrapper = createWrapper();

    expect(cell(wrapper, 0, 'apr')).toBe('5.00');
    expect(cell(wrapper, 1, 'apr')).toBe('0.00');
  });

  it('should hand a new page from the table back through the model', async () => {
    const wrapper = createWrapper();

    wrapper.findComponent({ name: 'RuiDataTable' }).vm.$emit('update:pagination', { limit: 10, page: 2, total: 2 });
    await nextTick();

    expect(wrapper.emitted('update:pagination')).toEqual([[{ limit: 10, page: 2, total: 2 }]]);
  });
});
