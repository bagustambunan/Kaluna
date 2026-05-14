# Kaluna — Aplikasi Pencatat Pengeluaran Harian

## Ringkasan

Kaluna adalah aplikasi web pencatat pengeluaran harian yang berjalan sepenuhnya di browser tanpa server backend. Dirancang mobile-first, dapat diinstal ke home screen, dan bekerja secara offline. Semua data disimpan di local storage perangkat pengguna.

---

## Tujuan Produk

Membantu pengguna mencatat pengeluaran harian, memantau rekapitulasi, dan menjaga disiplin anggaran — tanpa perlu login, tanpa koneksi internet, dan tanpa data yang dikirim ke mana pun.

---

## Batasan & Keputusan Teknis

| Aspek | Keputusan |
|---|---|
| Arsitektur | Client-only, tidak ada server/backend |
| Database | Browser `localStorage` (dienkode JSON) |
| Auth | Tidak ada login, tidak ada akun |
| Offline | Harus berfungsi penuh tanpa internet (PWA) |
| Platform | Web, mobile-first; kompatibel iOS Safari, Android Chrome, dan semua browser modern |
| Deploy | Vercel / Netlify (static hosting) |
| **Bahasa UI** | **English** — seluruh teks antarmuka, label, pesan, dan navigasi menggunakan bahasa Inggris |

---

## Tech Stack

- **Framework**: React + Vite
- **State management**: React Context + useReducer (atau Zustand jika state tumbuh kompleks)
- **Storage**: `localStorage` dengan wrapper abstraksi sederhana
- **PWA**: `vite-plugin-pwa` — service worker + web app manifest
- **Notifikasi**: Notification API (browser-native, bukan server push)
- **Styling**: Tailwind CSS
- **Export/Import**: File API browser (JSON)
- **Routing**: React Router v6

---

## Fitur

### 1. Tambah Pengeluaran

- Form input: nominal, kategori, catatan (opsional), tanggal (default hari ini)
- Input nominal angka saja — titik pemisah ribuan muncul otomatis saat mengetik
- Bisa edit dan hapus setiap entri dari mana saja (Home, History, Summary)
- Konfirmasi hapus: inline confirm (bukan dialog modal), diikuti snackbar **Undo** selama 5 detik
- Data tersimpan ke `localStorage` secara instan saat Save ditekan

### 2. Kategori Pengeluaran

- Kategori default saat pertama buka: Food, Transport, Shopping, Entertainment, Health, Bills, Other
- Pengguna bisa tambah, ubah nama, dan hapus kategori custom
- Setiap kategori memiliki emoji dan warna yang bisa dipilih
- Kategori yang sudah dipakai di minimal satu transaksi tidak bisa dihapus — tampilkan info singkat kenapa

### 3. Rekap Mingguan

- Rentang default: Monday s.d. Sunday (bisa diubah via pengaturan **Start of Week**)
- Total pengeluaran minggu berjalan
- Bar chart sederhana per hari
- Navigasi mundur/maju antar minggu (tombol `‹ ›` atau swipe horizontal)
- Perbandingan total vs minggu sebelumnya ditampilkan jika data tersedia

### 4. Rekap Bulanan

- Total pengeluaran bulan berjalan (tanggal 1 s.d. akhir bulan)
- Rincian per minggu dalam bulan
- Distribusi per kategori (horizontal bar atau donut — tanpa library chart besar)
- Navigasi mundur/maju antar bulan

### 5. Rekap per Kategori

- Rentang waktu: this week / this month / custom
- Total per kategori, diurutkan dari terbesar
- Persentase masing-masing terhadap total keseluruhan
- Tap kategori → expand daftar transaksi dalam kategori tersebut

### 6. Rekap Rentang Tanggal Custom

- Tersedia di semua tampilan Summary (Weekly, Monthly, By Category) via tombol filter
- Date picker pilih **start date** dan **end date**
- Preset cepat: Last 7 days, Last 30 days, Last month, This year
- Hasil menampilkan: total, rata-rata harian, breakdown per kategori, dan daftar transaksi
- Range yang dipilih bersifat sementara (per sesi, tidak disimpan ke localStorage)

### 7. Filter Interaktif di Halaman Summary

Pengguna dapat melakukan analisis "what-if" langsung di tampilan rekap tanpa mengubah data asli:

- **Check/uncheck kategori** — centang atau hapus centang satu atau beberapa kategori; total rekap otomatis terhitung ulang hanya dari kategori yang aktif
- **Check/uncheck item transaksi** — tap kategori untuk expand daftar transaksinya; setiap item bisa di-centang/hapus-centang secara individual
- Total di bagian atas selalu mencerminkan hanya item yang sedang dicentang
- Tombol **Reset** untuk kembali ke kondisi semua dicentang
- Pilihan ini bersifat sementara — tidak disimpan, reset saat pindah tab atau ganti periode

*Contoh penggunaan: pengguna ingin melihat total mingguan tanpa menghitung pengeluaran tidak rutin seperti servis motor atau beli baju.*

### 8. Riwayat & Cari Transaksi

- Daftar semua transaksi, diurutkan terbaru di atas
- **Search** berdasarkan teks catatan
- **Filter** berdasarkan: kategori (multi-select), rentang nominal, rentang tanggal
- **Sort**: newest, oldest, highest amount, lowest amount
- Scroll tanpa pagination (virtual list jika data besar)
- Swipe kiri pada item untuk aksi cepat: Edit | Delete

### 9. Quick Entry (Shortcuts)

- Pengguna bisa simpan transaksi yang sering diulang sebagai shortcut
- Contoh: "Office lunch — Rp 25,000 — Food"
- Di form tambah pengeluaran, bagian shortcuts tampil di atas keyboard — tap untuk isi form otomatis
- Shortcuts bisa dibuat dari transaksi yang sudah ada (tap transaksi → "Save as shortcut")
- Maksimal 10 shortcuts; bisa diurutkan ulang (drag) di halaman Settings

### 10. Statistik Ringkas

Tersedia di halaman Summary sebagai baris ringkasan di bagian atas, dihitung dari data lokal:

- Average daily spending this month
- Highest spending day this week
- Top category this month
- Difference vs last month (up/down by percentage)

### 11. Budget Mingguan & Bulanan

- Set weekly dan/atau monthly budget — keduanya opsional dan independen
- Progress bar: hijau → kuning (>75%) → merah (>100%)
- Sisa budget dan persentase terpakai ditampilkan secara eksplisit (bukan hanya bar)
- Budget bisa diubah kapan saja dari halaman Settings

### 12. Budget per Kategori *(opsional, bisa diaktifkan per kategori)*

- Setiap kategori bisa diberi monthly limit sendiri
- Ditampilkan sebagai indikator kecil di samping nama kategori saat rekap
- Kategori tanpa budget tidak menampilkan indikator apa pun

### 13. Alert Mendekati / Melewati Budget

Notifikasi dikirim ketika pengeluaran (weekly atau monthly) mencapai threshold:

| Threshold | Tindakan |
|---|---|
| 75% budget | Warning notification |
| 100% budget | Limit reached notification |
| > 100% budget | Over budget notification |

- Menggunakan **Notification API** browser — tidak ada server, dipicu lokal saat transaksi disimpan
- Izin notifikasi diminta saat pengguna pertama kali mengaktifkan budget
- Jika izin ditolak atau browser tidak mendukung, alert tetap muncul sebagai in-app banner di bagian atas
- Notifikasi tidak dikirim berulang untuk threshold yang sama dalam periode yang sama

### 14. Export / Import Data

- **Export**: unduh seluruh data (transaksi + kategori + budget + shortcuts + settings) sebagai file `.json`
- **Import**: unggah file `.json` untuk restore data
- Sebelum import, tampilkan preview: jumlah transaksi, rentang tanggal, total nominal
- Dua mode import:
  - **Replace all** — data lama diganti seluruhnya
  - **Merge** — data digabung, transaksi duplikat diabaikan (berdasarkan ID)

### 15. Instalasi ke Home Screen (PWA)

- Web App Manifest dengan `display: standalone`
- Service worker cache aset utama agar app bisa dibuka offline
- In-app banner "Add to Home Screen" untuk Android (menggunakan `beforeinstallprompt`)
- Panduan langkah manual untuk iOS: Share → Add to Home Screen
- Ikon: 192×192, 512×512, maskable
- Splash screen mengikuti warna tema aplikasi

---

## Halaman Settings

Settings dikelompokkan dalam satu halaman, dibagi per bagian:

### Preferences
- **Start of week** — pilih Monday atau Sunday; memengaruhi semua tampilan weekly summary dan perhitungan weekly budget

### Budget
- Set weekly dan monthly budget
- Set budget per kategori (opsional)
- Alert threshold (default 75%, bisa diubah ke 50% atau 90%)

### Categories
- Daftar semua kategori (default + custom)
- Add, rename, delete, reorder

### Shortcuts
- Daftar shortcuts Quick Entry
- Add, delete, reorder (drag)

### Notifications
- Toggle on/off budget notifications
- Tombol "Request permission" jika belum diberikan
- Status izin saat ini (granted / denied / not asked)

### Data
- **Export data** — unduh `.json`
- **Import data** — unggah `.json` dengan preview sebelum konfirmasi
- **Delete all data** — reset ke kondisi awal; konfirmasi dengan mengetik "DELETE"

### About
- App name dan versi
- Deskripsi singkat aplikasi
- Privacy info: "All data is stored on your device. Nothing is sent to any server."
- Lisensi (jika open source)

---

## Struktur Navigasi

```
Bottom Navigation (mobile) / Sidebar kiri (desktop)
├── Home           → Ringkasan hari ini, progress budget, pintasan cepat
├── History        → Semua transaksi + search, filter, sort
├── [ + ]          → FAB — buka form tambah pengeluaran
├── Summary        → Tab: Weekly | Monthly | By Category | Custom
└── Settings       → Preferences, budget, categories, shortcuts, data, about
```

---

## Alur Pengguna Utama

### Pertama Kali Buka

1. Pengguna buka URL di browser
2. Aplikasi load instan — tidak ada splash screen atau loading yang menghalangi konten
3. Home tampil kosong dengan satu baris teks: "Tap + to record your first expense"
4. Banner tipis di bawah: "Add to home screen for quick access" — bisa di-dismiss permanen

### Mencatat Pengeluaran

1. Tap FAB `+`
2. Masukkan nominal → pilih kategori → isi catatan (opsional) → tap **Save**
3. Snackbar "Saved" muncul 2 detik; Home langsung terupdate

### Pakai Quick Entry

1. Tap FAB `+`
2. Tap salah satu shortcut yang muncul di atas form
3. Form terisi otomatis — ubah nominal jika perlu → **Save**

### Analisis dengan Filter Summary

1. Buka tab Summary → pilih periode
2. Tap ikon filter di pojok kanan
3. Uncheck kategori atau item tertentu untuk mengecualikannya dari total
4. Total di header berubah real-time
5. Tap "Reset" untuk kembali ke tampilan penuh

### Melihat Rekap Custom

1. Buka tab Summary → tap "Custom"
2. Pilih start date dan end date (atau gunakan preset)
3. Data tampil langsung

### Mengatur Budget

1. Buka Settings → Budget
2. Isi nominal weekly dan/atau monthly budget → **Save**
3. Izin notifikasi diminta jika belum diberikan
4. Progress bar di Home langsung aktif

---

## Desain & UX

### Prinsip

- **Kecepatan**: aksi paling sering (tambah pengeluaran) selesai dalam ≤ 3 tap
- **Clarity over cleverness**: label teks selalu ada, tidak ada ikon ambigu tanpa label
- **Satu tangan**: semua aksi utama bisa dilakukan tanpa menggeser pegangan
- **Feedback instan**: setiap aksi (save, delete, import) memberikan respons visual langsung
- **Zero dead ends**: setiap halaman kosong punya teks panduan dan satu CTA yang jelas

### Layout

- **Mobile**: bottom navigation 4 tab + FAB di tengah
- **Desktop**: layout 2-kolom (max-width 900px, centered), navigasi di kiri sebagai sidebar
- Angka nominal menggunakan ukuran besar dan tebal — mudah dibaca sekilas
- List item transaksi padat tapi tidak sesak: baris pertama nominal + kategori, baris kedua tanggal + catatan

### Warna & Tema

- Mode terang sebagai default, warna netral mendominasi
- Satu warna aksen utama, bukan gradien
- Merah hanya untuk over-budget dan aksi destruktif (delete)
- Kuning/oranye untuk peringatan mendekati budget
- Hijau untuk konfirmasi dan status aman

### Hal yang Dihindari

- Animasi berlebihan atau skeleton loader yang tidak perlu
- Jargon keuangan yang tidak umum
- Onboarding wizard multi-langkah
- Iklan, upsell, atau nag screen
- Modal konfirmasi penuh untuk aksi yang mudah di-undo

---

## Anti-AI UI — Panduan Wajib untuk Implementasi

UI **tidak boleh** terlihat seperti hasil generate AI. UI yang terasa generik menurunkan kepercayaan pengguna. Patuhi panduan ini selama implementasi.

### Yang DILARANG

- **Gradien sebagai dekorasi** — terutama gradien biru-ungu atau teal-hijau di header/hero/card
- **Kartu dengan shadow tebal dan border-radius besar (>16px)** tanpa alasan fungsional
- **Ilustrasi SVG dekoratif** — bergaya flat-art, isometrik, atau undraw.co
- **Emoji di judul halaman, tombol, atau label form** sebagai dekorasi
- **Lebih dari 2 warna aksen** dalam satu layar
- **Variasi ukuran font terlalu banyak** — maksimal 2 ukuran yang berbeda per halaman
- **Tombol dengan teks panjang + ikon** seperti `✨ Add New Expense`
- **Section header + subtitle panjang** di bawahnya — pola ini terlalu umum di output AI
- **Progress bar atau counter yang animasi sendiri** saat halaman dibuka tanpa trigger dari pengguna
- **Placeholder teks yang terlalu ramah**: "Hey! You don't have any expenses yet 😊" — cukup tulis "No expenses yet"

### Yang HARUS DILAKUKAN

- **Densitas yang masuk akal** — whitespace untuk keterbacaan, bukan whitespace untuk kesan "modern"
- **Setiap warna punya fungsi** — status (merah/kuning/hijau), kategori (warna pilihan user), atau aksi, bukan dekorasi
- **Tipografi konsisten** — satu font, satu skala, tebal hanya untuk angka/nominal yang penting
- **Tombol terlihat seperti tombol**, input terlihat seperti input — hindari tombol ghost di mana-mana
- **State kosong fungsional** — teks singkat + satu CTA, tanpa ilustrasi besar
- **Icon yang familier** — pencil untuk edit, trash untuk delete, funnel untuk filter
- **Pesan langsung ke poin** — "Weekly budget exceeded" bukan "Looks like you've gone over your weekly budget!"

---

## Model Data (localStorage)

```js
// Key: "kaluna_expenses"
[
  {
    id: "uuid-v4",
    amount: 25000,           // Rupiah, integer
    categoryId: "cat-001",
    note: "Office lunch",
    date: "2025-05-14"       // ISO date YYYY-MM-DD
  }
]

// Key: "kaluna_categories"
[
  {
    id: "cat-001",
    name: "Food",
    emoji: "🍽️",
    color: "#F97316",
    budgetMonthly: 500000    // null jika tidak diset
  }
]

// Key: "kaluna_budgets"
{
  weekly: 300000,            // null jika tidak diset
  monthly: 1200000,          // null jika tidak diset
  alertThresholdPct: 75      // default 75, bisa 50 atau 90
}

// Key: "kaluna_shortcuts"
[
  {
    id: "sc-001",
    label: "Office lunch",
    amount: 25000,
    categoryId: "cat-001",
    note: "Office lunch",
    order: 0
  }
]

// Key: "kaluna_settings"
{
  weekStartDay: "monday",    // "monday" | "sunday"
  installBannerDismissed: false
}
```

---

## Scope yang TIDAK Termasuk (v1)

- Multi-currency
- Sinkronisasi antar perangkat / cloud sync
- Pencatatan pemasukan (income) — aplikasi ini hanya mencatat pengeluaran
- Export laporan PDF
- Pengeluaran berulang terjadwal otomatis (recurring)
- Dark mode — kandidat v2
- Grafik interaktif (zoom, pan, tooltip hover)
- Attachments / foto struk

---

## Deployment

- Build output: folder `/dist` berisi file statis (HTML, JS, CSS, assets)
- Deploy ke Vercel atau Netlify — drag-drop folder atau connect GitHub repo
- Tidak ada environment variable yang diperlukan
- **HTTPS wajib** di production — diperlukan untuk service worker (PWA) dan Notification API
