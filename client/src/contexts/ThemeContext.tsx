import { createContext, useContext, useEffect, useState } from "react";
import { Theme, ThemeColor, ThemeMode, themeService } from "@/lib/theme";

interface ThemeContextType {
  theme: Theme;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(themeService.getTheme());

  useEffect(() => {
    // Load theme on mount
    themeService.loadTheme();
    setTheme(themeService.getTheme());
  }, []);

  const setThemeColor = (color: ThemeColor) => {
    themeService.setColor(color);
    setTheme(themeService.getTheme());
  };

  const setThemeMode = (mode: ThemeMode) => {
    themeService.setTheme({ mode });
    setTheme(themeService.getTheme());
  };

  const toggleMode = () => {
    themeService.toggleMode();
    setTheme(themeService.getTheme());
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setThemeColor,
      setThemeMode,
      toggleMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
