import type { BudgetStatus } from '../types'
import { formatPct, formatRupiah } from './format'

export const copy = {
  whatDidYouSpend: 'What did you spend?',
  nothingRecorded: 'Nothing recorded yet.',
  noMatch: 'No expenses match.',
  noExpensesInPeriod: 'No expenses in this period.',
  saved: 'Saved',
  deleted: 'Deleted',
  backToToday: 'Back to today',
  installAndroid: 'Add to home screen for quick access',
  installIOS: 'Tap Share then “Add to Home Screen”',
} as const

export function budgetWhisperText(
  period: 'weekly' | 'monthly',
  status: BudgetStatus,
  thresholdPct: number,
): string {
  const label = period === 'weekly' ? 'Weekly' : 'Monthly'
  if (status.status === 'over') return `${label} budget exceeded.`
  if (status.status === 'warning') {
    return `${label} budget is at ${Math.round(thresholdPct)}%.`
  }
  const remaining = status.budget - status.spent
  return `${label} ${formatPct(status.pct)} · ${formatRupiah(remaining)} left`
}
