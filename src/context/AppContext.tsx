import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { Expense, Category, Budgets, Shortcut, Settings, AppData } from '../types'
import * as storage from '../lib/storage'

export type { AppData }

export interface AppState {
  expenses: Expense[]
  categories: Category[]
  budgets: Budgets
  shortcuts: Shortcut[]
  settings: Settings
  pendingDelete: {
    expense: Expense
    timeoutId: ReturnType<typeof setTimeout>
  } | null
}

export type AppAction =
  | { type: 'LOAD_STATE'; payload: Omit<AppState, 'pendingDelete'> }
  | { type: 'ADD_EXPENSE';          payload: Expense }
  | { type: 'UPDATE_EXPENSE';       payload: Expense }
  | { type: 'DELETE_EXPENSE';       payload: string }
  | { type: 'SOFT_DELETE_EXPENSE';  payload: { expense: Expense; timeoutId: ReturnType<typeof setTimeout> } }
  | { type: 'UNDO_DELETE' }
  | { type: 'CONFIRM_DELETE' }
  | { type: 'ADD_CATEGORY';         payload: Category }
  | { type: 'UPDATE_CATEGORY';      payload: Category }
  | { type: 'DELETE_CATEGORY';      payload: string }
  | { type: 'UPDATE_BUDGETS';       payload: Partial<Budgets> }
  | { type: 'ADD_SHORTCUT';         payload: Shortcut }
  | { type: 'DELETE_SHORTCUT';      payload: string }
  | { type: 'REORDER_SHORTCUTS';    payload: Shortcut[] }
  | { type: 'UPDATE_SETTINGS';      payload: Partial<Settings> }
  | { type: 'REPLACE_ALL';          payload: AppData }

const initialState: AppState = {
  expenses:      [],
  categories:    [],
  budgets:       { weekly: null, monthly: null, alertThresholdPct: 75 },
  shortcuts:     [],
  settings:      { weekStartDay: 'monday', installBannerDismissed: false, darkMode: false },
  pendingDelete: null,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload, pendingDelete: null }

    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] }

    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e),
      }

    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) }

    case 'SOFT_DELETE_EXPENSE':
      return { ...state, pendingDelete: action.payload }

    case 'UNDO_DELETE':
      if (state.pendingDelete) clearTimeout(state.pendingDelete.timeoutId)
      return { ...state, pendingDelete: null }

    case 'CONFIRM_DELETE':
      if (!state.pendingDelete) return state
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== state.pendingDelete!.expense.id),
        pendingDelete: null,
      }

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c),
      }

    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) }

    case 'UPDATE_BUDGETS':
      return { ...state, budgets: { ...state.budgets, ...action.payload } }

    case 'ADD_SHORTCUT':
      return { ...state, shortcuts: [...state.shortcuts, action.payload] }

    case 'DELETE_SHORTCUT':
      return { ...state, shortcuts: state.shortcuts.filter(s => s.id !== action.payload) }

    case 'REORDER_SHORTCUTS':
      return { ...state, shortcuts: action.payload }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'REPLACE_ALL':
      return {
        ...state,
        expenses:   action.payload.expenses,
        categories: action.payload.categories,
        budgets:    action.payload.budgets,
        shortcuts:  action.payload.shortcuts,
        settings:   action.payload.settings,
        pendingDelete: null,
      }

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const data = storage.loadAll()
    dispatch({ type: 'LOAD_STATE', payload: data })
  }, [])

  useEffect(() => { storage.set(storage.KEYS.expenses,   state.expenses) },   [state.expenses])
  useEffect(() => { storage.set(storage.KEYS.categories, state.categories) }, [state.categories])
  useEffect(() => { storage.set(storage.KEYS.budgets,    state.budgets) },    [state.budgets])
  useEffect(() => { storage.set(storage.KEYS.shortcuts,  state.shortcuts) },  [state.shortcuts])
  useEffect(() => { storage.set(storage.KEYS.settings,   state.settings) },   [state.settings])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useAppDispatch() {
  return useApp().dispatch
}

export function useAppState() {
  return useApp().state
}

export function useSnackbar() {
  const [message, setMessage] = React.useState<{ text: string; undoFn?: () => void } | null>(null)

  const show = useCallback((text: string, undoFn?: () => void) => {
    setMessage({ text, undoFn })
  }, [])

  const dismiss = useCallback(() => setMessage(null), [])

  return { message, show, dismiss }
}
