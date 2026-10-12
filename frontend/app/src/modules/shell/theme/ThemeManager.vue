<script setup lang="ts">
import { DARK_COLORS, LIGHT_COLORS } from '@/plugins/theme';
import ThemeColorsEditor from './ThemeColorsEditor.vue';
import { useThemeManager } from './use-theme-manager';

const { t } = useI18n({ useScope: 'global' });

const { modelDarkTheme, modelLightTheme } = useThemeManager();
</script>

<template>
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-8"
    data-testid="theme-manager"
  >
    <ThemeColorsEditor
      v-model="modelLightTheme"
      :title="t('premium_components.theme_manager.light_theme')"
      :defaults="LIGHT_COLORS"
      data-testid="theme-manager-light"
    />
    <ThemeColorsEditor
      v-model="modelDarkTheme"
      :title="t('premium_components.theme_manager.dark_theme')"
      :defaults="DARK_COLORS"
      data-testid="theme-manager-dark"
    />
  </div>
</template>
