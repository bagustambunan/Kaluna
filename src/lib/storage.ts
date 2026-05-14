import type { AppData, Budgets, Category, Expense, Settings, Shortcut } from '../types'
import { DEFAULT_BUDGETS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../constants/defaults'

export const KEYS = {
  expenses:   'kaluna_expenses',
  categories: 'kaluna_categories',
  budgets:    'kaluna_budgets',
  shortcuts:  'kaluna_shortcuts',
  settings:   'kaluna_settings',
  notifSent:  'kaluna_notif_sent',
} as const

export type StorageKey = typeof KEYS[keyof typeof KEYS]

export function get<T>(key: StorageKey): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function set<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage full or disabled — silently fail
  }
}

export function remove(key: StorageKey): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function clear(): void {
  try {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}

export function initDefaultData(): void {
  if (get<Category[]>(KEYS.categories) !== null) return

  const categories: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i }))
  set(KEYS.categories, categories)
  set(KEYS.expenses, [] as Expense[])
  set(KEYS.shortcuts, [] as Shortcut[])
  set(KEYS.budgets, DEFAULT_BUDGETS)
  set(KEYS.settings, DEFAULT_SETTINGS)
}

export function loadAll(): AppData {
  initDefaultData()
  return {
    expenses:   get<Expense[]>(KEYS.expenses)   ?? [],
    categories: get<Category[]>(KEYS.categories) ?? DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i })),
    budgets:    get<Budgets>(KEYS.budgets)       ?? DEFAULT_BUDGETS,
    shortcuts:  get<Shortcut[]>(KEYS.shortcuts)  ?? [],
    settings:   get<Settings>(KEYS.settings)     ?? DEFAULT_SETTINGS,
  }
}
