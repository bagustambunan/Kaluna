import { useState, useRef } from 'react'
import { Trash2, Plus, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppState, useAppDispatch } from '../context/AppContext'
import { Button } from '../components/ui/Button'
import { formatRupiahInput, parseRupiahInput, formatRupiah } from '../lib/format'
import { exportData } from '../lib/exportImport'
import { validateImport, mergeData } from '../lib/exportImport'
import { EMOJI_OPTIONS, COLOR_OPTIONS } from '../constants/defaults'
import type { Category } from '../types'
import { useNotification } from '../hooks/useNotification'

type Section = 'preferences' | 'budget' | 'categories' | 'shortcuts' | 'notifications' | 'data' | 'about'

export function Settings() {
  const state    = useAppState()
  const dispatch = useAppDispatch()
  const { requestPermission } = useNotification()
  const [openSection,    setOpenSection]    = useState<Section | null>('preferences')
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<{
    data: ReturnType<typeof validateImport>['data']
    preview: ReturnType<typeof validateImport>['preview']
  } | null>(null)
  const [importError,   setImportError]   = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [newCatName,    setNewCatName]    = useState('')
  const [newCatEmoji,   setNewCatEmoji]   = useState('📦')
  const [newCatColor,   setNewCatColor]   = useState('#78716C')
  const [editingCat,    setEditingCat]    = useState<Category | null>(null)
  const [weeklyBudget,  setWeeklyBudget]  = useState(state.budgets.weekly  ? formatRupiahInput(String(state.budgets.weekly))  : '')
  const [monthlyBudget, setMonthlyBudget] = useState(state.budgets.monthly ? formatRupiahInput(String(state.budgets.monthly)) : '')

  const toggle = (s: Section) => setOpenSection(v => v === s ? null : s)
  const usedCategoryIds = new Set(state.expenses.map(e => e.categoryId))

  const handleRequestPermission = async () => {
    const p = await requestPermission()
    setNotifPermission(p)
  }

  const handleExport = () => exportData(state)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const raw  = JSON.parse(text) as unknown
      const result = validateImport(raw)
      setImportPreview(result)
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid file format')
      setImportPreview(null)
    }
    e.target.value = ''
  }

  const doImportReplace = () => {
    if (!importPreview) return
    dispatch({ type: 'REPLACE_ALL', payload: importPreview.data })
    setImportPreview(null)
  }

  const doImportMerge = () => {
    if (!importPreview) return
    const merged = mergeData({
      expenses: state.expenses, categories: state.categories,
      budgets: state.budgets, shortcuts: state.shortcuts, settings: state.settings,
    }, importPreview.data)
    dispatch({ type: 'REPLACE_ALL', payload: merged })
    setImportPreview(null)
  }

  const handleDeleteAll = () => {
    if (deleteConfirm !== 'DELETE') return
    dispatch({ type: 'REPLACE_ALL', payload: {
      expenses: [], categories: state.categories,
      budgets: { weekly: null, monthly: null, alertThresholdPct: 75 },
      shortcuts: [], settings: state.settings,
    }})
    setDeleteConfirm('')
  }

  const addCategory = () => {
    if (!newCatName.trim()) return
    const cat: Category = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      emoji: newCatEmoji,
      color: newCatColor,
      budgetMonthly: null,
      isDefault: false,
      order: state.categories.length,
    }
    dispatch({ type: 'ADD_CATEGORY', payload: cat })
    setNewCatName('')
  }

  const saveBudgets = () => {
    dispatch({ type: 'UPDATE_BUDGETS', payload: {
      weekly:  weeklyBudget  ? parseRupiahInput(weeklyBudget)  : null,
      monthly: monthlyBudget ? parseRupiahInput(monthlyBudget) : null,
    }})
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100'

  return (
    <div className="px-4 pt-5 pb-4 space-y-2">
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">Settings</h1>

      {/* Preferences */}
      <SectionCard title="Preferences" open={openSection === 'preferences'} onToggle={() => toggle('preferences')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Start of week</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">Affects weekly summaries and budget calculations</p>
            </div>
            <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
              {(['monday','sunday'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { weekStartDay: v } })}
                  className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                    state.settings.weekStartDay === v
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Budget */}
      <SectionCard title="Budget" open={openSection === 'budget'} onToggle={() => toggle('budget')}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Weekly budget</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 text-sm">Rp</span>
              <input type="text" inputMode="numeric" value={weeklyBudget}
                onChange={e => setWeeklyBudget(formatRupiahInput(e.target.value))}
                placeholder="Not set"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Monthly budget</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 text-sm">Rp</span>
              <input type="text" inputMode="numeric" value={monthlyBudget}
                onChange={e => setMonthlyBudget(formatRupiahInput(e.target.value))}
                placeholder="Not set"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Alert threshold</label>
            <div className="flex gap-2">
              {[50, 75, 90].map(v => (
                <button key={v}
                  onClick={() => dispatch({ type: 'UPDATE_BUDGETS', payload: { alertThresholdPct: v } })}
                  className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                    state.budgets.alertThresholdPct === v
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>
          <Button onClick={saveBudgets} className="w-full">Save Budget</Button>
        </div>
      </SectionCard>

      {/* Categories */}
      <SectionCard title="Categories" open={openSection === 'categories'} onToggle={() => toggle('categories')}>
        <div className="space-y-3">
          {state.categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="text-lg">{cat.emoji}</span>
              {editingCat?.id === cat.id ? (
                <input
                  value={editingCat.name}
                  onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                  onBlur={() => {
                    if (editingCat.name.trim()) dispatch({ type: 'UPDATE_CATEGORY', payload: editingCat })
                    setEditingCat(null)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (editingCat.name.trim()) dispatch({ type: 'UPDATE_CATEGORY', payload: editingCat })
                      setEditingCat(null)
                    }
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 text-sm border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-100"
                />
              ) : (
                <button onClick={() => setEditingCat(cat)} className="flex-1 text-left text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100">
                  {cat.name}
                </button>
              )}
              {cat.isDefault ? (
                <span className="text-xs text-stone-400 dark:text-stone-500">Default</span>
              ) : usedCategoryIds.has(cat.id) ? (
                <span className="text-xs text-stone-400 dark:text-stone-500">In use</span>
              ) : (
                <button
                  onClick={() => dispatch({ type: 'DELETE_CATEGORY', payload: cat.id })}
                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          <div className="border-t border-stone-100 dark:border-stone-800 pt-3 space-y-2">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Add category</p>
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name"
              className={inputCls}
            />
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Emoji</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setNewCatEmoji(e)}
                    className={`text-lg p-1 rounded ${newCatEmoji === e ? 'ring-2 ring-stone-900 dark:ring-stone-100' : ''}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => setNewCatColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${newCatColor === c ? 'border-stone-900 dark:border-stone-100' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={addCategory} size="sm">
              <Plus size={14} /> Add
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Shortcuts */}
      <SectionCard title="Shortcuts" open={openSection === 'shortcuts'} onToggle={() => toggle('shortcuts')}>
        {state.shortcuts.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500">No shortcuts yet. Save a transaction as a shortcut from the expense form.</p>
        ) : (
          <div className="space-y-2">
            {state.shortcuts
              .slice()
              .sort((a, b) => a.order - b.order)
              .map(sc => {
                const cat = state.categories.find(c => c.id === sc.categoryId)
                return (
                  <div key={sc.id} className="flex items-center gap-2">
                    <GripVertical size={16} className="text-stone-300 dark:text-stone-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 dark:text-stone-300 truncate">{sc.label}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">{formatRupiah(sc.amount)} · {cat?.name}</p>
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'DELETE_SHORTCUT', payload: sc.id })}
                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
          </div>
        )}
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" open={openSection === 'notifications'} onToggle={() => toggle('notifications')}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-700 dark:text-stone-300">Permission status</span>
            <span className={`font-medium ${
              notifPermission === 'granted' ? 'text-green-600 dark:text-green-400'
              : notifPermission === 'denied' ? 'text-red-600 dark:text-red-400'
              : 'text-stone-500 dark:text-stone-400'
            }`}>
              {notifPermission === 'granted' ? 'Granted' : notifPermission === 'denied' ? 'Denied' : 'Not asked'}
            </span>
          </div>
          {notifPermission !== 'granted' && (
            <Button onClick={handleRequestPermission} variant="secondary" size="sm">Request permission</Button>
          )}
          <p className="text-xs text-stone-400 dark:text-stone-500">Budget alert notifications are sent when you reach 75%, 100%, or exceed your budget.</p>
        </div>
      </SectionCard>

      {/* Data */}
      <SectionCard title="Data" open={openSection === 'data'} onToggle={() => toggle('data')}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Export data</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">Download all your data as a JSON file.</p>
            <Button onClick={handleExport} variant="secondary" size="sm">Export .json</Button>
          </div>

          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Import data</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">Upload a previously exported JSON file.</p>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            <Button onClick={() => fileRef.current?.click()} variant="secondary" size="sm">Select file</Button>

            {importError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{importError}</p>}

            {importPreview && (
              <div className="mt-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Expenses</span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">{importPreview.preview.count}</span>
                  </div>
                  {importPreview.preview.dateRange && (
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-stone-400">Date range</span>
                      <span className="font-medium text-stone-900 dark:text-stone-100 text-xs">{importPreview.preview.dateRange.start} – {importPreview.preview.dateRange.end}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Total</span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">{formatRupiah(importPreview.preview.total)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={doImportMerge}   size="sm" className="flex-1">Merge</Button>
                  <Button onClick={doImportReplace} variant="danger" size="sm" className="flex-1">Replace all</Button>
                </div>
                <button onClick={() => setImportPreview(null)} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">Cancel</button>
              </div>
            )}
          </div>

          <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Delete all data</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">This will permanently delete all expenses. Type DELETE to confirm.</p>
            <div className="flex gap-2">
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <Button onClick={handleDeleteAll} variant="danger" size="sm" disabled={deleteConfirm !== 'DELETE'}>Delete</Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard title="About" open={openSection === 'about'} onToggle={() => toggle('about')}>
        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
          <div className="flex justify-between">
            <span>App</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">Kaluna</span>
          </div>
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">1.0.0</span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 pt-1 border-t border-stone-100 dark:border-stone-800">
            Daily expense tracker. All data is stored on your device. Nothing is sent to any server.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}

function SectionCard({ title, open, onToggle, children }: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800">
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">{title}</span>
        {open ? <ChevronUp size={16} className="text-stone-400 dark:text-stone-500" /> : <ChevronDown size={16} className="text-stone-400 dark:text-stone-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-800">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  )
}
