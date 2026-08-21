import { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, History, ChartNoAxesColumnIncreasing, Settings, Plus, Share, Sparkles, X } from 'lucide-react'
import { useAppState, useAppDispatch } from '../context/AppContext'
import { ExpenseForm } from './shared/ExpenseForm'
import { Snackbar } from './ui/Snackbar'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useNotification } from '../hooks/useNotification'
import type { Expense } from '../types'
import { filterByRange, getWeekRange, getMonthRange, sumExpenses, formatDateStr } from '../lib/date'

interface SnackMsg { text: string; undoFn?: () => void }

interface AppHandlers {
  openEdit: (e: Expense) => void
  handleDelete: (e: Expense) => void
  setFormDefaultDate: (date: string) => void
}

const AppHandlersContext = createContext<AppHandlers>({
  openEdit: () => {},
  handleDelete: () => {},
  setFormDefaultDate: () => {},
})

export function useAppHandlers() {
  return useContext(AppHandlersContext)
}

const navItems = [
  { to: '/',         icon: Home,                          label: 'Beranda' },
  { to: '/history',  icon: History,                       label: 'Riwayat' },
  { to: '/summary',  icon: ChartNoAxesColumnIncreasing,   label: 'Ringkasan' },
  { to: '/settings', icon: Settings,                      label: 'Atur' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [formDefaultDate, setFormDefaultDate] = useState(() => formatDateStr(new Date()))
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

  const handleSave = (values: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: { ...values, id: editingExpense.id } })
      showSnack('Catatan diperbarui')
    } else {
      const expense: Expense = { ...values, id: crypto.randomUUID() }
      dispatch({ type: 'ADD_EXPENSE', payload: expense })
      showSnack('Pengeluaran dicatat')

      const now = new Date()
      const weekRange  = getWeekRange(now, state.settings.weekStartDay)
      const monthRange = getMonthRange(now)
      const weeklySpent  = sumExpenses(filterByRange([...state.expenses, expense], weekRange))
      const monthlySpent = sumExpenses(filterByRange([...state.expenses, expense], monthRange))
      checkBudget(weeklySpent,  state.budgets, 'weekly',  msg => setInAppAlert(msg))
      checkBudget(monthlySpent, state.budgets, 'monthly', msg => setInAppAlert(msg))
    }
    setFormOpen(false)
    setEditingExpense(undefined)
  }

  const openAdd = useCallback(() => {
    setEditingExpense(undefined)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((expense: Expense) => {
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'CONFIRM_DELETE' })
    }, 5000)
    dispatch({ type: 'SOFT_DELETE_EXPENSE', payload: { expense, timeoutId } })
    showSnack('Catatan dihapus', () => dispatch({ type: 'UNDO_DELETE' }))
  }, [dispatch, showSnack])

  const showBanner = (!state.settings.installBannerDismissed) && (canInstall || isIOS)

  const addFormInitial = editingExpense
    ? editingExpense
    : { amount: 0, categoryId: '', note: '', date: formDefaultDate }

  return (
    <div className="min-h-screen bg-transparent flex md:flex-row text-[#17345e] dark:text-blue-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white/90 dark:bg-[#101d30]/95 border-r border-blue-100 dark:border-blue-950 fixed top-0 left-0 h-full backdrop-blur-xl">
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[15px] bg-blue-600 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(47,111,228,.25)]">
            <Sparkles size={19} />
          </div>
          <div>
            <span className="font-display text-xl font-bold text-[#17345e] dark:text-blue-50">Kaluna</span>
            <p className="text-[11px] text-[#7890ae] dark:text-slate-400">teman keuanganmu</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-3 space-y-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-200 shadow-[inset_0_0_0_1px_rgba(47,111,228,.08)]'
                    : 'text-[#7187a4] dark:text-slate-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 pb-5">
          <button
            onClick={openAdd}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-bold py-3 rounded-2xl hover:bg-blue-700 active:scale-[.98] shadow-[0_10px_24px_rgba(47,111,228,.24)] transition"
          >
            <Plus size={16} />
            Catat pengeluaran
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-28 md:pb-8 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-[62px] bg-[#f4f8ff]/90 dark:bg-[#0d1727]/90 sticky top-0 z-20 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[14px] bg-blue-600 text-white flex items-center justify-center shadow-[0_6px_16px_rgba(47,111,228,.22)]">
              <Sparkles size={17} />
            </div>
            <div className="leading-tight">
              <span className="font-display text-[17px] font-bold text-[#17345e] dark:text-blue-50">Kaluna</span>
              <p className="text-[10px] text-[#7890ae] dark:text-slate-400">teman keuanganmu</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> tersimpan lokal
          </div>
        </header>

        {inAppAlert && (
          <div className="mx-4 mt-2 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-100 dark:border-orange-900 px-4 py-3 flex items-center justify-between text-sm text-orange-800 dark:text-orange-300">
            <span>{inAppAlert}</span>
            <button onClick={() => setInAppAlert(null)} aria-label="Tutup pengingat" className="p-1 text-orange-600 dark:text-orange-400"><X size={16} /></button>
          </div>
        )}

        {showBanner && (
          <div className="mx-4 mt-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 px-4 py-3 flex items-center justify-between text-xs text-blue-800 dark:text-blue-200">
            <span className="flex items-center gap-2">
              {isIOS ? <><Share size={14} /> Bagikan lalu pilih “Add to Home Screen”</> : 'Pasang Kaluna agar lebih cepat dibuka'}
            </span>
            <div className="flex items-center gap-3">
              {canInstall && (
                <button onClick={triggerInstall} className="font-bold text-blue-700 dark:text-blue-200 hover:underline">Pasang</button>
              )}
              <button
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { installBannerDismissed: true } })}
                className="text-[#7187a4] dark:text-slate-400 hover:text-blue-700"
              >
                Nanti
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

        <div className="max-w-[720px] mx-auto">
          <AppHandlersContext.Provider value={{ openEdit, handleDelete, setFormDefaultDate }}>
            {children}
          </AppHandlersContext.Provider>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[68px] px-1 rounded-[24px] bg-white/95 dark:bg-[#14223a]/95 border border-white dark:border-blue-900/60 shadow-[0_16px_44px_rgba(23,52,94,.18)] backdrop-blur-xl">
          {navItems.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} exact={to === '/'} />
          ))}
          <button
            onClick={openAdd}
            className="w-[58px] h-[58px] -mt-8 bg-blue-600 rounded-[20px] flex items-center justify-center text-white ring-[5px] ring-[#f4f8ff] dark:ring-[#0d1727] shadow-[0_12px_26px_rgba(47,111,228,.34)] hover:bg-blue-700 active:scale-95 transition"
            aria-label="Catat pengeluaran"
          >
            <Plus size={24} />
          </button>
          {navItems.slice(2).map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} exact={false} />
          ))}
        </div>
      </nav>

      {formOpen && (
        <ExpenseForm
          initialValues={editingExpense ? editingExpense : { ...addFormInitial, id: '' } as Expense}
          isEditing={!!editingExpense}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditingExpense(undefined) }}
        />
      )}

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
        `relative flex flex-col items-center gap-1 min-w-[54px] px-2 py-1 rounded-xl text-[10px] font-semibold transition-colors ${
          isActive ? 'text-blue-600 dark:text-blue-300' : 'text-[#91a4bd] dark:text-slate-500'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}
