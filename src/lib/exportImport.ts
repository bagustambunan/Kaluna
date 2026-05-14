import type { AppData, AppState } from '../context/AppContext'
import { formatDateStr } from './date'

export function exportData(state: AppState): void {
  const payload: AppData = {
    expenses:   state.expenses,
    categories: state.categories,
    budgets:    state.budgets,
    shortcuts:  state.shortcuts,
    settings:   state.settings,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kaluna-export-${formatDateStr(new Date())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportPreview {
  count: number
  dateRange: { start: string; end: string } | null
  total: number
}

export function validateImport(raw: unknown): { data: AppData; preview: ImportPreview } {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid file format')
  }
  const obj = raw as Record<string, unknown>

  if (!Array.isArray(obj.expenses)) {
    throw new Error('Missing required field: expenses')
  }

  for (const e of obj.expenses as unknown[]) {
    if (typeof e !== 'object' || e === null) throw new Error('Invalid expense data')
    const exp = e as Record<string, unknown>
    if (!exp.id || typeof exp.amount !== 'number' || !exp.categoryId || !exp.date) {
      throw new Error('Missing required fields in expense data')
    }
  }

  const expenses = obj.expenses as AppData['expenses']
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date))
  const dateRange = sorted.length > 0
    ? { start: sorted[0].date, end: sorted[sorted.length - 1].date }
    : null
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const data: AppData = {
    expenses,
    categories: Array.isArray(obj.categories) ? obj.categories as AppData['categories'] : [],
    budgets:    (obj.budgets as AppData['budgets']) ?? { weekly: null, monthly: null, alertThresholdPct: 75 },
    shortcuts:  Array.isArray(obj.shortcuts) ? obj.shortcuts as AppData['shortcuts'] : [],
    settings:   (obj.settings as AppData['settings']) ?? { weekStartDay: 'monday', installBannerDismissed: false },
  }

  return { data, preview: { count: expenses.length, dateRange, total } }
}

export function mergeData(existing: AppData, incoming: AppData): AppData {
  const expenseIds = new Set(existing.expenses.map(e => e.id))
  const newExpenses = incoming.expenses.filter(e => !expenseIds.has(e.id))

  const catIds = new Set(existing.categories.map(c => c.id))
  const newCategories = incoming.categories.filter(c => !catIds.has(c.id))

  return {
    expenses:   [...existing.expenses, ...newExpenses],
    categories: [...existing.categories, ...newCategories],
    budgets:    existing.budgets,
    shortcuts:  existing.shortcuts,
    settings:   existing.settings,
  }
}
