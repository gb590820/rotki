import type { ThemeColors } from '@rotki/common';
import type { WritableComputedRef } from 'vue';
import { startPromise } from '@shared/utils';
import { useSettingsOperations } from '@/modules/settings/use-settings-operations';
import { useThemeSettings } from '@/modules/shell/theme/use-theme-settings';

interface UseThemeManagerReturn {
  /** The light theme's colors; writing saves them to the frontend settings. */
  modelLightTheme: WritableComputedRef<ThemeColors>;
  /** The dark theme's colors; writing saves them to the frontend settings. */
  modelDarkTheme: WritableComputedRef<ThemeColors>;
}

/**
 * The custom theme colors as editable models.
 *
 * @remarks
 * The settings stay the single source: a write goes to the backend and the model reads the setting
 * back, so the app repaints through `useDarkMode` like any other settings change.
 */
export function useThemeManager(): UseThemeManagerReturn {
  const { darkTheme, lightTheme } = useThemeSettings();
  const { updateFrontendSetting } = useSettingsOperations();

  const modelLightTheme = computed<ThemeColors>({
    get: () => get(lightTheme),
    set: (colors) => {
      startPromise(updateFrontendSetting({ lightTheme: colors }));
    },
  });

  const modelDarkTheme = computed<ThemeColors>({
    get: () => get(darkTheme),
    set: (colors) => {
      startPromise(updateFrontendSetting({ darkTheme: colors }));
    },
  });

  return { modelDarkTheme, modelLightTheme };
}
