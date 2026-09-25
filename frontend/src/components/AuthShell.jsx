import { Link } from 'react-router-dom'

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-cream p-12 relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <span className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center font-display font-semibold">T</span>
          <span className="font-display text-xl font-semibold">Toyo&apos;s Pot</span>
        </Link>
        <div className="relative z-10 max-w-sm">
          <p className="text-sm uppercase tracking-wide text-gold mb-3">{eyebrow}</p>
          <h2 className="font-display text-4xl font-medium leading-tight">
            Real Nigerian meals, made the way home cooking should taste.
          </h2>
        </div>
        <img
          src="/images/jollof.jpg"
          alt=""
          aria-hidden="true"
          className="absolute -right-16 -bottom-16 w-96 h-96 rounded-full object-cover opacity-30"
        />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-full bg-primary text-white grid place-items-center font-display font-semibold text-sm">T</span>
            <span className="font-display text-lg font-semibold">Toyo&apos;s Pot</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1.5">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
