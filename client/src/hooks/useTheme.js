import { useLayoutEffect, useState } from 'react';
import { withViewTransition } from '../utils/motion.js';

export const themeStorageKey = 'lp-theme';

function readInitialTheme() {
  const preset = document.documentElement.dataset.theme;
  if (preset === 'light' || preset === 'dark') {
    return preset;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme);

  // Layout effect so the new tokens are on <html> before the view transition snapshots the page.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0F172A' : '#FFFFFF');
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Storage can be blocked; the theme still switches for this visit.
    }
    withViewTransition(() => setTheme(nextTheme));
  }

  return { theme, toggleTheme };
}

export default useTheme;
