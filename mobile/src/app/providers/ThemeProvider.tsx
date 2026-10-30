import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from '../../shared/theme';

interface ThemeContextValue {
  theme: Theme;
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  theme?: Theme;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    let active = true;
    if (theme)
      return () => {
        active = false;
      };
    Promise.resolve(AsyncStorage.getItem('worksphere.appearance'))
      .then(value => {
        if (active && value === 'light') setDark(false);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [theme]);
  const toggle = () =>
    setDark(value => {
      AsyncStorage.setItem(
        'worksphere.appearance',
        value ? 'light' : 'dark',
      ).catch(() => {});
      return !value;
    });
  return (
    <ThemeContext.Provider
      value={{ theme: theme ?? (dark ? darkTheme : lightTheme), dark, toggle }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider required');
  return { dark: context.dark, toggle: context.toggle };
}

export function useAppTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context.theme;
}
