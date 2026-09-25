import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Layout from './Layout'
import { useAuth } from '../context/AuthContext'
import { notificationApi } from '../lib/endpoints'

const tabs = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/orders', label: 'My Orders' },
  { to: '/dashboard/favorites', label: 'Favorites' },
  { to: '/dashboard/addresses', label: 'Addresses' },
  { to: '/dashboard/notifications', label: 'Notifications' },
  { to: '/dashboard/profile', label: 'Profile' }
]

export default function DashboardLayout() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    notificationApi
      .list()
      .then((notifications) => setUnread(notifications.filter((n) => !n.is_read).length))
      .catch(() => setUnread(0))
  }, [])

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-medium">Welcome back, {user?.first_name}</h1>
        <p className="text-muted text-sm mt-1">Manage your orders, addresses and account.</p>

        <div className="mt-6 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-border">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                  isActive ? 'text-primary' : 'text-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {t.label}
                  {t.to === '/dashboard/notifications' && unread > 0 && (
                    <span className="ml-1.5 inline-block w-4 h-4 rounded-full bg-primary text-white text-[10px] leading-4 text-center align-middle">
                      {unread}
                    </span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </section>
    </Layout>
  )
}
