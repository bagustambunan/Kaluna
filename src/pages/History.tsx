import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useAppState } from '../context/AppContext'
import { useAppHandlers } from '../components/AppLayout'
import { ExpenseItem } from '../components/shared/ExpenseItem'
import { parseRupiahInput } from '../lib/format'

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest'

export function History() {
  const state = useAppState()
  const { openEdit, handleDelete } = useAppHandlers()

  const [search,       setSearch]       = useState('')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [sortKey,      setSortKey]      = useState<SortKey>('newest')
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [minAmount,    setMinAmount]    = useState('')
  const [maxAmount,    setMaxAmount]    = useState('')

  const pendingId  = state.pendingDelete?.expense.id
  const categoryMap = useMemo(() => new Map(state.categories.map(c => [c.id, c])), [state.categories])

  const filtered = useMemo(() => {
    let list = state.expenses.filter(e => e.id !== pendingId)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e => e.note.toLowerCase().includes(q))
    }
    if (selectedCats.size > 0) {
      list = list.filter(e => selectedCats.has(e.categoryId))
    }
    const min = minAmount ? parseRupiahInput(minAmount) : 0
    const max = maxAmount ? parseRupiahInput(maxAmount) : Infinity
    if (min > 0 || max < Infinity) {
      list = list.filter(e => e.amount >= min && e.amount <= max)
    }

    switch (sortKey) {
      case 'newest':  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      case 'oldest':  return [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
      case 'highest': return [...list].sort((a, b) => b.amount - a.amount)
      case 'lowest':  return [...list].sort((a, b) => a.amount - b.amount)
    }
  }, [state.expenses, pendingId, search, selectedCats, sortKey, minAmount, maxAmount])

  const toggleCat = (id: string) => {
    const next = new Set(selectedCats)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedCats(next)
  }

  const clearFilters = () => {
    setSelectedCats(new Set())
    setMinAmount('')
    setMaxAmount('')
    setSearch('')
  }

  const hasFilters = search || selectedCats.size > 0 || minAmount || maxAmount

  return (
    <div className="page-shell flex flex-col min-h-full">
      <h1 className="page-title mb-5">Riwayat</h1>

      {/* Search + filter bar */}
      <div className="space-y-2 sticky top-[62px] md:top-0 z-10 py-2 bg-[#f4f8ff] dark:bg-[#080808]">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ba0bb]" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari dari catatan..."
              className="field-control pl-10 pr-3 py-3 text-sm"
            />
          </div>
          <button
            onClick={() => setFilterOpen(v => !v)}
            aria-label="Buka filter"
            className={`w-11 rounded-xl border text-sm font-medium transition-colors ${
              filterOpen || hasFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-[#111111] border-blue-100 dark:border-[#303030] text-[#6680a4] dark:text-neutral-300'
            }`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {filterOpen && (
          <div className="surface-card p-4 space-y-4">
            {/* Sort */}
            <div>
              <p className="text-xs font-bold text-[#6680a4] dark:text-neutral-400 mb-2">Urutkan</p>
              <div className="flex flex-wrap gap-1.5">
                {(['newest','oldest','highest','lowest'] as SortKey[]).map(k => (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                      sortKey === k
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-blue-100 dark:border-[#303030] text-[#6680a4] dark:text-neutral-400 hover:bg-blue-50 dark:hover:bg-[#1c1c1c]'
                    }`}
                  >
                    {{ newest: 'Terbaru', oldest: 'Terlama', highest: 'Terbesar', lowest: 'Terkecil' }[k]}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-xs font-bold text-[#6680a4] dark:text-neutral-400 mb-2">Kategori</p>
              <div className="flex flex-wrap gap-1.5">
                {state.categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleCat(c.id)}
                    className={`px-2.5 py-1.5 text-xs rounded-xl border transition-colors ${
                      selectedCats.has(c.id)
                        ? 'text-white border-transparent'
                        : 'border-blue-100 dark:border-[#303030] text-[#6680a4] dark:text-neutral-400 hover:bg-blue-50 dark:hover:bg-[#1c1c1c]'
                    }`}
                    style={selectedCats.has(c.id) ? { backgroundColor: c.color } : {}}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount range */}
            <div>
              <p className="text-xs font-bold text-[#6680a4] dark:text-neutral-400 mb-2">Rentang nominal</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  placeholder="Minimum"
                  className="field-control flex-1 min-w-0 px-3 py-2.5 text-xs"
                />
                <span className="text-[#9bafca] text-xs">–</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  placeholder="Maksimum"
                  className="field-control flex-1 min-w-0 px-3 py-2.5 text-xs"
                />
              </div>
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-neutral-300 hover:text-blue-800 dark:hover:text-white">
                <X size={12} /> Hapus semua filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expense list */}
      <div className="flex-1 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <p className="text-xs font-bold text-[#6680a4] dark:text-neutral-400">{filtered.length} catatan ditemukan</p>
          {hasFilters && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-[#1c1c1c] dark:text-neutral-300 px-2 py-1 rounded-full">Filter aktif</span>}
        </div>
        {filtered.length === 0 ? (
          <div className="surface-card text-center py-12 px-6">
            <div className="w-12 h-12 mx-auto grid place-items-center rounded-[18px] bg-blue-50 dark:bg-[#1c1c1c] text-blue-500 dark:text-neutral-400"><Search size={20} /></div>
            <p className="text-sm font-bold text-[#294b76] dark:text-neutral-200 mt-3">{hasFilters ? 'Tidak ada hasil' : 'Belum ada pengeluaran'}</p>
            {hasFilters && <p className="text-xs text-[#7890ae] dark:text-neutral-500 mt-1">Ubah kata kunci atau filter.</p>}
          </div>
        ) : (
          <div className="surface-card divide-y divide-blue-50 dark:divide-[#242424] overflow-hidden">
            {filtered.map(e => (
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
    </div>
  )
}
