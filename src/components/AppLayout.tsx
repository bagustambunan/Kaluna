import { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, History, BarChart2, Settings, Share } from 'lucide-react'
import { useAppState, useAppDispatch } from '../context/AppContext'
import { Snackbar } from './ui/Snackbar'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useNotification } from '../hooks/useNotification'
import type { Expense } from '../types'
import { filterByRange, getWeekRange, getMonthRange, sumExpenses, formatDateStr } from '../lib/date'
import { copy } from '../lib/copy'

interface SnackMsg { text: string; undoFn?: () => void }

interface AppHandlers {
  openEdit: (e: Expense) => void
  handleDelete: (e: Expense) => void
  setFormDefaultDate: (date: string) => void
  handleSave: (values: Omit<Expense, 'id'>) => void
  cancelEdit: () => void
  editingExpense: Expense | undefined
  composeFocused: boolean
  setComposeFocused: (v: boolean) => void
}

const AppHandlersContext = createContext<AppHandlers>({
  openEdit: () => {},
  handleDelete: () => {},
  setFormDefaultDate: () => {},
  handleSave: () => {},
  cancelEdit: () => {},
  editingExpense: undefined,
  composeFocused: false,
  setComposeFocused: () => {},
})

export function useAppHandlers() {
  return useContext(AppHandlersContext)
}

const navItems = [
  { to: '/',         icon: Home,      label: 'Today' },
  { to: '/history',  icon: History,   label: 'History' },
  { to: '/summary',  icon: BarChart2, label: 'Summary' },
  { to: '/settings', icon: Settings,  label: 'Settings' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [, setFormDefaultDate] = useState(() => formatDateStr(new Date()))
  const [composeFocused, setComposeFocused] = useState(false)
  const [snack, setSnack] = useState<SnackMsg | null>(null)
  const [inAppAlert, setInAppAlert] = useState<string | null>(null)
  const { canInstall, triggerInstall, isIOS } = useInstallPrompt()
  const { checkBudget } = useNotification()

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const mode = state.settings.darkMode
      const isDark = mode === 'dark' || (mode === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', isDark)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [state.settings.darkMode])

  const showSnack = useCallback((text: string, undoFn?: () => void) => {
    setSnack({ text, undoFn })
  }, [])

  const cancelEdit = useCallback(() => setEditingExpense(undefined), [])

  const handleSave = useCallback((values: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: { ...values, id: editingExpense.id } })
      showSnack(copy.saved)
      cancelEdit()
    } else {
      const expense: Expense = { ...values, id: crypto.randomUUID() }
      dispatch({ type: 'ADD_EXPENSE', payload: expense })
      showSnack(copy.saved, () => dispatch({ type: 'DELETE_EXPENSE', payload: expense.id }))

      const now = new Date()
      const weekRange  = getWeekRange(now, state.settings.weekStartDay)
      const monthRange = getMonthRange(now)
      const weeklySpent  = sumExpenses(filterByRange([...state.expenses, expense], weekRange))
      const monthlySpent = sumExpenses(filterByRange([...state.expenses, expense], monthRange))
      checkBudget(weeklySpent,  state.budgets, 'weekly',  msg => setInAppAlert(msg))
      checkBudget(monthlySpent, state.budgets, 'monthly', msg => setInAppAlert(msg))
      setEditingExpense(undefined)
    }
  }, [editingExpense, dispatch, showSnack, cancelEdit, state.expenses, state.budgets, state.settings.weekStartDay, checkBudget])

  const openEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    navigate('/')
  }, [navigate])

  const handleDelete = useCallback((expense: Expense) => {
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'CONFIRM_DELETE' })
    }, 5000)
    dispatch({ type: 'SOFT_DELETE_EXPENSE', payload: { expense, timeoutId } })
    showSnack(copy.deleted, () => dispatch({ type: 'UNDO_DELETE' }))
  }, [dispatch, showSnack])

  const showBanner = (!state.settings.installBannerDismissed) && (canInstall || isIOS)
  const snackOffset = location.pathname === '/' && !composeFocused ? '9.5rem' : '5.5rem'

  return (
    <div
      className="min-h-screen bg-paper text-ink flex md:flex-row font-sans"
      style={{ '--snack-offset': snackOffset } as React.CSSProperties}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-sheet border-r border-ink/10 fixed top-0 left-0 h-full">
        <div className="px-4 py-5 border-b border-ink/10 flex items-center gap-2">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="w-6 h-6 rounded-md" />
          <span className="text-lg font-bold text-ink">Kaluna</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-pen text-sheet'
                    : 'text-mute hover:bg-sheet'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-52 pb-20 md:pb-6">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-2 px-4 h-12 bg-sheet border-b border-ink/10 sticky top-0 z-20">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="w-6 h-6 rounded-md" />
          <span className="text-base font-bold text-ink">Kaluna</span>
        </header>

        {inAppAlert && (
          <div className={`bg-sheet border-b border-ink/10 px-4 py-2.5 flex items-center justify-between text-sm ${inAppAlert.includes('exceeded') ? 'text-stamp' : 'text-warn'}`}>
            <span>{inAppAlert}</span>
            <button onClick={() => setInAppAlert(null)} className="font-medium">Dismiss</button>
          </div>
        )}

        {showBanner && (
          <div className="bg-sheet border-b border-ink/10 px-4 py-2.5 flex items-center justify-between text-sm text-ink">
            <span className="flex items-center gap-2">
              {isIOS ? <><Share size={14} /> {copy.installIOS}</> : copy.installAndroid}
            </span>
            <div className="flex items-center gap-3">
              {canInstall && (
                <button onClick={triggerInstall} className="font-medium text-ink hover:underline">Add</button>
              )}
              <button
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { installBannerDismissed: true } })}
                className="text-mute hover:text-ink"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Fires only after LOAD_STATE populates categories — used by E2E tests */}
        {state.categories.length > 0 && (
          <span
            data-testid="app-ready"
            className="fixed bottom-0 left-0 w-px h-px opacity-0 pointer-events-none"
          />
        )}

        <div className="max-w-2xl mx-auto">
          <AppHandlersContext.Provider value={{
            openEdit,
            handleDelete,
            setFormDefaultDate,
            handleSave,
            cancelEdit,
            editingExpense,
            composeFocused,
            setComposeFocused,
          }}>
            {children}
          </AppHandlersContext.Provider>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className={composeFocused ? 'hidden' : 'md:hidden fixed bottom-0 left-0 right-0 bg-sheet border-t border-ink/10 z-30'}>
        <div className="flex items-center h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} exact={to === '/'} />
          ))}
        </div>
      </nav>

      <Snackbar message={snack} onDismiss={() => setSnack(null)} />
    </div>
  )
}

function NavItem({ to, icon: Icon, label, exact }: { to: string; icon: React.ElementType; label: string; exact: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
          isActive ? 'text-pen' : 'text-mute'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}
