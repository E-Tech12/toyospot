import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/menu', label: 'Menu', icon: MenuIcon },
  { to: '/cart', label: 'Cart', icon: CartIcon },
  { to: '/dashboard', label: 'Account', icon: UserIcon }
]

export default function BottomNav() {
  const { itemCount } = useCart()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border safe-bottom">
      <div className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            <Icon />
            {label}
            {to === '/cart' && itemCount > 0 && (
              <span className="absolute top-1 right-[28%] min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-white text-[9px] font-semibold grid place-items-center">
                {itemCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function iconProps() {
  return { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
}

function HomeIcon() {
  return <svg {...iconProps()}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>
}
function MenuIcon() {
  return <svg {...iconProps()}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
}
function CartIcon() {
  return <svg {...iconProps()}><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" /></svg>
}
function UserIcon() {
  return <svg {...iconProps()}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 6-6 8-6s6.5 2 8 6" /></svg>
}
