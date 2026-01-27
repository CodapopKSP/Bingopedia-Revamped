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
 * 
 * @param props - Component props
 * @param props.items - Array of ToC items to display
 * @param props.onNavigate - Optional callback when a section is clicked
 */
export const TableOfContents = memo(({ items, onNavigate }: TableOfContentsProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      e.preventDefault()

      // Scroll to section smoothly
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }

      // Call navigation callback if provided
      if (onNavigate) {
        onNavigate(sectionId)
      }
    },
    [onNavigate],
  )

  if (items.length === 0) {
    return null
  }

  return (
    <nav className="bp-toc" aria-label="Table of Contents">
      <div className="bp-toc-header">
        <h3>Contents</h3>
      </div>
      <ul className="bp-toc-list">
        {items.map((item) => (
          <ToCItem key={item.id} item={item} onClick={handleClick} />
        ))}
      </ul>
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

