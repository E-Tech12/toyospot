import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from '../mock/data'

export default function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-danger font-medium text-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-danger" />
        Order Cancelled
      </div>
    )
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status)

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const done = i <= currentIndex
        const isLast = i === ORDER_STATUS_FLOW.length - 1
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${
                  done ? 'bg-success text-white' : 'bg-border text-transparent'
                }`}
              >
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M5 12l5 5 9-9" />
                  </svg>
                )}
              </span>
              {!isLast && <span className={`w-0.5 flex-1 min-h-[24px] ${i < currentIndex ? 'bg-success' : 'bg-border'}`} />}
            </div>
            <div className={`pb-6 text-sm font-medium ${done ? 'text-ink' : 'text-muted'}`}>
              {ORDER_STATUS_LABEL[step]}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
