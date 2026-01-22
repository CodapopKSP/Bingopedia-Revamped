import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
  return (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    // Reset document attribute
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('should provide default theme (dark) when no preference is set', () => {
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia(false)) // dark mode

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should detect system preference (light)', () => {
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia(true)) // light mode

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should load theme from localStorage', () => {
    localStorageMock.setItem('bingopedia-theme', 'light')
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia(false)) // dark mode (should be ignored)

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should persist theme to localStorage when set', () => {
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia(false))

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
    expect(localStorageMock.getItem('bingopedia-theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should toggle theme', () => {
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia(false))

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
    expect(localStorageMock.getItem('bingopedia-theme')).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(localStorageMock.getItem('bingopedia-theme')).toBe('dark')
  })

  it('should update data-theme attribute when theme changes', () => {
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia(false))

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    act(() => {
      result.current.setTheme('light')
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleError.mockRestore()
  })
})

