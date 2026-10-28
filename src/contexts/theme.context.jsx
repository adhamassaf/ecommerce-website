import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const THEME_PALETTES = [
  {
    id: 'classic',
    labelKey: 'themeClassic',
    swatch: ['#111111', '#c9a24b', '#f7f4ee'],
  },
  {
    id: 'ocean',
    labelKey: 'themeOcean',
    swatch: ['#0b3d5c', '#2f9ed8', '#eef6fb'],
  },
  {
    id: 'rose',
    labelKey: 'themeRose',
    swatch: ['#6b1e3a', '#e4578c', '#fdf2f6'],
  },
  {
    id: 'forest',
    labelKey: 'themeForest',
    swatch: ['#1b4332', '#40916c', '#eef6f1'],
  },
  {
    id: 'violet',
    labelKey: 'themeViolet',
    swatch: ['#3b1d6d', '#8b5cf6', '#f4f0ff'],
  },
  {
    id: 'sunset',
    labelKey: 'themeSunset',
    swatch: ['#7c2d12', '#f97316', '#fff7ed'],
  },
];

const STORAGE_KEY = 'crwn-theme-v1';

const readStoredTheme = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const ThemeContext = createContext({
  mode: 'light',
  palette: 'classic',
  setMode: () => {},
  toggleMode: () => {},
  setPalette: () => {},
});

export const ThemeProvider = ({ children }) => {
  const stored = readStoredTheme();
  const [mode, setModeState] = useState(
    stored?.mode === 'dark' ? 'dark' : 'light'
  );
  const [palette, setPaletteState] = useState(
    THEME_PALETTES.some((item) => item.id === stored?.palette)
      ? stored.palette
      : 'classic'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-palette', palette);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, palette }));
  }, [mode, palette]);

  const setMode = useCallback((next) => {
    setModeState(next === 'dark' ? 'dark' : 'light');
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const setPalette = useCallback((next) => {
    const exists = THEME_PALETTES.some((item) => item.id === next);
    setPaletteState(exists ? next : 'classic');
  }, []);

  const value = useMemo(
    () => ({
      mode,
      palette,
      setMode,
      toggleMode,
      setPalette,
    }),
    [mode, palette, setMode, toggleMode, setPalette]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
