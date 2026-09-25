export default function Button({ children, loading, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    dark: 'bg-ink text-white hover:bg-ink/90',
    outline: 'border border-border text-ink hover:border-ink/40',
    ghost: 'text-ink hover:bg-primary-light/60'
  }
  return (
    <button {...props} disabled={loading || props.disabled} className={`${base} ${variants[variant]} ${className}`}>
      {loading && (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  )
}
