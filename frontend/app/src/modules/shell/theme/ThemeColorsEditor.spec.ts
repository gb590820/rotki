import type { ThemeColors } from '@rotki/common';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ThemeColorsEditor from './ThemeColorsEditor.vue';
import '@test/i18n';

const DEFAULTS: ThemeColors = { accent: '#000002', graph: '#000003', primary: '#000001' };

function createWrapper(colors: ThemeColors): VueWrapper {
  return mount(ThemeColorsEditor, {
    global: {
      stubs: {
        RuiButton: { emits: ['click'], props: ['disabled'], template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>' },
      },
    },
    props: { defaults: DEFAULTS, modelValue: colors, title: 'Light' },
  });
}

describe('modules/shell/theme/ThemeColorsEditor', () => {
  it('should show one picker per theme color, holding its current value', () => {
    const wrapper = createWrapper({ accent: '#aaaaaa', graph: '#bbbbbb', primary: '#cccccc' });

    expect(wrapper.find<HTMLInputElement>('[data-testid=theme-color-primary]').element.value).toBe('#cccccc');
    expect(wrapper.find<HTMLInputElement>('[data-testid=theme-color-accent]').element.value).toBe('#aaaaaa');
    expect(wrapper.find<HTMLInputElement>('[data-testid=theme-color-graph]').element.value).toBe('#bbbbbb');
  });

  it('should emit the colors with only the picked one changed', async () => {
    const custom: ThemeColors = { accent: '#aaaaaa', graph: '#bbbbbb', primary: '#cccccc' };
    const wrapper = createWrapper(custom);

    await wrapper.find('[data-testid=theme-color-accent]').setValue('#123456');

    expect(wrapper.emitted('update:modelValue')).toEqual([[{ ...custom, accent: '#123456' }]]);
  });

  it('should reset to the application colors', async () => {
    const wrapper = createWrapper({ ...DEFAULTS, primary: '#ffffff' });

    await wrapper.find('[data-testid=theme-colors-reset]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[DEFAULTS]]);
  });

  it('should not offer a reset when the colors already are the defaults', () => {
    const wrapper = createWrapper({ ...DEFAULTS });

    expect(wrapper.find('[data-testid=theme-colors-reset]').attributes('disabled')).toBeDefined();
  });
});
