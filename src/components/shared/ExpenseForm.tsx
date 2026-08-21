import { useState, useEffect, useRef } from 'react'
import { X, ReceiptText } from 'lucide-react'
import type { Expense, Shortcut } from '../../types'
import { useAppState } from '../../context/AppContext'
import { Button } from '../ui/Button'
import { formatRupiahInput, parseRupiahInput } from '../../lib/format'
import { formatDateStr } from '../../lib/date'

interface ExpenseFormProps {
  initialValues?: Expense
  isEditing?: boolean
  onSave: (values: Omit<Expense, 'id'>) => void
  onClose: () => void
}

export function ExpenseForm({ initialValues, isEditing = false, onSave, onClose }: ExpenseFormProps) {
  const { categories, shortcuts } = useAppState()
  const [amountDisplay, setAmountDisplay] = useState(
    initialValues ? formatRupiahInput(String(initialValues.amount)) : ''
  )
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? '')
  const [note, setNote]   = useState(initialValues?.note ?? '')
  const [date, setDate]   = useState(initialValues?.date ?? formatDateStr(new Date()))
  const amountRef = useRef<HTMLInputElement>(null)
  const today = formatDateStr(new Date())

  useEffect(() => { amountRef.current?.focus() }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountDisplay(formatRupiahInput(e.target.value))
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
      <div className="absolute inset-0 bg-[#17345e]/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white dark:bg-[#121f33] rounded-t-[30px] md:rounded-[30px] md:mx-4 shadow-[0_-20px_55px_rgba(23,52,94,.2)] max-h-[92vh] flex flex-col border border-white/70 dark:border-blue-900/70">
        <div className="md:hidden w-10 h-1 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto mt-2.5" />
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[15px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 grid place-items-center"><ReceiptText size={18} /></div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#17345e] dark:text-blue-50">
                {isEditing ? 'Ubah pengeluaran' : 'Tambah pengeluaran'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="soft-button w-9 h-9">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form data-testid="expense-form" onSubmit={handleSubmit} className="px-5 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5">
            {/* Shortcuts */}
            {shortcuts.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#6680a4] dark:text-slate-400 mb-2">Pilihan cepat</p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                  {shortcuts
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map(sc => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => applyShortcut(sc)}
                        className="shrink-0 px-3 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-200 rounded-xl whitespace-nowrap"
                      >
                        {sc.label}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-[#6680a4] dark:text-slate-400 mb-2">Nominal</label>
              <div className="relative rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 p-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-300 text-sm font-bold">Rp</span>
                <input
                  ref={amountRef}
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="field-control font-data pl-11 pr-3 py-3.5 text-xl font-bold bg-white dark:bg-[#0e1a2c]"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#6680a4] dark:text-slate-400 mb-2">Kategori</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-xs transition-all ${
                      categoryId === cat.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/60 shadow-[0_6px_16px_rgba(47,111,228,.10)]'
                        : 'border-blue-100 dark:border-blue-900/70 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-[#48698f] dark:text-blue-200 font-semibold truncate w-full text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-[#6680a4] dark:text-slate-400 mb-2">Catatan</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Contoh: makan siang"
                className="field-control px-3.5 py-3 text-sm"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-[#6680a4] dark:text-slate-400 mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={today}
                className="field-control px-3.5 py-3 text-sm"
              />
            </div>

            <Button type="submit" className="w-full py-3.5 rounded-2xl">{isEditing ? 'Simpan perubahan' : 'Simpan catatan'}</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
