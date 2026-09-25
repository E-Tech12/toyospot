import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' }
]

export default function Navbar() {
  const { itemCount } = useCart()
  const { isAuthenticated, user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center font-display font-semibold text-base">T</span>
          <span className="font-display text-xl font-semibold tracking-tight">Toyo&apos;s Pot</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-ink/70 hover:text-ink'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative w-10 h-10 rounded-full grid place-items-center hover:bg-primary-light/60 transition-colors"
          >
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-semibold grid place-items-center">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/dashboard"
                className="text-sm font-medium px-3 py-2 rounded-full hover:bg-primary-light/60 transition-colors"
              >
                Hi, {user.first_name}
              </Link>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="text-sm font-medium text-muted hover:text-ink px-2"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-semibold bg-ink text-white px-4 py-2 rounded-full hover:bg-ink/90 transition-colors"
            >
              Log in
            </Link>
          )}

          <button
            className="md:hidden w-10 h-10 rounded-full grid place-items-center"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-cream px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-ink/80"
            >
              {l.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-medium">
                My Dashboard
              </Link>
              <button
                onClick={() => {
                  logout()
                  setMenuOpen(false)
                  navigate('/')
                }}
                className="py-2.5 text-sm font-medium text-left text-muted"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-semibold text-primary">
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  )
}

function MenuIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  )
}
