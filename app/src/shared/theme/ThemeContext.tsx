import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'bingopedia-theme'

/**
 * Detects system color scheme preference.
 * @returns 'light' or 'dark' based on system preference
 */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark' // SSR default
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

/**
 * Gets the initial theme from localStorage or system preference.
 * @returns The initial theme
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark' // SSR default
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  
  return getSystemTheme()
}

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Theme provider component that manages theme state and persistence.
 * 
 * Features:
 * - localStorage persistence
 * - System preference detection on first load
 * - Applies theme via `data-theme` attribute on document root
 * - Defaults to dark mode if no preference
 * 
 * @param props - Component props
 * @param props.children - Child components
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme())

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Only update if user hasn't set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (!stored) {
        const newTheme: Theme = e.matches ? 'light' : 'dark'
        setThemeState(newTheme)
      }
    }

    // Check if browser supports addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context.
 * @returns Theme context value
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

