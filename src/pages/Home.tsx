import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppState } from '../context/AppContext'
import { useAppHandlers } from '../components/AppLayout'
import { ExpenseItem } from '../components/shared/ExpenseItem'
import { ProgressBar } from '../components/ui/ProgressBar'
import { getBudgetStatus } from '../lib/budget'
import {
  filterByRange, getWeekRange, getMonthRange, sumExpenses,
  formatDateStr, shiftDays, formatDayDisplay,
} from '../lib/date'
import { formatRupiah } from '../lib/format'

export function Home() {
  const state = useAppState()
  const { openEdit, handleDelete, setFormDefaultDate } = useAppHandlers()

  const today = useMemo(() => formatDateStr(new Date()), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today

  useEffect(() => {
    setFormDefaultDate(selectedDate)
  }, [selectedDate, setFormDefaultDate])

  useEffect(() => {
    return () => setFormDefaultDate(today)
  }, [setFormDefaultDate, today])

  const dateInputRef = useRef<HTMLInputElement>(null)

  const goBack    = useCallback(() => setSelectedDate(d => shiftDays(d, -1)), [])
  const goForward = useCallback(() => setSelectedDate(d => {
    const next = shiftDays(d, 1)
    return next <= today ? next : d
  }), [today])
  const goToday   = useCallback(() => setSelectedDate(today), [today])

  const openDatePicker = useCallback(() => {
    const input = dateInputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.click()
    }
  }, [])

  const now = new Date()
  const weekRange  = useMemo(() => getWeekRange(now, state.settings.weekStartDay), [state.settings.weekStartDay])
  const monthRange = useMemo(() => getMonthRange(now), [])

  const weeklySpent  = useMemo(() => sumExpenses(filterByRange(state.expenses, weekRange)),  [state.expenses, weekRange])
  const monthlySpent = useMemo(() => sumExpenses(filterByRange(state.expenses, monthRange)), [state.expenses, monthRange])

  const dayExpenses = useMemo(
    () => state.expenses.filter(e => e.date === selectedDate).sort((a, b) => b.id.localeCompare(a.id)),
    [state.expenses, selectedDate]
  )
  const dayTotal = useMemo(() => sumExpenses(dayExpenses), [dayExpenses])

  const weeklyStatus  = getBudgetStatus(weeklySpent,  state.budgets.weekly,  state.budgets.alertThresholdPct)
  const monthlyStatus = getBudgetStatus(monthlySpent, state.budgets.monthly, state.budgets.alertThresholdPct)

  const pendingId  = state.pendingDelete?.expense.id
  const categoryMap = useMemo(() => new Map(state.categories.map(c => [c.id, c])), [state.categories])
  const dayLabel   = formatDayDisplay(selectedDate, today)

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={goBack}
          aria-label="Previous day"
          className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <button
            data-testid="day-label"
            onClick={openDatePicker}
            aria-label="Pick date"
            className="font-semibold text-stone-900 dark:text-stone-100 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
          >
            {dayLabel}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={today}
            onChange={e => { if (e.target.value) setSelectedDate(e.target.value) }}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            tabIndex={-1}
            aria-hidden="true"
          />
          {!isToday && (
            <div>
              <button
                onClick={goToday}
                aria-label="Back to today"
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mt-0.5"
              >
                Back to today
              </button>
            </div>
          )}
        </div>
        <button
          onClick={goForward}
          aria-label="Next day"
          disabled={isToday}
          className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day total */}
      <div>
        <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide font-medium">
          {isToday ? "Today's spending" : 'Day total'}
        </p>
        <p className="text-3xl font-bold text-stone-900 dark:text-stone-50 mt-1">{formatRupiah(dayTotal)}</p>
      </div>

      {/* Budget progress */}
      {(weeklyStatus || monthlyStatus) && (
        <div className="space-y-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          {weeklyStatus  && <ProgressBar status={weeklyStatus}  label="Weekly Budget" />}
          {monthlyStatus && <ProgressBar status={monthlyStatus} label="Monthly Budget" />}
        </div>
      )}

      {/* Day expenses */}
      <div>
        <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide font-medium mb-2">
          {isToday ? "Today's Expenses" : 'Expenses'}
        </p>
        {dayExpenses.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">Tap + to record your first expense</p>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
            {dayExpenses
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

      {/* Weekly / monthly totals */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-stone-500 dark:text-stone-400">This week</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">{formatRupiah(weeklySpent)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-stone-500 dark:text-stone-400">This month</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">{formatRupiah(monthlySpent)}</span>
        </div>
      </div>
    </div>
  )
}
