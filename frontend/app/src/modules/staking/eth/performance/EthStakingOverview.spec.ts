import { bigNumberify } from '@rotki/common';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EthStakingOverview from './EthStakingOverview.vue';
import '@test/i18n';

function createWrapper(sums: InstanceType<typeof EthStakingOverview>['$props']['sums']): VueWrapper {
  return mount(EthStakingOverview, {
    global: {
      stubs: {
        AssetAmountDisplay: { props: ['amount', 'asset'], template: '<span class="amount" :data-asset="asset" :data-amount="amount.toFixed()" />' },
        PercentageDisplay: { props: ['value'], template: '<span class="percentage" :data-value="value" />' },
        RuiCard: { template: '<div><slot name="header" /><slot /></div>' },
      },
    },
    props: { sums, total: bigNumberify(64) },
  });
}

function amountIn(wrapper: VueWrapper, testId: string): string | undefined {
  return wrapper.find(`[data-testid=${testId}] .amount`).attributes('data-amount');
}

describe('modules/staking/eth/performance/EthStakingOverview', () => {
  it('should show the staked total and the rewards, in ETH', () => {
    const wrapper = createWrapper({
      outstandingConsensusPnl: bigNumberify(0.2),
      sum: bigNumberify(3.5),
      withdrawals: bigNumberify(1.5),
    });

    expect(amountIn(wrapper, 'eth-staking-staked')).toBe('64');
    expect(wrapper.find('[data-testid=eth-staking-staked] .amount').attributes('data-asset')).toBe('ETH');
    expect(amountIn(wrapper, 'eth-staking-total-reward')).toBe('3.5');
    expect(amountIn(wrapper, 'eth-staking-withdrawn')).toBe('1.5');
    expect(amountIn(wrapper, 'eth-staking-outstanding')).toBe('0.2');
  });

  it('should add block and MEV rewards into the execution layer total', () => {
    const wrapper = createWrapper({ executionBlocks: bigNumberify(0.25), executionMev: bigNumberify(0.5) });

    expect(amountIn(wrapper, 'eth-staking-execution')).toBe('0.75');
  });

  it('should show the APR, a fraction, as a percentage', () => {
    const wrapper = createWrapper({ apr: bigNumberify(0.0345) });

    expect(wrapper.find('[data-testid=eth-staking-apr] .percentage').attributes('data-value')).toBe('3.45');
  });

  it('should show zero for sums the backend left out', () => {
    const wrapper = createWrapper({});

    expect(amountIn(wrapper, 'eth-staking-total-reward')).toBe('0');
    expect(amountIn(wrapper, 'eth-staking-execution')).toBe('0');
    expect(wrapper.find('[data-testid=eth-staking-apr] .percentage').attributes('data-value')).toBe('0.00');
  });
});
