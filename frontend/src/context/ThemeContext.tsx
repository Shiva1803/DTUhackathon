import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
  isLoaded: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

// Helper to get initial theme from localStorage
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('parallax-theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mark as loaded on mount
  useEffect(() => {
    // Use queueMicrotask to avoid synchronous state update during effect
    queueMicrotask(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('parallax-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isLoaded]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}
