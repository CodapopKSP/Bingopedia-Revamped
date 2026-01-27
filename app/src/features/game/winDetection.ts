import type { GameGridCell, GridIndex } from './types'
import { getCuratedArticleTitle } from '../../shared/data/types'
import { normalizeTitle } from '../../shared/wiki/normalizeTitle'

/**
 * All 12 possible winning lines in a 5×5 bingo grid:
 * - 5 rows (horizontal)
 * - 5 columns (vertical)
 * - 2 diagonals (top-left to bottom-right, top-right to bottom-left)
 */
const WIN_LINES: GridIndex[][] = [
  // rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

/**
 * Detects all winning cells in a 5×5 bingo grid based on matched articles.
 * 
 * A line wins when all 5 cells in that line have been matched.
 * Multiple lines can win simultaneously (e.g., a row and a column).
 * 
 * Matching is case-insensitive and uses normalized titles.
 * 
 * @param gridCells - Array of 25 grid cells (must be exactly 25)
 * @param matchedTitles - Set of matched article titles (normalized, lowercase)
 * @returns Array of grid indices that are part of winning lines (sorted ascending)
 */
export function detectWinningCells(
  gridCells: GameGridCell[],
  matchedTitles: Set<string>,
): GridIndex[] {
  if (gridCells.length !== 25 || matchedTitles.size === 0) {
    return []
  }

  const winningIndices = new Set<GridIndex>()

  for (const line of WIN_LINES) {
    const isLineWinning = line.every((index) => {
      const cell = gridCells[index]
      const title = cell ? getCuratedArticleTitle(cell.article) : ''
      const normalized = title ? normalizeTitle(title) : ''
      return normalized && matchedTitles.has(normalized)
    })

    if (isLineWinning) {
      line.forEach((idx) => winningIndices.add(idx))
    }
  }

  return Array.from(winningIndices).sort((a, b) => a - b)
}


