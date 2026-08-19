import { budgetWhisperText, copy } from './copy'
import { formatRupiah } from './format'
import type { BudgetStatus } from '../types'

describe('copy', () => {
  it('exposes canonical empty and save strings', () => {
    expect(copy.whatDidYouSpend).toBe('What did you spend?')
    expect(copy.nothingRecorded).toBe('Nothing recorded yet.')
    expect(copy.noMatch).toBe('No expenses match.')
    expect(copy.noExpensesInPeriod).toBe('No expenses in this period.')
    expect(copy.saved).toBe('Saved')
    expect(copy.deleted).toBe('Deleted')
  })

  it('formats weekly warning with the real threshold', () => {
    const status: BudgetStatus = { spent: 75000, budget: 100000, pct: 75, status: 'warning' }
    expect(budgetWhisperText('weekly', status, 75)).toBe('Weekly budget is at 75%.')
  })

  it('formats monthly over', () => {
    const status: BudgetStatus = { spent: 120000, budget: 100000, pct: 120, status: 'over' }
    expect(budgetWhisperText('monthly', status, 75)).toBe('Monthly budget exceeded.')
  })

  it('formats safe as percent used and remaining', () => {
    const status: BudgetStatus = { spent: 20000, budget: 100000, pct: 20, status: 'safe' }
    expect(budgetWhisperText('weekly', status, 75)).toBe(`Weekly 20% · ${formatRupiah(80000)} left`)
  })
})
