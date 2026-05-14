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
- Nominal menggunakan format Rupiah (IDR), input angka saja tanpa titik/koma manual
- Bisa edit dan hapus setiap entri
- Entri tersimpan secara instan ke localStorage

### 2. Kategori Pengeluaran

- Kategori default tersedia saat pertama kali buka (Makan, Transportasi, Belanja, Hiburan, Kesehatan, Tagihan, Lainnya)
- Pengguna bisa menambah, mengubah nama, dan menghapus kategori custom
- Setiap kategori memiliki ikon emoji dan warna yang bisa dipilih

### 3. Rekap Mingguan (Senin – Minggu)

- Tampilkan total pengeluaran minggu berjalan (Senin s.d. Minggu)
- Rincian per hari dalam bentuk bar/list sederhana
- Perbandingan dengan minggu sebelumnya (opsional, tampilkan jika tersedia data)

### 4. Rekap Bulanan (1 – Akhir Bulan)

- Total pengeluaran bulan berjalan
- Rincian per minggu dalam bulan
- Grafik atau visual sederhana distribusi per kategori

### 5. Rekap per Kategori

- Pilih rentang waktu: minggu ini / bulan ini / custom
- Tampilkan total per kategori, diurutkan dari terbesar
- Persentase terhadap total pengeluaran

### 6. Budget Mingguan & Bulanan

- Pengguna bisa set budget mingguan dan/atau budget bulanan
- Tampilan progress bar: hijau → kuning (>75%) → merah (>100%)
- Budget tersimpan di localStorage, bisa diubah kapan saja

### 7. Alert Mendekati / Melewati Budget

- **Push notification** (Web Notification API) dikirim ketika:
  - Pengeluaran mencapai 75% dari budget (mingguan atau bulanan)
  - Pengeluaran mencapai 100% budget (tepat batas)
  - Pengeluaran melewati 100% budget
- Permintaan izin notifikasi ditampilkan saat pertama kali pengguna menyetel budget
- Notifikasi juga muncul sebagai in-app toast banner jika pengguna sedang membuka aplikasi
- Tidak ada server push — notifikasi dipicu secara lokal saat pengguna menambahkan pengeluaran

### 8. Export / Import Data

- **Export**: unduh seluruh data (pengeluaran + kategori + budget) sebagai file `.json`
- **Import**: unggah file `.json` yang sebelumnya diekspor untuk restore data
- Import menampilkan preview ringkasan sebelum data ditimpa
- Import bisa memilih: **timpa semua** atau **gabungkan** (merge, hindari duplikasi berdasarkan ID + tanggal)

### 9. Instalasi ke Home Screen (PWA)

- Web App Manifest dengan `display: standalone`
- Service worker untuk caching aset sehingga app bisa dibuka offline
- Tombol "Tambahkan ke Home Screen" muncul (in-app banner, bukan hanya prompt browser default) untuk Android dan panduan manual untuk iOS
- Splash screen dan ikon yang sesuai (192×192, 512×512, maskable)

---

## Struktur Navigasi

```
Bottom Navigation (mobile) / Sidebar kecil (desktop)
├── Beranda        → Ringkasan hari ini + shortcut tambah
├── Catat          → Form tambah pengeluaran
├── Rekap          → Tab: Mingguan | Bulanan | Kategori
├── Anggaran       → Set budget + progress
└── Pengaturan     → Kategori, export/import, notifikasi
```

---

## Alur Pengguna Utama

### Pertama Kali Buka

1. Pengguna buka URL di browser
2. Aplikasi load instan (tidak ada loading screen panjang)
3. Halaman Beranda tampil dengan state kosong dan panduan singkat "Catat pengeluaran pertama kamu"
4. Banner muncul: "Tambahkan ke home screen untuk akses lebih cepat"

### Mencatat Pengeluaran

1. Tap tombol `+` di mana pun (FAB atau bottom nav tab Catat)
2. Masukkan nominal → pilih kategori → isi catatan (opsional) → tap Simpan
3. Kembali ke halaman sebelumnya, entri langsung muncul di list hari ini

### Melihat Rekap

1. Buka tab Rekap
2. Pilih tab Mingguan / Bulanan / Kategori
3. Data langsung tampil tanpa loading

### Mengatur Budget

1. Buka tab Anggaran
2. Set nominal budget mingguan dan/atau bulanan
3. Izin notifikasi diminta jika belum diberikan
4. Progress bar langsung terupdate berdasarkan data yang ada

---

## Desain & UX

### Prinsip

- **Kecepatan interaksi**: aksi paling sering (tambah pengeluaran) harus bisa dilakukan dalam ≤ 3 tap
- **Clarity over cleverness**: label jelas, tidak ada ikon ambigu tanpa label
- **Satu tangan**: semua elemen interaktif di area jangkauan ibu jari (bawah layar)
- **Feedback instan**: setiap aksi (simpan, hapus, import) memberikan respons visual langsung

### Layout

- Mobile: bottom navigation 5 tab + FAB `+` di tengah
- Desktop: layout 2-kolom, navigasi di kiri, konten di kanan (max-width 900px, centered)
- Tipografi bersih, ukuran angka besar untuk nominal agar mudah dibaca

### Warna & Tema

- Mode terang sebagai default
- Palet netral dengan aksen satu warna utama (tidak terlalu banyak warna)
- Merah hanya untuk kondisi over-budget / hapus
- Kuning/oranye untuk warning mendekati budget

### Hal yang Dihindari

- Animasi berlebihan atau loading spinner yang tidak perlu
- Jargon keuangan yang rumit
- Onboarding panjang / wizard multi-langkah
- Iklan, upsell, atau nag screen apapun

---

## Model Data (localStorage)

```js
// Key: "kaluna_expenses"
[
  {
    id: "uuid-v4",
    amount: 25000,          // dalam Rupiah, integer
    categoryId: "cat-001",
    note: "Makan siang",
    date: "2025-05-14"      // ISO date string YYYY-MM-DD
  }
]

// Key: "kaluna_categories"
[
  {
    id: "cat-001",
    name: "Makan",
    emoji: "🍽️",
    color: "#F97316"
  }
]

// Key: "kaluna_budgets"
{
  weekly: 300000,   // null jika belum diset
  monthly: 1200000  // null jika belum diset
}
```

---

## Scope yang TIDAK Termasuk (v1)

- Multi-currency
- Sinkronisasi antar perangkat / cloud sync
- Pemasukan (income tracking) — hanya pengeluaran
- Laporan PDF
- Recurring / jadwal pengeluaran otomatis
- Dark mode (bisa ditambahkan di v2)

---

## Deployment

- Build output: folder `/dist` berisi file statis (HTML, JS, CSS, assets)
- Deploy ke Vercel atau Netlify via drag-drop folder atau connect GitHub repo
- Tidak ada environment variable yang diperlukan
- Service worker harus aktif di production (HTTPS required untuk PWA & Notification API)
