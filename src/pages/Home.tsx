import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppState } from '../context/AppContext'
import { useAppHandlers } from '../components/AppLayout'
import { ExpenseItem } from '../components/shared/ExpenseItem'
import { ComposeWell } from '../components/shared/ComposeWell'
import { BudgetWhisper } from '../components/shared/BudgetWhisper'
import { getBudgetStatus } from '../lib/budget'
import {
  filterByRange, getWeekRange, getMonthRange, sumExpenses,
  formatDateStr, shiftDays, formatDayDisplay,
} from '../lib/date'
import { formatRupiah } from '../lib/format'
import { copy } from '../lib/copy'

export function Home() {
  const state = useAppState()
  const {
    openEdit, handleDelete, setFormDefaultDate, handleSave, cancelEdit,
    editingExpense, composeFocused, setComposeFocused,
  } = useAppHandlers()

  const today = useMemo(() => formatDateStr(new Date()), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today

  useEffect(() => {
    setFormDefaultDate(selectedDate)
  }, [selectedDate, setFormDefaultDate])

  useEffect(() => {
    return () => setFormDefaultDate(today)
  }, [setFormDefaultDate, today])

  useEffect(() => {
    if (editingExpense) setSelectedDate(editingExpense.date)
  }, [editingExpense])

  const goBack    = useCallback(() => setSelectedDate(d => shiftDays(d, -1)), [])
  const goForward = useCallback(() => setSelectedDate(d => {
    const next = shiftDays(d, 1)
    return next <= today ? next : d
  }), [today])
  const goToday   = useCallback(() => setSelectedDate(today), [today])

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
  const visibleDayExpenses = dayExpenses.filter(e => e.id !== pendingId)
  const categoryMap = useMemo(() => new Map(state.categories.map(c => [c.id, c])), [state.categories])
  const dayLabel   = formatDayDisplay(selectedDate, today)

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 px-4 pt-5 pb-4 md:pb-4">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 md:order-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            aria-label="Previous day"
            className="p-2 rounded-lg text-mute hover:bg-sheet transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <div className="relative inline-flex flex-col items-center">
              <span
                data-testid="day-label"
                className="font-semibold text-ink"
              >
                {dayLabel}
              </span>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={e => { if (e.target.value) setSelectedDate(e.target.value) }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Pick date"
              />
            </div>
            {!isToday && (
              <div>
                <button
                  onClick={goToday}
                  aria-label="Back to today"
                  className="text-xs text-mute hover:text-ink mt-0.5"
                >
                  {copy.backToToday}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={goForward}
            aria-label="Next day"
            disabled={isToday}
            className="p-2 rounded-lg text-mute hover:bg-sheet transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div>
          <p className="text-xs text-mute font-medium">
            {isToday ? "Today's spending" : 'Day total'}
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-ink mt-1">{formatRupiah(dayTotal)}</p>
        </div>

        {weeklyStatus && (
          <BudgetWhisper period="weekly" status={weeklyStatus} thresholdPct={state.budgets.alertThresholdPct} />
        )}
        {monthlyStatus && (
          <BudgetWhisper period="monthly" status={monthlyStatus} thresholdPct={state.budgets.alertThresholdPct} />
        )}
        {visibleDayExpenses.length === 0 ? (
          <p className="text-sm text-mute py-4 text-center">{copy.whatDidYouSpend}</p>
        ) : (
          <div className="divide-y divide-ink/10 bg-transparent">
            {visibleDayExpenses.map(e => (
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
      <div className={`md:order-1 -mx-4 md:mx-0 ${composeFocused ? 'min-h-0 flex-1 overflow-y-auto max-h-[min(50dvh,22rem)]' : 'shrink-0'}`}>
        <ComposeWell
          categories={state.categories}
          shortcuts={state.shortcuts}
          selectedDate={selectedDate}
          editingExpense={editingExpense}
          autoFocusAmount={isToday && visibleDayExpenses.length === 0 && !editingExpense}
          onSave={handleSave}
          onCancelEdit={cancelEdit}
          onComposeFocusChange={setComposeFocused}
        />
      </div>
    </div>
  )
}
