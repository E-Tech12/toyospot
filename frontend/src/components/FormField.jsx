export default function FormField({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      <input
        {...props}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-surface placeholder:text-muted/70 focus:border-primary transition-colors ${
          error ? 'border-danger' : 'border-border'
        }`}
      />
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  )
}
