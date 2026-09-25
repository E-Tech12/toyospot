// Horizontal ranked list with proportional bars, for "best sellers" style
// rankings where a bar chart would be too cramped with long labels.
export default function RankedBarList({ items, labelKey, valueKey, formatValue, color = '#E1481F' }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted py-6 text-center">No data yet</p>
  }
  const max = Math.max(...items.map((i) => i[valueKey]), 1)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium truncate pr-2">{item[labelKey]}</span>
            <span className="text-muted shrink-0">{formatValue ? formatValue(item[valueKey]) : item[valueKey]}</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item[valueKey] / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
