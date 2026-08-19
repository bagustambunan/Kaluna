import { useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Expense, Category } from '../../types'
import { formatRupiah } from '../../lib/format'
import { formatDisplayDate } from '../../lib/date'

interface ExpenseItemProps {
  expense: Expense
  category: Category | undefined
  onEdit: (e: Expense) => void
  onDelete: (e: Expense) => void
}

export function ExpenseItem({ expense, category, onEdit, onDelete }: ExpenseItemProps) {
  const [offset, setOffset] = useState(0)
  const [open, setOpen] = useState(false)
  const startX = useRef(0)
  const ACTION_WIDTH = 120

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    if (dx > 0) { setOffset(0); return }
    setOffset(Math.max(dx, -ACTION_WIDTH))
  }

  const handleTouchEnd = () => {
    if (offset < -60) {
      setOffset(-ACTION_WIDTH)
      setOpen(true)
    } else {
      setOffset(0)
      setOpen(false)
    }
  }

  const close = () => { setOffset(0); setOpen(false) }

  return (
    <div className="relative overflow-hidden">
      {/* Swipe action buttons */}
      <div className="absolute right-0 top-0 h-full w-[120px] flex">
        <button
          onClick={() => { close(); onEdit(expense) }}
          className="flex-1 flex items-center justify-center bg-sheet text-ink"
          aria-label="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => { close(); onDelete(expense) }}
          className="flex-1 flex items-center justify-center bg-stamp/15 text-stamp"
          aria-label="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Main row */}
      <div
        className="relative bg-paper md:hover:bg-sheet flex items-center gap-3 px-4 py-3 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {open && <div className="absolute inset-0 z-10" onClick={close} />}
        <span className="text-xl shrink-0">{category?.emoji ?? '📦'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-stone-700 dark:text-neutral-300 truncate">{category?.name ?? 'Unknown'}</span>
            <span className="text-base font-semibold tabular-nums text-stone-900 dark:text-neutral-100 shrink-0">{formatRupiah(expense.amount)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-neutral-500 mt-0.5">
            <span>{formatDisplayDate(expense.date)}</span>
            {expense.note && <><span>·</span><span className="truncate">{expense.note}</span></>}
          </div>
        </div>
        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 text-stone-400 dark:text-neutral-500 hover:text-stone-600 dark:hover:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded"
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(expense)}
            className="p-1.5 text-stone-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
