import type { BudgetStatus } from '../../types'
import { formatRupiah, formatPct } from '../../lib/format'

interface ProgressBarProps {
  status: BudgetStatus
  label: string
}

const barColors = {
  safe:    'bg-ink',
  warning: 'bg-warn',
  over:    'bg-stamp',
}

const textColors = {
  safe:    'text-ink',
  warning: 'text-warn',
  over:    'text-stamp',
}

export function ProgressBar({ status, label }: ProgressBarProps) {
  const remaining = status.budget - status.spent
  const overage   = status.spent - status.budget
  const barWidth  = Math.min(status.pct, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-mute">{formatRupiah(status.spent)} / {formatRupiah(status.budget)}</span>
      </div>
      <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColors[status.status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className={`text-xs ${textColors[status.status]}`}>
        {status.status === 'over'
          ? `Over by ${formatRupiah(overage)}`
          : `${formatPct(status.pct)} used · ${formatRupiah(remaining)} left`
        }
      </p>
    </div>
  )
}
