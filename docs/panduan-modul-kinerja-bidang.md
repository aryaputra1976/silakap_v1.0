# Panduan Penggunaan Modul Kinerja Bidang

**Sistem:** Silakap V1.0  
**Modul:** Kinerja Bidang — SOP & RHK Bidang PPIK  
**Versi Dokumen:** 1.0.0  
**Tanggal:** 17 Mei 2026

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Konsep Dasar](#2-konsep-dasar)
3. [Hak Akses Berdasarkan Role](#3-hak-akses-berdasarkan-role)
4. [Persiapan Awal — Inisialisasi Data](#4-persiapan-awal--inisialisasi-data)
5. [Navigasi Modul](#5-navigasi-modul)
6. [Dashboard RHK](#6-dashboard-rhk)
7. [Peta SOP Bidang](#7-peta-sop-bidang)
8. [Daftar SOP](#8-daftar-sop)
9. [Detail SOP](#9-detail-sop)
10. [Monitoring Realisasi](#10-monitoring-realisasi)
11. [Realisasi SOP/RHK](#11-realisasi-soprhk)
    - 11.1 [Membuat Realisasi Baru](#111-membuat-realisasi-baru)
    - 11.2 [Mengelola Bukti Dukung DMS](#112-mengelola-bukti-dukung-dms)
    - 11.3 [Submit Realisasi](#113-submit-realisasi)
    - 11.4 [Review Realisasi](#114-review-realisasi)
    - 11.5 [Approve Realisasi](#115-approve-realisasi)
    - 11.6 [Minta Revisi](#116-minta-revisi)
    - 11.7 [Revisi dan Submit Ulang](#117-revisi-dan-submit-ulang)
12. [Laporan Kinerja Bidang](#12-laporan-kinerja-bidang)
13. [Alur Kerja Lengkap](#13-alur-kerja-lengkap)
14. [Status Risiko RHK](#14-status-risiko-rhk)
15. [Referensi SOP Bidang PPIK](#15-referensi-sop-bidang-ppik)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Gambaran Umum

Modul **Kinerja Bidang** adalah sistem pengendalian kinerja berbasis SOP (Standar Operasional Prosedur) dan RHK (Rencana Hasil Kerja) untuk Bidang PPIK (Pengadaan, Pemberhentian, Informasi, dan Kepegawaian) di lingkungan BKPSDM.

Modul ini mencakup seluruh siklus kinerja:

```
Inisialisasi Data → Pantau Target → Input Realisasi → Submit → Review → Approve → Laporan
```

**Fungsi utama:**

| Fungsi | Deskripsi |
|---|---|
| Master SOP | 20 paket SOP dalam 3 tahap, terhubung ke 8 RHK utama |
| Target Tahunan | Target kuantitas dan kualitas per SOP per tahun |
| Realisasi | Pencatatan capaian kegiatan per bulan/triwulan/tahunan |
| Bukti Dukung | Tautan dokumen DMS sebagai bukti pelaksanaan kegiatan |
| Workflow Review | Alur Draft → Submit → Review → Approve dengan notifikasi status |
| Laporan | Draft laporan kinerja otomatis dengan narasi eksekutif |

---

## 2. Konsep Dasar

### 2.1 Tahapan SOP

SOP Bidang PPIK dikelompokkan dalam 3 tahap:

| Tahap | Nama | Isi |
|---|---|---|
| **Tahap 1** | SOP Manajemen Bidang | Perencanaan, pembagian tugas, monitoring, pelaporan, dan pengelolaan arsip bidang |
| **Tahap 2** | SOP Pengelolaan Layanan Kepegawaian | Penerimaan permohonan, verifikasi berkas, monitoring SLA, penanganan keterlambatan, evaluasi kepuasan |
| **Tahap 3** | SOP Fungsi Spesifik Bidang | Pengadaan ASN, pemberhentian, lembaga profesi, sistem informasi, pengelolaan data, DMS, layanan informasi |

### 2.2 RHK (Rencana Hasil Kerja)

Bidang PPIK memiliki **8 RHK utama** yang menjadi dasar pengukuran kinerja:

| Kode | Bidang Fungsi |
|---|---|
| RHK 1 | Pengadaan ASN (Perencanaan, Formasi, Pelaksanaan) |
| RHK 2 | Evaluasi dan Pelaporan Kinerja Bidang |
| RHK 3 | Pemberhentian dan Pensiun ASN |
| RHK 4 | Fasilitasi Lembaga Profesi ASN |
| RHK 5 | Pengelolaan Sistem Informasi Kepegawaian |
| RHK 6 | Pengendalian Data ASN |
| RHK 7 | Pengelolaan DMS dan Data Kepegawaian |
| RHK 8 | Layanan Informasi Kepegawaian dan SLA |

### 2.3 SOP Utama vs SOP Pendukung

- **SOP Utama RHK** (`isRhkPrimary = true`): SOP yang langsung menghasilkan output yang diukur sebagai capaian RHK. Ada **8 SOP utama**, satu per RHK.
- **SOP Pendukung**: SOP yang mendukung pelaksanaan kegiatan secara operasional namun bukan output langsung RHK.

### 2.4 Realisasi SOP

Setiap realisasi mencatat satu episode pelaksanaan SOP dalam satu periode (bulanan, triwulan, atau tahunan), meliputi:
- Kuantitas output yang dihasilkan
- Kualitas dalam persentase
- Status waktu (tepat waktu / terlambat)
- Deskripsi, kendala, tindak lanjut
- Bukti dukung dari DMS

### 2.5 Bukti Dukung DMS

Bukti dukung adalah dokumen yang diunggah ke sistem **DMS (Document Management System)** dan dikaitkan ke realisasi. Contoh: Laporan bulanan, Surat Keputusan, Berita Acara, Notulensi, dll.

Syarat minimum untuk **Approve**: realisasi harus memiliki setidaknya **1 bukti dukung DMS**.

---

## 3. Hak Akses Berdasarkan Role

| Aksi | SUPER_ADMIN | ADMIN | KEPALA_BADAN | SEKRETARIS | KABID | STAFF |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat Dashboard, SOP, Monitoring, Laporan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Input / Edit Realisasi (Draft) | ✅ | ✅ | — | — | ✅ | ✅ |
| Submit Realisasi | ✅ | ✅ | — | — | ✅ | ✅ |
| Tambah / Lepas Bukti Dukung | ✅ | ✅ | — | — | ✅ | ✅ |
| Review Realisasi | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Approve Realisasi | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Minta Revisi | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Seed Data Awal (Inisialisasi) | ✅ | ✅ | — | — | ✅ | — |

> **Catatan:** Role diambil otomatis dari token JWT atau localStorage. Badge "Role: ..." ditampilkan di halaman Detail Realisasi agar pengguna tahu hak akses yang sedang aktif.

---

## 4. Persiapan Awal — Inisialisasi Data

Sebelum modul dapat digunakan, **administrator harus menjalankan inisialisasi data SOP** untuk tahun berjalan.

### Cara Inisialisasi

**Via API (untuk admin teknis):**

```
POST /api/v1/kinerja-bidang/seed-default
Authorization: Bearer <token>
```

> Endpoint ini hanya dapat dipanggil oleh role: `SUPER_ADMIN`, `ADMIN`, atau `KABID`.

**Apa yang diinisialisasi:**

1. **20 paket SOP** master Bidang PPIK (Tahap 1, 2, dan 3)
2. **Pemetaan RHK** — kode RHK yang terhubung ke setiap SOP
3. **Target tahunan** — target kuantitas per SOP per RHK untuk tahun berjalan
4. **6 langkah prosedur default** untuk setiap SOP

**Respon sukses:**

```json
{
  "seeded": true,
  "year": 2026,
  "total": 20
}
```

> Proses seed bersifat **upsert** — aman untuk dijalankan berulang. Data yang sudah ada tidak akan duplikat.

---

## 5. Navigasi Modul

Modul Kinerja Bidang dapat diakses dari **sidebar utama** Silakap dengan label **"Kinerja Bidang"**. Navigasi utama antarhalaman dilakukan dari sidebar dan tombol aksi pada header halaman.

Pada halaman **Dashboard RHK**, sistem juga menampilkan panel **Navigasi Kinerja Bidang** sebagai launcher cepat ke seluruh submenu. Panel ini tidak ditampilkan di submenu lain agar halaman kerja seperti Monitoring, Realisasi, Detail SOP, dan Laporan tetap fokus pada kontennya.

| Menu | URL | Deskripsi |
|---|---|---|
| Dashboard RHK | `/kinerja-bidang` | Ringkasan kartu KPI, monitoring ringkas RHK |
| Peta SOP Bidang | `/kinerja-bidang/sop/map` | Visualisasi peta SOP Tahap 1–3 |
| Daftar SOP | `/kinerja-bidang/sop` | Tabel master SOP dengan filter |
| Monitoring Realisasi | `/kinerja-bidang/monitoring` | Tabel monitoring per RHK dengan status risiko |
| Realisasi SOP/RHK | `/kinerja-bidang/realisasi` | Input, daftar, dan kelola realisasi |
| Laporan Kinerja | `/kinerja-bidang/laporan` | Draft laporan kinerja lengkap |

---

## 6. Dashboard RHK

**URL:** `/kinerja-bidang`

Dashboard adalah halaman pertama yang dilihat saat membuka modul. Halaman ini menampilkan ringkasan kinerja bidang secara keseluruhan.

### 6.1 Kartu Ringkasan (Summary Cards)

Terdapat **8 kartu KPI** di bagian atas:

| Kartu | Penjelasan |
|---|---|
| **Total SOP** | Jumlah seluruh SOP yang terdaftar di sistem |
| **RHK Utama** | Jumlah SOP utama RHK yang aktif |
| **Total Target** | Jumlah total output yang ditargetkan tahun ini |
| **Total Realisasi** | Jumlah total output yang sudah diinput (semua status) |
| **Realisasi Approved** | Jumlah output yang sudah berstatus Approved (final) |
| **Total Bukti Dukung** | Jumlah dokumen DMS yang sudah ditautkan |
| **Rata-rata Progres** | Rata-rata persentase capaian seluruh RHK utama |
| **Perlu Perhatian** | Jumlah RHK yang berstatus "Perlu Perhatian" atau "Belum Ada Bukti" |

### 6.2 Tabel Monitoring Ringkas

Di bawah kartu, ditampilkan tabel ringkas kemajuan per RHK. Kolom yang tampil:

- Kode SOP & judul
- Kode RHK
- Target vs realisasi
- Persentase progres
- Status risiko (AMAN / PERLU PERHATIAN / BELUM ADA BUKTI / TERLAMPAUI)

### 6.3 Tombol Aksi Cepat

| Tombol | Aksi |
|---|---|
| **Peta SOP** | Buka halaman Peta SOP Bidang |
| **Monitoring** | Buka halaman Monitoring Realisasi |
| **Input Realisasi** | Langsung buka form input realisasi baru |
| **Laporan** | Buka halaman Laporan Kinerja |

### 6.4 Badge Sumber Data

Badge di pojok kanan header menunjukkan sumber data yang sedang ditampilkan:
- **Backend** (hijau) — data resmi dari database sistem
- **Statis** (abu-abu) — data fallback ketika backend tidak dapat dijangkau

### 6.5 Navigasi Kinerja Bidang

Dashboard RHK menampilkan panel **Navigasi Kinerja Bidang** berisi kartu pintasan ke Dashboard, Peta SOP, Daftar SOP, Monitoring, Realisasi, dan Laporan. Panel ini berfungsi sebagai pusat orientasi modul; pada submenu lain, pengguna cukup memakai sidebar dan tombol aksi cepat pada header.

---

## 7. Peta SOP Bidang

**URL:** `/kinerja-bidang/sop/map`

Halaman ini menampilkan **visualisasi peta SOP** dalam format diagram yang menggambarkan hubungan antar tahapan.

### Isi Peta

- **Kolom kiri (Tahap 1)** — SOP Manajemen Bidang (5 SOP)
- **Kolom tengah (Tahap 2)** — SOP Pengelolaan Layanan Kepegawaian (5 SOP)
- **Kolom kanan (Tahap 3)** — SOP Fungsi Spesifik Bidang (10 SOP)

### Cara Membaca Peta

- Setiap kotak mewakili satu paket SOP
- Warna berbeda untuk setiap tahap (biru = Tahap 1, hijau = Tahap 2, kuning/oranye = Tahap 3)
- SOP dengan tanda **"RHK Utama"** adalah SOP yang langsung diukur sebagai capaian RHK
- Klik pada nama SOP (jika tersedia link) untuk melihat detail

---

## 8. Daftar SOP

**URL:** `/kinerja-bidang/sop`

Halaman ini menampilkan **seluruh master SOP** dalam bentuk tabel yang dapat difilter.

### 8.1 Filter yang Tersedia

| Filter | Pilihan |
|---|---|
| **Tahap** | Semua / Tahap 1 / Tahap 2 / Tahap 3 |
| **Jenis SOP** | Semua / SOP Utama RHK / SOP Pendukung |
| **Status** | Aktif / Draft / Arsip |

### 8.2 Kolom Tabel SOP

| Kolom | Keterangan |
|---|---|
| Kode SOP | Kode unik, format: `SOP-BKPSDM-[KATEGORI]-[NOMOR]` |
| Judul SOP | Nama lengkap SOP |
| Tahap | Tahap 1 / 2 / 3 |
| RHK Terkait | Kode RHK yang dilayani SOP ini |
| Target | Kuantitas target (misal: 12 Laporan / 1 Dokumen) |
| Jenis | SOP Utama RHK / SOP Pendukung |
| Aksi | Tombol "Detail" untuk membuka halaman Detail SOP |

> Jika backend belum diinisialisasi, halaman ini menampilkan data statis dengan peringatan dan tombol navigasi ke panduan inisialisasi.

---

## 9. Detail SOP

**URL:** `/kinerja-bidang/sop/:id` (bisa menggunakan ID atau kode SOP, contoh: `SOP-BKPSDM-PAN-001`)

Halaman ini menampilkan **informasi lengkap satu SOP** dalam format tab.

### 9.1 Kartu Statistik

Di bagian atas halaman:

| Kartu | Isi |
|---|---|
| **Target Kuantitas** | Jumlah output yang ditargetkan (misal: 5 Laporan) |
| **Target Kualitas** | Rentang persentase kualitas yang diharapkan (misal: 90%-100%) |
| **Target Waktu** | Periodisitas pelaksanaan (misal: Bulanan, Triwulan, Tahunan) |

### 9.2 Tab Detail SOP

**Tab Ringkasan**
- Dasar hukum yang menjadi landasan SOP
- Tujuan SOP
- Ruang lingkup SOP

**Tab Target RHK**
- RHK yang dilayani oleh SOP ini
- Detail target kuantitas, kualitas, waktu
- Tahap SOP dan jenis (Utama/Pendukung)

**Tab Langkah Prosedur**
Tabel berisi 6 langkah standar prosedur pelaksanaan SOP:

| Kolom | Keterangan |
|---|---|
| No | Nomor urut langkah |
| Tahapan | Nama aktivitas |
| Pelaksana | Pihak yang bertanggung jawab |
| Input | Dokumen/data yang dibutuhkan |
| Proses | Uraian kegiatan |
| Output | Hasil yang dihasilkan |
| Waktu | Estimasi durasi |

**Tab Bukti Dukung**
- Daftar jenis dokumen bukti dukung yang disarankan untuk SOP ini
- Contoh: Laporan pelaksanaan, Berita Acara, Surat Keputusan

**Tab Tanda Tangan**
- Kolom tanda tangan pejabat yang berwenang
- Posisi: Pembuat, Pemeriksa, Pengesah

---

## 10. Monitoring Realisasi

**URL:** `/kinerja-bidang/monitoring`

Halaman ini menampilkan **tabel monitoring lengkap** per RHK dengan semua dimensi capaian.

### 10.1 Kartu Ringkasan

Sama seperti Dashboard, menampilkan 8 kartu KPI di bagian atas.

### 10.2 Tabel Monitoring RHK

Tabel ini berfokus pada **SOP utama RHK** (8 baris, satu per RHK):

| Kolom | Keterangan |
|---|---|
| Kode SOP | Kode SOP utama RHK |
| Judul | Nama SOP |
| RHK | Kode RHK |
| Target | Target kuantitas tahun ini |
| Realisasi | Total output yang diinput |
| Approved | Total output berstatus Approved |
| Bukti | Jumlah dokumen DMS tertaut |
| Progres | Bar progres persentase capaian |
| Status | Badge status risiko berwarna |
| Aksi | Tombol "Input Realisasi" untuk SOP bersangkutan |

### 10.3 Tombol Input Realisasi dari Monitoring

Dari tabel monitoring, klik **"Input Realisasi"** pada baris SOP tertentu. Sistem akan otomatis membuka form realisasi dengan **target SOP sudah terpilih** (tidak perlu pilih ulang).

---

## 11. Realisasi SOP/RHK

**URL:** `/kinerja-bidang/realisasi`

Ini adalah halaman utama untuk **mengelola seluruh siklus realisasi**, mulai dari input hingga approval.

### 11.1 Membuat Realisasi Baru

**Langkah-langkah:**

1. Buka halaman Realisasi SOP/RHK (`/kinerja-bidang/realisasi`)
2. Klik tombol **"Input Realisasi"** di pojok kanan atas
3. Form input realisasi akan muncul

**Mengisi Form Realisasi:**

**Bagian 1 — Pilih Target SOP/RHK**

| Field | Keterangan |
|---|---|
| **Tahun** | Tahun target (default: tahun berjalan) |
| **Target SOP/RHK** | Pilih dari dropdown daftar target yang tersedia. Setiap pilihan menampilkan kode SOP, judul, RHK, dan target kuantitas. |

> Jika datang dari halaman Monitoring dengan klik "Input Realisasi", target sudah terpilih otomatis.

**Bagian 2 — Periode**

Pilih salah satu periode (tidak bisa keduanya):

| Pilihan | Kapan digunakan |
|---|---|
| **Bulanan** | Untuk SOP dengan target periode bulanan (misal: 12 Laporan/tahun → 1 per bulan) |
| **Triwulan** | Untuk SOP dengan target triwulan (misal: 3 Laporan/tahun → 1 per triwulan) |
| **Tahunan** | Untuk SOP dengan satu output per tahun (tidak isi bulan/triwulan) |

**Bagian 3 — Data Realisasi**

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul Realisasi** | ✅ | Nama singkat episode kegiatan (maks. 200 karakter) |
| **Kuantitas Realisasi** | ✅ | Angka output yang dihasilkan (misal: 1 laporan) |
| **Kualitas (%)** | — | Persentase kualitas capaian, misal: 95 |
| **Status Waktu** | — | Pilih: Tepat Waktu / Terlambat / Sesuai Target |
| **Deskripsi** | — | Uraian pelaksanaan kegiatan |
| **Kendala** | — | Hambatan yang dihadapi |
| **Tindak Lanjut** | — | Rencana perbaikan atau eskalasi |

**Bagian 4 — Bukti Dukung DMS (opsional saat buat)**

- Klik **"Tambah Bukti Dukung"** untuk membuka pencarian dokumen DMS
- Cari dokumen berdasarkan judul atau nama file
- Pilih dokumen yang relevan
- Tandai apakah dokumen ini adalah **bukti utama** (isPrimary)
- Bisa menambahkan beberapa bukti dukung

> Bukti dukung bisa ditambahkan nanti setelah realisasi dibuat, sebelum realisasi di-submit.

4. Klik **"Buat Realisasi"** — sistem akan membuat realisasi dengan status **DRAFT**
5. Setelah berhasil, sistem otomatis membuka halaman **Detail Realisasi**

---

### 11.2 Mengelola Bukti Dukung DMS

Bukti dukung adalah dokumen yang diunggah ke DMS dan dikaitkan ke realisasi.

**Menambah Bukti Dukung:**

1. Buka halaman Detail Realisasi (`/kinerja-bidang/realisasi/:id`)
2. Scroll ke bagian **"Bukti Dukung DMS"**
3. Klik tombol **"Tambah Bukti"** (hanya muncul jika realisasi belum Approved)
4. Cari dokumen DMS menggunakan kotak pencarian (maks. 20 hasil)
5. Pilih dokumen yang relevan
6. Isi label dokumen (opsional) dan tandai "Utama" jika ini dokumen bukti primer
7. Klik **"Tautkan"**

**Kolom tabel bukti dukung:**

| Kolom | Keterangan |
|---|---|
| Dokumen | Judul dan nama file dokumen DMS |
| Label | Label deskriptif yang diberikan |
| Utama | Badge "Utama" atau "Pendukung" |
| Aksi | Tombol "DMS" (buka dokumen) dan "Lepas" (hapus tautan) |

**Melepas Bukti Dukung:**
- Klik **"Lepas"** pada baris dokumen yang ingin dihapus
- Konfirmasi akan diminta
- Hanya bisa dilakukan jika realisasi belum berstatus Approved

> **Perhatian:** Dokumen DMS tidak ikut dihapus — hanya tautan ke realisasi yang dihapus. Dokumen tetap ada di sistem DMS.

---

### 11.3 Submit Realisasi

**Prasyarat sebelum submit:**
- Status realisasi harus **DRAFT** atau **PERLU REVISI**
- Kuantitas realisasi harus lebih dari 0

**Langkah:**

1. Buka halaman Detail Realisasi
2. Lihat bagian **"Aksi Status"**
3. Jika prasyarat terpenuhi, tombol **"Submit"** akan aktif
4. Klik **"Submit"** — sistem akan mengubah status menjadi **SUBMITTED**
5. Realisasi siap untuk di-review

> Setelah di-submit, realisasi tidak bisa lagi diedit kecuali dikembalikan untuk revisi.

**Panel Validasi:**

Di atas bagian Aksi Status, terdapat **Panel Validasi** yang menampilkan:
- Daftar syarat yang sudah terpenuhi (tanda centang hijau)
- Daftar syarat yang belum terpenuhi (tanda silang merah) beserta penjelasannya

Contoh syarat yang ditampilkan:
- Kuantitas realisasi > 0
- Judul realisasi sudah diisi
- Minimal 1 bukti dukung DMS tersedia

---

### 11.4 Review Realisasi

**Siapa yang bisa:** SUPER_ADMIN, ADMIN, KEPALA_BADAN, SEKRETARIS, KABID

**Prasyarat:**
- Status realisasi harus **SUBMITTED**

**Langkah:**

1. Buka halaman Detail Realisasi yang berstatus SUBMITTED
2. Di bagian **"Aksi Status"**, klik **"Review"**
3. Isikan catatan review (opsional) di field yang muncul
4. Klik **"Konfirmasi Review"**
5. Status berubah menjadi **REVIEWED**

> Setelah REVIEWED, realisasi bisa di-Approve langsung atau dikembalikan untuk revisi.

---

### 11.5 Approve Realisasi

**Siapa yang bisa:** SUPER_ADMIN, ADMIN, KEPALA_BADAN, SEKRETARIS, KABID

**Prasyarat (keduanya harus terpenuhi):**
- Status realisasi harus **SUBMITTED** atau **REVIEWED**
- Harus ada minimal **1 bukti dukung DMS** yang ditautkan
- Kuantitas realisasi harus lebih dari 0

**Langkah:**

1. Buka halaman Detail Realisasi
2. Pastikan prasyarat sudah terpenuhi (panel validasi akan menunjukkan status)
3. Di bagian **"Aksi Status"**, klik **"Approve"**
4. Isikan catatan approval (opsional)
5. Klik **"Konfirmasi Approve"**
6. Status berubah menjadi **APPROVED**

> **Penting:** Setelah APPROVED, realisasi **terkunci** — tidak bisa diedit, tidak bisa ditambah/dihapus bukti dukung, dan tidak bisa dikembalikan ke status sebelumnya.

---

### 11.6 Minta Revisi

**Siapa yang bisa:** SUPER_ADMIN, ADMIN, KEPALA_BADAN, SEKRETARIS, KABID

**Prasyarat:**
- Status realisasi harus **SUBMITTED** atau **REVIEWED**

**Langkah:**

1. Buka halaman Detail Realisasi
2. Di bagian **"Aksi Status"**, klik **"Minta Revisi"**
3. **Wajib** isikan catatan alasan revisi di field yang muncul (ditampilkan ke pengisi sebagai panduan perbaikan)
4. Klik **"Konfirmasi"**
5. Status berubah menjadi **PERLU REVISI**
6. Pengisi (STAFF/KABID) dapat melihat catatan revisi di halaman detail

---

### 11.7 Revisi dan Submit Ulang

Ketika realisasi dikembalikan untuk revisi:

1. Pengisi membuka halaman Detail Realisasi yang berstatus **PERLU REVISI**
2. Baca **catatan review** dari reviewer di bagian "Catatan Review"
3. Edit data realisasi sesuai masukan:
   - Perbarui kuantitas, kualitas, atau status waktu jika perlu
   - Lengkapi deskripsi, kendala, atau tindak lanjut
   - Tambah atau ganti bukti dukung DMS
4. Klik **"Submit"** untuk mengirim ulang ke reviewer
5. Status kembali ke **SUBMITTED**

---

### 11.8 Daftar Realisasi

Di halaman Realisasi SOP/RHK, tersedia tabel daftar seluruh realisasi.

**Filter yang tersedia:**
- **Tahun** — filter berdasarkan tahun target (input angka 4 digit)
- **Refresh** — muat ulang data terkini

**Kolom tabel daftar:**

| Kolom | Keterangan |
|---|---|
| SOP | Kode dan judul SOP |
| RHK | Kode RHK |
| Periode | Bulan/Triwulan/Tahun |
| Judul | Judul realisasi |
| Kuantitas | Output yang tercatat |
| Status | Badge status dengan warna |
| Aksi | Tombol "Detail" |

**Kode warna status badge:**

| Status | Warna | Arti |
|---|---|---|
| Draft | Abu-abu | Input awal, masih bisa diedit |
| Submitted | Biru | Menunggu review |
| Reviewed | Biru | Sudah diperiksa reviewer |
| Approved | Hijau | Final dan terkunci |
| Perlu Revisi | Kuning | Dikembalikan, perlu diperbaiki |

---

## 12. Laporan Kinerja Bidang

**URL:** `/kinerja-bidang/laporan`

Halaman ini menghasilkan **draft laporan kinerja** yang dapat dicetak atau dieksport.

### 12.1 Parameter Laporan

Di bagian atas halaman, terdapat panel **"Parameter Laporan"** dengan pilihan:

| Parameter | Pilihan | Keterangan |
|---|---|---|
| **Tahun** | Input angka | Default: tahun berjalan |
| **Periode** | Tahunan / Bulanan / Triwulan | Jenis periode laporan |
| **Bulan** | 1–12 | Muncul jika pilih Bulanan |
| **Triwulan** | 1–4 | Muncul jika pilih Triwulan |

Laporan otomatis diperbarui setiap kali parameter diubah.

### 12.2 Ringkasan Eksekutif

Kartu ringkasan yang menampilkan:
- Total SOP dan RHK utama
- Total target dan realisasi
- Realisasi yang sudah Approved
- Total bukti dukung tertaut
- Rata-rata persentase capaian
- Jumlah RHK yang perlu perhatian

### 12.3 Rekapitulasi RHK

Tabel per RHK utama yang menampilkan:

| Kolom | Keterangan |
|---|---|
| Kode SOP | Kode SOP utama |
| Judul SOP | Nama SOP |
| RHK | Kode RHK |
| Target | Kuantitas target |
| Realisasi | Total output diinput |
| Approved | Output berstatus Approved |
| Bukti | Jumlah dokumen DMS |
| Progres | Persentase capaian (%) |
| Status | Status risiko RHK |

### 12.4 Daftar Bukti Dukung Minimal

Tabel daftar **kebutuhan minimum dokumen bukti dukung** per RHK — berguna sebagai checklist persiapan laporan.

### 12.5 Narasi Laporan

Sistem menghasilkan narasi laporan otomatis yang berisi:

| Bagian | Isi |
|---|---|
| **Judul** | "Laporan Kinerja Bidang PPIK Tahun [tahun]" |
| **Pendahuluan** | Konteks dan tujuan penyusunan laporan |
| **Capaian** | Narasi ringkas jumlah RHK, target, realisasi, dan rata-rata progres |
| **Kendala** | Narasi tentang RHK yang perlu perhatian (jika ada) |
| **Tindak Lanjut** | Rencana pemutakhiran dan review berkala |

### 12.6 Cetak Laporan

Gunakan tombol **"Cetak"** atau **"Simpan PDF"** di bagian atas kanan halaman. Bagian panel navigasi dan parameter akan tersembunyi saat dicetak (class `no-print`).

---

## 13. Alur Kerja Lengkap

Berikut adalah alur kerja menyeluruh dari awal hingga laporan final:

```
ADMIN/KABID          STAFF/KABID              KABID/KEPALA BADAN
     │                     │                         │
     │ [1] Seed Data        │                         │
     │ POST /seed-default   │                         │
     │                     │                         │
     │                [2] Buka Dashboard              │
     │                     │                         │
     │                [3] Lihat Monitoring            │
     │                     │ Cek target RHK           │
     │                     │                         │
     │                [4] Input Realisasi             │
     │                     │ Isi form                 │
     │                     │ Tambah bukti DMS         │
     │                     │ Status: DRAFT            │
     │                     │                         │
     │                [5] Submit                      │
     │                     │ Status: SUBMITTED        │
     │                     │──────────────────────────▶│
     │                     │                    [6] Review
     │                     │                    Cek data
     │                     │                    Status: REVIEWED
     │                     │                         │
     │                     │             [PILIHAN A] Approve
     │                     │                    Syarat: ada bukti DMS
     │                     │                    Status: APPROVED ✅
     │                     │                         │
     │                     │             [PILIHAN B] Minta Revisi
     │                     │◀─────────────────────────│
     │                [7] Perbaiki                    │
     │                     │ Status: PERLU REVISI     │
     │                     │ Edit data/bukti          │
     │                     │                         │
     │                [8] Submit Ulang                │
     │                     │ Status: SUBMITTED        │
     │                     │──────────────────────────▶│
     │                     │                    [9] Approve
     │                     │                    Status: APPROVED ✅
     │                     │                         │
     │                [10] Lihat Laporan              │
     │                     │                         │
     │                [11] Cetak/Export               │
```

---

## 14. Status Risiko RHK

Setiap RHK utama dihitung status risikonya secara otomatis berdasarkan progres dan ketersediaan bukti dukung:

| Status | Kondisi | Warna | Tindakan |
|---|---|---|---|
| **TERLAMPAUI** | Progres ≥ 100% | Hijau | — |
| **AMAN** | Progres ≥ 80% DAN ada bukti dukung | Hijau | Pertahankan capaian |
| **PERLU PERHATIAN** | Progres < 80% DAN ada bukti dukung | Kuning | Percepat realisasi dan review |
| **BELUM ADA BUKTI** | Belum ada bukti dukung DMS sama sekali | Abu-abu | Upload dokumen ke DMS dan tautkan ke realisasi |

> Status ini dihitung real-time setiap kali halaman Dashboard, Monitoring, atau Laporan dimuat dari backend.

---

## 15. Referensi SOP Bidang PPIK

### Tahap 1 — SOP Manajemen Bidang (5 SOP)

| Kode | Judul | RHK | Target | Periode |
|---|---|---|---|---|
| SOP-BKPSDM-MAN-001 | Perencanaan Program dan Kegiatan Bidang | Semua RHK | 1 Dokumen | Tahunan |
| SOP-BKPSDM-MAN-002 | Pembagian Tugas Internal Bidang | Semua RHK | 1 Dokumen | Tahunan |
| SOP-BKPSDM-MAN-003 | Monitoring Pelaksanaan Kegiatan Bidang | Semua RHK | 12 Laporan | Bulanan |
| SOP-BKPSDM-MAN-004 | Pelaporan Kinerja Bidang | RHK 2 | 1 Dokumen | Tahunan |
| SOP-BKPSDM-EVK-001 | Evaluasi Kinerja Bidang ⭐ | RHK 2 | 1 Dokumen | Tahunan |

### Tahap 1 — SOP Pengelolaan Arsip

| Kode | Judul | RHK | Target | Periode |
|---|---|---|---|---|
| SOP-BKPSDM-MAN-005 | Pengelolaan Dokumen dan Arsip Bidang | RHK 7 | 12 Laporan | Bulanan |

### Tahap 2 — SOP Pengelolaan Layanan Kepegawaian (5 SOP)

| Kode | Judul | RHK | Target | Periode |
|---|---|---|---|---|
| SOP-BKPSDM-LAY-001 | Penerimaan Permohonan Layanan Kepegawaian | RHK 1,3,4,8 | 12 Laporan | Bulanan |
| SOP-BKPSDM-LAY-002 | Verifikasi Kelengkapan Berkas Layanan | RHK 1, RHK 3 | 12 Laporan | Bulanan |
| SOP-BKPSDM-LAY-003 | Monitoring SLA Layanan Kepegawaian | RHK 8 | 12 Laporan | Bulanan |
| SOP-BKPSDM-LAY-004 | Penanganan Keterlambatan Layanan | RHK 8 | 12 Laporan | Bulanan |
| SOP-BKPSDM-LAY-005 | Evaluasi Kepuasan Layanan | RHK 8 | 2 Laporan | Semesteran |

### Tahap 3 — SOP Fungsi Spesifik Bidang (9 SOP)

| Kode | Judul | RHK | Target | Periode |
|---|---|---|---|---|
| SOP-BKPSDM-FNG-001 | Penyusunan Rencana Kebutuhan ASN | RHK 1 | 1 Dokumen | Tahunan |
| SOP-BKPSDM-FNG-002 | Verifikasi Usulan Formasi ASN | RHK 1 | 1 Dokumen | Tahunan |
| SOP-BKPSDM-PAN-001 | Pengendalian Pelaksanaan Pengadaan ASN ⭐ | RHK 1 | 5 Laporan | Per tahapan |
| SOP-BKPSDM-PBH-001 | Pengendalian Pemberhentian ASN ⭐ | RHK 3 | 12 Laporan | Bulanan |
| SOP-BKPSDM-LPA-001 | Fasilitasi Lembaga Profesi ASN ⭐ | RHK 4 | 3 Laporan | Triwulan |
| SOP-BKPSDM-SIK-001 | Pengelolaan Sistem Informasi Kepegawaian ⭐ | RHK 5 | 12 Laporan | Bulanan |
| SOP-BKPSDM-DAT-001 | Pengendalian Pengelolaan Data ASN ⭐ | RHK 6 | 12 Laporan | Bulanan |
| SOP-BKPSDM-DMS-001 | Pengelolaan DMS & Data Kepegawaian ⭐ | RHK 7 | 12 Laporan | Bulanan |
| SOP-BKPSDM-LIK-001 | Monev Publikasi Layanan Informasi Kepegawaian ⭐ | RHK 8 | 2 Laporan | Semesteran |

> ⭐ = SOP Utama RHK (langsung diukur sebagai capaian RHK)

---

## 16. Troubleshooting

### 16.1 Halaman menampilkan "data statis"

**Gejala:** Badge "Statis" muncul di pojok kanan header, dengan pesan error.

**Kemungkinan penyebab dan solusi:**

| Penyebab | Solusi |
|---|---|
| Backend API tidak dapat dijangkau | Periksa koneksi jaringan dan status server API |
| Database belum di-migrate | Jalankan `npx prisma migrate deploy` di folder `api/` |
| Data SOP belum di-seed | Jalankan POST `/api/v1/kinerja-bidang/seed-default` sebagai ADMIN/KABID |
| Token JWT kadaluarsa | Logout dan login ulang |

### 16.2 Tombol Submit tidak aktif (grayed out)

**Periksa Panel Validasi** di halaman Detail Realisasi. Kemungkinan penyebab:
- Kuantitas realisasi masih 0 → isi field "Kuantitas Realisasi" dengan angka > 0
- Judul realisasi kosong → isi field "Judul Realisasi"

> Catatan: Bukti dukung DMS bukan syarat wajib untuk submit, tetapi **wajib** untuk approve.

### 16.3 Tombol Approve tidak aktif

Periksa:
- Belum ada bukti dukung DMS → tambahkan minimal 1 dokumen dari DMS
- Status bukan SUBMITTED atau REVIEWED → harus submit dulu
- Role tidak memiliki akses approve → hanya KABID, KEPALA_BADAN, SEKRETARIS, ADMIN, SUPER_ADMIN yang dapat approve

### 16.4 Error "Dokumen DMS tidak ditemukan"

**Gejala:** Error saat mencoba menautkan bukti dukung.

**Penyebab:** ID dokumen DMS yang dipilih tidak ditemukan di database.

**Solusi:**
- Pastikan dokumen sudah berhasil diunggah ke modul DMS terlebih dahulu
- Coba cari dokumen dengan kata kunci berbeda
- Hubungi admin DMS jika dokumen tidak muncul di pencarian

### 16.5 Role ditampilkan sebagai "UNKNOWN"

**Gejala:** Badge "Role: UNKNOWN" muncul di halaman Detail Realisasi. Tombol submit/approve tidak tersedia.

**Penyebab:** Sistem tidak dapat membaca role dari token JWT.

**Solusi:** Logout dan login ulang untuk memperbarui token JWT.

### 16.6 Error "Pilih salah satu periode saja: bulan atau triwulan"

**Penyebab:** Form realisasi mengirim kedua field bulan DAN triwulan secara bersamaan.

**Solusi:** Pastikan hanya salah satu yang diisi — pilih tipe periode terlebih dahulu, lalu isi nilainya.

### 16.7 Daftar SOP kosong

**Gejala:** Halaman Daftar SOP menampilkan tabel kosong dengan pesan "Backend belum memiliki data SOP."

**Solusi:**
1. Login sebagai ADMIN atau KABID
2. Jalankan inisialisasi data: POST `/api/v1/kinerja-bidang/seed-default`
3. Muat ulang halaman Daftar SOP

---

## Lampiran — Singkatan dan Istilah

| Singkatan | Kepanjangan |
|---|---|
| ASN | Aparatur Sipil Negara |
| BKPSDM | Badan Kepegawaian dan Pengembangan Sumber Daya Manusia |
| DMS | Document Management System |
| PPIK | Pengadaan, Pemberhentian, Informasi, dan Kepegawaian |
| RHK | Rencana Hasil Kerja |
| SLA | Service Level Agreement |
| SOP | Standar Operasional Prosedur |

---

*Dokumen ini dibuat berdasarkan implementasi Silakap V1.0 per 17 Mei 2026.*  
*Untuk pertanyaan teknis, hubungi tim pengembang Silakap.*
