# Kaluna — Aplikasi Pencatat Pengeluaran Harian

## Ringkasan

Kaluna adalah aplikasi web pencatat pengeluaran harian yang berjalan sepenuhnya di browser tanpa server backend. Dirancang mobile-first, dapat diinstal ke home screen, dan bekerja secara offline. Semua data disimpan di local storage perangkat pengguna.

---

## Tujuan Produk

Membantu pengguna mencatat pengeluaran harian, memantau rekapitulasi mingguan dan bulanan, serta menjaga disiplin anggaran lewat peringatan budget secara real-time — tanpa perlu login atau koneksi internet.

---

## Batasan & Keputusan Teknis

| Aspek | Keputusan |
|---|---|
| Arsitektur | Client-only, tidak ada server/backend |
| Database | Browser localStorage (dienkode JSON) |
| Auth | Tidak ada login, tidak ada akun |
| Offline | Harus berfungsi penuh tanpa internet (PWA) |
| Platform | Web, mobile-first; kompatibel iOS Safari, Android Chrome, dan semua browser modern |
| Deploy | Vercel / Netlify (static hosting) |

---

## Tech Stack

- **Framework**: React (Vite sebagai build tool)
- **State management**: React Context + useReducer (atau Zustand jika state kompleks)
- **Storage**: localStorage dengan wrapper abstraksi sederhana
- **PWA**: Vite PWA Plugin (`vite-plugin-pwa`) — service worker + manifest
- **Notifikasi**: Web Push API (Notification API browser-native)
- **Styling**: Tailwind CSS
- **Export/Import**: JSON native (File API browser)
- **Routing**: React Router v6

---

## Fitur

### 1. Tambah Pengeluaran

- Form input: nominal, kategori, catatan (opsional), tanggal (default hari ini)
- Nominal menggunakan format Rupiah (IDR), input angka saja — titik pemisah ribuan ditambahkan otomatis
- Bisa edit dan hapus setiap entri
- Entri tersimpan secara instan ke localStorage
- Tombol hapus meminta konfirmasi singkat (bukan dialog penuh — cukup inline confirm)
- Setelah hapus ada opsi **Batalkan** selama 5 detik (undo snackbar)

### 2. Kategori Pengeluaran

- Kategori default tersedia saat pertama kali buka: Makan, Transportasi, Belanja, Hiburan, Kesehatan, Tagihan, Lainnya
- Pengguna bisa menambah, mengubah nama, dan menghapus kategori custom
- Setiap kategori memiliki ikon emoji dan warna yang bisa dipilih
- Kategori yang sudah dipakai tidak bisa dihapus (tampilkan pesan informatif)

### 3. Rekap Mingguan (Senin – Minggu)

- Total pengeluaran minggu berjalan (Senin s.d. Minggu)
- Rincian per hari dalam bentuk bar chart sederhana
- Navigasi mundur/maju antar minggu (swipe atau tombol `‹ ›`)
- Perbandingan dengan minggu sebelumnya ditampilkan jika data tersedia

### 4. Rekap Bulanan (1 – Akhir Bulan)

- Total pengeluaran bulan berjalan
- Rincian per minggu dalam bulan
- Distribusi per kategori (donut chart atau horizontal bar, tidak perlu library besar)
- Navigasi mundur/maju antar bulan

### 5. Rekap per Kategori

- Pilih rentang waktu: minggu ini / bulan ini / custom (lihat fitur 6)
- Tampilkan total per kategori, diurutkan dari terbesar
- Persentase terhadap total pengeluaran
- Tap kategori untuk melihat daftar transaksi dalam kategori tersebut

### 6. Rekap Rentang Tanggal Custom

- Tersedia di semua tampilan rekap (Mingguan, Bulanan, Kategori) via tombol filter
- Pengguna pilih **tanggal mulai** dan **tanggal selesai** lewat date picker
- Hasil menampilkan: total, rata-rata per hari, breakdown per kategori, dan daftar transaksi
- Preset cepat tersedia: 7 hari terakhir, 30 hari terakhir, bulan lalu, tahun ini
- Range yang dipilih tersimpan sementara (per sesi, tidak permanen)

### 7. Riwayat & Cari Transaksi

- Halaman daftar semua transaksi, diurutkan terbaru di atas
- **Cari** berdasarkan teks catatan
- **Filter** berdasarkan: kategori (multi-select), rentang nominal, rentang tanggal
- **Urutkan**: terbaru, terlama, nominal terbesar, nominal terkecil
- Scroll tanpa pagination (virtual list jika data besar)
- Swipe kiri pada item untuk aksi cepat: Edit | Hapus

### 8. Quick Entry (Pintasan)

- Pengguna bisa menyimpan transaksi yang sering diulang sebagai **pintasan**
- Contoh: "Makan siang kantor — Rp 25.000 — Makan"
- Di form tambah pengeluaran, ada bagian "Pintasan" yang bisa di-tap untuk mengisi form otomatis
- Pintasan bisa dibuat dari transaksi yang sudah ada (tap & simpan sebagai pintasan)
- Maksimal 10 pintasan

### 9. Statistik Ringkas

Tersedia di halaman Rekap sebagai kartu ringkasan di bagian atas:

- Rata-rata pengeluaran harian bulan ini
- Hari dengan pengeluaran tertinggi minggu ini
- Kategori terboros bulan ini
- Selisih total pengeluaran vs bulan lalu (naik/turun berapa persen)

Data ini dihitung dari localStorage, tidak ada API eksternal.

### 10. Budget Mingguan & Bulanan

- Set budget mingguan dan/atau bulanan (keduanya opsional dan independen)
- Tampilan progress bar: hijau → kuning (>75%) → merah (>100%)
- Sisa budget dan persentase terpakai ditampilkan secara eksplisit
- Budget tersimpan di localStorage, bisa diubah kapan saja

### 11. Budget per Kategori *(opsional, bisa diaktifkan per kategori)*

- Setiap kategori bisa diberi batas pengeluaran bulanan sendiri
- Ditampilkan sebagai indikator kecil di samping nama kategori saat rekap
- Tidak wajib diisi — kategori tanpa budget tidak menampilkan indikator

### 12. Alert Mendekati / Melewati Budget

- **Push notification** (Web Notification API) dikirim ketika:
  - Pengeluaran mencapai 75% budget (mingguan atau bulanan)
  - Pengeluaran mencapai 100% budget
  - Pengeluaran melewati 100% budget
- Permintaan izin notifikasi ditampilkan saat pengguna pertama kali menyetel budget
- Jika pengguna menolak izin, alert tetap muncul sebagai in-app banner
- Tidak ada server push — notifikasi dipicu lokal saat pengguna menyimpan transaksi

### 13. Export / Import Data

- **Export**: unduh seluruh data (transaksi + kategori + budget + pintasan) sebagai `.json`
- **Import**: unggah file `.json` untuk restore data
- Import menampilkan preview ringkasan (jumlah transaksi, rentang tanggal, total nominal) sebelum data ditimpa
- Dua mode import: **Timpa semua** atau **Gabungkan** (merge, hindari duplikasi berdasarkan ID)

### 14. Instalasi ke Home Screen (PWA)

- Web App Manifest dengan `display: standalone`
- Service worker untuk caching aset agar app bisa dibuka offline
- In-app banner "Tambahkan ke Home Screen" untuk Android
- Panduan langkah-langkah manual untuk iOS (Share → Add to Home Screen)
- Ikon: 192×192, 512×512, maskable
- Splash screen sesuai warna tema aplikasi

---

## Struktur Navigasi

```
Bottom Navigation (mobile) / Sidebar kecil (desktop)
├── Beranda        → Ringkasan hari ini, progress budget, shortcut tambah
├── Riwayat        → Daftar semua transaksi + cari & filter
├── [+ FAB]        → Form tambah pengeluaran (tengah bottom nav)
├── Rekap          → Tab: Mingguan | Bulanan | Kategori | Custom
└── Pengaturan     → Budget, kategori, pintasan, export/import, notifikasi
```

---

## Alur Pengguna Utama

### Pertama Kali Buka

1. Pengguna buka URL di browser
2. Aplikasi load instan (tidak ada splash screen atau loading yang menghalangi)
3. Halaman Beranda tampil dengan state kosong dan satu baris teks panduan: "Tap + untuk catat pengeluaran pertama"
4. Banner tipis muncul di bawah: "Tambahkan ke home screen untuk akses lebih cepat" — bisa di-dismiss

### Mencatat Pengeluaran

1. Tap FAB `+`
2. Masukkan nominal → pilih kategori → isi catatan (opsional) → tap Simpan
3. Form tertutup, snackbar "Tersimpan" muncul 2 detik
4. Beranda langsung terupdate

### Pakai Quick Entry

1. Tap FAB `+`
2. Tap salah satu pintasan di bagian atas form
3. Form terisi otomatis — tinggal konfirmasi atau ubah nominal jika perlu → Simpan

### Melihat Rekap Custom

1. Buka tab Rekap
2. Tap ikon filter / pilih "Custom"
3. Pilih tanggal mulai dan selesai
4. Data langsung tampil

### Mengatur Budget

1. Buka Pengaturan → Budget
2. Isi nominal budget mingguan dan/atau bulanan → Simpan
3. Izin notifikasi diminta jika belum diberikan
4. Kembali ke Beranda: progress bar budget sudah aktif

---

## Desain & UX

### Prinsip

- **Kecepatan**: aksi paling sering (tambah pengeluaran) selesai dalam ≤ 3 tap
- **Clarity over cleverness**: label teks selalu ada, tidak ada ikon ambigu yang berdiri sendiri
- **Satu tangan**: semua aksi utama bisa dilakukan tanpa menggeser pegangan
- **Feedback instan**: setiap aksi (simpan, hapus, import) memberikan respons visual langsung
- **Zero dead ends**: setiap halaman kosong punya teks panduan dan CTA yang jelas

### Layout

- Mobile: bottom navigation 5 tab + FAB di tengah
- Desktop: layout 2-kolom (max-width 900px, centered), navigasi di kiri
- Ukuran angka nominal besar dan tebal agar mudah dibaca sekilas
- List item transaksi padat tapi tidak sesak — satu baris untuk nominal + kategori, satu baris untuk tanggal + catatan

### Warna & Tema

- Mode terang sebagai default, warna netral dominan
- Satu warna aksen utama (bukan gradien)
- Merah hanya untuk kondisi over-budget dan aksi hapus
- Kuning/oranye untuk peringatan mendekati budget
- Hijau untuk konfirmasi sukses

### Hal yang Dihindari

- Animasi berlebihan atau skeleton loader yang tidak perlu
- Jargon keuangan yang tidak familiar
- Onboarding wizard multi-langkah
- Iklan, upsell, atau nag screen apapun
- Modal konfirmasi untuk aksi yang mudah di-undo

---

## Anti-AI UI — Panduan Wajib untuk Implementasi

Antarmuka **tidak boleh** terlihat seperti hasil generate AI. Ini bukan soal estetika saja — UI yang terasa generik menurunkan kepercayaan pengguna. Patuhi panduan berikut selama implementasi:

### Yang DILARANG

- **Gradien di mana-mana** — khususnya gradien biru-ungu atau teal-hijau sebagai latar header/hero
- **Kartu dengan shadow tebal dan radius besar (>16px)** tanpa alasan — terlihat seperti template Figma
- **Ilustrasi SVG humanoid/isometrik** — terutama yang bergaya flat-art atau undraw.co
- **Emoji sebagai dekorasi** di judul halaman, tombol, atau label form
- **Terlalu banyak warna** — lebih dari 2 warna aksen membuat tampilan terasa auto-generated
- **Tipografi yang terlalu bervariasi** — tidak lebih dari 2 ukuran font dalam satu halaman
- **Tombol dengan icon + teks panjang** seperti `✨ Tambah Pengeluaran Baru` — berlebihan
- **Section header dengan subtitle kalimat panjang** di bawahnya — pattern ini terlalu umum di AI output
- **Progress bar animasi otomatis** yang berjalan saat halaman buka tanpa alasan fungsional
- **Placeholder teks yang terlalu "friendly"** seperti "Hei! Belum ada pengeluaran nih 😊"

### Yang HARUS DILAKUKAN

- **Densitas yang masuk akal** — jangan terlalu banyak whitespace kosong hanya agar terlihat "modern"
- **Warna yang dipilih dengan alasan** — setiap warna harus ada fungsi (status, kategori, aksi), bukan dekorasi
- **Tipografi konsisten** — satu font, satu skala ukuran, berat tebal hanya untuk angka/nominal penting
- **Interaksi yang jelas** — tombol terlihat seperti tombol, input terlihat seperti input
- **State kosong yang fungsional** — bukan ilustrasi besar, cukup teks pendek + satu tombol CTA
- **Icon yang familier** — gunakan icon yang sudah dikenal pengguna mobile (pensil untuk edit, tempat sampah untuk hapus, filter untuk filter)
- **Pesan error/warning yang langsung ke poin** — "Budget mingguan terlewati" bukan "Wah, sepertinya pengeluaranmu sudah melebihi batas!"

---

## Model Data (localStorage)

```js
// Key: "kaluna_expenses"
[
  {
    id: "uuid-v4",
    amount: 25000,          // Rupiah, integer
    categoryId: "cat-001",
    note: "Makan siang",
    date: "2025-05-14"      // ISO date YYYY-MM-DD
  }
]

// Key: "kaluna_categories"
[
  {
    id: "cat-001",
    name: "Makan",
    emoji: "🍽️",
    color: "#F97316",
    budgetMonthly: 500000   // null jika tidak diset
  }
]

// Key: "kaluna_budgets"
{
  weekly: 300000,           // null jika tidak diset
  monthly: 1200000          // null jika tidak diset
}

// Key: "kaluna_shortcuts"
[
  {
    id: "sc-001",
    label: "Makan siang kantor",
    amount: 25000,
    categoryId: "cat-001",
    note: "Makan siang"
  }
]
```

---

## Scope yang TIDAK Termasuk (v1)

- Multi-currency
- Sinkronisasi antar perangkat / cloud sync
- Pemasukan (income tracking) — hanya pengeluaran
- Laporan PDF
- Recurring / pengeluaran terjadwal otomatis
- Dark mode (kandidat v2)
- Grafik interaktif kompleks (zoom, pan, tooltip hover)

---

## Deployment

- Build output: folder `/dist` berisi file statis (HTML, JS, CSS, assets)
- Deploy ke Vercel atau Netlify via drag-drop atau connect GitHub repo
- Tidak ada environment variable yang diperlukan
- HTTPS wajib di production (diperlukan untuk PWA service worker dan Notification API)
