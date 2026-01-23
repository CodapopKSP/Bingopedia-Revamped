/**
 * Formats seconds into HH:MM:SS format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "01:23:45")
 */
export function formatTime(seconds: number): string {
  // Handle edge cases gracefully
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00'
  }
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

