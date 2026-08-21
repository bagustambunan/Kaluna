import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-react'
import { addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
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

type Tab = 'weekly' | 'monthly' | 'custom'

interface MonthlyCategoryDatum {
  id: string
  name: string
  color: string
  value: number
  pct: number
}

const PRESETS = [
  { label: '7 hari terakhir',  days: 7 },
  { label: '30 hari terakhir', days: 30 },
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

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

  const monthlyCategoryData = useMemo(() => {
    if (tab !== 'monthly') return []

    const expenses = filteredExpenses.filter(e => e.id !== pendingId)
    const grouped = groupByCategory(expenses)
    const chartTotal = sumExpenses(expenses)

    return state.categories
      .map(cat => {
        const categoryTotal = sumExpenses(grouped[cat.id] ?? [])
        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          value: categoryTotal,
          pct: chartTotal > 0 ? (categoryTotal / chartTotal) * 100 : 0,
        } satisfies MonthlyCategoryDatum
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [tab, filteredExpenses, pendingId, state.categories])

  const selectedCategory = monthlyCategoryData.find(item => item.id === selectedCategoryId)

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
    { key: 'weekly',   label: 'Minggu'   },
    { key: 'monthly',  label: 'Bulan'    },
    { key: 'custom',   label: 'Rentang'  },
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
    <div className="page-shell space-y-4">
      <h1 className="page-title mb-5">Ringkasan</h1>
      {/* Tabs */}
      <div className="flex gap-1 bg-blue-100/60 dark:bg-[#151515] dark:border dark:border-[#292929] p-1.5 rounded-2xl overflow-x-auto scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFilter({ excludedCategoryIds: new Set(), excludedExpenseIds: new Set() }) }}
            className={`flex-1 min-w-fit px-2.5 py-2 text-[11px] font-bold rounded-xl transition-colors ${
              tab === t.key
                ? 'bg-white dark:bg-[#282828] text-blue-700 dark:text-neutral-100'
                : 'text-[#7890ae] dark:text-neutral-500 hover:text-blue-700 dark:hover:text-neutral-200'
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
            className="soft-button w-9 h-9"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-sm font-bold text-[#48698f] dark:text-neutral-300">
            {tab === 'weekly' ? formatWeekRange(weekRange) : formatMonthYear(subMonths(now, -monthOffset))}
          </p>
          <button
            onClick={() => tab === 'weekly' ? setWeekOffset(v => v + 1) : setMonthOffset(v => v + 1)}
            className="soft-button w-9 h-9"
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
              <label className="block text-xs font-bold text-[#6680a4] dark:text-neutral-400 mb-1">Mulai</label>
              <input type="date" value={customRange.start}
                onChange={e => setCustomRange(v => ({ ...v, start: e.target.value }))}
                className="field-control px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#6680a4] dark:text-neutral-400 mb-1">Selesai</label>
              <input type="date" value={customRange.end}
                onChange={e => setCustomRange(v => ({ ...v, end: e.target.value }))}
                className="field-control px-3 py-2.5 text-sm"
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
                className="px-3 py-2 text-xs font-semibold bg-blue-50 dark:bg-[#1c1c1c] hover:bg-blue-100 dark:hover:bg-[#242424] text-blue-700 dark:text-neutral-300 rounded-xl"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Total header */}
      <div className="surface-card flex items-start justify-between p-5">
        <div>
          <p className="text-[10px] text-blue-600 dark:text-neutral-500 uppercase tracking-[.15em] font-bold">Total tercatat</p>
          <p className="font-display font-data text-[30px] font-bold text-[#17345e] dark:text-neutral-100 mt-1">{formatRupiah(total)}</p>
          <p className="text-[11px] text-[#7890ae] dark:text-neutral-500 mt-1">{filteredExpenses.length} pengeluaran dalam periode ini</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilter && (
            <button onClick={resetFilter} className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-neutral-300 px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-[#1c1c1c]">
              <RotateCcw size={12} /> Atur ulang
            </button>
          )}
          <button
            onClick={() => setFilterOpen(v => !v)}
            aria-label="Filter ringkasan"
            className={`p-2.5 rounded-xl border transition-colors ${
              filterOpen || hasFilter
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-blue-100 dark:border-[#303030] text-[#6680a4] dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-[#1c1c1c]'
            }`}
          >
            <Filter size={15} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="surface-card p-4 space-y-3">
          <p className="text-xs font-bold text-[#6680a4] dark:text-neutral-400">Kategori yang ditampilkan</p>
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
                  <button onClick={() => toggleExpandCat(cat.id)} className="flex-1 flex items-center gap-1.5 text-sm text-left text-[#48698f] dark:text-neutral-300">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                    <ChevronRight size={12} className={`ml-auto text-[#8ba0bb] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
                        <span className="text-xs text-[#6680a4] dark:text-neutral-400 flex-1 truncate">{exp.note || formatRupiah(exp.amount)}</span>
                        <span className="font-data text-xs text-[#6680a4] dark:text-neutral-400 shrink-0">{formatRupiah(exp.amount)}</span>
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
        <div className="surface-card text-center py-12 px-6">
          <p className="text-sm font-bold text-[#294b76] dark:text-neutral-200">Tidak ada pengeluaran</p>
          <p className="text-xs text-[#7890ae] dark:text-neutral-500 mt-1">Pilih periode lain.</p>
        </div>
      ) : (
        <>
          {/* Weekly bar chart */}
          {tab === 'weekly' && dailyData.length > 0 && (
            <div className="surface-card p-4">
              <p className="text-xs font-bold text-[#6680a4] dark:text-neutral-400 mb-3">Pengeluaran harian</p>
              <div className="flex items-end gap-1.5 h-24">
                {dailyData.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-md min-h-[3px]"
                      style={{ height: `${(d.total / maxDaily) * 80}px` }}
                    />
                    <span className="text-[10px] text-[#8ba0bb] dark:text-neutral-600">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'weekly'  && weeklyStatus  && (
            <div className="surface-card p-4">
              <ProgressBar status={weeklyStatus} label="Anggaran mingguan" />
            </div>
          )}
          {tab === 'monthly' && monthlyStatus && (
            <div className="surface-card p-4">
              <ProgressBar status={monthlyStatus} label="Anggaran bulanan" />
            </div>
          )}

          {/* Monthly category pie chart */}
          {tab === 'monthly' && monthlyCategoryData.length > 0 && (
            <section className="surface-card p-4" aria-labelledby="monthly-category-chart-title">
              <p id="monthly-category-chart-title" className="text-xs font-bold text-[#6680a4] dark:text-neutral-400">
                Pengeluaran per kategori
              </p>
              <div className="mx-auto mt-3 h-64 w-full max-w-sm">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart accessibilityLayer>
                    <Pie
                      data={monthlyCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      stroke="none"
                      isAnimationActive={false}
                      onClick={(_, index) => {
                        const id = monthlyCategoryData[index]?.id
                        if (id) setSelectedCategoryId(current => current === id ? null : id)
                      }}
                    >
                      {monthlyCategoryData.map(item => (
                        <Cell
                          key={item.id}
                          fill={item.color}
                          opacity={selectedCategoryId && selectedCategoryId !== item.id ? 0.42 : 1}
                          className="cursor-pointer outline-none transition-opacity"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={false}
                      isAnimationActive={false}
                      content={({ active, payload }) => {
                        const item = payload?.[0]?.payload as MonthlyCategoryDatum | undefined
                        if (!active || !item) return null
                        return (
                          <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 dark:border-[#303030] dark:bg-[#171717]">
                            <p className="text-xs font-bold text-[#365b84] dark:text-neutral-200">{item.name}</p>
                            <p className="font-data mt-0.5 text-[11px] text-[#6680a4] dark:text-neutral-400">
                              {formatPct(item.pct)} · {formatRupiah(item.value)}
                            </p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {selectedCategory && (
                <div className="mx-auto mb-4 flex max-w-sm items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 dark:border-[#303030] dark:bg-[#1a1a1a]">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                    <span className="truncate text-xs font-bold text-[#365b84] dark:text-neutral-200">{selectedCategory.name}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-data text-xs font-bold text-[#17345e] dark:text-neutral-100">{formatRupiah(selectedCategory.value)}</p>
                    <p className="font-data text-[10px] text-[#8ba0bb] dark:text-neutral-500">{formatPct(selectedCategory.pct)}</p>
                  </div>
                </div>
              )}

              <div className="mx-auto grid max-w-sm grid-cols-2 gap-x-4 gap-y-2.5 border-t border-blue-50 pt-4 dark:border-[#242424]">
                  {monthlyCategoryData.map(item => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedCategoryId(current => current === item.id ? null : item.id)}
                      className="flex min-w-0 items-start gap-2 text-left"
                    >
                      <span
                        className="w-2.5 h-2.5 mt-1 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-semibold text-[#48698f] dark:text-neutral-300 truncate">{item.name}</span>
                          <span className="font-data text-[10px] text-[#8ba0bb] dark:text-neutral-500 shrink-0">{formatPct(item.pct)}</span>
                        </div>
                        <p className="font-data text-[11px] text-[#6680a4] dark:text-neutral-400 truncate">{formatRupiah(item.value)}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
          )}

          {/* Category breakdown */}
          {tab !== 'monthly' && <div className="surface-card p-4 space-y-4">
            <p className="text-xs font-bold text-[#6680a4] dark:text-neutral-400">Menurut kategori</p>
            {catBreakdown.map(({ cat, total: catTotal, pct }) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-[#48698f] dark:text-neutral-300">{cat.emoji} {cat.name}</span>
                  <span className="font-data font-bold text-[#17345e] dark:text-neutral-100">
                    {formatRupiah(catTotal)} <span className="text-[#8ba0bb] dark:text-neutral-600 text-xs">{formatPct(pct)}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-blue-50 dark:bg-[#242424] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>}

          {/* Expense list */}
          <div className="surface-card divide-y divide-blue-50 dark:divide-[#242424] overflow-hidden">
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
