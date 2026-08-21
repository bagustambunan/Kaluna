import type { BudgetStatus } from '../../types'
import { formatRupiah, formatPct } from '../../lib/format'

interface ProgressBarProps {
  status: BudgetStatus
  label: string
}

const barColors = {
  safe:    'bg-[#39ad8a]',
  warning: 'bg-[#f2aa48]',
  over:    'bg-[#ec6b62]',
}

const textColors = {
  safe:    'text-[#47866f] dark:text-emerald-300',
  warning: 'text-amber-700 dark:text-amber-300',
  over:    'text-[#c65049] dark:text-red-300',
}

export function ProgressBar({ status, label }: ProgressBarProps) {
  const remaining = status.budget - status.spent
  const overage   = status.spent - status.budget
  const barWidth  = Math.min(status.pct, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-[#48698f] dark:text-blue-200">{label}</span>
        <span className="font-data text-[12px] text-[#7890ae] dark:text-slate-400">{formatRupiah(status.spent)} / {formatRupiah(status.budget)}</span>
      </div>
      <div className="h-2.5 bg-blue-50 dark:bg-blue-950/70 rounded-full overflow-hidden p-[2px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColors[status.status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className={`text-xs ${textColors[status.status]}`}>
        {status.status === 'over'
          ? `Lewat ${formatRupiah(overage)}`
          : `${formatPct(status.pct)} terpakai · sisa ${formatRupiah(remaining)}`
        }
      </p>
    </div>
  )
}
