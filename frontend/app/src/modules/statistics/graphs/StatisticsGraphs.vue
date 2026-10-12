<script setup lang="ts">
import StatisticsGraphSettings from '@/modules/settings/StatisticsGraphSettings.vue';
import AssetSelect from '@/modules/shell/components/inputs/AssetSelect.vue';
import AssetAmountAndValueOverTime from './AssetAmountAndValueOverTime.vue';
import NetValueOverTimeCard from './NetValueOverTimeCard.vue';
import ValueDistributionCard from './ValueDistributionCard.vue';

const { t } = useI18n({ useScope: 'global' });

const selectedAsset = ref<string>();

/**
 * Bumped when a graph setting changes. The over-time charts are keyed on it, so they remount and
 * load their data again under the new setting.
 */
const settingsVersion = shallowRef<number>(0);

function reloadCharts(): void {
  set(settingsVersion, get(settingsVersion) + 1);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-end">
      <StatisticsGraphSettings @updated="reloadCharts()" />
    </div>

    <NetValueOverTimeCard :key="`net-value-${settingsVersion}`" />

    <div class="flex flex-col gap-2">
      <AssetSelect
        v-model="selectedAsset"
        variant="outlined"
        clearable
        hide-details
        data-testid="statistics-graphs-asset"
        :label="t('premium_components.statistics.select_asset')"
      />
      <AssetAmountAndValueOverTime
        v-if="selectedAsset"
        :key="`asset-${settingsVersion}`"
        :asset="selectedAsset"
      />
      <RuiCard
        v-else
        data-testid="statistics-graphs-no-asset"
      >
        <div class="py-8 text-center text-rui-text-secondary">
          {{ t('premium_components.statistics.search_asset_to_see_graph') }}
        </div>
      </RuiCard>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ValueDistributionCard distribution-by="location" />
      <ValueDistributionCard distribution-by="asset" />
    </div>
  </div>
</template>
