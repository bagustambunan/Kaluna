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
import { copy } from '../lib/copy'

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
      <div className="flex gap-4 border-b border-ink/10">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFilter({ excludedCategoryIds: new Set(), excludedExpenseIds: new Set() }) }}
            className={`text-xs font-medium transition-colors ${
              tab === t.key
                ? 'text-ink border-b-2 border-pen -mb-px pb-2'
                : 'text-mute pb-2'
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
            className="p-1.5 rounded-lg hover:bg-sheet text-mute"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-sm font-medium text-ink">
            {tab === 'weekly' ? formatWeekRange(weekRange) : formatMonthYear(subMonths(now, -monthOffset))}
          </p>
          <button
            onClick={() => tab === 'weekly' ? setWeekOffset(v => v + 1) : setMonthOffset(v => v + 1)}
            className="p-1.5 rounded-lg hover:bg-sheet text-mute"
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
              <label className="block text-xs font-medium text-mute mb-1">Start</label>
              <input type="date" value={customRange.start}
                onChange={e => setCustomRange(v => ({ ...v, start: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-sm border border-ink/15 bg-sheet text-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-pen"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-mute mb-1">End</label>
              <input type="date" value={customRange.end}
                onChange={e => setCustomRange(v => ({ ...v, end: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-sm border border-ink/15 bg-sheet text-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-pen"
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
                className="px-3 py-1.5 text-xs bg-sheet hover:bg-sheet text-ink rounded-lg"
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
          <p className="text-xs text-mute uppercase tracking-wide font-medium">Total</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-ink">{formatRupiah(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilter && (
            <button onClick={resetFilter} className="flex items-center gap-1 text-xs text-mute hover:text-ink px-2 py-1.5 rounded-lg hover:bg-sheet">
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`p-2 rounded-lg border transition-colors ${
              filterOpen || hasFilter
                ? 'bg-ink text-sheet border-ink'
                : 'border-ink/10 text-mute hover:bg-sheet'
            }`}
          >
            <Filter size={15} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="bg-sheet border border-ink/10 rounded-md p-3 space-y-3">
          <p className="text-xs font-medium text-mute">Filter categories</p>
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
                  <button onClick={() => toggleExpandCat(cat.id)} className="flex-1 flex items-center gap-1.5 text-sm text-left text-ink">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                    <ChevronRight size={12} className={`ml-auto text-mute transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
                        <span className="text-xs text-mute flex-1 truncate">{exp.note || formatRupiah(exp.amount)}</span>
                        <span className="text-xs text-mute shrink-0 tabular-nums">{formatRupiah(exp.amount)}</span>
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
        <p className="text-sm text-mute text-center py-10">{copy.noExpensesInPeriod}</p>
      ) : (
        <>
          {/* Weekly bar chart */}
          {tab === 'weekly' && dailyData.length > 0 && (
            <div className="bg-sheet border border-ink/10 rounded-md p-4">
              <p className="text-xs font-medium text-mute mb-3">Daily breakdown</p>
              <div className="flex items-end gap-1.5 h-24">
                {dailyData.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-ink rounded-t-sm min-h-[2px]"
                      style={{ height: `${(d.total / maxDaily) * 80}px` }}
                    />
                    <span className="text-xs text-mute">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'weekly'  && weeklyStatus  && (
            <div className="bg-sheet border border-ink/10 rounded-md p-4">
              <ProgressBar status={weeklyStatus} label="Weekly Budget" />
            </div>
          )}
          {tab === 'monthly' && monthlyStatus && (
            <div className="bg-sheet border border-ink/10 rounded-md p-4">
              <ProgressBar status={monthlyStatus} label="Monthly Budget" />
            </div>
          )}

          {/* Category breakdown */}
          <div className="bg-sheet border border-ink/10 rounded-md p-4 space-y-3">
            <p className="text-xs font-medium text-mute">By category</p>
            {catBreakdown.map(({ cat, total: catTotal, pct }) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink">{cat.emoji} {cat.name}</span>
                  <span className="font-medium text-ink tabular-nums">
                    {formatRupiah(catTotal)} <span className="text-mute text-xs">{formatPct(pct)}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Expense list */}
          <div className="divide-y divide-ink/10">
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
