import { memo, useCallback } from 'react'
import './TableOfContents.css'

/**
 * Represents a single item in the table of contents.
 */
export interface ToCItem {
  id: string
  text: string
  level: number
  children: ToCItem[]
}

interface TableOfContentsProps {
  items: ToCItem[]
  onNavigate?: (sectionId: string) => void
}

/**
 * Table of Contents component for Wikipedia articles.
 * 
 * Displays a navigable list of article sections with smooth scrolling.
 * Supports nested subsections with proper indentation.
 * Shows an empty state message when no ToC items are available.
 * 
 * @param props - Component props
 * @param props.items - Array of ToC items to display
 * @param props.onNavigate - Optional callback when a section is clicked
 */
export const TableOfContents = memo(({ items, onNavigate }: TableOfContentsProps) => {
  /**
   * Handles clicking a ToC item.
   * Prevents default anchor behavior and calls the navigation callback.
   * The actual scrolling is handled by the parent component (ArticleViewer)
   * which has access to the article content container and can perform
   * robust ID matching with multiple fallback strategies.
   * 
   * @param e - Click event
   * @param sectionId - The section ID to navigate to
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      // Prevent default anchor behavior (prevents browser navigation)
      e.preventDefault()

      // Call navigation callback if provided
      // The parent component (ArticleViewer) handles the actual scrolling
      // with robust ID matching and fallback mechanisms
      if (onNavigate) {
        onNavigate(sectionId)
      } else {
        // Fallback: if no callback provided, try basic scrolling
        // This should not happen in normal usage, but provides graceful degradation
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    },
    [onNavigate],
  )

  return (
    <nav className="bp-toc" aria-label="Table of Contents">
      <div className="bp-toc-header">
        <h3>Contents</h3>
      </div>
      {items.length === 0 ? (
        <div className="bp-toc-empty">
          <p>No table of contents available for this article.</p>
        </div>
      ) : (
        <ul className="bp-toc-list">
          {items.map((item) => (
            <ToCItem key={item.id} item={item} onClick={handleClick} />
          ))}
        </ul>
      )}
    </nav>
  )
})

TableOfContents.displayName = 'TableOfContents'

interface ToCItemProps {
  item: ToCItem
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => void
}

/**
 * Recursive component for rendering individual ToC items and their children.
 */
const ToCItem = memo(({ item, onClick }: ToCItemProps) => {
  return (
    <li className={`bp-toc-item bp-toc-item--level-${item.level}`}>
      <a
        href={`#${item.id}`}
        onClick={(e) => onClick(e, item.id)}
        className="bp-toc-link"
      >
        {item.text}
      </a>
      {item.children.length > 0 && (
        <ul className="bp-toc-sublist">
          {item.children.map((child) => (
            <ToCItem key={child.id} item={child} onClick={onClick} />
          ))}
        </ul>
      )}
    </li>
  )
})

ToCItem.displayName = 'ToCItem'

