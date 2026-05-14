import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-react'
import { addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { useAppState } from '../context/AppContext'
import { useAppHandlers } from '../components/AppLayout'
import { ExpenseItem } from '../components/shared/ExpenseItem'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  getWeekRange, getMonthRange, filterByRange, groupByCategory,
  sumExpenses, formatWeekRange, formatMonthYear, getDayLabel,
  groupByDay, formatDateStr,
} from '../lib/date'
import { formatRupiah, formatPct } from '../lib/format'
import type { SummaryFilterState, DateRange } from '../types'
import { getBudgetStatus } from '../lib/budget'

type Tab = 'weekly' | 'monthly' | 'category' | 'custom'

const PRESETS = [
  { label: 'Last 7 days',  days: 7 },
  { label: 'Last 30 days', days: 30 },
]

export function Summary() {
  const [tab,          setTab]          = useState<Tab>('weekly')
  const [weekOffset,   setWeekOffset]   = useState(0)
  const [monthOffset,  setMonthOffset]  = useState(0)
  const [customRange,  setCustomRange]  = useState<DateRange>({ start: '', end: '' })
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [filter,       setFilter]       = useState<SummaryFilterState>({
    excludedCategoryIds: new Set(),
    excludedExpenseIds:  new Set(),
  })
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  const state = useAppState()
  const { openEdit, handleDelete } = useAppHandlers()

  const categoryMap = useMemo(() => new Map(state.categories.map(c => [c.id, c])), [state.categories])
  const now = new Date()

  const weekRange = useMemo(() => {
    const base = weekOffset === 0 ? now : (weekOffset > 0 ? addWeeks(now, weekOffset) : subWeeks(now, -weekOffset))
    return getWeekRange(base, state.settings.weekStartDay)
  }, [weekOffset, state.settings.weekStartDay])

  const monthRange = useMemo(() => {
    const base = monthOffset === 0 ? now : (monthOffset > 0 ? addMonths(now, monthOffset) : subMonths(now, -monthOffset))
    return getMonthRange(base)
  }, [monthOffset])

  const activeRange = useMemo((): DateRange | null => {
    if (tab === 'weekly') return weekRange
    if (tab === 'monthly') return monthRange
    if (tab === 'custom' && customRange.start && customRange.end) return customRange
    if (tab === 'category') return monthRange
    return null
  }, [tab, weekRange, monthRange, customRange])

  const periodExpenses = useMemo(
    () => (activeRange ? filterByRange(state.expenses, activeRange) : []),
    [state.expenses, activeRange]
  )

  const filteredExpenses = useMemo(() => {
    return periodExpenses
      .filter(e => !filter.excludedCategoryIds.has(e.categoryId))
      .filter(e => !filter.excludedExpenseIds.has(e.id))
  }, [periodExpenses, filter])

  const total = useMemo(() => sumExpenses(filteredExpenses), [filteredExpenses])
  const hasFilter = filter.excludedCategoryIds.size > 0 || filter.excludedExpenseIds.size > 0

  const resetFilter = () => {
    setFilter({ excludedCategoryIds: new Set(), excludedExpenseIds: new Set() })
    setFilterOpen(false)
  }

  const toggleCatFilter = (id: string) => {
    setFilter(prev => {
      const next = new Set(prev.excludedCategoryIds)
      if (next.has(id)) next.delete(id); else next.add(id)
      return { ...prev, excludedCategoryIds: next }
    })
  }

  const toggleExpenseFilter = (id: string) => {
    setFilter(prev => {
      const next = new Set(prev.excludedExpenseIds)
      if (next.has(id)) next.delete(id); else next.add(id)
      return { ...prev, excludedExpenseIds: next }
    })
  }

  const toggleExpandCat = (id: string) => {
    setExpandedCats(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const pendingId = state.pendingDelete?.expense.id

  const catBreakdown = useMemo(() => {
    const grouped    = groupByCategory(periodExpenses.filter(e => e.id !== pendingId))
    const grandTotal = sumExpenses(periodExpenses.filter(e => e.id !== pendingId))
    return state.categories
      .map(cat => {
        const items    = grouped[cat.id] ?? []
        const catTotal = sumExpenses(items)
        return { cat, items, total: catTotal, pct: grandTotal > 0 ? (catTotal / grandTotal) * 100 : 0 }
      })
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [periodExpenses, pendingId, state.categories])

  const dailyData = useMemo(() => {
    if (tab !== 'weekly') return []
    const grouped = groupByDay(periodExpenses, weekRange)
    return Object.entries(grouped).map(([date, exps]) => ({
      date,
      label: getDayLabel(date),
      total: sumExpenses(exps),
    }))
  }, [tab, periodExpenses, weekRange])

  const maxDaily = useMemo(() => Math.max(...dailyData.map(d => d.total), 1), [dailyData])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'weekly',   label: 'Weekly'      },
    { key: 'monthly',  label: 'Monthly'     },
    { key: 'category', label: 'By Category' },
    { key: 'custom',   label: 'Custom'      },
  ]

  const weeklyStatus = useMemo(
    () => getBudgetStatus(sumExpenses(filterByRange(state.expenses, getWeekRange(now, state.settings.weekStartDay))), state.budgets.weekly, state.budgets.alertThresholdPct),
    [state.expenses, state.budgets, state.settings.weekStartDay]
  )
  const monthlyStatus = useMemo(
    () => getBudgetStatus(sumExpenses(filterByRange(state.expenses, getMonthRange(now))), state.budgets.monthly, state.budgets.alertThresholdPct),
    [state.expenses, state.budgets]
  )

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-neutral-800 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFilter({ excludedCategoryIds: new Set(), excludedExpenseIds: new Set() }) }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-white dark:bg-neutral-700 text-stone-900 dark:text-neutral-100 shadow-sm'
                : 'text-stone-500 dark:text-neutral-400 hover:text-stone-700 dark:hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      {(tab === 'weekly' || tab === 'monthly') && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => tab === 'weekly' ? setWeekOffset(v => v - 1) : setMonthOffset(v => v - 1)}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-neutral-800 text-stone-600 dark:text-neutral-400"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-sm font-medium text-stone-700 dark:text-neutral-300">
            {tab === 'weekly' ? formatWeekRange(weekRange) : formatMonthYear(subMonths(now, -monthOffset))}
          </p>
          <button
            onClick={() => tab === 'weekly' ? setWeekOffset(v => v + 1) : setMonthOffset(v => v + 1)}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-neutral-800 text-stone-600 dark:text-neutral-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Custom date range */}
      {tab === 'custom' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1">Start</label>
              <input type="date" value={customRange.start}
                onChange={e => setCustomRange(v => ({ ...v, start: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-sm border border-stone-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-stone-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-neutral-100"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 dark:text-neutral-400 mb-1">End</label>
              <input type="date" value={customRange.end}
                onChange={e => setCustomRange(v => ({ ...v, end: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-sm border border-stone-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-stone-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-neutral-100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  const end = new Date()
                  const start = new Date(); start.setDate(start.getDate() - p.days + 1)
                  setCustomRange({ start: formatDateStr(start), end: formatDateStr(end) })
                }}
                className="px-3 py-1.5 text-xs bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-700 dark:text-neutral-300 rounded-lg"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Total header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-500 dark:text-neutral-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-neutral-50">{formatRupiah(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilter && (
            <button onClick={resetFilter} className="flex items-center gap-1 text-xs text-stone-500 dark:text-neutral-400 hover:text-stone-800 dark:hover:text-neutral-200 px-2 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800">
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`p-2 rounded-lg border transition-colors ${
              filterOpen || hasFilter
                ? 'bg-stone-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-stone-900 dark:border-neutral-100'
                : 'border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Filter size={15} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 rounded-xl p-3 space-y-3">
          <p className="text-xs font-medium text-stone-500 dark:text-neutral-400">Filter categories</p>
          {catBreakdown.map(({ cat, items }) => {
            const allExcluded  = filter.excludedCategoryIds.has(cat.id)
            const someExcluded = !allExcluded && items.some(e => filter.excludedExpenseIds.has(e.id))
            const isExpanded   = expandedCats.has(cat.id)

            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!allExcluded}
                    ref={el => { if (el) el.indeterminate = someExcluded }}
                    onChange={() => toggleCatFilter(cat.id)}
                    className="rounded"
                  />
                  <button onClick={() => toggleExpandCat(cat.id)} className="flex-1 flex items-center gap-1.5 text-sm text-left text-stone-700 dark:text-neutral-300">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                    <ChevronRight size={12} className={`ml-auto text-stone-400 dark:text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {items.map(exp => (
                      <div key={exp.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!filter.excludedExpenseIds.has(exp.id)}
                          onChange={() => toggleExpenseFilter(exp.id)}
                          className="rounded"
                        />
                        <span className="text-xs text-stone-600 dark:text-neutral-400 flex-1 truncate">{exp.note || formatRupiah(exp.amount)}</span>
                        <span className="text-xs text-stone-500 dark:text-neutral-400 shrink-0">{formatRupiah(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {periodExpenses.length === 0 ? (
        <p className="text-sm text-stone-400 dark:text-neutral-500 text-center py-10">No expenses in this period</p>
      ) : (
        <>
          {/* Weekly bar chart */}
          {tab === 'weekly' && dailyData.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-700 p-4">
              <p className="text-xs font-medium text-stone-500 dark:text-neutral-400 mb-3">Daily breakdown</p>
              <div className="flex items-end gap-1.5 h-24">
                {dailyData.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-stone-800 dark:bg-neutral-300 rounded-t-sm min-h-[2px]"
                      style={{ height: `${(d.total / maxDaily) * 80}px` }}
                    />
                    <span className="text-xs text-stone-400 dark:text-neutral-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'weekly'  && weeklyStatus  && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-700 p-4">
              <ProgressBar status={weeklyStatus} label="Weekly Budget" />
            </div>
          )}
          {tab === 'monthly' && monthlyStatus && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-700 p-4">
              <ProgressBar status={monthlyStatus} label="Monthly Budget" />
            </div>
          )}

          {/* Category breakdown */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-700 p-4 space-y-3">
            <p className="text-xs font-medium text-stone-500 dark:text-neutral-400">By category</p>
            {catBreakdown.map(({ cat, total: catTotal, pct }) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-700 dark:text-neutral-300">{cat.emoji} {cat.name}</span>
                  <span className="font-medium text-stone-900 dark:text-neutral-100">
                    {formatRupiah(catTotal)} <span className="text-stone-400 dark:text-neutral-500 text-xs">{formatPct(pct)}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-stone-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Expense list */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-700 divide-y divide-stone-100 dark:divide-neutral-800 overflow-hidden">
            {periodExpenses
              .filter(e => e.id !== pendingId)
              .sort((a, b) => b.date.localeCompare(a.date))
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
        </>
      )}
    </div>
  )
}
