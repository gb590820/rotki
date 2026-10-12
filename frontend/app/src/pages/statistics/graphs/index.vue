<script setup lang="ts">
import { msg } from '@/message-key';
import { NoteLocation } from '@/modules/core/common/notes';
import StatisticsGraphs from '@/modules/statistics/graphs/StatisticsGraphs.vue';

definePage({
  meta: {
    nav: { labelKey: msg.$t('navigation_menu.statistics_sub.graphs'), icon: 'lu-chart-line', parent: '/statistics/', order: 10, drawer: 'statistics-graph' },
    noteLocation: NoteLocation.STATISTICS,
  },
});
</script>

<template>
  <div class="container">
    <StatisticsGraphs />
  </div>
</template>
