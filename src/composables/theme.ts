import { ref, watchEffect, type Ref } from 'vue';

export type Theme = 'light' | 'dark';

const themeStorageKey = 'theme-preference';

export function useTheme() {
  const initialTheme = (localStorage.getItem(themeStorageKey) as Theme) || 'light';
  const theme: Ref<Theme> = ref(initialTheme);

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  watchEffect(() => {
    const root = document.documentElement;

    localStorage.setItem(themeStorageKey, theme.value);

    if (theme.value === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  });

  return {
    theme,
    toggleTheme,
  };
}
