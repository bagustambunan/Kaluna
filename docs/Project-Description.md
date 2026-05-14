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
- Bisa edit dan hapus setiap entri dari mana saja (Beranda, Riwayat, Rekap)
- Konfirmasi hapus: inline confirm (bukan dialog modal), diikuti snackbar **Batalkan** selama 5 detik
- Data tersimpan ke `localStorage` secara instan saat Simpan ditekan

### 2. Kategori Pengeluaran

- Kategori default saat pertama buka: Makan, Transportasi, Belanja, Hiburan, Kesehatan, Tagihan, Lainnya
- Pengguna bisa tambah, ubah nama, dan hapus kategori custom
- Setiap kategori memiliki emoji dan warna yang bisa dipilih
- Kategori yang sudah dipakai di minimal satu transaksi tidak bisa dihapus — tampilkan info singkat kenapa

### 3. Rekap Mingguan

- Rentang default: Senin s.d. Minggu (bisa diubah via pengaturan **Awal Minggu**)
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

- Rentang waktu: minggu ini / bulan ini / custom
- Total per kategori, diurutkan dari terbesar
- Persentase masing-masing terhadap total keseluruhan
- Tap kategori → expand daftar transaksi dalam kategori tersebut

### 6. Rekap Rentang Tanggal Custom

- Tersedia di semua tampilan Rekap (Mingguan, Bulanan, Kategori) via tombol filter
- Date picker pilih **tanggal mulai** dan **tanggal selesai**
- Preset cepat: 7 hari terakhir, 30 hari terakhir, bulan lalu, tahun ini
- Hasil menampilkan: total, rata-rata harian, breakdown per kategori, dan daftar transaksi
- Range yang dipilih bersifat sementara (per sesi, tidak disimpan ke localStorage)

### 7. Filter Interaktif di Halaman Rekap

Pengguna dapat melakukan analisis "what-if" langsung di tampilan rekap tanpa mengubah data asli:

- **Check/uncheck kategori** — centang atau hapus centang satu atau beberapa kategori; total rekap otomatis terhitung ulang hanya dari kategori yang aktif
- **Check/uncheck item transaksi** — tap kategori untuk expand daftar transaksinya; setiap item bisa di-centang/hapus-centang secara individual
- Total di bagian atas selalu mencerminkan hanya item yang sedang dicentang
- Tombol **Reset pilihan** untuk kembali ke kondisi semua dicentang
- Pilihan ini bersifat sementara — tidak disimpan, reset saat pindah tab atau ganti periode

*Contoh penggunaan: pengguna ingin melihat total mingguan tanpa menghitung pengeluaran tidak rutin seperti servis motor atau beli baju.*

### 8. Riwayat & Cari Transaksi

- Daftar semua transaksi, diurutkan terbaru di atas
- **Cari** berdasarkan teks catatan
- **Filter** berdasarkan: kategori (multi-select), rentang nominal, rentang tanggal
- **Urutkan**: terbaru, terlama, nominal terbesar, nominal terkecil
- Scroll tanpa pagination (virtual list jika data besar)
- Swipe kiri pada item untuk aksi cepat: Edit | Hapus

### 9. Quick Entry (Pintasan)

- Pengguna bisa simpan transaksi yang sering diulang sebagai pintasan
- Contoh: "Makan siang kantor — Rp 25.000 — Makan"
- Di form tambah pengeluaran, bagian pintasan tampil di atas keyboard — tap untuk isi form otomatis
- Pintasan bisa dibuat dari transaksi yang sudah ada (tap transaksi → "Simpan sebagai pintasan")
- Maksimal 10 pintasan; bisa diurutkan ulang (drag) di halaman Pengaturan

### 10. Statistik Ringkas

Tersedia di halaman Rekap sebagai baris ringkasan di bagian atas, dihitung dari data lokal:

- Rata-rata pengeluaran harian bulan ini
- Hari dengan pengeluaran tertinggi minggu ini
- Kategori terboros bulan ini
- Selisih total vs bulan lalu (naik/turun berapa persen)

### 11. Budget Mingguan & Bulanan

- Set budget mingguan dan/atau bulanan — keduanya opsional dan independen
- Progress bar: hijau → kuning (>75%) → merah (>100%)
- Sisa budget dan persentase terpakai ditampilkan secara eksplisit (bukan hanya bar)
- Budget bisa diubah kapan saja dari halaman Pengaturan

### 12. Budget per Kategori *(opsional, bisa diaktifkan per kategori)*

- Setiap kategori bisa diberi batas bulanan sendiri
- Ditampilkan sebagai indikator kecil di samping nama kategori saat rekap
- Kategori tanpa budget tidak menampilkan indikator apa pun

### 13. Alert Mendekati / Melewati Budget

Notifikasi dikirim ketika pengeluaran (mingguan atau bulanan) mencapai threshold:

| Threshold | Tindakan |
|---|---|
| 75% budget | Notifikasi peringatan |
| 100% budget | Notifikasi tepat batas |
| > 100% budget | Notifikasi over-budget |

- Menggunakan **Notification API** browser — tidak ada server, dipicu lokal saat transaksi disimpan
- Izin notifikasi diminta saat pengguna pertama kali mengaktifkan budget
- Jika izin ditolak atau browser tidak mendukung, alert tetap muncul sebagai in-app banner di bagian atas
- Notifikasi tidak dikirim berulang untuk threshold yang sama dalam periode yang sama

### 14. Export / Import Data

- **Export**: unduh seluruh data (transaksi + kategori + budget + pintasan + pengaturan) sebagai file `.json`
- **Import**: unggah file `.json` untuk restore data
- Sebelum import, tampilkan preview: jumlah transaksi, rentang tanggal, total nominal
- Dua mode import:
  - **Timpa semua** — data lama diganti seluruhnya
  - **Gabungkan** — data digabung, transaksi duplikat diabaikan (berdasarkan ID)

### 15. Instalasi ke Home Screen (PWA)

- Web App Manifest dengan `display: standalone`
- Service worker cache aset utama agar app bisa dibuka offline
- In-app banner "Tambahkan ke Home Screen" untuk Android (menggunakan `beforeinstallprompt`)
- Panduan langkah manual untuk iOS: Share → Tambahkan ke Layar Utama
- Ikon: 192×192, 512×512, maskable
- Splash screen mengikuti warna tema aplikasi

---

## Halaman Pengaturan

Pengaturan dikelompokkan dalam satu halaman, dibagi per bagian:

### Preferensi
- **Awal minggu** — pilih Senin atau Minggu; memengaruhi semua tampilan rekap mingguan dan perhitungan budget mingguan

### Anggaran
- Set budget mingguan dan bulanan
- Set budget per kategori (opsional)
- Pengaturan threshold notifikasi (default 75%, bisa diubah ke 50% atau 90%)

### Kategori
- Daftar semua kategori (default + custom)
- Tambah, ubah, hapus, ubah urutan tampilan

### Pintasan
- Daftar pintasan Quick Entry
- Tambah, hapus, ubah urutan (drag)

### Notifikasi
- Toggle aktif/nonaktif notifikasi budget
- Tombol "Minta izin notifikasi" jika belum diberikan
- Info status izin saat ini (diberikan / ditolak / belum diminta)

### Data
- **Export data** — unduh `.json`
- **Import data** — unggah `.json` dengan preview sebelum konfirmasi
- **Hapus semua data** — reset ke kondisi awal; memerlukan konfirmasi teks (ketik "HAPUS" untuk lanjut)

### Tentang Aplikasi
- Nama dan versi aplikasi
- Kalimat singkat deskripsi aplikasi
- Informasi privasi: "Semua data tersimpan di perangkat kamu. Tidak ada yang dikirim ke server."
- Lisensi (jika open source)

---

## Struktur Navigasi

```
Bottom Navigation (mobile) / Sidebar kiri (desktop)
├── Beranda        → Ringkasan hari ini, progress budget, pintasan cepat
├── Riwayat        → Semua transaksi + cari, filter, urutkan
├── [ + ]          → FAB — buka form tambah pengeluaran
├── Rekap          → Tab: Mingguan | Bulanan | Kategori | Custom
└── Pengaturan     → Preferensi, anggaran, kategori, pintasan, data, tentang
```

---

## Alur Pengguna Utama

### Pertama Kali Buka

1. Pengguna buka URL di browser
2. Aplikasi load instan — tidak ada splash screen atau loading yang menghalangi konten
3. Beranda tampil kosong dengan satu baris teks: "Tap + untuk catat pengeluaran pertama"
4. Banner tipis di bawah: "Tambahkan ke home screen untuk akses lebih cepat" — bisa di-dismiss permanen

### Mencatat Pengeluaran

1. Tap FAB `+`
2. Masukkan nominal → pilih kategori → isi catatan (opsional) → tap Simpan
3. Snackbar "Tersimpan" muncul 2 detik; Beranda langsung terupdate

### Pakai Quick Entry

1. Tap FAB `+`
2. Tap salah satu pintasan yang muncul di atas form
3. Form terisi otomatis — ubah nominal jika perlu → Simpan

### Analisis dengan Filter Rekap

1. Buka tab Rekap → pilih periode
2. Tap ikon filter di pojok kanan
3. Uncheck kategori atau item tertentu untuk mengecualikannya dari total
4. Total di header berubah real-time
5. Tap "Reset" untuk kembali ke tampilan penuh

### Melihat Rekap Custom

1. Buka tab Rekap → tap "Custom"
2. Pilih tanggal mulai dan selesai (atau gunakan preset)
3. Data tampil langsung

### Mengatur Budget

1. Buka Pengaturan → Anggaran
2. Isi nominal budget mingguan dan/atau bulanan → Simpan
3. Izin notifikasi diminta jika belum diberikan
4. Progress bar di Beranda langsung aktif

---

## Desain & UX

### Prinsip

- **Kecepatan**: aksi paling sering (tambah pengeluaran) selesai dalam ≤ 3 tap
- **Clarity over cleverness**: label teks selalu ada, tidak ada ikon ambigu tanpa label
- **Satu tangan**: semua aksi utama bisa dilakukan tanpa menggeser pegangan
- **Feedback instan**: setiap aksi (simpan, hapus, import) memberikan respons visual langsung
- **Zero dead ends**: setiap halaman kosong punya teks panduan dan satu CTA yang jelas

### Layout

- **Mobile**: bottom navigation 4 tab + FAB di tengah
- **Desktop**: layout 2-kolom (max-width 900px, centered), navigasi di kiri sebagai sidebar
- Angka nominal menggunakan ukuran besar dan tebal — mudah dibaca sekilas
- List item transaksi padat tapi tidak sesak: baris pertama nominal + kategori, baris kedua tanggal + catatan

### Warna & Tema

- Mode terang sebagai default, warna netral mendominasi
- Satu warna aksen utama, bukan gradien
- Merah hanya untuk over-budget dan aksi destruktif (hapus)
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
- **Tombol dengan teks panjang + ikon** seperti `✨ Tambah Pengeluaran Baru`
- **Section header + subtitle panjang** di bawahnya — pola ini terlalu umum di output AI
- **Progress bar atau counter yang animasi sendiri** saat halaman dibuka tanpa trigger dari pengguna
- **Placeholder teks yang terlalu ramah**: "Hei! Belum ada pengeluaran nih 😊" — cukup tulis "Belum ada pengeluaran"

### Yang HARUS DILAKUKAN

- **Densitas yang masuk akal** — whitespace untuk keterbacaan, bukan whitespace untuk kesan "modern"
- **Setiap warna punya fungsi** — status (merah/kuning/hijau), kategori (warna pilihan user), atau aksi, bukan dekorasi
- **Tipografi konsisten** — satu font, satu skala, tebal hanya untuk angka/nominal yang penting
- **Tombol terlihat seperti tombol**, input terlihat seperti input — hindari tombol ghost di mana-mana
- **State kosong fungsional** — teks singkat + satu CTA, tanpa ilustrasi besar
- **Icon yang familier** — pensil untuk edit, tempat sampah untuk hapus, corong untuk filter
- **Pesan langsung ke poin** — "Budget mingguan terlewati" bukan "Wah, sepertinya kamu sudah melewati batas budget minggu ini!"

---

## Model Data (localStorage)

```js
// Key: "kaluna_expenses"
[
  {
    id: "uuid-v4",
    amount: 25000,           // Rupiah, integer
    categoryId: "cat-001",
    note: "Makan siang",
    date: "2025-05-14"       // ISO date YYYY-MM-DD
  }
]

// Key: "kaluna_categories"
[
  {
    id: "cat-001",
    name: "Makan",
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
    label: "Makan siang kantor",
    amount: 25000,
    categoryId: "cat-001",
    note: "Makan siang",
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
