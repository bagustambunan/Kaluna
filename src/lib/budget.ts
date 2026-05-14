import type { BudgetStatus } from '../types'

export function getBudgetStatus(
  spent: number,
  budget: number | null,
  thresholdPct: number
): BudgetStatus | null {
  if (!budget) return null
  const pct = (spent / budget) * 100
  const status = pct > 100 ? 'over' : pct >= thresholdPct ? 'warning' : 'safe'
  return { spent, budget, pct, status }
}
