# AUDIT-00 - Ringkasan Eksekutif Audit SILAKAP v1.0

Tanggal audit: 2026-05-28  
Repo: `aryaputra1976/silakap_v1.0`  
Status: Audit tahap 1 berdasarkan pembacaan repo aktual dan konteks desain organisasi BKPSDM/PPIK.

---

## 1. Kesimpulan Utama

SILAKAP v1.0 sudah berada pada arah arsitektur yang benar sebagai platform layanan kepegawaian berbasis workflow. Backend sudah memakai NestJS, TypeScript, Prisma, MySQL, sedangkan frontend memakai React, Vite, TypeScript, dan Tailwind. Root project juga sudah memisahkan build API dan web.

Integrasi OPD Submission ke SIAP sudah terbentuk: saat OPD mengirim pengajuan, SIAP Case otomatis dibuat, disubmit, task pertama dibuat, dan `siapCaseId` disimpan pada `OpdSubmission`.

Namun, untuk menjadi sistem kerja BKPSDM yang benar secara organisasi, masih ada deviasi penting:

1. Workflow awal SIAP masih menempatkan `ADMIN_BKPSDM` sebagai role tahap awal `VERIFIKASI_ADMIN`.
2. Auto-assignment sudah ada, tetapi masih memilih user pertama berdasarkan role, belum memilih pegawai aktif dengan beban kerja paling ringan.
3. `ADMIN_BKPSDM` dan `ANALIS_MUDA` masih masuk daftar role penugasan/reassign.
4. Kabid tidak boleh diposisikan sebagai aktor utama penugasan harian. Untuk pengajuan dari OPD, assignment harus otomatis ke pelaksana teknis/pool sesuai role dan beban kerja.
5. Belum terlihat model khusus `ANALIS_PERTAMA_POOL` yang menggabungkan Analis Pertama, Penelaah Teknis Kebijakan, dan PPPK Analis SDMA Ahli Pertama, sekaligus mengecualikan PPPK Paruh Waktu dari task digital.
6. Dashboard SIAP belum cukup untuk pemerataan kerja lintas pegawai.

---

## 2. Prioritas Temuan

| Prioritas | Area | Temuan | Dampak |
|---|---|---|---|
| P0 | SIAP Workflow/RBAC | Tahap awal workflow masih mengarah ke `ADMIN_BKPSDM` | Admin teknis berisiko menjadi aktor bisnis |
| P0 | Assignment SIAP | Auto-assignment memilih user aktif pertama berdasarkan role, bukan beban kerja | Pemerataan pekerjaan tidak berjalan |
| P0 | RBAC Penugasan | `ADMIN_BKPSDM` dan `ANALIS_MUDA` masih masuk role assign/reassign | Kewenangan tidak sesuai prinsip tata kelola |
| P1 | Struktur Role Operasional | Belum ada konsep `ANALIS_PERTAMA_POOL` | Penelaah dan PPPK Analis Pertama belum otomatis setara operasional |
| P1 | OPD -> SIAP | Integrasi sudah ada, tetapi assignment belum memakai pool dan beban | Integrasi belum optimal secara manajemen kerja |
| P1 | Dashboard | Belum ada dashboard pemerataan kerja SIAP | Pimpinan sulit memantau distribusi beban dan SLA |
| P2 | DMS | DMS sudah terhubung dengan audit dan OPD upload, tetapi pemetaan bukti dukung ke case/worklog perlu ditegaskan | Bukti dukung belum maksimal untuk audit kinerja |
| P2 | Frontend UX/RBAC | Tombol dan halaman perlu disesuaikan dengan role backend | Risiko tombol tampil untuk role yang tidak boleh melakukan aksi |
| P3 | Dokumentasi | Dokumen audit terkini belum tersedia | Patch bertahap sulit dikendalikan |

---

## 3. Arah Keputusan Desain

### 3.1 OPD Submission harus auto-assign ke teknis

Setiap pengajuan OPD yang masuk ke SIAP sebaiknya langsung dibuatkan task untuk pelaksana teknis berdasarkan pool dan beban kerja.

```text
OPD Submit
  -> OpdSubmission SUBMITTED
  -> SIAP Case dibuat
  -> SIAP Case ACTIVE
  -> Task awal dibuat
  -> Auto-assignment ke ANALIS_PERTAMA_POOL dengan beban paling ringan
```

### 3.2 Kabid bukan aktor utama penugasan rutin

Kabid berperan sebagai:

- pengendali mutu;
- approval pekerjaan penting;
- penerima eskalasi;
- reassign manual jika ada kendala;
- pemantau dashboard pemerataan;
- pengambil keputusan atas kasus khusus.

Kabid tidak menjadi bottleneck pada task normal dari OPD.

### 3.3 Admin teknis tidak menjadi aktor bisnis

`ADMIN_BKPSDM` sebaiknya dibatasi pada administrasi sistem, data master, konfigurasi teknis, dan bantuan operasional non-bisnis.

---

## 4. Rencana Patch Bertahap

### Tahap 1 - Dokumen audit dan baseline keputusan

Output:

- `docs/AUDIT-00-RINGKASAN-EKSEKUTIF.md`
- `docs/AUDIT-01-ARSITEKTUR-SILAKAP.md`
- `docs/AUDIT-02-DATA-MODEL-PRISMA.md`
- `docs/AUDIT-03-WORKFLOW-SIAP-LAYANAN.md`
- `docs/AUDIT-04-FRONTEND-UX-RBAC.md`

### Tahap 2 - Patch kecil workflow seed dan RBAC penugasan

Target:

- Hilangkan `ADMIN_BKPSDM` dari tahap awal bisnis.
- Hilangkan `ADMIN_BKPSDM` dan `ANALIS_MUDA` dari role assign/reassign rutin.
- Batasi assign/reassign ke `SUPER_ADMIN` emergency, `KABID` untuk kasus penting/escalation, dan `ANALIS_MADYA` jika didelegasikan.
- Ubah tahap awal agar masuk ke role operasional `ANALIS_PERTAMA`/pool teknis.

### Tahap 3 - Auto-assignment berbasis beban kerja

Target:

- Tambah repository method untuk menghitung task aktif per user.
- Pilih kandidat aktif berdasarkan role/pool dan unit kerja.
- Urutkan berdasarkan beban kerja aktif paling rendah.
- Hindari PPPK Paruh Waktu dari assignment digital.

### Tahap 4 - Dashboard pemerataan SIAP

Target metrik:

- task aktif per pegawai;
- task selesai per pegawai;
- task terlambat;
- bobot beban kerja;
- rata-rata waktu selesai;
- distribusi jenis layanan;
- daftar pegawai underload/overload.

### Tahap 5 - Penyesuaian frontend

Target:

- Tombol `Tugaskan` hanya muncul untuk role yang benar-benar boleh reassign.
- Halaman task membedakan `Tugas Saya`, `Tim`, dan `Supervisi`.
- Dashboard pemerataan masuk ke workspace SIAP.
