import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Category, Expense, Shortcut } from '../../types'
import { Button } from '../ui/Button'
import { formatRupiahInput, parseRupiahInput } from '../../lib/format'

export interface ComposeWellProps {
  categories: Category[]
  shortcuts: Shortcut[]
  selectedDate: string
  editingExpense?: Expense
  autoFocusAmount: boolean
  onSave: (values: Omit<Expense, 'id'>) => void
  onCancelEdit: () => void
  onComposeFocusChange: (focused: boolean) => void
}

export function ComposeWell({
  categories,
  shortcuts,
  selectedDate,
  editingExpense,
  autoFocusAmount,
  onSave,
  onCancelEdit,
  onComposeFocusChange,
}: ComposeWellProps) {
  const [amountDisplay, setAmountDisplay] = useState(
    editingExpense ? formatRupiahInput(String(editingExpense.amount)) : '',
  )
  const [categoryId, setCategoryId] = useState(editingExpense?.categoryId ?? '')
  const [note, setNote] = useState(editingExpense?.note ?? '')
  const [date, setDate] = useState(editingExpense?.date ?? selectedDate)
  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocusAmount) amountRef.current?.focus()
  }, [autoFocusAmount])

  useEffect(() => {
    if (!editingExpense) {
      setAmountDisplay('')
      setCategoryId('')
      setNote('')
      setDate(selectedDate)
      return
    }
    setAmountDisplay(formatRupiahInput(String(editingExpense.amount)))
    setCategoryId(editingExpense.categoryId)
    setNote(editingExpense.note)
    setDate(editingExpense.date)
  }, [editingExpense])

  const canSave = parseRupiahInput(amountDisplay) !== 0 && categoryId !== ''

  function resetAddFields() {
    setAmountDisplay('')
    setCategoryId('')
    setNote('')
    amountRef.current?.focus()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = parseRupiahInput(amountDisplay)
    if (!amount || !categoryId) return
    onSave({
      amount,
      categoryId,
      note,
      date: editingExpense ? date : selectedDate,
    })
    if (!editingExpense) resetAddFields()
  }

  function handleShortcut(sc: Shortcut) {
    onSave({
      amount: sc.amount,
      categoryId: sc.categoryId,
      note: sc.note,
      date: selectedDate,
    })
    resetAddFields()
  }

  return (
    <form
      data-testid="expense-form"
      className="bg-sheet border-t border-ink/10 px-4 pt-3 pb-3 md:border md:rounded-md md:mt-0"
      onSubmit={handleSubmit}
      onFocusCapture={() => onComposeFocusChange(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onComposeFocusChange(false)
      }}
    >
      {editingExpense && (
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-ink">Edit expense</p>
          <Button type="button" variant="ghost" onClick={onCancelEdit}>
            Cancel
          </Button>
        </div>
      )}

      {!editingExpense && shortcuts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-3">
          {shortcuts
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleShortcut(sc)}
                className="shrink-0 bg-paper text-ink text-sm px-3 py-1.5 rounded-md whitespace-nowrap"
              >
                {sc.label}
              </button>
            ))}
        </div>
      )}

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mute text-sm">Rp</span>
        <input
          ref={amountRef}
          type="text"
          inputMode="numeric"
          value={amountDisplay}
          onChange={(e) => setAmountDisplay(formatRupiahInput(e.target.value))}
          placeholder="0"
          className="w-full pl-10 pr-3 py-3 tabular-nums text-lg font-semibold text-ink bg-sheet border border-ink/15 rounded-md placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-pen"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors ${
              categoryId === cat.id ? 'border-pen bg-paper' : 'border-ink/10'
            }`}
          >
            <span className="text-xl">{cat.emoji}</span>
            <span className="text-ink truncate w-full text-center">{cat.name}</span>
          </button>
        ))}
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        className="w-full mb-3 px-3 py-2 text-sm text-ink bg-sheet border border-ink/15 rounded-md placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-pen"
      />

      {editingExpense && (
        <div className="mb-3">
          <label htmlFor="compose-date" className="block text-sm font-medium text-ink mb-1">
            Date
          </label>
          <input
            id="compose-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm text-ink bg-sheet border border-ink/15 rounded-md focus:outline-none focus:ring-2 focus:ring-pen"
          />
        </div>
      )}

      <Button type="submit" className="w-full py-3" disabled={!canSave}>
        Save
      </Button>
    </form>
  )
}
