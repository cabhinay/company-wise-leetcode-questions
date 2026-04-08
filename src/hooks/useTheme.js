import { useState, useCallback } from 'react';

function getTheme() {
  if (typeof window === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getTheme);

  const setTheme = useCallback((t) => {
    // Briefly disable transitions to prevent flash
    document.documentElement.classList.add('no-transitions');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', t);
    setThemeState(t);
    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transitions');
      });
    });
  }, []);

  const toggle = useCallback(() => {
    // Read directly from DOM to avoid stale closure
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, setTheme, toggle, isDark: theme === 'dark' };
}
