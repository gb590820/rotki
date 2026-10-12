import type { ThemeColors } from '@rotki/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemeManager } from './use-theme-manager';

const { darkTheme, lightTheme, updateFrontendSetting } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  return {
    darkTheme: ref<ThemeColors>({ accent: '#d2', graph: '#d3', primary: '#d1' }),
    lightTheme: ref<ThemeColors>({ accent: '#l2', graph: '#l3', primary: '#l1' }),
    updateFrontendSetting: vi.fn<(payload: object) => Promise<{ success: boolean }>>(async () => ({ success: true })),
  };
});

vi.mock('@/modules/shell/theme/use-theme-settings', () => ({
  useThemeSettings: (): Record<string, unknown> => ({ darkTheme, lightTheme }),
}));

vi.mock('@/modules/settings/use-settings-operations', () => ({
  useSettingsOperations: (): Record<string, unknown> => ({ updateFrontendSetting }),
}));

describe('modules/shell/theme/use-theme-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read each theme from the settings', () => {
    const { modelDarkTheme, modelLightTheme } = useThemeManager();

    expect(get(modelLightTheme)).toEqual(get(lightTheme));
    expect(get(modelDarkTheme)).toEqual(get(darkTheme));
  });

  it('should save an edited light theme to the light theme setting only', () => {
    const { modelLightTheme } = useThemeManager();
    const colors: ThemeColors = { accent: '#000002', graph: '#000003', primary: '#000001' };

    set(modelLightTheme, colors);

    expect(updateFrontendSetting).toHaveBeenCalledExactlyOnceWith({ lightTheme: colors });
  });

  it('should save an edited dark theme to the dark theme setting only', () => {
    const { modelDarkTheme } = useThemeManager();
    const colors: ThemeColors = { accent: '#100002', graph: '#100003', primary: '#100001' };

    set(modelDarkTheme, colors);

    expect(updateFrontendSetting).toHaveBeenCalledExactlyOnceWith({ darkTheme: colors });
  });
});
