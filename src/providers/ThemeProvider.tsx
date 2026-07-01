'use client';

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

const CUSTOM_THEMES = ['dark', 'theme-midnight-phantom', 'theme-cyber-trench', 'theme-deep-matrix', 'theme-solar-eclipse', 'theme-absolute-zero'];

/**
 * Ensures the correct theme class is on <html> on mount.
 * After mount, next-themes handles all class changes via setTheme().
 */
function ThemeClassSync() {
  const { theme } = useTheme();

  React.useEffect(() => {
    if (!theme || !CUSTOM_THEMES.includes(theme)) return;
    const html = document.documentElement;
    CUSTOM_THEMES.forEach((cls) => {
      if (cls !== theme) html.classList.remove(cls);
    });
    if (!html.classList.contains(theme)) {
      html.classList.add(theme);
    }
  }, [theme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeClassSync />
      {children}
    </NextThemesProvider>
  );
}
