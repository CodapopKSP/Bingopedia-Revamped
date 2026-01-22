import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../theme/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

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

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('should render and display current theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  it('should toggle theme on click', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')

    await user.click(button)

    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
    expect(localStorageMock.getItem('bingopedia-theme')).toBe('light')
  })

  it('should toggle theme on Enter key', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')

    button.focus()
    await user.keyboard('{Enter}')

    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('should toggle theme on Space key', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')

    button.focus()
    await user.keyboard(' ')

    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('should have proper ARIA attributes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('aria-pressed')
    expect(button).toHaveAttribute('title')
  })

  it('should display correct icon for dark theme', () => {
    localStorageMock.setItem('bingopedia-theme', 'dark')

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    // Check that sun icon is present (light mode icon when in dark mode)
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})

