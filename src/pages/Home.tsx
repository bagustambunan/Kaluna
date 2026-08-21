import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, ReceiptText } from 'lucide-react'
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
  const categoryMap = useMemo(() => new Map(state.categories.map(c => [c.id, c])), [state.categories])
  const dayLabel   = formatDayDisplay(selectedDate, today)

  const monthlyPct = monthlyStatus ? Math.min(monthlyStatus.pct, 100) : 0

  return (
    <div className="page-shell space-y-5">
      <h1 className="page-title">Beranda</h1>

      {/* Date notebook tab */}
      <div className="flex items-center gap-2 bg-blue-100/60 dark:bg-blue-950/40 rounded-2xl p-1.5">
        <button
          onClick={goBack}
          aria-label="Hari sebelumnya"
          className="soft-button w-9 h-9 border-transparent shadow-none"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center leading-tight">
          <div className="relative inline-flex items-center gap-2">
            <CalendarDays size={15} className="text-blue-600 dark:text-blue-300" />
            <span
              data-testid="day-label"
              className="text-sm font-bold text-[#294b76] dark:text-blue-100"
            >
              {dayLabel}
            </span>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => { if (e.target.value) setSelectedDate(e.target.value) }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Pilih tanggal"
            />
          </div>
          {!isToday && (
            <div>
              <button
                onClick={goToday}
                aria-label="Kembali ke hari ini"
                className="text-[10px] font-semibold text-blue-600 dark:text-blue-300 mt-0.5"
              >
                Kembali ke hari ini
              </button>
            </div>
          )}
        </div>
        <button
          onClick={goForward}
          aria-label="Hari berikutnya"
          disabled={isToday}
          className="soft-button w-9 h-9 border-transparent shadow-none disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Daily total */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#2f6fe4] text-white px-5 pt-5 pb-6 shadow-[0_18px_42px_rgba(47,111,228,.24)]">
        <div className="absolute inset-0 opacity-[.14]" aria-hidden="true" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 29px, white 30px)' }} />
        <div className="absolute -right-10 -top-12 w-36 h-36 rounded-full border-[22px] border-white/10" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-blue-100">{isToday ? 'Pengeluaran hari ini' : 'Total pengeluaran'}</p>
            <p className="font-display font-data text-[32px] sm:text-4xl font-bold leading-none mt-4 truncate">{formatRupiah(dayTotal)}</p>
            <p className="text-[12px] text-blue-100 mt-2">{dayExpenses.length} transaksi</p>
          </div>
          {monthlyStatus ? (
            <div
              className="relative w-[72px] h-[72px] rounded-full shrink-0 grid place-items-center"
              style={{ background: `conic-gradient(#8ee1c8 ${monthlyPct * 3.6}deg, rgba(255,255,255,.17) 0)` }}
              aria-label={`${Math.round(monthlyPct)} persen anggaran bulanan terpakai`}
            >
              <div className="w-[58px] h-[58px] rounded-full bg-[#2f6fe4] grid place-items-center text-center">
                <span className="font-data text-sm font-bold leading-none">{Math.round(monthlyPct)}%</span>
                <span className="text-[8px] text-blue-100">bulan ini</span>
              </div>
            </div>
          ) : (
            <div className="w-[58px] h-[58px] rounded-[20px] bg-white/14 grid place-items-center shrink-0"><ReceiptText size={24} /></div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="surface-card px-4 py-3.5">
          <p className="text-[11px] font-semibold text-[#7890ae] dark:text-slate-400">Minggu ini</p>
          <p className="font-data mt-1 text-base font-bold text-[#17345e] dark:text-blue-50 truncate">{formatRupiah(weeklySpent)}</p>
        </div>
        <div className="surface-card px-4 py-3.5">
          <p className="text-[11px] font-semibold text-[#7890ae] dark:text-slate-400">Bulan ini</p>
          <p className="font-data mt-1 text-base font-bold text-[#17345e] dark:text-blue-50 truncate">{formatRupiah(monthlySpent)}</p>
        </div>
      </div>

      {/* Budget progress */}
      {(weeklyStatus || monthlyStatus) && (
        <div className="surface-card space-y-5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#294b76] dark:text-blue-100">Anggaran</p>
          </div>
          {weeklyStatus  && <ProgressBar status={weeklyStatus}  label="Mingguan" />}
          {monthlyStatus && <ProgressBar status={monthlyStatus} label="Bulanan" />}
        </div>
      )}

      {/* Day expenses */}
      <section>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <p className="text-sm font-bold text-[#294b76] dark:text-blue-100">{isToday ? 'Pengeluaran hari ini' : 'Pengeluaran'}</p>
          <span className="grid place-items-center min-w-7 h-7 px-2 rounded-full bg-blue-100 dark:bg-blue-950 text-xs font-bold text-blue-700 dark:text-blue-300">{dayExpenses.filter(e => e.id !== pendingId).length}</span>
        </div>
        {dayExpenses.length === 0 ? (
          <div className="surface-card py-10 px-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-[18px] bg-blue-50 dark:bg-blue-950/60 grid place-items-center text-blue-500"><ReceiptText size={21} /></div>
            <p className="font-bold text-sm text-[#294b76] dark:text-blue-100 mt-3">Belum ada catatan</p>
            <p className="text-xs text-[#7890ae] dark:text-slate-400 mt-1">Ketuk tombol + saat kamu mengeluarkan uang.</p>
          </div>
        ) : (
          <div className="surface-card divide-y divide-blue-50 dark:divide-blue-950/70 overflow-hidden">
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
      </section>
    </div>
  )
}
