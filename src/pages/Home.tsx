import { useMemo } from 'react'
import { useAppState } from '../context/AppContext'
import { useAppHandlers } from '../components/AppLayout'
import { ExpenseItem } from '../components/shared/ExpenseItem'
import { ProgressBar } from '../components/ui/ProgressBar'
import { getBudgetStatus } from '../lib/budget'
import { filterByRange, getWeekRange, getMonthRange, sumExpenses, formatDateStr } from '../lib/date'
import { formatRupiah } from '../lib/format'

export function Home() {
  const state = useAppState()
  const { openEdit, handleDelete } = useAppHandlers()

  const now = new Date()
  const today = formatDateStr(now)

  const todayExpenses = useMemo(
    () => state.expenses.filter(e => e.date === today).sort((a, b) => b.id.localeCompare(a.id)),
    [state.expenses, today]
  )

  const weekRange = useMemo(() => getWeekRange(now, state.settings.weekStartDay), [state.settings.weekStartDay])
  const monthRange = useMemo(() => getMonthRange(now), [])

  const weeklySpent  = useMemo(() => sumExpenses(filterByRange(state.expenses, weekRange)), [state.expenses, weekRange])
  const monthlySpent = useMemo(() => sumExpenses(filterByRange(state.expenses, monthRange)), [state.expenses, monthRange])

  const todayTotal = useMemo(() => sumExpenses(todayExpenses), [todayExpenses])

  const weeklyStatus  = getBudgetStatus(weeklySpent,  state.budgets.weekly,  state.budgets.alertThresholdPct)
  const monthlyStatus = getBudgetStatus(monthlySpent, state.budgets.monthly, state.budgets.alertThresholdPct)

  const pendingId = state.pendingDelete?.expense.id

  const categoryMap = useMemo(() => {
    const m = new Map(state.categories.map(c => [c.id, c]))
    return m
  }, [state.categories])

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Today summary */}
      <div>
        <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">Today</p>
        <p className="text-3xl font-bold text-stone-900 mt-1">{formatRupiah(todayTotal)}</p>
      </div>

      {/* Budget progress */}
      {(weeklyStatus || monthlyStatus) && (
        <div className="space-y-4 bg-white rounded-xl border border-stone-200 p-4">
          {weeklyStatus  && <ProgressBar status={weeklyStatus}  label="Weekly Budget" />}
          {monthlyStatus && <ProgressBar status={monthlyStatus} label="Monthly Budget" />}
        </div>
      )}

      {/* Today's expenses */}
      <div>
        <p className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-2">Today's Expenses</p>
        {todayExpenses.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">Tap + to record your first expense</p>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {todayExpenses
              .filter(e => e.id !== pendingId)
              .map(e => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  category={categoryMap.get(e.categoryId)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        )}
      </div>

      {/* This week summary */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">This week</span>
          <span className="font-semibold text-stone-900">{formatRupiah(weeklySpent)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-stone-500">This month</span>
          <span className="font-semibold text-stone-900">{formatRupiah(monthlySpent)}</span>
        </div>
      </div>
    </div>
  )
}
