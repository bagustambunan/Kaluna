import type { Category, Budgets, Settings } from '../types'

export const DEFAULT_CATEGORIES: Omit<Category, 'order'>[] = [
  { id: 'cat-default-1', name: 'Food',          emoji: '🍽️', color: '#F97316', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-2', name: 'Transport',     emoji: '🚗', color: '#3B82F6', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-3', name: 'Shopping',      emoji: '🛍️', color: '#A855F7', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-4', name: 'Entertainment', emoji: '🎬', color: '#EC4899', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-5', name: 'Health',        emoji: '💊', color: '#10B981', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-6', name: 'Bills',         emoji: '📄', color: '#6B7280', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-7', name: 'Other',         emoji: '📦', color: '#78716C', budgetMonthly: null, isDefault: true },
]

export const DEFAULT_BUDGETS: Budgets = {
  weekly: null,
  monthly: null,
  alertThresholdPct: 75,
}

export const DEFAULT_SETTINGS: Settings = {
  weekStartDay: 'monday',
  installBannerDismissed: false,
}

export const EMOJI_OPTIONS = ['🍽️','🚗','🛍️','🎬','💊','📄','📦','☕','✈️','🏠','🎓','💪','🎮','📱','👗','🐾','🌿']

export const COLOR_OPTIONS = [
  '#F97316','#3B82F6','#A855F7','#EC4899',
  '#10B981','#6B7280','#78716C','#EAB308',
  '#14B8A6','#F43F5E','#8B5CF6','#0EA5E9',
]
