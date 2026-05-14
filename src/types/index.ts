export interface Expense {
  id: string
  amount: number
  categoryId: string
  note: string
  date: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  color: string
  budgetMonthly: number | null
  isDefault: boolean
  order: number
}

export interface Budgets {
  weekly: number | null
  monthly: number | null
  alertThresholdPct: number
}

export interface Shortcut {
  id: string
  label: string
  amount: number
  categoryId: string
  note: string
  order: number
}

export interface Settings {
  weekStartDay: 'monday' | 'sunday'
  installBannerDismissed: boolean
  darkMode: 'light' | 'dark' | 'system'
}

export interface AppData {
  expenses: Expense[]
  categories: Category[]
  budgets: Budgets
  shortcuts: Shortcut[]
  settings: Settings
}

export type WeekStartDay = 'monday' | 'sunday'

export interface DateRange {
  start: string
  end: string
}

export interface BudgetStatus {
  spent: number
  budget: number
  pct: number
  status: 'safe' | 'warning' | 'over'
}

export interface SummaryFilterState {
  excludedCategoryIds: Set<string>
  excludedExpenseIds: Set<string>
}
