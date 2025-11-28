"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";
type Theme = "default" | "ocean" | "forest" | "sunset" | "slate";

interface ThemeProviderState {
  mode: Mode;
  theme: Theme;
  portalTheme: Theme;
  setMode: (mode: Mode) => void;
  setTheme: (theme: Theme) => void;
  setPortalTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  mode: "dark",
  theme: "default",
  portalTheme: "default",
  setMode: () => null,
  setTheme: () => null,
  setPortalTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: Mode;
  defaultTheme?: Theme;
  defaultPortalTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultMode = "dark",
  defaultTheme = "default",
  defaultPortalTheme = "default",
  storageKey = "coreos-theme",
}: ThemeProviderProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [portalTheme, setPortalTheme] = useState<Theme>(defaultPortalTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved preferences
    const savedMode = localStorage.getItem(`${storageKey}-mode`) as Mode;
    const savedTheme = localStorage.getItem(`${storageKey}-theme`) as Theme;
    const savedPortalTheme = localStorage.getItem(`${storageKey}-portal-theme`) as Theme;

    if (savedMode) setMode(savedMode);
    if (savedTheme) setTheme(savedTheme);
    if (savedPortalTheme) setPortalTheme(savedPortalTheme);
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Handle mode (light/dark)
    root.classList.remove("light", "dark");
    if (mode === "system") {
      const systemMode = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemMode);
    } else {
      root.classList.add(mode);
    }

    // Handle theme preset
    root.classList.remove("theme-ocean", "theme-forest", "theme-sunset", "theme-slate");
    if (theme !== "default") {
      root.classList.add(`theme-${theme}`);
    }

    // Save to localStorage
    localStorage.setItem(`${storageKey}-mode`, mode);
    localStorage.setItem(`${storageKey}-theme`, theme);
    localStorage.setItem(`${storageKey}-portal-theme`, portalTheme);
  }, [mode, theme, portalTheme, mounted, storageKey]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeProviderContext.Provider value={{ ...initialState, mode: defaultMode, theme: defaultTheme, portalTheme: defaultPortalTheme }}>
        {children}
      </ThemeProviderContext.Provider>
    );
  }

  return (
    <ThemeProviderContext.Provider
      value={{
        mode,
        theme,
        portalTheme,
        setMode: (newMode: Mode) => setMode(newMode),
        setTheme: (newTheme: Theme) => setTheme(newTheme),
        setPortalTheme: (newPortalTheme: Theme) => setPortalTheme(newPortalTheme),
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export type { Mode, Theme };
