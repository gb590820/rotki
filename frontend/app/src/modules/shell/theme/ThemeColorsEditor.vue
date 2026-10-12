<script setup lang="ts">
import type { ThemeColors } from '@rotki/common';
import { isEqual } from 'es-toolkit';

type ColorKey = keyof ThemeColors;

const colors = defineModel<ThemeColors>({ required: true });

const { defaults, title } = defineProps<{
  title: string;
  /** The application's own colors, which reset restores */
  defaults: ThemeColors;
}>();

const { t } = useI18n({ useScope: 'global' });

const fields = computed<{ key: ColorKey; label: string }[]>(() => [
  { key: 'primary', label: t('premium_components.theme_manager.primary') },
  { key: 'accent', label: t('premium_components.theme_manager.accent') },
  { key: 'graph', label: t('premium_components.theme_manager.graph') },
]);

const isDefault = computed<boolean>(() => isEqual(get(colors), defaults));

/** Takes a color once the picker settles on it, rather than on every step of a drag. */
function pickColor(key: ColorKey, event: Event): void {
  if (!(event.target instanceof HTMLInputElement))
    return;
  set(colors, { ...get(colors), [key]: event.target.value });
}

function reset(): void {
  set(colors, { ...defaults });
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <span class="font-medium">{{ title }}</span>
      <RuiButton
        variant="text"
        size="sm"
        color="primary"
        :disabled="isDefault"
        :title="t('premium_components.theme_manager.reset.default')"
        data-testid="theme-colors-reset"
        @click="reset()"
      >
        {{ t('premium_components.theme_manager.reset.short') }}
      </RuiButton>
    </div>
    <label
      v-for="field in fields"
      :key="field.key"
      class="flex items-center justify-between gap-4"
    >
      <span>{{ field.label }}</span>
      <input
        type="color"
        class="h-8 w-14 cursor-pointer rounded border border-default bg-transparent"
        :value="colors[field.key]"
        :title="t('premium_components.theme_manager.select_color')"
        :data-testid="`theme-color-${field.key}`"
        @change="pickColor(field.key, $event)"
      />
    </label>
  </div>
</template>
