import { useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, History, BarChart2, Settings, Plus, Share } from 'lucide-react'
import { useAppState, useAppDispatch } from '../context/AppContext'
import { ExpenseForm } from './shared/ExpenseForm'
import { Snackbar } from './ui/Snackbar'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useNotification } from '../hooks/useNotification'
import type { Expense } from '../types'
import { filterByRange, getWeekRange, getMonthRange, sumExpenses } from '../lib/date'

interface SnackMsg { text: string; undoFn?: () => void }

const navItems = [
  { to: '/',         icon: Home,     label: 'Home' },
  { to: '/history',  icon: History,  label: 'History' },
  { to: '/summary',  icon: BarChart2,label: 'Summary' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [snack, setSnack] = useState<SnackMsg | null>(null)
  const [inAppAlert, setInAppAlert] = useState<string | null>(null)
  const { canInstall, triggerInstall, isIOS } = useInstallPrompt()
  const { checkBudget } = useNotification()

  const showSnack = useCallback((text: string, undoFn?: () => void) => {
    setSnack({ text, undoFn })
  }, [])

  const handleSave = (values: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: { ...values, id: editingExpense.id } })
      showSnack('Saved')
    } else {
      const expense: Expense = { ...values, id: crypto.randomUUID() }
      dispatch({ type: 'ADD_EXPENSE', payload: expense })
      showSnack('Saved')

      // Check budgets after add
      const now = new Date()
      const weekRange = getWeekRange(now, state.settings.weekStartDay)
      const monthRange = getMonthRange(now)
      const weeklySpent = sumExpenses(filterByRange([...state.expenses, expense], weekRange))
      const monthlySpent = sumExpenses(filterByRange([...state.expenses, expense], monthRange))
      checkBudget(weeklySpent, state.budgets, 'weekly', msg => setInAppAlert(msg))
      checkBudget(monthlySpent, state.budgets, 'monthly', msg => setInAppAlert(msg))
    }
    setFormOpen(false)
    setEditingExpense(undefined)
  }

  const openEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((expense: Expense) => {
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'CONFIRM_DELETE' })
    }, 5000)
    dispatch({ type: 'SOFT_DELETE_EXPENSE', payload: { expense, timeoutId } })
    showSnack('Deleted', () => dispatch({ type: 'UNDO_DELETE' }))
  }, [dispatch, showSnack])

  const showBanner = (!state.settings.installBannerDismissed) && (canInstall || isIOS)

  return (
    <div className="min-h-screen bg-stone-50 flex md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-white border-r border-stone-200 fixed top-0 left-0 h-full">
        <div className="px-4 py-5 border-b border-stone-100">
          <span className="text-lg font-bold text-stone-900">Kaluna</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-stone-100">
          <button
            onClick={() => { setEditingExpense(undefined); setFormOpen(true) }}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-stone-700"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-52 pb-20 md:pb-6">
        {/* In-app budget alert */}
        {inAppAlert && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 flex items-center justify-between text-sm text-orange-800">
            <span>{inAppAlert}</span>
            <button onClick={() => setInAppAlert(null)} className="text-orange-600 hover:text-orange-800 font-medium">Dismiss</button>
          </div>
        )}

        {/* Install banner */}
        {showBanner && (
          <div className="bg-stone-100 border-b border-stone-200 px-4 py-2.5 flex items-center justify-between text-sm text-stone-700">
            <span className="flex items-center gap-2">
              {isIOS ? <><Share size={14} /> Tap Share then "Add to Home Screen"</> : 'Add to home screen for quick access'}
            </span>
            <div className="flex items-center gap-3">
              {canInstall && (
                <button onClick={triggerInstall} className="font-medium text-stone-900 hover:underline">Add</button>
              )}
              <button
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { installBannerDismissed: true } })}
                className="text-stone-500 hover:text-stone-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          {/* Pass handlers down via context replacement — use a simple pattern */}
          <AppHandlersContext.Provider value={{ openEdit, handleDelete }}>
            {children}
          </AppHandlersContext.Provider>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} exact={to === '/'} />
          ))}
          {/* FAB */}
          <button
            onClick={() => { setEditingExpense(undefined); setFormOpen(true) }}
            className="w-14 h-14 -mt-6 bg-stone-900 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-stone-700 active:bg-stone-800"
            aria-label="Add expense"
          >
            <Plus size={24} />
          </button>
          {navItems.slice(2).map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} exact={false} />
          ))}
        </div>
      </nav>

      {/* Expense form */}
      {formOpen && (
        <ExpenseForm
          initialValues={editingExpense}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditingExpense(undefined) }}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        message={snack}
        onDismiss={() => setSnack(null)}
      />
    </div>
  )
}

function NavItem({ to, icon: Icon, label, exact }: { to: string; icon: React.ElementType; label: string; exact: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
          isActive ? 'text-stone-900' : 'text-stone-400'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}

// Minimal context to pass handlers down to pages
import { createContext, useContext } from 'react'
interface AppHandlers {
  openEdit: (e: Expense) => void
  handleDelete: (e: Expense) => void
}
const AppHandlersContext = createContext<AppHandlers>({
  openEdit: () => {},
  handleDelete: () => {},
})
export function useAppHandlers() {
  return useContext(AppHandlersContext)
}
