import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import UserMenu from './UserMenu'

export default function Layout({ title, action, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close the drawer automatically whenever the route changes (clicking a
  // nav link already closes it via Sidebar's onClick, but this also covers
  // back/forward navigation and any programmatic navigate() calls).
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-ink text-cream px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 -ml-1.5 rounded-lg grid place-items-center hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary text-white grid place-items-center font-display font-semibold text-xs">T</span>
            <span className="font-display text-sm font-semibold">Toyo&apos;s Pot</span>
          </div>
          <UserMenu />
        </div>

        <main>
          {(title || action) && (
            <div className="sticky top-14 lg:top-0 z-10 bg-cream/90 backdrop-blur border-b border-border px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
              <h1 className="font-display text-xl sm:text-2xl font-medium truncate">{title}</h1>
              <div className="flex items-center gap-3 shrink-0">
                {action}
                <span className="hidden lg:block">
                  <UserMenu />
                </span>
              </div>
            </div>
          )}
          <div className="p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
