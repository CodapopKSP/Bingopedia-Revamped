import { describe, it, expect } from 'vitest'
import { normalizeTitle } from './normalizeTitle'

describe('normalizeTitle', () => {
  it('should replace spaces with underscores', () => {
    expect(normalizeTitle('New York')).toBe('new_york')
  })

  it('should collapse multiple underscores', () => {
    expect(normalizeTitle('New__York')).toBe('new_york')
    expect(normalizeTitle('New___York')).toBe('new_york')
  })

  it('should trim whitespace', () => {
    expect(normalizeTitle('  New York  ')).toBe('new_york')
  })

  it('should convert to lowercase', () => {
    expect(normalizeTitle('NEW YORK')).toBe('new_york')
    expect(normalizeTitle('New York')).toBe('new_york')
  })

  it('should handle mixed case and spaces', () => {
    expect(normalizeTitle('New York City')).toBe('new_york_city')
  })

  it('should handle titles that already have underscores', () => {
    expect(normalizeTitle('New_York')).toBe('new_york')
  })

  it('should handle empty string', () => {
    expect(normalizeTitle('')).toBe('')
  })

  it('should handle null', () => {
    expect(normalizeTitle(null)).toBe('')
  })

  it('should handle undefined', () => {
    expect(normalizeTitle(undefined)).toBe('')
  })

  it('should handle titles with special characters', () => {
    expect(normalizeTitle('C++')).toBe('c++')
    expect(normalizeTitle('C#')).toBe('c#')
  })

  it('should normalize equivalent titles consistently', () => {
    const title1 = normalizeTitle('New York')
    const title2 = normalizeTitle('new_york')
    const title3 = normalizeTitle('NEW YORK')
    expect(title1).toBe(title2)
    expect(title2).toBe(title3)
  })
})

