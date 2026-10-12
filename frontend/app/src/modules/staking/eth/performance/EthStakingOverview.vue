<script setup lang="ts">
import { type BigNumber, type EthStakingPerformance, Zero } from '@rotki/common';
import { AssetAmountDisplay } from '@/modules/assets/amount-display/components';
import PercentageDisplay from '@/modules/shell/components/display/PercentageDisplay.vue';

const { loading = false, sums, total } = defineProps<{
  sums: EthStakingPerformance['sums'];
  /** ETH staked by the validators the page shows */
  total: BigNumber;
  loading?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const executionRewards = computed<BigNumber>(() => (sums.executionBlocks ?? Zero).plus(sums.executionMev ?? Zero));

/** The APR comes as a fraction of one; the display expects a percentage. */
const aprPercentage = computed<string>(() => (sums.apr ?? Zero).multipliedBy(100).toFixed(2));
</script>

<template>
  <RuiCard data-testid="eth-staking-overview">
    <template #header>
      {{ t('premium_components.eth2_staking.overview') }}
    </template>
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      <div data-testid="eth-staking-staked">
        <div class="text-rui-text-secondary text-caption">
          {{ t('common.balance') }}
        </div>
        <AssetAmountDisplay
          class="text-h6"
          asset="ETH"
          :amount="total"
          :loading="loading"
        />
      </div>
      <div data-testid="eth-staking-total-reward">
        <div class="text-rui-text-secondary text-caption">
          {{ t('premium_components.eth2_staking.rewards.total_reward') }}
        </div>
        <AssetAmountDisplay
          class="text-h6"
          asset="ETH"
          :amount="sums.sum ?? Zero"
          :loading="loading"
        />
      </div>
      <div data-testid="eth-staking-apr">
        <div class="text-rui-text-secondary text-caption">
          {{ t('premium_components.common.apr') }}
        </div>
        <PercentageDisplay
          class="text-h6"
          justify="start"
          :value="aprPercentage"
        />
      </div>
      <div data-testid="eth-staking-withdrawn">
        <div class="text-rui-text-secondary text-caption">
          {{ t('premium_components.eth2_staking.rewards.withdrawn_cl') }}
        </div>
        <AssetAmountDisplay
          asset="ETH"
          :amount="sums.withdrawals ?? Zero"
          :loading="loading"
        />
      </div>
      <div data-testid="eth-staking-execution">
        <div class="text-rui-text-secondary text-caption">
          {{ t('premium_components.eth2_staking.rewards.el') }}
        </div>
        <AssetAmountDisplay
          asset="ETH"
          :amount="executionRewards"
          :loading="loading"
        />
        <div class="flex gap-4 text-caption text-rui-text-secondary">
          <span class="flex gap-1">
            {{ t('premium_components.eth2_staking.rewards.execution_blocks') }}
            <AssetAmountDisplay
              asset="ETH"
              :amount="sums.executionBlocks ?? Zero"
            />
          </span>
          <span class="flex gap-1">
            {{ t('premium_components.eth2_staking.rewards.execution_mev') }}
            <AssetAmountDisplay
              asset="ETH"
              :amount="sums.executionMev ?? Zero"
            />
          </span>
        </div>
      </div>
      <div data-testid="eth-staking-outstanding">
        <div class="text-rui-text-secondary text-caption">
          {{ t('premium_components.eth2_staking.rewards.consensus.title') }}
        </div>
        <AssetAmountDisplay
          asset="ETH"
          :amount="sums.outstandingConsensusPnl ?? Zero"
          :loading="loading"
        />
        <div class="text-caption text-rui-text-secondary">
          {{ t('premium_components.eth2_staking.rewards.consensus.description') }}
        </div>
      </div>
    </div>
  </RuiCard>
</template>
