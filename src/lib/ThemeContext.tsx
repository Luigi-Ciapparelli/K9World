import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark);

  root.classList.toggle('dark', shouldUseDark);
  root.dataset.theme = theme;
  root.style.colorScheme = shouldUseDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('pawconnect-theme');

    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }

    return 'system';
  });

  const setTheme = (nextTheme: ThemeMode) => {
    localStorage.setItem('pawconnect-theme', nextTheme);
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  };

  useEffect(() => {
    applyTheme(theme);

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const onChange = () => {
      if (theme === 'system') applyTheme('system');
    };

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return ctx;
}
