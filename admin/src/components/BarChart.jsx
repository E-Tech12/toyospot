// A small dependency-free bar chart. Good enough for the admin analytics
// views (orders/day, customer growth) without pulling in a charting
// library for a handful of simple time series.
export default function BarChart({ data, xKey, yKey, formatY, height = 220, color = '#E1481F' }) {
  if (!data || data.length === 0) {
    return <div className="h-[220px] grid place-items-center text-sm text-muted">No data yet</div>
  }

  const max = Math.max(...data.map((d) => d[yKey]), 1)
  const barWidth = 100 / data.length

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max((d[yKey] / max) * 100, 2)
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative" style={{ width: `${barWidth}%` }}>
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold bg-ink text-white px-2 py-0.5 rounded whitespace-nowrap">
                {formatY ? formatY(d[yKey]) : d[yKey]}
              </div>
              <div
                className="w-full rounded-t transition-all"
                style={{ height: `${h}%`, backgroundColor: color, minHeight: 2 }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted truncate" style={{ width: `${barWidth}%` }}>
            {d[xKey]?.slice(5) /* trim year for date strings */}
          </div>
        ))}
      </div>
    </div>
  )
}
