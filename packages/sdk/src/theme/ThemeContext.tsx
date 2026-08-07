import React, { createContext, useContext } from 'react';
import type { LivenessTheme } from './types';
import { defaultTheme } from './defaults';

const ThemeContext = createContext<LivenessTheme>(defaultTheme);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: LivenessTheme;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): LivenessTheme {
  return useContext(ThemeContext);
}
