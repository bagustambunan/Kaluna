# Kaluna — Tech Design

Dokumen ini adalah panduan teknis implementasi untuk Claude Code. Baca bersamaan dengan `Project-Description.md`. Semua keputusan di sini bersifat preskriptif — ikuti kecuali ada alasan kuat untuk menyimpang.

**Bahasa UI**: Seluruh teks antarmuka (label, pesan, placeholder, tombol, navigasi) harus menggunakan **bahasa Inggris**. Ini berlaku untuk semua string yang tampil ke pengguna, termasuk teks default, pesan error, dan notifikasi.

---

## 1. Dependensi

### Produksi

| Package | Versi | Alasan |
|---|---|---|
| `react` + `react-dom` | `^18` | Framework utama |
| `react-router-dom` | `^6` | Client-side routing |
| `date-fns` | `^3` | Kalkulasi tanggal (week range, month range, weekStartDay) |
| `lucide-react` | latest | Icon set — familier, tree-shakeable |
| `tailwindcss` | `^3` | Styling |

### Dev

| Package | Alasan |
|---|---|
| `vite` | Build tool |
| `@vitejs/plugin-react` | React fast refresh |
| `vite-plugin-pwa` | Service worker + manifest otomatis |
| `typescript` | Type safety |
| `@types/react` + `@types/react-dom` | TypeScript types |

### Tidak Digunakan

- **Tidak ada chart library** (recharts, chart.js, dll) — chart dibuat dengan CSS/SVG native. Lihat bagian 13.
- **Tidak ada `uuid` package** — gunakan `crypto.randomUUID()` yang sudah built-in di semua browser modern.
- **Tidak ada form library** — form sederhana, cukup controlled components.
- **Tidak ada date-picker library** — gunakan `<input type="date">` native browser yang sudah cukup baik di mobile.

---

## 2. Struktur Direktori

```
src/
├── components/          # Komponen UI yang bisa dipakai ulang
│   ├── ui/              # Primitif: Button, Input, Snackbar, ProgressBar, Badge
│   └── shared/          # Komponen domain: ExpenseItem, CategoryBadge, BudgetCard
├── pages/               # Komponen level route
│   ├── Home.tsx
│   ├── History.tsx
│   ├── Summary.tsx
│   └── Settings.tsx
├── hooks/               # Custom React hooks
│   ├── useExpenses.ts
│   ├── useBudget.ts
│   ├── useNotification.ts
│   └── useInstallPrompt.ts
├── context/
│   └── AppContext.tsx    # Global state provider
├── lib/
│   ├── storage.ts        # localStorage abstraction
│   ├── date.ts           # Semua kalkulasi tanggal
│   ├── format.ts         # Format Rupiah, persentase
│   ├── budget.ts         # Logika threshold budget
│   └── exportImport.ts   # Serialisasi/deserialisasi JSON
├── constants/
│   └── defaults.ts       # Kategori default, warna, emoji
├── types/
│   └── index.ts          # Semua TypeScript interfaces
└── main.tsx
```

---

## 3. TypeScript Types

Definisikan semua type di `src/types/index.ts`. Seluruh codebase mengimpor dari sini.

```ts
export interface Expense {
  id: string
  amount: number          // Integer, Rupiah
  categoryId: string
  note: string
  date: string            // Format: "YYYY-MM-DD"
}

export interface Category {
  id: string
  name: string
  emoji: string
  color: string           // Hex, contoh: "#F97316"
  budgetMonthly: number | null
  isDefault: boolean      // true = tidak bisa dihapus secara paksa
  order: number
}

export interface Budgets {
  weekly: number | null
  monthly: number | null
  alertThresholdPct: number   // Default: 75
}

export interface Shortcut {
  id: string
  label: string
  amount: number
  categoryId: string
  note: string
  order: number
}

export interface Settings {
  weekStartDay: 'monday' | 'sunday'
  installBannerDismissed: boolean
}

export interface AppData {
  expenses: Expense[]
  categories: Category[]
  budgets: Budgets
  shortcuts: Shortcut[]
  settings: Settings
}

export type WeekStartDay = 'monday' | 'sunday'

export interface DateRange {
  start: string   // "YYYY-MM-DD"
  end: string     // "YYYY-MM-DD"
}

export interface BudgetStatus {
  spent: number
  budget: number
  pct: number
  status: 'safe' | 'warning' | 'over'
}

// Untuk filter interaktif di rekap — state lokal, tidak masuk AppContext
export interface SummaryFilterState {
  excludedCategoryIds: Set<string>
  excludedExpenseIds: Set<string>
}
```

---

## 4. Storage Layer

File: `src/lib/storage.ts`

Semua akses ke `localStorage` harus melalui modul ini. Komponen dan hooks tidak boleh mengakses `localStorage` langsung.

```ts
const KEYS = {
  expenses:  'kaluna_expenses',
  categories:'kaluna_categories',
  budgets:   'kaluna_budgets',
  shortcuts: 'kaluna_shortcuts',
  settings:  'kaluna_settings',
  notifSent: 'kaluna_notif_sent',   // tracking notifikasi yang sudah dikirim
} as const

// Interface yang harus diimplementasi:
// get<T>(key): T | null
// set<T>(key, value): void
// remove(key): void
// clear(): void  — hapus semua key kaluna_*
```

Implementasi menggunakan `try/catch` untuk mengantisipasi kasus `localStorage` penuh atau dinonaktifkan (mode privat di beberapa browser lama).

Saat **pertama kali** app dibuka (key `kaluna_categories` tidak ada), inisialisasi data default:
- Pasang kategori default dari `src/constants/defaults.ts`
- Pasang `settings` dengan nilai default
- Pasang `budgets` dengan semua `null`

---

## 5. State Management

File: `src/context/AppContext.tsx`

Gunakan `React.createContext` + `useReducer`. Satu context untuk seluruh app state.

### Shape State

```ts
interface AppState {
  expenses: Expense[]
  categories: Category[]
  budgets: Budgets
  shortcuts: Shortcut[]
  settings: Settings
  pendingDelete: {
    expense: Expense
    timeoutId: ReturnType<typeof setTimeout>
  } | null
}
```

### Action Types (Reducer)

```ts
type AppAction =
  // Expenses
  | { type: 'ADD_EXPENSE';    payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }        // id
  | { type: 'SOFT_DELETE_EXPENSE'; payload: Expense }  // mulai 5s timer
  | { type: 'UNDO_DELETE' }
  | { type: 'CONFIRM_DELETE' }

  // Categories
  | { type: 'ADD_CATEGORY';    payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }

  // Budgets
  | { type: 'UPDATE_BUDGETS'; payload: Partial<Budgets> }

  // Shortcuts
  | { type: 'ADD_SHORTCUT';    payload: Shortcut }
  | { type: 'DELETE_SHORTCUT'; payload: string }
  | { type: 'REORDER_SHORTCUTS'; payload: Shortcut[] }

  // Settings
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }

  // Init
  | { type: 'LOAD_STATE'; payload: Omit<AppState, 'pendingDelete'> }
```

### Aturan Reducer

- Setiap action yang mengubah data expenses/categories/budgets/shortcuts/settings **langsung memanggil fungsi storage** di dalam reducer atau via `useEffect` yang menonton perubahan state.
- Pendekatan yang direkomendasikan: gunakan `useEffect` terpisah per key yang sync state → localStorage setiap kali state berubah. Ini lebih bersih daripada side effect di dalam reducer.
- State dibaca dari localStorage satu kali saat `AppProvider` mount (`LOAD_STATE`).

---

## 6. Routing

File: `src/main.tsx` dan `src/App.tsx`

```
/           → <Home />
/history    → <History />
/summary    → <Summary />
/settings   → <Settings />
```

Semua route dibungkus dalam `<AppLayout>` yang merender bottom navigation (mobile) atau sidebar (desktop) + area konten.

FAB `+` **tidak membuka route baru** — ia membuka bottom sheet / modal yang overlay di atas halaman aktif. Ini menjaga state halaman sebelumnya tetap hidup dan navigasi tetap mulus.

Form tambah/edit pengeluaran dirender sebagai bottom sheet yang slide up dari bawah layar. Di desktop, bisa menjadi modal centered.

---

## 7. Utilitas Tanggal

File: `src/lib/date.ts`

Semua kalkulasi tanggal menggunakan `date-fns`. Semua tanggal disimpan sebagai string `YYYY-MM-DD`. Konversi ke `Date` object hanya untuk kalkulasi, bukan untuk storage.

### Fungsi yang Harus Ada

```ts
// Ambil range minggu berdasarkan weekStartDay dari settings
getWeekRange(date: Date, weekStartDay: WeekStartDay): DateRange

// Ambil range bulan
getMonthRange(date: Date): DateRange

// Filter expenses berdasarkan range tanggal
filterByRange(expenses: Expense[], range: DateRange): Expense[]

// Group expenses per hari dalam suatu range
groupByDay(expenses: Expense[], range: DateRange): Record<string, Expense[]>

// Group expenses per kategori
groupByCategory(expenses: Expense[]): Record<string, Expense[]>

// Total dari array expenses
sumExpenses(expenses: Expense[]): number

// Format YYYY-MM-DD → Date object (tanpa timezone issue)
parseDate(dateStr: string): Date

// Date object → YYYY-MM-DD
formatDateStr(date: Date): string

// Cek apakah suatu tanggal ada dalam range
isInRange(dateStr: string, range: DateRange): boolean
```

### Catatan Penting: Timezone

Jangan gunakan `new Date("YYYY-MM-DD")` langsung — browser menginterpretasinya sebagai UTC, bukan lokal, yang menyebabkan off-by-one di timezone +7 (WIB). Gunakan parsing manual atau `date-fns/parseISO` yang aman.

### Week Range dengan weekStartDay

```ts
import { startOfWeek, endOfWeek } from 'date-fns'

getWeekRange(date, weekStartDay) {
  const weekStartsOn = weekStartDay === 'sunday' ? 0 : 1
  return {
    start: formatDateStr(startOfWeek(date, { weekStartsOn })),
    end:   formatDateStr(endOfWeek(date,   { weekStartsOn })),
  }
}
```

---

## 8. Format Rupiah

File: `src/lib/format.ts`

```ts
// Display: Rp 25.000
formatRupiah(amount: number): string

// Input handler: "25000" → "25.000" (hanya untuk tampilan di input)
// State tetap menyimpan integer murni
formatRupiahInput(raw: string): string

// Parse input string ke integer: "25.000" → 25000
parseRupiahInput(formatted: string): number
```

Implementasi `formatRupiah` menggunakan `Intl.NumberFormat`:
```ts
new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(amount)
```

Untuk input nominal di form: gunakan controlled input yang menyimpan nilai sebagai `number` di state, dan pada setiap `onChange` strip karakter non-digit lalu format ulang sebagai display value.

---

## 9. Logika Budget & Notifikasi

File: `src/lib/budget.ts` dan `src/hooks/useNotification.ts`

### Menghitung Status Budget

```ts
function getBudgetStatus(spent: number, budget: number | null, thresholdPct: number): BudgetStatus | null {
  if (!budget) return null
  const pct = (spent / budget) * 100
  const status = pct > 100 ? 'over' : pct >= thresholdPct ? 'warning' : 'safe'
  return { spent, budget, pct, status }
}
```

### Kapan Dicek

Setelah setiap `ADD_EXPENSE` atau `UPDATE_EXPENSE`, panggil fungsi cek dari `useNotification`. Jangan cek saat app pertama dibuka — ini menghindari notifikasi berulang yang tidak diinginkan.

### Mencegah Notifikasi Berulang

Simpan riwayat notifikasi yang sudah terkirim di `localStorage` dengan key `kaluna_notif_sent`:

```ts
// Format key: "{period_type}_{threshold}_{period_key}"
// Contoh: "weekly_75_2025-W20", "monthly_100_2025-05"
type NotifKey = string

// Cek sebelum kirim
function wasNotifSent(key: NotifKey): boolean
function markNotifSent(key: NotifKey): void

// Bersihkan notif lama (> 2 bulan) saat app dibuka untuk mencegah storage bloat
function pruneOldNotifKeys(): void
```

Notifikasi dikirim **hanya satu kali per threshold per periode**. Jika budget berubah, reset riwayat periode yang sedang berjalan.

### Teks Notifikasi (English)

```ts
// Warning (75%): "You've used 75% of your weekly budget"
// Limit (100%): "Weekly budget reached"
// Over (>100%): "You're over your weekly budget"
// Same pattern untuk monthly budget
```

### In-App Alert

Jika `Notification.permission !== 'granted'` atau browser tidak support, tampilkan banner di bagian atas halaman manapun. Banner muncul di atas bottom nav, bisa di-dismiss.

---

## 10. Filter Interaktif Summary

State filter bersifat **lokal** (tidak masuk AppContext). Letakkan di komponen `<Summary>` menggunakan `useState`.

```ts
const [filterState, setFilterState] = useState<SummaryFilterState>({
  excludedCategoryIds: new Set(),
  excludedExpenseIds: new Set(),
})
```

Reset `filterState` ke default setiap kali:
- Tab berganti (Weekly/Monthly/By Category/Custom)
- Pengguna navigasi ke periode berbeda (minggu/bulan sebelumnya)

### Logika Penghitungan Total dengan Filter

```ts
function getFilteredTotal(
  expenses: Expense[],
  filter: SummaryFilterState
): number {
  return expenses
    .filter(e => !filter.excludedCategoryIds.has(e.categoryId))
    .filter(e => !filter.excludedExpenseIds.has(e.id))
    .reduce((sum, e) => sum + e.amount, 0)
}
```

### UI Filter

- Tampilkan daftar kategori dengan checkbox di sebelah kiri
- Tap/klik nama kategori → toggle expand/collapse daftar item di bawahnya
- Setiap item dalam expand view juga punya checkbox
- Jika semua item dalam kategori di-uncheck, kategori otomatis tampil sebagai unchecked
- Jika salah satu item di-uncheck tapi tidak semua, kategori tampil sebagai "indeterminate" (garis, bukan centang penuh)
- Total di header terupdate real-time mengikuti pilihan filter
- Tombol "Reset" muncul hanya jika ada item yang sedang di-uncheck

---

## 11. Undo Delete

Alur undo delete menggunakan `pendingDelete` di AppState:

1. User tap delete → dispatch `SOFT_DELETE_EXPENSE`
2. Reducer: simpan expense di `pendingDelete`, **jangan** hapus dari `expenses[]` dulu, set `timeoutId`
3. Snackbar muncul: "Deleted · **Undo**" dengan countdown visual 5 detik
4. Jika user tap Undo → dispatch `UNDO_DELETE` → `pendingDelete` dibersihkan, expense tetap
5. Jika timeout → dispatch `CONFIRM_DELETE` → expense dihapus dari `expenses[]`, `pendingDelete` dibersihkan

Snackbar harus dirender di luar scroll area agar selalu terlihat. Letakkan di `<AppLayout>` di atas bottom navigation.

---

## 12. Swipe Gesture pada List Item

Implementasi **tanpa library**. Gunakan event `touchstart`, `touchmove`, `touchend` pada setiap `<ExpenseItem>`.

```
touchstart  → catat posisi X awal
touchmove   → hitung deltaX; jika > 0 (geser kanan) abaikan; jika < 0 apply transform translateX
touchend    → jika |deltaX| > 60px: tampilkan action buttons (Edit, Delete)
              jika < 60px: snap kembali ke posisi 0
```

Action buttons muncul dari kanan dengan lebar ~120px total. Di balik item yang bergeser ke kiri.

Hanya satu item yang bisa terbuka sekaligus. Jika item lain dibuka, item sebelumnya snap kembali.

Di desktop, tidak ada swipe — tampilkan tombol Edit dan Delete yang muncul saat hover.

---

## 13. Chart tanpa Library

### Bar Chart (pengeluaran per hari)

Gunakan `div` dengan flexbox. Tinggi setiap bar dihitung sebagai persentase terhadap nilai tertinggi dalam rentang.

```tsx
// Tidak perlu SVG, CSS saja sudah cukup
<div className="flex items-end gap-1 h-24">
  {days.map(day => (
    <div
      key={day.date}
      style={{ height: `${(day.total / maxTotal) * 100}%` }}
      className="flex-1 bg-stone-800 rounded-t-sm min-h-[2px]"
    />
  ))}
</div>
```

Jika nilai semua hari adalah 0, tampilkan semua bar dengan tinggi minimum `2px`.

### Horizontal Bar (breakdown kategori)

```tsx
<div className="space-y-2">
  {categories.map(cat => (
    <div key={cat.id}>
      <div className="flex justify-between text-sm mb-1">
        <span>{cat.name}</span>
        <span>{formatRupiah(cat.total)}</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full">
        <div
          style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
          className="h-full rounded-full"
        />
      </div>
    </div>
  ))}
</div>
```

### Donut Chart (opsional, untuk rekap bulanan)

Implementasi menggunakan SVG `<circle>` dengan `stroke-dasharray` dan `stroke-dashoffset`. Satu segmen = satu kategori. Hanya render jika ada data (min. 2 kategori dengan nilai > 0).

Jika implementasi SVG donut terlalu kompleks, **gunakan horizontal bar saja** — fungsionalitas sama, lebih mudah dibaca di mobile.

---

## 14. PWA & Install Banner

### Konfigurasi `vite-plugin-pwa`

File: `vite.config.ts`

```ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icons/*.png'],
  manifest: {
    name: 'Kaluna',
    short_name: 'Kaluna',
    description: 'Daily expense tracker',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [],   // app adalah static, tidak perlu runtime caching API
  },
})
```

### Install Banner Hook

File: `src/hooks/useInstallPrompt.ts`

```ts
// Tangkap event beforeinstallprompt (Android Chrome only)
// Simpan di ref; expose fungsi triggerInstall()
// Kembalikan: { canInstall: boolean, triggerInstall: () => void }
```

Banner ditampilkan di `<AppLayout>` sebagai strip tipis di bawah konten, di atas bottom nav.

Teks banner Android: **"Add to home screen for quick access"** — bisa di-dismiss → panggil `UPDATE_SETTINGS({ installBannerDismissed: true })`.

Teks banner iOS: **"Tap Share then 'Add to Home Screen'"** — tampilkan ikon Share agar lebih jelas.

Deteksi iOS: `navigator.userAgent` mengandung `'iPhone' | 'iPad'` dan tidak ada `beforeinstallprompt`.

---

## 15. Export / Import

File: `src/lib/exportImport.ts`

### Export

```ts
function exportData(state: AppState): void {
  const payload: AppData = {
    expenses: state.expenses,
    categories: state.categories,
    budgets: state.budgets,
    shortcuts: state.shortcuts,
    settings: state.settings,
  }
  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: 'application/json' }
  )
  // Nama file: kaluna-export-YYYY-MM-DD.json
  triggerDownload(blob, `kaluna-export-${formatDateStr(new Date())}.json`)
}
```

### Import — Validasi

Sebelum import, validasi file JSON untuk memastikan struktur sesuai:
- Ada field `expenses` berupa array
- Setiap expense punya `id`, `amount` (number), `categoryId`, `date`
- Jika validasi gagal: tampilkan pesan error spesifik dalam bahasa Inggris, jangan lanjut import
  - Contoh: "Invalid file format", "Missing required fields in expense data"

### Import — Preview

Sebelum konfirmasi, tampilkan:
- Number of expenses in file
- Date range (oldest to newest)
- Total amount

### Import — Mode Gabungkan

```ts
function mergeData(existing: AppData, incoming: AppData): AppData {
  // Expenses: gabung, buang duplikat berdasarkan id
  const expenseIds = new Set(existing.expenses.map(e => e.id))
  const newExpenses = incoming.expenses.filter(e => !expenseIds.has(e.id))

  // Categories: gabung, prioritaskan yang existing jika id sama
  const catIds = new Set(existing.categories.map(c => c.id))
  const newCategories = incoming.categories.filter(c => !catIds.has(c.id))

  return {
    expenses: [...existing.expenses, ...newExpenses],
    categories: [...existing.categories, ...newCategories],
    budgets: existing.budgets,     // budget milik pengguna saat ini dipertahankan
    shortcuts: existing.shortcuts,
    settings: existing.settings,
  }
}
```

---

## 16. Konstanta Default

File: `src/constants/defaults.ts`

```ts
export const DEFAULT_CATEGORIES: Omit<Category, 'order'>[] = [
  { id: 'cat-default-1', name: 'Food',          emoji: '🍽️', color: '#F97316', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-2', name: 'Transport',     emoji: '🚗', color: '#3B82F6', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-3', name: 'Shopping',      emoji: '🛍️', color: '#A855F7', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-4', name: 'Entertainment', emoji: '🎬', color: '#EC4899', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-5', name: 'Health',        emoji: '💊', color: '#10B981', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-6', name: 'Bills',         emoji: '📄', color: '#6B7280', budgetMonthly: null, isDefault: true },
  { id: 'cat-default-7', name: 'Other',         emoji: '📦', color: '#78716C', budgetMonthly: null, isDefault: true },
]

export const DEFAULT_BUDGETS: Budgets = {
  weekly: null,
  monthly: null,
  alertThresholdPct: 75,
}

export const DEFAULT_SETTINGS: Settings = {
  weekStartDay: 'monday',
  installBannerDismissed: false,
}

export const EMOJI_OPTIONS = ['🍽️','🚗','🛍️','🎬','💊','📄','📦','☕','✈️','🏠','🎓','💪','🎮','📱','👗','🐾','🌿']

export const COLOR_OPTIONS = [
  '#F97316','#3B82F6','#A855F7','#EC4899',
  '#10B981','#6B7280','#78716C','#EAB308',
  '#14B8A6','#F43F5E','#8B5CF6','#0EA5E9',
]
```

---

## 17. Komponen UI Utama

### `<ExpenseForm>`

Bottom sheet yang dipakai baik untuk **add** maupun **edit** pengeluaran. Terima prop `initialValues` — jika ada, mode edit; jika tidak, mode tambah.

Field:
1. Amount input (autofocus, keyboard numerik di mobile — gunakan `inputMode="numeric"`)
2. Category grid (emoji + name, scroll horizontal)
3. Note input (optional)
4. Date picker — `<input type="date">` native, default hari ini
5. Tombol **Save**

Bagian shortcuts tampil sebagai scroll horizontal chips di atas field amount. Tap chip → isi semua field otomatis (amount, category, note), pengguna bisa langsung save atau ubah.

Placeholder teks:
- Amount: "0" atau kosong
- Note: "Add a note (optional)"
- Shortcut section label: "Shortcuts" (hanya tampil jika ada shortcut)

### `<ExpenseItem>`

List item untuk menampilkan satu transaksi. Dipakai di Home, History, dan expand view Summary.

Props: `expense`, `category`, `onEdit`, `onDelete`

Layout dua baris:
- Baris 1: emoji kategori + nama kategori · nominal (tebal, besar)
- Baris 2: tanggal · catatan (jika ada, abu-abu, truncate 1 baris)

### `<BudgetProgressBar>`

Props: `status: BudgetStatus`, `label: string`

Label menggunakan bahasa Inggris: "Weekly Budget", "Monthly Budget".

Tampilkan: label, nominal `spent / budget`, persentase, dan progress bar.
Warna bar otomatis sesuai status: `safe` → stone, `warning` → orange, `over` → red.

Sub-label teks:
- safe: "{pct}% used · {remaining} left"
- warning: "{pct}% used · {remaining} left" (warna oranye)
- over: "Over by {overage}" (warna merah)

### `<Snackbar>`

Global snackbar untuk feedback aksi. Render di `<AppLayout>`, posisi fixed bottom di atas bottom nav.

Teks snackbar (semua dalam bahasa Inggris):
- Simpan berhasil: "Saved"
- Hapus dengan undo: "Deleted · **Undo**"
- Import berhasil: "Data imported"
- Import gagal: "Import failed: {reason}"

Auto-dismiss: 2 detik (snackbar biasa), 5 detik (undo delete).

### Empty States

Semua teks empty state dalam bahasa Inggris:
- Home tanpa data: "Tap + to record your first expense"
- History tanpa hasil search: "No expenses match your search"
- History tanpa data sama sekali: "No expenses yet"
- Summary tanpa data: "No expenses in this period"

---

## 18. Responsivitas

Gunakan Tailwind breakpoint `md` (≥768px) sebagai threshold mobile/desktop.

- Di bawah `md`: bottom navigation, FAB di tengah
- Ab `md` ke atas: sidebar kiri (lebar tetap ~200px), konten di kanan, FAB tidak ada (tombol di sidebar)

Bottom sheet untuk form di mobile → modal centered di desktop (max-width 480px).

Jangan membuat dua versi komponen terpisah — satu komponen dengan conditional class berdasarkan breakpoint.

---

## 19. Performa

- **Virtual list**: tidak diperlukan untuk v1. `localStorage` memiliki batas ~5MB; asumsi rata-rata expense 100 bytes, itu ~50.000 entri. Scroll reguler di browser modern mampu menangani ini.
- **Memoization**: gunakan `useMemo` untuk kalkulasi summary yang berat (group by category, sum per period) agar tidak dihitung ulang setiap render. Jangan over-optimize — hanya di tempat yang nyata-nyata mahal.
- **Bundle size**: target `< 200KB` gzip. Dengan React (~40KB), date-fns tree-shaken (~15KB), lucide-react tree-shaken, dan Tailwind CSS — ini tercapai. Jangan tambahkan dependency besar tanpa pertimbangan.
- **First paint**: tidak ada API call, tidak ada loading state. App harus tampil dalam < 1 detik di koneksi 4G biasa.

---

## 20. Hal yang Harus Dihindari saat Implementasi

- **Jangan buat `useEffect` yang berlebihan** untuk sync state → storage. Cukup satu `useEffect` per storage key yang watch slice state yang relevan.
- **Jangan simpan `Date` object** di state atau localStorage — selalu string `YYYY-MM-DD`.
- **Jangan gunakan `any`** di TypeScript. Jika terpaksa, tulis komentar kenapa.
- **Jangan buat abstraksi sebelum diperlukan** — tiga komponen yang mirip tidak perlu di-generalisasi kecuali ada kebutuhan nyata.
- **Jangan tambahkan animasi CSS** kecuali: slide-up bottom sheet, snackbar fade in/out, dan swipe gesture. Sisanya static.
- **Jangan polyfill hal yang sudah native** — `crypto.randomUUID`, `Intl.NumberFormat`, `fetch`, `localStorage` semua tersedia di target browser.
- **Jangan gunakan teks Indonesia** di dalam UI — semua string yang tampil ke pengguna harus bahasa Inggris tanpa pengecualian.
