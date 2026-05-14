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
    <div className="flex flex-col h-full">
      {/* Search + filter bar */}
      <div className="px-4 pt-4 pb-3 space-y-2 bg-stone-50 dark:bg-stone-950 sticky top-0 z-10 md:top-0">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by note..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 text-stone-900 dark:text-stone-100"
            />
          </div>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              filterOpen || hasFilters
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {filterOpen && (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3 space-y-3">
            {/* Sort */}
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">Sort</p>
              <div className="flex flex-wrap gap-1.5">
                {(['newest','oldest','highest','lowest'] as SortKey[]).map(k => (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    className={`px-3 py-1 text-xs rounded-lg capitalize border transition-colors ${
                      sortKey === k
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {state.categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleCat(c.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      selectedCats.has(c.id)
                        ? 'text-white border-transparent'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
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
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">Amount Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  placeholder="Min"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
                <span className="text-stone-400 dark:text-stone-500 text-xs">–</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  placeholder="Max"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              </div>
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expense list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12">
            {hasFilters ? 'No expenses match your search' : 'No expenses yet'}
          </p>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
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
