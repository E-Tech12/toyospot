export function FormField({ label, error, hint, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>}
      <input
        {...props}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-surface placeholder:text-muted/70 focus:border-primary transition-colors disabled:bg-cream disabled:text-muted ${
          error ? 'border-danger' : 'border-border'
        }`}
      />
      {hint && !error && <span className="block text-xs text-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  )
}

export function TextAreaField({ label, error, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-surface placeholder:text-muted/70 focus:border-primary transition-colors resize-none ${
          error ? 'border-danger' : 'border-border'
        }`}
      />
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  )
}

export function SelectField({ label, children, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>}
      <select
        {...props}
        className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm bg-surface focus:border-primary transition-colors"
      >
        {children}
      </select>
    </label>
  )
}

export function CheckboxField({ label, ...props }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" {...props} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
      {label}
    </label>
  )
}
