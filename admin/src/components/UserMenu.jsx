import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white grid place-items-center text-xs font-semibold ring-2 ring-white/0 hover:ring-primary-light transition-all"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials || '?'}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl2 shadow-2xl border border-border py-2 z-50 origin-top-right animate-[fadeIn_0.12s_ease-out]">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted truncate mt-0.5">{user?.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary uppercase tracking-wide">
              Admin
            </span>
          </div>
          <button
            onClick={async () => {
              setOpen(false)
              await logout()
              navigate('/login')
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5M15 12H3" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
