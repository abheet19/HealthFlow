import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { ThemeMode } from "../theme";

const STORAGE_KEY = "healthflow-theme";

interface ThemeModeContextProps {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextProps>({
  mode: "dark",
  toggleMode: () => {},
});

const readStoredMode = (): ThemeMode | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
};

const systemPrefersLight = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: light)").matches;

/**
 * Drives the light/dark glass theme: keeps `<html data-theme>` (which the
 * shared CSS variables in index.css key off) and the MUI theme mode in sync,
 * and remembers an explicit choice in localStorage. Defaults to the
 * system preference when the viewer has never toggled it.
 */
export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode() ?? (systemPrefersLight() ? "light" : "dark"));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private browsing / storage disabled - theme just won't persist.
      }
      return next;
    });
  };

  const value = useMemo(() => ({ mode, toggleMode }), [mode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
};

export const useThemeMode = () => useContext(ThemeModeContext);
