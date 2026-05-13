# DMS Frontend — Manual Regression Checklist

**Versi:** SILAKAP V1.0  
**Modul:** Document Management System (DMS)  
**Terakhir diperbarui:** 2026-05-13  
**Tester:** ___________________________  
**Tanggal pengujian:** ___________________________  
**Build/commit:** ___________________________

---

## Petunjuk Penggunaan

- Centang `[x]` setiap langkah yang sudah dikerjakan.
- Isi kolom **Evidence** dengan screenshot atau catatan singkat.
- Isi **Status** dengan `PASS`, `FAIL`, atau `SKIP` (beserta alasan skip).
- Jika **FAIL**: catat nomor item, deskripsi bug, dan langkah reproduksi di bagian **Bug Log** di bawah.

---

## 1. Environment Setup

- [ ] Backend API berjalan dan dapat diakses dari browser (cek network tab — tidak ada CORS error)
- [ ] Frontend dev server atau build production dapat dibuka di browser
- [ ] Database terhubung ke backend (tidak ada 500 Internal Server Error pada semua endpoint)
- [ ] Akun tester tersedia dengan masing-masing role:
  - [ ] Role **user biasa** (pengunggah dokumen)
  - [ ] Role **verifikator** (punya akses verify/reject)
  - [ ] Role **admin** (akses penuh)

- Expected result:
  - Semua service berjalan tanpa error
  - Akun tester tersedia dan dapat login
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 2. Login dan Role Testing

### 2.1 Login Berhasil

- [ ] Buka halaman login
- [ ] Masukkan kredensial valid
- [ ] Tekan tombol login

- Expected result:
  - Redirect ke `/dashboard` setelah login berhasil
  - Token/session tersimpan
- Evidence:
- Status: PASS / FAIL / SKIP

### 2.2 Protected Route

- [ ] Tanpa login, buka langsung `/dms` di browser
- [ ] Tanpa login, buka langsung `/dms/documents` di browser

- Expected result:
  - Redirect ke halaman login
  - Tidak dapat mengakses halaman DMS tanpa autentikasi
- Evidence:
- Status: PASS / FAIL / SKIP

### 2.3 Navigasi ke DMS

- [ ] Setelah login, navigasi ke `/dms` via sidebar atau menu
- [ ] URL bar menampilkan `/dms` dengan benar

- Expected result:
  - Halaman dashboard DMS tampil
  - Tidak ada error console yang kritis
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 3. Dashboard DMS (`/dms`)

### 3.1 Layout dan Header

- [ ] Buka `/dms`
- [ ] Periksa header halaman: judul "Dashboard DMS", badge "DMS BUKTI DUKUNG"
- [ ] Periksa tombol "Upload Dokumen" dan "Refresh" tersedia di header

- Expected result:
  - Header tampil lengkap dengan judul, badge, dan kedua tombol
  - Badge "DMS BUKTI DUKUNG" berwarna gelap (dark tone)
- Evidence:
- Status: PASS / FAIL / SKIP

### 3.2 Loading State

- [ ] Throttle network (Chrome DevTools → Network → Slow 3G) lalu refresh `/dms`
- [ ] Amati tampilan saat data sedang dimuat

- Expected result:
  - LoadingState dengan label "Memuat dashboard DMS" tampil
  - Tidak ada layout shift atau error saat loading
- Evidence:
- Status: PASS / FAIL / SKIP

### 3.3 Summary Cards

- [ ] Setelah data dimuat, periksa bagian summary
- [ ] Hitung jumlah stat card baris pertama (Total, Draft, Uploaded, Submitted, Verified/Archived, Tanpa File)
- [ ] Periksa baris kedua (Menunggu Verifikasi, Belum Ada File, Ditolak)

- Expected result:
  - 6 card di baris pertama, 3 card di baris kedua
  - Nilai pada card sesuai dengan data aktual (atau 0 jika belum ada data)
  - Card "Tanpa File" berwarna warning jika ada dokumen tanpa file, success jika tidak ada
  - Card "Ditolak" berwarna danger jika ada yang ditolak
- Evidence:
- Status: PASS / FAIL / SKIP

### 3.4 Quick Actions

- [ ] Periksa panel "Aksi Cepat" tersedia
- [ ] Klik "Upload Dokumen" → harus navigasi ke `/dms/upload`
- [ ] Kembali ke `/dms`, klik "Semua Dokumen" → navigasi ke `/dms/documents`
- [ ] Kembali ke `/dms`, klik "Verifikasi" → navigasi ke `/dms/verification`
- [ ] Kembali ke `/dms`, klik "Laporan" → navigasi ke `/dms/reports`

- Expected result:
  - Setiap tombol navigasi ke route yang benar
  - Tidak ada broken link atau 404
- Evidence:
- Status: PASS / FAIL / SKIP

### 3.5 Dokumen Terbaru

- [ ] Periksa tabel "Dokumen Terbaru" menampilkan data
- [ ] Periksa kolom: Dokumen (judul + file + badge), Unit Kerja, Periode, Dibuat, Aksi
- [ ] Klik tombol "Buka" pada salah satu dokumen → navigasi ke `/dms/documents/:id`
- [ ] Kembali, klik "Lihat Semua" → navigasi ke `/dms/documents`

- Expected result:
  - Maksimal 10 dokumen terbaru tampil
  - Setiap baris menampilkan badge kategori dan status dengan warna yang benar
  - Tombol "Buka" navigasi ke detail dokumen yang benar
- Evidence:
- Status: PASS / FAIL / SKIP

### 3.6 Download dari Dashboard

- [ ] Pada tabel Dokumen Terbaru, cari dokumen yang memiliki file (tombol "Download" tersedia)
- [ ] Klik "Download"
- [ ] Amati tombol berubah menjadi "Mengunduh..." selama proses
- [ ] Verifikasi file berhasil diunduh

- Expected result:
  - Tombol "Download" hanya muncul jika dokumen memiliki file
  - Loading state "Mengunduh..." tampil saat proses
  - File terunduh dengan nama file asli (originalFileName jika ada)
  - Dokumen tanpa file tidak menampilkan tombol Download
- Evidence:
- Status: PASS / FAIL / SKIP

### 3.7 Refresh Dashboard

- [ ] Klik tombol "Refresh" di header
- [ ] Amati apakah tombol disabled saat loading

- Expected result:
  - Data di-reload dari API
  - Tombol Refresh disabled saat proses loading
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 4. Upload Dokumen (`/dms/upload`)

### 4.1 Layout dan Header

- [ ] Buka `/dms/upload`
- [ ] Periksa header: judul "Upload Dokumen DMS", badge "CREATE DOCUMENT"
- [ ] Periksa tombol "Kembali" tersedia

- Expected result:
  - Header tampil lengkap
  - Badge "CREATE DOCUMENT" tampil dengan tone info
  - Tombol Kembali ada
- Evidence:
- Status: PASS / FAIL / SKIP

### 4.2 Form Metadata

- [ ] Periksa field yang tersedia: Judul, Deskripsi, Kategori, Tahun, Bulan, Triwulan, Unit Kerja ID, ASN ID, Case SIAP ID, Worklog ID
- [ ] Pastikan field Judul di-mark sebagai required (ada atribut `required`)
- [ ] Pastikan Tahun sudah terisi default tahun sekarang

- Expected result:
  - Semua field metadata tersedia
  - Default tahun = tahun berjalan
  - Dropdown Kategori berisi semua kategori DMS
- Evidence:
- Status: PASS / FAIL / SKIP

### 4.3 Upload File (Opsional)

- [ ] Coba klik area dropzone dan pilih file PDF valid (< 10 MB)
- [ ] Periksa nama file dan ukuran tampil setelah dipilih
- [ ] Klik "Hapus pilihan file" → file terhapus dari dropzone

- Expected result:
  - File berhasil dipilih dan informasinya tampil
  - File dapat dihapus dari pilihan
- Evidence:
- Status: PASS / FAIL / SKIP

### 4.4 Validasi File

- [ ] Coba pilih file berekstensi tidak didukung (misal `.exe`, `.zip`)
- [ ] Amati pesan error

- [ ] Coba pilih file PDF berukuran > 10 MB
- [ ] Amati pesan error

- Expected result:
  - File `.exe`/`.zip`: error "Ekstensi file tidak didukung..."
  - File > 10 MB: error "Ukuran file maksimal 10 MB."
  - Tombol "Simpan Dokumen" tetap **disabled** selama ada `fileError` aktif
  - Error hilang setelah file yang valid dipilih
- Evidence:
- Status: PASS / FAIL / SKIP

### 4.5 Submit Tanpa File

- [ ] Isi minimal field Judul dengan nilai valid
- [ ] Jangan pilih file apapun
- [ ] Klik "Simpan Dokumen"

- Expected result:
  - Dokumen berhasil dibuat dengan status DRAFT
  - Redirect ke halaman detail dokumen baru (`/dms/documents/:id`)
- Evidence:
- Status: PASS / FAIL / SKIP

### 4.6 Submit Dengan File

- [ ] Isi field Judul dan pilih file valid
- [ ] Klik "Simpan Dokumen"
- [ ] Amati tombol berubah menjadi "Menyimpan..." selama proses

- Expected result:
  - Dokumen dibuat lalu file langsung diunggah
  - Status dokumen menjadi UPLOADED
  - Redirect ke halaman detail dokumen
- Evidence:
- Status: PASS / FAIL / SKIP

### 4.7 Panduan Upload

- [ ] Scroll ke bawah halaman upload
- [ ] Periksa card "Panduan Upload" ada dengan 5 poin petunjuk

- Expected result:
  - Card panduan tampil dengan 5 item bernomor 01–05
  - Konten panduan relevan (format file, ukuran, opsional, metadata wajib, status awal)
- Evidence:
- Status: PASS / FAIL / SKIP

### 4.8 Tombol Kembali

- [ ] Klik "Kembali" atau "Lihat Daftar Dokumen"

- Expected result:
  - Navigasi ke `/dms/documents`
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 5. Upload dari SIAP Worklog Context

### 5.1 Akses dengan Query Param worklogId

- [ ] Buka `/dms/upload?worklogId=WORKLOG-UUID-TEST`
- [ ] Periksa header: badge "TERHUBUNG WORKLOG" tampil
- [ ] Periksa card "Konteks Integrasi SIAP" tampil dengan Worklog ID yang benar
- [ ] Periksa field Worklog ID di form sudah terisi otomatis

- Expected result:
  - Badge "TERHUBUNG WORKLOG" muncul di header (warna success)
  - Kartu konteks SIAP tampil dengan UUID dari URL
  - Form Worklog ID sudah terisi dari query param
- Evidence:
- Status: PASS / FAIL / SKIP

### 5.2 Akses dengan Query Param caseId

- [ ] Buka `/dms/upload?caseId=CASE-UUID-TEST`
- [ ] Periksa badge "TERHUBUNG CASE" tampil di header
- [ ] Periksa card Konteks SIAP tampil dengan Case ID yang benar
- [ ] Periksa field Case SIAP ID di form sudah terisi

- Expected result:
  - Badge "TERHUBUNG CASE" muncul (warna success)
  - Form Case ID sudah terisi dari query param
- Evidence:
- Status: PASS / FAIL / SKIP

### 5.3 Akses dengan Kedua Query Param

- [ ] Buka `/dms/upload?worklogId=WL-UUID&caseId=CASE-UUID`
- [ ] Periksa kedua badge tampil
- [ ] Periksa card Konteks SIAP menampilkan keduanya
- [ ] Periksa kedua field form terisi

- Expected result:
  - Kedua badge tampil di header
  - Kartu konteks menampilkan Worklog ID dan Case ID
  - Kedua field form terisi
- Evidence:
- Status: PASS / FAIL / SKIP

### 5.4 Tanpa Query Param

- [ ] Buka `/dms/upload` tanpa query param
- [ ] Periksa tidak ada badge TERHUBUNG WORKLOG / TERHUBUNG CASE
- [ ] Periksa tidak ada card Konteks Integrasi SIAP

- Expected result:
  - Hanya badge "CREATE DOCUMENT" yang tampil
  - Tidak ada card konteks SIAP
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 6. List Dokumen (`/dms/documents`)

### 6.1 Layout dan Header

- [ ] Buka `/dms/documents`
- [ ] Periksa header: judul "Dokumen DMS", badge jumlah dokumen, tombol "Upload Dokumen" dan "Refresh"

- Expected result:
  - Badge menampilkan total dokumen yang benar (misal "42 DOKUMEN")
  - Kedua tombol tersedia
- Evidence:
- Status: PASS / FAIL / SKIP

### 6.2 Summary Cards

- [ ] Periksa 6 stat card tampil: Total, Draft, Uploaded, Submitted, Verified, Rejected+Archived
- [ ] Verifikasi nilai kartu konsisten dengan jumlah dokumen yang tampil di tabel

- Expected result:
  - Kartu menampilkan nilai numerik yang benar
  - Warna kartu sesuai (danger untuk rejected, success untuk verified)
- Evidence:
- Status: PASS / FAIL / SKIP

### 6.3 Tabel Dokumen

- [ ] Periksa tabel menampilkan kolom: Dokumen, Unit Kerja, ASN, Periode, File, Dibuat, Aksi
- [ ] Periksa setiap baris menampilkan badge kategori dan status
- [ ] Klik "Buka" pada satu baris → navigasi ke `/dms/documents/:id`

- Expected result:
  - Semua kolom tampil dengan data yang benar
  - Badge warna sesuai dengan status dan kategori dokumen
  - Tombol Buka navigasi ke detail dokumen yang benar
- Evidence:
- Status: PASS / FAIL / SKIP

### 6.4 Empty State

- [ ] Jika tidak ada dokumen, pastikan tabel menampilkan pesan kosong

- Expected result:
  - Pesan "Belum ada dokumen DMS" tampil di tengah tabel
  - Tidak ada error atau blank page
- Evidence:
- Status: PASS / FAIL / SKIP

### 6.5 Loading State

- [ ] Throttle network lalu refresh `/dms/documents`

- Expected result:
  - "Memuat dokumen DMS" tampil saat data belum siap
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 7. Filter Dokumen

### 7.1 Filter Pencarian (q)

- [ ] Pada `/dms/documents`, masukkan kata kunci di field "Pencarian"
- [ ] Tekan Enter atau klik "Terapkan"

- Expected result:
  - Tabel hanya menampilkan dokumen yang judulnya mengandung kata kunci
  - Jika tidak ada hasil, tampil empty state
- Evidence:
- Status: PASS / FAIL / SKIP

### 7.2 Filter Kategori

- [ ] Pilih salah satu kategori dari dropdown Kategori
- [ ] Klik "Terapkan"

- Expected result:
  - Tabel hanya menampilkan dokumen dengan kategori yang dipilih
- Evidence:
- Status: PASS / FAIL / SKIP

### 7.3 Filter Status

- [ ] Pilih "Submitted" dari dropdown Status
- [ ] Klik "Terapkan"

- Expected result:
  - Hanya dokumen berstatus SUBMITTED yang tampil
- Evidence:
- Status: PASS / FAIL / SKIP

### 7.4 Filter Tahun dan Bulan

- [ ] Isi field Tahun dengan tahun yang relevan (misal 2026)
- [ ] Pilih bulan dari dropdown Bulan
- [ ] Klik "Terapkan"

- Expected result:
  - Dokumen difilter berdasarkan tahun dan bulan periode yang dipilih
- Evidence:
- Status: PASS / FAIL / SKIP

### 7.5 Filter Kombinasi

- [ ] Isi beberapa filter sekaligus (misal kategori + status + tahun)
- [ ] Klik "Terapkan"

- Expected result:
  - Filter dikombinasikan (AND) — hanya dokumen yang memenuhi semua kriteria tampil
- Evidence:
- Status: PASS / FAIL / SKIP

### 7.6 Reset Filter

- [ ] Setelah menerapkan filter, klik tombol "Reset"

- Expected result:
  - Semua field filter kembali ke nilai default
  - Tabel menampilkan semua dokumen tanpa filter
- Evidence:
- Status: PASS / FAIL / SKIP

### 7.7 Filter Disabled saat Loading

- [ ] Throttle network, klik "Terapkan" lalu segera periksa state tombol

- Expected result:
  - Tombol "Terapkan" dan "Reset" disabled saat loading berlangsung
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 8. Detail Dokumen (`/dms/documents/:id`)

### 8.1 Layout Halaman

- [ ] Buka detail dokumen yang valid
- [ ] Periksa header: judul dokumen, badge kategori, badge status, badge FILE TERSEDIA / BELUM ADA FILE
- [ ] Periksa tombol "Kembali" dan "Refresh" tersedia

- Expected result:
  - Header menampilkan judul, kategori, status, dan status file dengan benar
  - Badge warna sesuai status dan kategori dokumen
- Evidence:
- Status: PASS / FAIL / SKIP

### 8.2 Metadata View Mode

- [ ] Pada panel "Metadata Dokumen", verifikasi data tampil dalam view mode (bukan form)
- [ ] Pastikan field yang tampil: Judul, Kategori, Status, Tahun, Bulan, Triwulan, Deskripsi

- Expected result:
  - Data metadata tampil dalam format read-only (kotak info)
  - Nilai sesuai data dokumen di database
- Evidence:
- Status: PASS / FAIL / SKIP

### 8.3 Edit Metadata (Status Editable)

- [ ] Buka dokumen berstatus DRAFT, UPLOADED, atau REJECTED
- [ ] Klik tombol "Edit Metadata"
- [ ] Ubah judul dokumen
- [ ] Klik "Simpan Metadata"

- Expected result:
  - Tombol "Edit Metadata" tersedia saat status DRAFT/UPLOADED/REJECTED
  - Form edit tampil setelah klik Edit
  - Tombol "Batal" dan "Simpan Metadata" tampil di mode edit
  - Metadata berhasil disimpan
  - View mode kembali tampil setelah simpan
  - Audit timeline diperbarui
- Evidence:
- Status: PASS / FAIL / SKIP

### 8.4 Edit Metadata Locked (Status Final)

- [ ] Buka dokumen berstatus VERIFIED atau ARCHIVED
- [ ] Periksa tombol "Edit Metadata"

- Expected result:
  - Tombol "Edit Metadata" **tidak tampil** pada status VERIFIED/ARCHIVED
- Evidence:
- Status: PASS / FAIL / SKIP

### 8.5 Panel Relasi Dokumen

- [ ] Pada sidebar kanan, periksa card "Relasi Dokumen"
- [ ] Verifikasi field: Unit Kerja, Kode Unit, ASN, NIP, Case SIAP, Worklog, Pembuat, Verifikator

- Expected result:
  - Semua field relasi tampil dengan nilai yang benar atau tanda "-" jika kosong
- Evidence:
- Status: PASS / FAIL / SKIP

### 8.6 ID Tidak Valid

- [ ] Buka `/dms/documents/id-yang-tidak-ada`

- Expected result:
  - Halaman menampilkan "Detail Dokumen DMS" dengan keterangan dokumen tidak ditemukan
  - Tombol "Kembali" tersedia
  - Error message ditampilkan dari API
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 9. Preview Dokumen

### 9.1 Dokumen dengan File

- [ ] Buka detail dokumen yang sudah memiliki file
- [ ] Periksa panel "Preview & Metadata File"
- [ ] Verifikasi informasi: nama file asli, ukuran, MIME type, versi, checksum, storage path, tanggal

- Expected result:
  - Panel menampilkan blok file dengan nama dan metadata teknis
  - Grid detail file tampil (Nama File Sistem, Nama Asli, Ukuran, MIME Type, Versi, Checksum, Dibuat, Diperbarui, Storage Path)
  - Tombol "Download" tersedia di header panel
- Evidence:
- Status: PASS / FAIL / SKIP

### 9.2 Dokumen Tanpa File

- [ ] Buka detail dokumen yang belum memiliki file (status DRAFT)
- [ ] Periksa panel Preview

- Expected result:
  - Empty state tampil: "File belum diunggah" dengan penjelasan singkat
  - Tidak ada tombol Download di header panel
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 10. Download Dokumen

### 10.1 Download dari Preview Panel

- [ ] Buka detail dokumen dengan file
- [ ] Klik "Download" di panel Preview

- Expected result:
  - Tombol berubah menjadi "Mengunduh..." saat proses
  - File berhasil diunduh dengan nama file asli
  - Audit timeline diperbarui setelah download (jika ada audit event download)
- Evidence:
- Status: PASS / FAIL / SKIP

### 10.2 Download dari Tabel List

- [ ] Di halaman `/dms/documents`, cari dokumen dengan file
- [ ] Klik "Download" di kolom Aksi

- Expected result:
  - File diunduh langsung dari tabel
  - Tombol Download disabled saat proses, "Mengunduh..." tampil
  - Hanya baris dokumen yang bersangkutan yang disabled (bukan semua baris)
- Evidence:
- Status: PASS / FAIL / SKIP

### 10.3 Download dari Dashboard

- [ ] Di halaman `/dms`, cari dokumen terbaru dengan file
- [ ] Klik "Download"

- Expected result:
  - File diunduh berhasil
  - Hanya tombol download dokumen tersebut yang disabled saat proses
- Evidence:
- Status: PASS / FAIL / SKIP

### 10.4 Tidak Ada Tombol Download jika Tidak Ada File

- [ ] Periksa tabel list atau dashboard untuk dokumen tanpa file

- Expected result:
  - Kolom Aksi pada dokumen tanpa file **tidak menampilkan** tombol Download
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 11. Upload File pada Detail Dokumen

### 11.1 Upload File Baru (DRAFT)

- [ ] Buka detail dokumen berstatus DRAFT
- [ ] Periksa section "Upload / Ganti File" tersedia
- [ ] Pilih file valid di dropzone
- [ ] Klik "Upload File"

- Expected result:
  - Section upload tersedia pada status DRAFT/UPLOADED/REJECTED
  - Tombol "Upload File" disabled jika belum ada file dipilih
  - Setelah upload berhasil: status dokumen berubah menjadi UPLOADED
  - Panel Preview diperbarui dengan informasi file baru
  - Audit timeline diperbarui
- Evidence:
- Status: PASS / FAIL / SKIP

### 11.2 Ganti File (UPLOADED)

- [ ] Buka dokumen berstatus UPLOADED yang sudah punya file
- [ ] Pilih file baru di dropzone
- [ ] Klik "Upload File"
- [ ] Konfirmasi dialog "Dokumen ini sudah memiliki file..."

- Expected result:
  - Dialog konfirmasi muncul sebelum upload
  - Setelah dikonfirmasi: file diganti, versi dokumen naik
  - Jika dibatalkan: tidak ada perubahan
- Evidence:
- Status: PASS / FAIL / SKIP

### 11.3 Upload Locked pada Status Final

- [ ] Buka dokumen berstatus VERIFIED atau ARCHIVED

- Expected result:
  - Section "Upload / Ganti File" **tidak tampil**
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 12. Submit Verifikasi

### 12.1 Submit dari Detail (Status UPLOADED)

- [ ] Buka detail dokumen berstatus UPLOADED
- [ ] Periksa panel "Aksi Dokumen": tombol "Submit Verifikasi" tersedia
- [ ] Klik "Submit Verifikasi"
- [ ] Konfirmasi dialog

- Expected result:
  - Tombol "Submit Verifikasi" ada pada status UPLOADED
  - Dialog konfirmasi muncul
  - Setelah dikonfirmasi: status berubah menjadi SUBMITTED
  - Badge status di header diperbarui
  - Audit timeline diperbarui
- Evidence:
- Status: PASS / FAIL / SKIP

### 12.2 Submit dari Detail (Status REJECTED)

- [ ] Buka detail dokumen berstatus REJECTED
- [ ] Periksa tombol "Submit Verifikasi" tersedia
- [ ] Klik "Submit Verifikasi" dan konfirmasi

- Expected result:
  - Tombol Submit tersedia pada status REJECTED
  - Setelah submit: status berubah SUBMITTED
- Evidence:
- Status: PASS / FAIL / SKIP

### 12.3 Submit Tidak Tersedia pada Status Lain

- [ ] Periksa dokumen berstatus DRAFT: tombol Submit tidak ada
- [ ] Periksa dokumen berstatus SUBMITTED: tombol Submit tidak ada
- [ ] Periksa dokumen berstatus VERIFIED: tombol Submit tidak ada

- Expected result:
  - Tombol "Submit Verifikasi" hanya muncul pada UPLOADED dan REJECTED
- Evidence:
- Status: PASS / FAIL / SKIP

### 12.4 Workflow Hint

- [ ] Pada dokumen DRAFT, periksa teks hint di panel Aksi Dokumen

- Expected result:
  - Teks "Upload file terlebih dahulu sebelum dokumen dapat disubmit." tampil
  - Pada status lain, hint berubah sesuai konteks status
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 13. Verifikasi Dokumen

### 13.1 Halaman Verifikasi (`/dms/verification`)

- [ ] Buka `/dms/verification`
- [ ] Periksa header: judul, badge jumlah menunggu, tombol Refresh
- [ ] Periksa tabel dokumen SUBMITTED tampil

- Expected result:
  - Hanya dokumen berstatus SUBMITTED yang tampil di tabel
  - Badge menampilkan jumlah yang menunggu (misal "5 MENUNGGU")
- Evidence:
- Status: PASS / FAIL / SKIP

### 13.2 Panel Verifikasi Cepat

- [ ] Klik "Buka" pada salah satu dokumen di tabel verifikasi

- Expected result:
  - Panel "Panel Verifikasi" tampil di atas tabel
  - Panel menampilkan judul dokumen yang dipilih
  - Textarea catatan verifikasi tersedia
  - Tombol "Verifikasi", "Tolak", "Buka Detail", dan "Tutup" tersedia
- Evidence:
- Status: PASS / FAIL / SKIP

### 13.3 Verifikasi dari Panel Cepat

- [ ] Dengan panel verifikasi terbuka, isi catatan opsional
- [ ] Klik "Verifikasi"

- Expected result:
  - Dokumen berpindah dari daftar SUBMITTED
  - Status dokumen berubah menjadi VERIFIED
  - Panel verifikasi ditutup otomatis
  - Tabel diperbarui (dokumen hilang dari daftar)
  - Jumlah di badge berkurang
- Evidence:
- Status: PASS / FAIL / SKIP

### 13.4 Verifikasi dari Detail Dokumen

- [ ] Buka detail dokumen berstatus SUBMITTED
- [ ] Periksa tombol "Verifikasi" tersedia di panel Aksi Dokumen
- [ ] Isi catatan di panel "Catatan Verifikasi" (opsional)
- [ ] Klik "Verifikasi" dan konfirmasi

- Expected result:
  - Status berubah menjadi VERIFIED
  - Badge status di header diperbarui
  - Panel Aksi menampilkan pesan "Dokumen sudah diverifikasi dan dapat diarsipkan"
  - Tombol Arsipkan muncul
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 14. Tolak Dokumen

### 14.1 Tolak dari Panel Verifikasi Cepat (Tanpa Catatan)

- [ ] Buka panel verifikasi untuk dokumen SUBMITTED
- [ ] Klik "Tolak" tanpa mengisi catatan

- Expected result:
  - Error: "Catatan penolakan wajib diisi minimal 3 karakter"
  - Dokumen tidak ditolak
- Evidence:
- Status: PASS / FAIL / SKIP

### 14.2 Tolak dari Panel Verifikasi Cepat (Dengan Catatan)

- [ ] Isi catatan penolakan minimal 3 karakter
- [ ] Klik "Tolak"

- Expected result:
  - Dokumen berstatus REJECTED
  - Panel ditutup otomatis
  - Tabel diperbarui
- Evidence:
- Status: PASS / FAIL / SKIP

### 14.3 Tolak dari Detail Dokumen

- [ ] Buka detail dokumen berstatus SUBMITTED
- [ ] Isi catatan di panel "Catatan Verifikasi"
- [ ] Klik tombol "Tolak" di panel Aksi Dokumen
- [ ] Konfirmasi dialog

- Expected result:
  - Status berubah menjadi REJECTED
  - Panel Aksi menampilkan hint "Dokumen ditolak. Perbaiki metadata atau upload ulang..."
  - Tombol "Submit Verifikasi" muncul kembali
  - Audit timeline diperbarui dengan catatan penolakan
- Evidence:
- Status: PASS / FAIL / SKIP

### 14.4 Textarea Catatan Disabled pada Status Non-SUBMITTED

- [ ] Buka detail dokumen berstatus DRAFT atau VERIFIED
- [ ] Periksa textarea "Catatan Verifikasi"

- Expected result:
  - Textarea disabled (tidak dapat diisi) jika status bukan SUBMITTED
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 15. Arsipkan Dokumen

### 15.1 Arsipkan dari Detail (Status VERIFIED)

- [ ] Buka detail dokumen berstatus VERIFIED
- [ ] Periksa tombol "Arsipkan" tersedia di panel Aksi Dokumen
- [ ] Klik "Arsipkan" dan konfirmasi dialog

- Expected result:
  - Status berubah menjadi ARCHIVED
  - Badge status di header diperbarui
  - Panel menampilkan pesan "Dokumen sudah masuk arsip final"
  - Tombol Arsipkan menghilang
  - Banner "Dokumen sudah final..." tampil
- Evidence:
- Status: PASS / FAIL / SKIP

### 15.2 Tombol Arsipkan Tidak Ada pada Status Lain

- [ ] Periksa dokumen berstatus DRAFT, UPLOADED, SUBMITTED, REJECTED, ARCHIVED

- Expected result:
  - Tombol "Arsipkan" hanya muncul pada status VERIFIED
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 16. Hapus Dokumen

### 16.1 Hapus Dokumen DRAFT

- [ ] Buka detail dokumen berstatus DRAFT
- [ ] Periksa tombol "Hapus" tersedia (icon Trash2)
- [ ] Klik "Hapus"
- [ ] Konfirmasi dialog pertama
- [ ] Konfirmasi dialog kedua (konfirmasi ganda)

- Expected result:
  - Dua dialog konfirmasi muncul berurutan
  - Setelah dua konfirmasi: dokumen terhapus
  - Navigasi otomatis ke `/dms/documents`
  - Dokumen tidak lagi tampil di daftar
- Evidence:
- Status: PASS / FAIL / SKIP

### 16.2 Hapus — Batalkan di Dialog Pertama

- [ ] Klik "Hapus", lalu klik "Cancel" di dialog pertama

- Expected result:
  - Dialog tertutup tanpa aksi apapun
  - Dokumen tetap ada
- Evidence:
- Status: PASS / FAIL / SKIP

### 16.3 Tombol Hapus Tidak Ada pada Status Final

- [ ] Buka dokumen berstatus VERIFIED
- [ ] Buka dokumen berstatus ARCHIVED

- Expected result:
  - Tombol "Hapus" **tidak tampil** pada status VERIFIED dan ARCHIVED
  - Banner "Dokumen sudah final..." tampil
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 17. Audit Timeline

### 17.1 Tampil di Detail Dokumen

- [ ] Buka detail dokumen yang sudah memiliki aktivitas
- [ ] Scroll ke section "Riwayat Dokumen"

- Expected result:
  - Timeline tampil dengan daftar event (dibuat, upload, submit, dll.)
  - Setiap item: judul event, deskripsi, aktor, timestamp
- Evidence:
- Status: PASS / FAIL / SKIP

### 17.2 Empty State Timeline

- [ ] Buka dokumen baru yang belum ada aktivitas di audit log

- Expected result:
  - Pesan "Belum ada audit log" tampil dengan deskripsi kapan timeline akan muncul
- Evidence:
- Status: PASS / FAIL / SKIP

### 17.3 Timeline diperbarui setelah Aksi

- [ ] Lakukan aksi pada dokumen (misal edit metadata, upload file, atau submit)
- [ ] Periksa audit timeline setelah aksi selesai

- Expected result:
  - Entri baru muncul di timeline yang mencatat aksi yang baru dilakukan
  - Aktor dan timestamp aksi benar
- Evidence:
- Status: PASS / FAIL / SKIP

### 17.4 Error State Timeline

- [ ] Simulasi kegagalan endpoint audit (`/dms/documents/:id/audit` return 500)
- [ ] Amati panel Riwayat Dokumen

- Expected result:
  - Pesan error dengan border merah tampil
  - Tombol "Muat Ulang Timeline" tersedia
  - Klik tombol: request diulang
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 18. Reports Summary (`/dms/reports`)

### 18.1 Layout dan Header

- [ ] Buka `/dms/reports`
- [ ] Periksa header: judul "Laporan DMS", badge jumlah dokumen, tombol Refresh dan Export CSV

- Expected result:
  - Header tampil lengkap dengan dua tombol aksi
- Evidence:
- Status: PASS / FAIL / SKIP

### 18.2 Filter Laporan

- [ ] Isi field Tahun
- [ ] Pilih Bulan
- [ ] Pilih Triwulan
- [ ] Pilih Kategori
- [ ] Pilih Status
- [ ] Klik "Terapkan"

- Expected result:
  - Data laporan difilter berdasarkan kriteria yang dipilih
  - Stat card dan tabel diperbarui
- Evidence:
- Status: PASS / FAIL / SKIP

### 18.3 Reset Filter Laporan

- [ ] Setelah filter diterapkan, klik "Reset"

- Expected result:
  - Filter kembali ke default (tahun berjalan, semua bulan/triwulan/kategori/status)
  - Data laporan kembali ke tampilan penuh
- Evidence:
- Status: PASS / FAIL / SKIP

### 18.4 Summary Stat Cards

- [ ] Periksa 4 stat card: Total Dokumen, Sah/Arsip, Menunggu Verifikasi, Ditolak

- Expected result:
  - Nilai sesuai data aktual dengan filter yang diterapkan
  - Card "Ditolak" berwarna danger jika ada yang ditolak
- Evidence:
- Status: PASS / FAIL / SKIP

### 18.5 Tabel Rekap Status

- [ ] Periksa tabel "Rekap Berdasarkan Status"
- [ ] Verifikasi kolom: Status (badge), Label, Jumlah

- Expected result:
  - Setiap status DMS yang memiliki dokumen tampil di tabel
  - Badge status berwarna sesuai status
- Evidence:
- Status: PASS / FAIL / SKIP

### 18.6 Tabel Rekap Kategori

- [ ] Periksa tabel "Rekap Berdasarkan Kategori"
- [ ] Verifikasi kolom: Kategori (badge), Label, Jumlah

- Expected result:
  - Setiap kategori yang memiliki dokumen tampil di tabel
  - Badge kategori berwarna sesuai kategori
- Evidence:
- Status: PASS / FAIL / SKIP

### 18.7 Loading State Laporan

- [ ] Throttle network, refresh `/dms/reports`

- Expected result:
  - "Memuat laporan DMS" tampil saat load pertama (sebelum ada data)
  - Tabel menampilkan "Memuat rekap status / kategori" saat refresh
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 19. Export CSV

### 19.1 Export Tanpa Filter

- [ ] Buka `/dms/reports`
- [ ] Klik tombol "Export CSV" di header

- Expected result:
  - File CSV diunduh dengan nama `laporan-dms-YYYY.csv` (atau sesuai filter)
  - Tombol berubah menjadi "Exporting..." saat proses
  - Setelah selesai, tombol kembali normal
- Evidence:
- Status: PASS / FAIL / SKIP

### 19.2 Export dengan Filter

- [ ] Terapkan filter tahun + bulan
- [ ] Klik "Export CSV"

- Expected result:
  - Nama file mencerminkan filter (misal `laporan-dms-2026-bulan-5.csv`)
  - Isi CSV hanya berisi data yang sesuai filter
- Evidence:
- Status: PASS / FAIL / SKIP

### 19.3 Export dari Section Export

- [ ] Scroll ke section "Export Laporan" di bagian bawah halaman
- [ ] Klik tombol "Export CSV" di section tersebut

- Expected result:
  - Hasil sama dengan export dari header
  - Catatan "Ekspor akan mengunduh maksimal 5.000 baris..." tampil di sebelah tombol
- Evidence:
- Status: PASS / FAIL / SKIP

### 19.4 Export Disabled saat Loading

- [ ] Throttle network, klik Terapkan filter lalu segera amati tombol Export

- Expected result:
  - Tombol Export CSV disabled saat loading data berlangsung
  - Tombol Export juga disabled saat proses export berjalan
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 20. Permission-Aware UI Actions

### 20.1 Status DRAFT — Aksi yang Tersedia

- [ ] Buka detail dokumen berstatus DRAFT
- [ ] Periksa panel Aksi Dokumen

- Expected result:
  - **Tidak ada** tombol Submit Verifikasi (belum ada file)
  - **Tidak ada** tombol Verifikasi
  - **Tidak ada** tombol Tolak
  - **Tidak ada** tombol Arsipkan
  - Tombol **Hapus** tersedia
  - Hint: "Upload file terlebih dahulu..."
- Evidence:
- Status: PASS / FAIL / SKIP

### 20.2 Status UPLOADED — Aksi yang Tersedia

- [ ] Buka detail dokumen berstatus UPLOADED

- Expected result:
  - Tombol **Submit Verifikasi** tersedia
  - **Tidak ada** Verifikasi / Tolak / Arsipkan
  - Tombol **Hapus** tersedia
  - Hint: "Dokumen sudah memiliki file dan siap disubmit..."
- Evidence:
- Status: PASS / FAIL / SKIP

### 20.3 Status SUBMITTED — Aksi yang Tersedia

- [ ] Buka detail dokumen berstatus SUBMITTED

- Expected result:
  - Tombol **Verifikasi** tersedia
  - Tombol **Tolak** tersedia (warna danger)
  - **Tidak ada** Submit / Arsipkan
  - Tombol **Hapus** tersedia
  - Hint: "Dokumen sedang menunggu keputusan verifikasi."
- Evidence:
- Status: PASS / FAIL / SKIP

### 20.4 Status VERIFIED — Aksi yang Tersedia

- [ ] Buka detail dokumen berstatus VERIFIED

- Expected result:
  - Tombol **Arsipkan** tersedia
  - **Tidak ada** Submit / Verifikasi / Tolak
  - **Tidak ada** tombol Hapus
  - Banner "Dokumen sudah final..." tampil
  - Hint: "Dokumen sudah diverifikasi dan dapat diarsipkan..."
- Evidence:
- Status: PASS / FAIL / SKIP

### 20.5 Status ARCHIVED — Aksi yang Tersedia

- [ ] Buka detail dokumen berstatus ARCHIVED

- Expected result:
  - **Tidak ada** tombol apapun kecuali kemungkinan status tampil
  - Banner "Dokumen sudah final..." tampil
  - Hint: "Dokumen sudah masuk arsip final."
- Evidence:
- Status: PASS / FAIL / SKIP

### 20.6 Status REJECTED — Aksi yang Tersedia

- [ ] Buka detail dokumen berstatus REJECTED

- Expected result:
  - Tombol **Submit Verifikasi** tersedia (re-submit)
  - **Tidak ada** Verifikasi / Tolak / Arsipkan
  - Tombol **Hapus** tersedia
  - Hint berwarna merah: "Dokumen ditolak. Perbaiki metadata..."
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 21. Error Scenario

### 21.1 API Error — Dashboard

- [ ] Matikan backend sementara, buka `/dms`

- Expected result:
  - ErrorAlert tampil dengan pesan error yang deskriptif (bukan stack trace)
  - Halaman tidak crash (white screen)
  - Tombol Refresh tersedia dan dapat dicoba kembali
- Evidence:
- Status: PASS / FAIL / SKIP

### 21.2 API Error — List Dokumen

- [ ] Simulasi error endpoint `/dms/documents` (404 atau 500)

- Expected result:
  - ErrorAlert tampil di atas tabel
  - Filter bar tetap tampil
- Evidence:
- Status: PASS / FAIL / SKIP

### 21.3 API Error — Detail Dokumen

- [ ] Simulasi error endpoint `/dms/documents/:id` (404)

- Expected result:
  - Halaman menampilkan pesan dokumen tidak ditemukan
  - Tombol Kembali ke daftar tersedia
- Evidence:
- Status: PASS / FAIL / SKIP

### 21.4 API Error — Upload File

- [ ] Saat upload file di halaman detail, simulasi error 400/500 dari server

- Expected result:
  - ErrorAlert tampil dengan pesan dari API
  - Tombol Upload kembali aktif
  - File yang dipilih tetap ada di dropzone (tidak di-clear)
- Evidence:
- Status: PASS / FAIL / SKIP

### 21.5 API Error — Submit/Verify/Reject

- [ ] Simulasi error saat aksi workflow

- Expected result:
  - ErrorAlert tampil dengan pesan error
  - Status dokumen tidak berubah
  - Tombol aksi kembali aktif
- Evidence:
- Status: PASS / FAIL / SKIP

### 21.6 API Error — Reports

- [ ] Simulasi error endpoint `/dms/dashboard/summary`

- Expected result:
  - ErrorAlert tampil
  - Halaman tidak crash
  - Tombol Refresh dan Terapkan tetap dapat digunakan
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 22. Empty State

### 22.1 Dashboard — Belum Ada Dokumen

- [ ] Jika sistem belum ada data, buka `/dms`

- Expected result:
  - Summary card menampilkan semua nilai 0
  - Tabel Dokumen Terbaru menampilkan "Belum ada dokumen terbaru"
- Evidence:
- Status: PASS / FAIL / SKIP

### 22.2 List Dokumen — Tidak Ada Hasil Filter

- [ ] Terapkan filter yang tidak menghasilkan dokumen (misal tahun 1900)

- Expected result:
  - Tabel menampilkan "Belum ada dokumen DMS"
  - Tidak ada error atau crash
- Evidence:
- Status: PASS / FAIL / SKIP

### 22.3 Verifikasi — Tidak Ada Antrian

- [ ] Buka `/dms/verification` saat tidak ada dokumen SUBMITTED

- Expected result:
  - Tabel menampilkan "Belum ada dokumen DMS"
  - Badge menampilkan "0 MENUNGGU"
- Evidence:
- Status: PASS / FAIL / SKIP

### 22.4 Laporan — Tidak Ada Data

- [ ] Terapkan filter pada reports yang tidak menghasilkan data

- Expected result:
  - Stat card menampilkan semua nilai 0
  - Tabel rekap status dan kategori menampilkan empty state
- Evidence:
- Status: PASS / FAIL / SKIP

### 22.5 Audit Timeline — Dokumen Baru

- [ ] Buka detail dokumen yang baru dibuat (audit log belum ada)

- Expected result:
  - "Belum ada audit log" tampil dengan deskripsi kapan timeline akan tampil
- Evidence:
- Status: PASS / FAIL / SKIP

---

## 23. Final Acceptance Criteria

Semua item di bawah harus **PASS** sebelum rilis ke production:

- [ ] Semua 6 route DMS dapat diakses tanpa error
- [ ] Build production (`tsc && vite build`) hijau tanpa error
- [ ] Tidak ada white screen / crash pada kondisi normal
- [ ] Tidak ada white screen / crash pada kondisi error API
- [ ] Loading state tampil saat setiap request API berlangsung
- [ ] Error message tampil saat API gagal (bukan stack trace)
- [ ] Empty state tampil saat tidak ada data
- [ ] Status badge berwarna konsisten di semua halaman
- [ ] Action button hanya tampil sesuai status dokumen
- [ ] Download hanya tersedia pada dokumen yang memiliki file
- [ ] Upload form disabled saat ada file error aktif
- [ ] Double confirm sebelum hapus dokumen
- [ ] Redirect ke halaman yang benar setelah setiap aksi sukses
- [ ] Query param `worklogId` dan `caseId` terbaca dengan benar di halaman upload
- [ ] Export CSV menghasilkan file yang dapat dibuka di Excel/spreadsheet
- [ ] Audit timeline diperbarui setelah setiap aksi dokumen
- [ ] Semua navigasi antar halaman DMS berfungsi tanpa broken link

---

## Bug Log

Gunakan tabel berikut untuk mencatat semua FAIL yang ditemukan:

| # | Halaman | Item | Deskripsi Bug | Langkah Reproduksi | Severity | Status |
|---|---------|------|---------------|--------------------|----------|--------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

**Severity:** Critical / High / Medium / Low

---

## Hasil Akhir

| Kategori | Total Item | Pass | Fail | Skip |
|----------|-----------|------|------|------|
| Environment Setup | | | | |
| Login & Route | | | | |
| Dashboard | | | | |
| Upload | | | | |
| SIAP Integration | | | | |
| List & Filter | | | | |
| Detail & Preview | | | | |
| Download | | | | |
| Workflow (Submit/Verify/Reject/Archive/Delete) | | | | |
| Audit Timeline | | | | |
| Reports & Export | | | | |
| Permission-Aware UI | | | | |
| Error Scenario | | | | |
| Empty State | | | | |
| **Total** | | | | |

**Acceptance:** Rilis dapat dilanjutkan jika semua item Critical PASS dan tidak ada item High yang FAIL lebih dari 2.

---

*Dokumen ini dibuat untuk pengujian manual DMS SILAKAP V1.0. Perbarui setiap kali ada perubahan fitur signifikan.*
