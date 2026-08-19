import type { BudgetStatus } from '../../types'
import { budgetWhisperText } from '../../lib/copy'

const tone = {
  safe: 'text-mute',
  warning: 'text-warn',
  over: 'text-stamp',
} as const

export function BudgetWhisper({
  period,
  status,
  thresholdPct,
}: {
  period: 'weekly' | 'monthly'
  status: BudgetStatus
  thresholdPct: number
}) {
  return (
    <p className={`text-sm ${tone[status.status]}`}>
      {budgetWhisperText(period, status, thresholdPct)}
    </p>
  )
}
