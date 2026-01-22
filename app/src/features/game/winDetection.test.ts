import { describe, it, expect } from 'vitest'
import { detectWinningCells } from './winDetection'
import type { GameGridCell } from './types'
import type { CuratedArticle } from '../../shared/data/types'

function createCell(title: string): GameGridCell {
  return {
    id: `cell-${title}`,
    article: {
      title,
      category: 'Test',
    },
  }
}

describe('detectWinningCells', () => {
  it('should return empty array for empty grid', () => {
    const result = detectWinningCells([], new Set())
    expect(result).toEqual([])
  })

  it('should return empty array if grid is not 25 cells', () => {
    const cells = Array.from({ length: 24 }, (_, i) => createCell(`Article${i}`))
    const result = detectWinningCells(cells, new Set())
    expect(result).toEqual([])
  })

  it('should return empty array if no matches', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const result = detectWinningCells(cells, new Set(['Other Article']))
    expect(result).toEqual([])
  })

  it('should detect a winning row (first row)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article0', 'article1', 'article2', 'article3', 'article4'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([0, 1, 2, 3, 4])
  })

  it('should detect a winning row (middle row)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article10', 'article11', 'article12', 'article13', 'article14'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([10, 11, 12, 13, 14])
  })

  it('should detect a winning column (first column)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article0', 'article5', 'article10', 'article15', 'article20'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([0, 5, 10, 15, 20])
  })

  it('should detect a winning column (last column)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article4', 'article9', 'article14', 'article19', 'article24'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([4, 9, 14, 19, 24])
  })

  it('should detect main diagonal (top-left to bottom-right)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article0', 'article6', 'article12', 'article18', 'article24'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([0, 6, 12, 18, 24])
  })

  it('should detect anti-diagonal (top-right to bottom-left)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article4', 'article8', 'article12', 'article16', 'article20'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([4, 8, 12, 16, 20])
  })

  it('should detect multiple winning lines simultaneously', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    // First row and first column both complete
    const matched = new Set([
      'article0',
      'article1',
      'article2',
      'article3',
      'article4', // First row
      'article5',
      'article10',
      'article15',
      'article20', // First column (article0 already included)
    ])
    const result = detectWinningCells(cells, matched)
    // Should include all cells from both lines
    expect(result).toContain(0)
    expect(result).toContain(1)
    expect(result).toContain(2)
    expect(result).toContain(3)
    expect(result).toContain(4)
    expect(result).toContain(5)
    expect(result).toContain(10)
    expect(result).toContain(15)
    expect(result).toContain(20)
    expect(result.length).toBe(9) // 5 from row + 4 from column (0 is shared)
  })

  it('should not detect false positives (4 in a row)', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article0', 'article1', 'article2', 'article3']) // Only 4, not 5
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([])
  })

  it('should handle case-insensitive matching', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['ARTICLE0', 'Article1', 'article2', 'ARTICLE3', 'Article4'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([0, 1, 2, 3, 4])
  })

  it('should return sorted indices', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    const matched = new Set(['article4', 'article3', 'article2', 'article1', 'article0'])
    const result = detectWinningCells(cells, matched)
    expect(result).toEqual([0, 1, 2, 3, 4])
  })

  it('should detect all 12 possible winning lines', () => {
    const cells = Array.from({ length: 25 }, (_, i) => createCell(`Article${i}`))
    
    // Test each of the 12 lines
    const lines = [
      [0, 1, 2, 3, 4], // Row 1
      [5, 6, 7, 8, 9], // Row 2
      [10, 11, 12, 13, 14], // Row 3
      [15, 16, 17, 18, 19], // Row 4
      [20, 21, 22, 23, 24], // Row 5
      [0, 5, 10, 15, 20], // Column 1
      [1, 6, 11, 16, 21], // Column 2
      [2, 7, 12, 17, 22], // Column 3
      [3, 8, 13, 18, 23], // Column 4
      [4, 9, 14, 19, 24], // Column 5
      [0, 6, 12, 18, 24], // Main diagonal
      [4, 8, 12, 16, 20], // Anti-diagonal
    ]

    for (const line of lines) {
      const matched = new Set(line.map((i) => `article${i}`))
      const result = detectWinningCells(cells, matched)
      expect(result.sort()).toEqual(line)
    }
  })
})

