import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Overview', end: true, icon: OverviewIcon },
  { to: '/foods', label: 'Foods', icon: FoodIcon },
  { to: '/inventory', label: 'Inventory', icon: InventoryIcon },
  { to: '/orders', label: 'Orders', icon: OrdersIcon },
  { to: '/customers', label: 'Customers', icon: CustomersIcon },
  { to: '/announcements', label: 'Announcements', icon: AnnouncementIcon },
  { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon }
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="w-64 shrink-0 bg-ink text-cream flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-2">
        <span className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center font-display font-semibold">T</span>
        <div>
          <p className="font-display text-lg font-semibold leading-tight">Toyo&apos;s Pot</p>
          <p className="text-[11px] text-cream/50 leading-tight">Admin</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white' : 'text-cream/70 hover:bg-white/5 hover:text-cream'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-cream/50 truncate">{user?.email}</p>
        </div>
        <button
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/70 hover:bg-white/5 hover:text-cream transition-colors"
        >
          <LogoutIcon />
          Log out
        </button>
      </div>
    </aside>
  )
}

function iconProps() {
  return { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
}
function OverviewIcon() { return <svg {...iconProps()}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg> }
function FoodIcon() { return <svg {...iconProps()}><path d="M4 3v18M4 3c3 0 3 3 3 5s0 3-3 3M17 3c-3 0-4 4-4 8s1 10 4 10" /></svg> }
function InventoryIcon() { return <svg {...iconProps()}><path d="M21 8L12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></svg> }
function OrdersIcon() { return <svg {...iconProps()}><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" /></svg> }
function CustomersIcon() { return <svg {...iconProps()}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1.3-4 4-6 6.5-6s5.2 2 6.5 6" /><circle cx="17.5" cy="9" r="2.5" /><path d="M15.5 14c2 0 4 1.7 5 4.5" /></svg> }
function AnnouncementIcon() { return <svg {...iconProps()}><path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4L6 9H5a2 2 0 0 0-2 2Z" /><path d="M14 8a4 4 0 0 1 0 8M17 5a8 8 0 0 1 0 14" /></svg> }
function AnalyticsIcon() { return <svg {...iconProps()}><path d="M3 3v18h18" /><path d="M7 15l3-4 3 2 5-6" /></svg> }
function LogoutIcon() { return <svg {...iconProps()}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></svg> }
