import { ReactNode } from 'react'
import './AppLayout.css'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="bp-app-root">
      <header className="bp-app-header">
        <h1 className="bp-app-title">Bingopedia</h1>
      </header>
      <main className="bp-app-main">{children}</main>
    </div>
  )
}


