import Sidebar from './Sidebar'

export default function Layout({ title, action, children }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {(title || action) && (
          <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur border-b border-border px-8 py-5 flex items-center justify-between">
            <h1 className="font-display text-2xl font-medium">{title}</h1>
            {action}
          </div>
        )}
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
