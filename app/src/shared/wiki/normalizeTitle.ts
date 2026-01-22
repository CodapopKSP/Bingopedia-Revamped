/**
 * Normalizes a Wikipedia article title for consistent comparison.
 * 
 * Normalization steps:
 * - Replaces all whitespace with underscores
 * - Collapses multiple underscores into single underscores
 * - Trims leading/trailing whitespace
 * - Converts to lowercase
 * 
 * This ensures titles like "New York", "New_York", and "new york" all match.
 * 
 * @param rawTitle - The raw article title (may be null/undefined)
 * @returns Normalized title string (empty string if input is falsy)
 */
export function normalizeTitle(rawTitle: string | null | undefined): string {
  if (!rawTitle) return ''
  return rawTitle
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim()
    .toLowerCase()
}


