import type { ReactNode } from 'react'
import { ThemeToggle } from '../shared/components/ThemeToggle'
import './AppLayout.css'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="bp-app-root">
      <header className="bp-app-header">
        <h1 className="bp-app-title">Wikibingo</h1>
        <ThemeToggle />
      </header>
      <main className="bp-app-main">{children}</main>
    </div>
  )
}


