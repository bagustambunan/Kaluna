import type { BudgetStatus } from '../../types'
import { formatRupiah, formatPct } from '../../lib/format'

interface ProgressBarProps {
  status: BudgetStatus
  label: string
}

const barColors = {
  safe:    'bg-stone-800 dark:bg-neutral-300',
  warning: 'bg-orange-500',
  over:    'bg-red-600',
}

const textColors = {
  safe:    'text-stone-600 dark:text-neutral-400',
  warning: 'text-orange-600 dark:text-orange-400',
  over:    'text-red-600 dark:text-red-400',
}

export function ProgressBar({ status, label }: ProgressBarProps) {
  const remaining = status.budget - status.spent
  const overage   = status.spent - status.budget
  const barWidth  = Math.min(status.pct, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-stone-700 dark:text-neutral-300">{label}</span>
        <span className="text-stone-500 dark:text-neutral-400">{formatRupiah(status.spent)} / {formatRupiah(status.budget)}</span>
      </div>
      <div className="h-2 bg-stone-100 dark:bg-neutral-700 rounded-full overflow-hidden">
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
