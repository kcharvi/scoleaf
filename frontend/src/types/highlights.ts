import type { Highlight } from 'react-pdf-highlighter-extended'

// Categories for different types of highlights
export type HighlightCategory = 'general' | 'important' | 'thoughts'

// Filter categories (includes 'all' for showing all highlights)
export type FilterCategory = HighlightCategory | 'all'

// Our custom highlight interface extending the base
export interface CustomHighlight extends Highlight {
  category: HighlightCategory
  comment?: string
  emoji?: string
  timestamp?: Date
  tags?: string[]
}

// For new highlights being created
export interface CustomNewHighlight {
  category: HighlightCategory
  comment?: string
  emoji?: string
  tags?: string[]
  position: {
    pageNumber: number
    boundingRect: {
      x1: number
      y1: number
      x2: number
      y2: number
      width: number
      height: number
      pageNumber: number
    }
    rects: Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      width: number
      height: number
      pageNumber: number
    }>
  }
  content: {
    text: string
    image?: string
  }
}

// Highlight colors for each category
export const HIGHLIGHT_COLORS: Record<HighlightCategory, string> = {
  general: 'rgba(255, 229, 153, 0.7)',   // Pastel Yellow
  important: 'rgba(255, 179, 186, 0.7)',  // Pastel Red/Pink
  thoughts: 'rgba(173, 216, 230, 0.7)'    // Pastel Blue
}

// Category display names
export const CATEGORY_NAMES: Record<HighlightCategory, string> = {
  general: 'General',
  important: 'Important',
  thoughts: 'Thoughts'
}

// Category emojis
export const CATEGORY_EMOJIS: Record<HighlightCategory, string> = {
  general: '💡',
  important: '❗',
  thoughts: '💭'
} 