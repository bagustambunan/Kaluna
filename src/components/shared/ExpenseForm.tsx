import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Expense, Shortcut } from '../../types'
import { useAppState } from '../../context/AppContext'
import { Button } from '../ui/Button'
import { formatRupiahInput, parseRupiahInput } from '../../lib/format'
import { formatDateStr } from '../../lib/date'

interface ExpenseFormProps {
  initialValues?: Expense
  onSave: (values: Omit<Expense, 'id'>) => void
  onClose: () => void
}

export function ExpenseForm({ initialValues, onSave, onClose }: ExpenseFormProps) {
  const { categories, shortcuts } = useAppState()
  const [amountDisplay, setAmountDisplay] = useState(
    initialValues ? formatRupiahInput(String(initialValues.amount)) : ''
  )
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? '')
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [date, setDate] = useState(initialValues?.date ?? formatDateStr(new Date()))
  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => { amountRef.current?.focus() }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRupiahInput(e.target.value)
    setAmountDisplay(formatted)
  }

  const applyShortcut = (sc: Shortcut) => {
    setAmountDisplay(formatRupiahInput(String(sc.amount)))
    setCategoryId(sc.categoryId)
    setNote(sc.note)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseRupiahInput(amountDisplay)
    if (!amount || !categoryId) return
    onSave({ amount, categoryId, note, date })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl md:mx-4 shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">{initialValues ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Shortcuts */}
            {shortcuts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500 mb-2">Shortcuts</p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                  {shortcuts
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map(sc => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => applyShortcut(sc)}
                        className="shrink-0 px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg whitespace-nowrap"
                      >
                        {sc.label}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">Rp</span>
                <input
                  ref={amountRef}
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-3 text-lg font-semibold text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                      categoryId === cat.id
                        ? 'border-stone-900 bg-stone-50'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-stone-700 truncate w-full text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Note</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-3 py-2 text-sm text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={formatDateStr(new Date())}
                className="w-full px-3 py-2 text-sm text-stone-900 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <Button type="submit" className="w-full py-3">Save</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
