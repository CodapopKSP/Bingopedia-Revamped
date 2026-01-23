import { describe, it, expect } from 'vitest'
import { formatTime } from './timeFormat'

describe('formatTime', () => {
  it('should format 0 seconds as "00:00:00"', () => {
    expect(formatTime(0)).toBe('00:00:00')
  })

  it('should format less than 60 seconds correctly', () => {
    expect(formatTime(59)).toBe('00:00:59')
    expect(formatTime(30)).toBe('00:00:30')
    expect(formatTime(1)).toBe('00:00:01')
  })

  it('should format less than 3600 seconds correctly', () => {
    expect(formatTime(60)).toBe('00:01:00')
    expect(formatTime(3660)).toBe('01:01:00')
    expect(formatTime(3599)).toBe('00:59:59')
  })

  it('should format more than 3600 seconds correctly', () => {
    expect(formatTime(3661)).toBe('01:01:01')
    expect(formatTime(5025)).toBe('01:23:45')
    expect(formatTime(3600)).toBe('01:00:00')
    expect(formatTime(7200)).toBe('02:00:00')
  })

  it('should handle edge cases gracefully', () => {
    expect(formatTime(NaN)).toBe('00:00:00')
    expect(formatTime(-1)).toBe('00:00:00')
    expect(formatTime(-100)).toBe('00:00:00')
  })

  it('should handle decimal seconds by flooring', () => {
    expect(formatTime(59.9)).toBe('00:00:59')
    expect(formatTime(60.5)).toBe('00:01:00')
    expect(formatTime(3661.7)).toBe('01:01:01')
  })
})

