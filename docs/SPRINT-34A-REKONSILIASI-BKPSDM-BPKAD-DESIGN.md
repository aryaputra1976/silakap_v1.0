# Sprint 34A - Desain Rekonsiliasi BKPSDM-BPKAD

## 1. Tujuan

Sprint 34A menyiapkan desain terstruktur untuk modul Rekonsiliasi Data Kepegawaian ASN antara BKPSDM dan BPKAD. Fokus sprint ini adalah mengunci alur SOP, struktur menu, sumber data, mapping kolom awal, status lifecycle, RBAC, dan urutan implementasi agar pengembangan modul tidak langsung melebar ke banyak halaman kosong.

Modul ini berada di area internal PPIK/BKPSDM. OPD hanya menjadi pihak klarifikasi bila ada temuan yang memerlukan konfirmasi, bukan pengguna utama modul rekonsiliasi internal.

## 2. Dasar SOP

SOP Rekonsiliasi BKPSDM-BPKAD mengatur proses rutin untuk:

- mencocokkan data ASN aktif BKPSDM/SIASN dengan data Simgaji BPKAD;
- mendeteksi selisih status, pangkat, jabatan, unit kerja, dan komponen pembayaran;
- menetapkan matriks temuan R01-R10;
- melakukan klarifikasi OPD jika diperlukan;
- menetapkan rencana tindak lanjut;
- memperbaiki data BKPSDM/SIASN atau data BPKAD/Simgaji;
- menyusun Berita Acara Rekonsiliasi;
- menyusun laporan bulanan dan arsip/evidence.

Alur SOP utama:

```text
Jadwal Rekonsiliasi
-> Tarik Data ASN BKPSDM/SIASN
-> Tarik Data Simgaji BPKAD
-> Samakan Format dan Kunci Matching NIP
-> Matching Data
-> Identifikasi Temuan R01-R10
-> Klarifikasi OPD jika diperlukan
-> Rencana Tindak Lanjut
-> Perbaikan Data BKPSDM/SIASN
-> Perbaikan Data BPKAD/Simgaji
-> Berita Acara Rekonsiliasi
-> Laporan Bulanan
-> Arsip DMS dan Audit
```

## 3. Struktur Menu Final

Menu internal yang disarankan:

```text
Rekonsiliasi BKPSDM-BPKAD
├─ Dashboard Rekonsiliasi
├─ Jadwal & Periode Rekonsiliasi
├─ Import Data
│  ├─ Data ASN BKPSDM / SIASN
│  ├─ Data Simgaji BPKAD
│  └─ Riwayat Import
├─ Pencocokan Data
│  ├─ Mapping Format Data
│  ├─ Matching NIP
│  └─ Hasil Matching
├─ Matriks Temuan
│  ├─ Semua Temuan
│  ├─ Prioritas Segera
│  ├─ Prioritas Bulan Ini
│  └─ Kode Temuan R01-R10
├─ Klarifikasi & Tindak Lanjut
│  ├─ Klarifikasi OPD
│  ├─ Rencana Tindak Lanjut
│  ├─ Perbaikan Data BKPSDM / SIASN
│  └─ Perbaikan Data BPKAD / Simgaji
├─ Berita Acara
│  ├─ Draft Berita Acara
│  ├─ Finalisasi Berita Acara
│  └─ Arsip Berita Acara
├─ Laporan
│  ├─ Laporan Bulanan
│  ├─ Rekap Triwulan
│  └─ Print / Export
└─ Pengaturan
   ├─ Template Dataset
   ├─ Mapping Kolom
   ├─ Kode Temuan R01-R10
   └─ Cut-off Gaji
```

Untuk implementasi awal, sidebar cukup menampilkan menu ringkas:

```text
Rekonsiliasi BPKAD
├─ Dashboard
├─ Import Simgaji
├─ Import BKPSDM/SIASN
├─ Pencocokan Data
├─ Matriks Temuan
├─ Tindak Lanjut
├─ Berita Acara
└─ Laporan
```

## 4. Urutan Implementasi

Urutan yang direkomendasikan:

1. Sprint 34A - desain modul, struktur menu, mapping data, status, RBAC.
2. Sprint 34B - import dan preview Data Simgaji BPKAD.
3. Sprint 34C - import dan preview Data BKPSDM/SIASN.
4. Sprint 34D - matching NIP dan temuan awal R01/R02/R09.
5. Sprint 34E - matriks temuan, klarifikasi, dan rencana tindak lanjut.
6. Sprint 34F - Berita Acara, laporan, DMS evidence, audit, dan integrasi RHK bila sudah tervalidasi.

Prinsip implementasi:

- jangan membuat semua halaman sekaligus tanpa data model;
- jangan membuat hasil rekonsiliasi otomatis menjadi realisasi kinerja;
- jangan membuka modul internal ke OPD;
- jangan menganggap data Simgaji sebagai data final BKPSDM;
- jangan menyalin file fisik DMS tanpa kebutuhan;
- gunakan import preview dan quality gate sebelum commit data.

## 5. Data Simgaji BPKAD

File contoh ekspor Simgaji:

- `BACKUP_505000202604 0(7).xlsx`
- Sheet: `001_keluarga23042018`
- Header: 100 kolom
- Baris data terdeteksi: 1.409 baris

Kolom penting untuk tahap awal:

| Kolom | Makna Awal | Digunakan Untuk |
| --- | --- | --- |
| `tglgaji` | periode/bulan gaji | periode rekonsiliasi |
| `nip` | NIP utama | kunci matching |
| `niplama` | NIP lama | fallback matching |
| `nama` | nama ASN | validasi nama |
| `kdskpd` | kode SKPD pembayaran | matching unit/SKPD |
| `kdsatker` | kode satker | matching unit/SKPD |
| `nmskpd` | nama SKPD | tampilan dan matching |
| `nmsatker` | nama satker | tampilan dan matching |
| `kdstapeg` | kode status pegawai | validasi status |
| `tmtstop` | TMT stop/bayar | indikasi stop pembayaran |
| `kdpangkat` | kode pangkat/golongan | validasi pangkat |
| `mkgolt` | masa kerja golongan tahun | validasi payroll |
| `blgolt` | masa kerja golongan bulan | validasi payroll |
| `kdeselon` | kode eselon | indikasi jabatan/tunjangan |
| `kdfungsi` | kode fungsi | indikasi jabatan/tunjangan |
| `kdstruk` | kode struktural | indikasi jabatan/tunjangan |
| `gapok` | gaji pokok | komponen pembayaran |
| `tjistri` | tunjangan istri/suami | komponen pembayaran |
| `tjanak` | tunjangan anak | komponen pembayaran |
| `tjeselon` | tunjangan eselon | komponen pembayaran |
| `tjfungsi` | tunjangan fungsional | komponen pembayaran |
| `tjstruk` | tunjangan struktural | komponen pembayaran |
| `tjberas` | tunjangan beras | komponen pembayaran |
| `kotor` | total bruto | kontrol pembayaran |
| `potongan` | total potongan | kontrol pembayaran |
| `bersih` | total netto | kontrol pembayaran |
| `npwp` | NPWP | data identitas pendukung |
| `noktp` | NIK/KTP | data identitas pendukung |

Kolom wajib tahap 34B:

```text
tglgaji, nip, nama, kdskpd, kdsatker, kdstapeg, kdpangkat, gapok, kotor, potongan, bersih
```

Kolom opsional tahap 34B:

```text
niplama, nmskpd, nmsatker, npwp, noktp, tmtstop, kdeselon, kdfungsi, kdstruk
```

## 6. Data BKPSDM/SIASN

Data BKPSDM/SIASN untuk pembanding minimal perlu memuat:

| Field | Tujuan |
| --- | --- |
| NIP | kunci matching |
| NIP lama | fallback matching |
| Nama | validasi identitas |
| Status ASN/kedudukan hukum | deteksi status berbeda |
| Pangkat/golongan | deteksi R04 |
| Jabatan | deteksi R05 |
| Unit kerja/OPD | deteksi R06 |
| TMT pangkat | deteksi R07 |
| TMT jabatan | deteksi R07 |
| TMT pensiun/berhenti | deteksi R03/R02 |

Untuk versi awal, data BKPSDM dapat memakai data ASN existing di modul SIDATA jika sudah sinkron. Import BKPSDM/SIASN khusus dibuat setelah import Simgaji stabil.

## 7. Kode Temuan R01-R10

| Kode | Jenis Temuan | Prioritas |
| --- | --- | --- |
| R01 | Ada di BKPSDM, tidak ada di BPKAD | SEGERA |
| R02 | Ada di BPKAD, tidak ada di BKPSDM | SEGERA |
| R03 | Status kepegawaian berbeda | SEGERA |
| R04 | Pangkat/golongan berbeda | SEGERA |
| R05 | Jabatan berbeda | BULAN_INI |
| R06 | Unit kerja/OPD berbeda | BULAN_INI |
| R07 | TMT pangkat/jabatan berbeda | BULAN_INI |
| R08 | Nama/NIP bermasalah | SEGERA |
| R09 | ASN ganda | SEGERA |
| R10 | Komponen pembayaran tidak sesuai | BULAN_INI |

Prioritas:

- `SEGERA`: berisiko langsung pada pembayaran gaji, harus diselesaikan sebelum cut-off.
- `BULAN_INI`: diselesaikan paling lambat akhir bulan/periode rekonsiliasi.

## 8. Status Lifecycle

### Periode Rekonsiliasi

```text
DRAFT
OPEN
IMPORTING
READY_FOR_MATCHING
MATCHING
FINDINGS_REVIEW
FOLLOW_UP
BA_DRAFT
FINALIZED
ARCHIVED
CANCELLED
```

### Import Batch

```text
UPLOADED
VALIDATING
VALIDATED
HAS_ISSUES
COMMITTED
FAILED
CANCELLED
```

### Temuan Rekonsiliasi

```text
OPEN
NEEDS_CLARIFICATION
CLARIFIED
IN_FOLLOW_UP
BKPSDM_FIXED
BPKAD_FIXED
RESOLVED
REJECTED
ARCHIVED
```

## 9. Model Data Awal

Model minimal yang disarankan untuk Sprint 34B-34C:

```text
ReconciliationPeriod
ReconciliationImportBatch
ReconciliationBpkadPayrollRecord
ReconciliationBkpsdmAsnSnapshot
ReconciliationFinding
ReconciliationFollowUp
ReconciliationAuditLog
```

Sprint 34B cukup membuat:

- `ReconciliationPeriod`
- `ReconciliationImportBatch`
- `ReconciliationBpkadPayrollRecord`
- `ReconciliationAuditLog`

Model matching dan temuan baru dibuat setelah kedua sumber data tersedia.

## 10. Endpoint Awal Sprint 34B

Base path:

```text
/api/v1/reconciliation/bpkad
```

Endpoint awal:

```text
GET  /periods
POST /periods
GET  /imports/bpkad-simgaji
POST /imports/bpkad-simgaji/upload
GET  /imports/bpkad-simgaji/:id
GET  /imports/bpkad-simgaji/:id/rows
POST /imports/bpkad-simgaji/:id/cancel
```

Sprint 34B upload masih fokus pada:

- baca file Excel;
- validasi header;
- hitung total baris;
- simpan batch dan staging row;
- tampilkan preview;
- belum melakukan matching otomatis;
- belum mengubah data ASN/BKPSDM existing.

## 11. Struktur Route Frontend Awal

Route awal:

```text
/rekonsiliasi-bpkad
/rekonsiliasi-bpkad/dashboard
/rekonsiliasi-bpkad/import/simgaji
/rekonsiliasi-bpkad/import/bkpsdm
/rekonsiliasi-bpkad/matching
/rekonsiliasi-bpkad/temuan
/rekonsiliasi-bpkad/tindak-lanjut
/rekonsiliasi-bpkad/berita-acara
/rekonsiliasi-bpkad/laporan
```

Untuk Sprint 34B, route yang wajib hidup:

```text
/rekonsiliasi-bpkad/dashboard
/rekonsiliasi-bpkad/import/simgaji
```

Route lainnya boleh hidup sebagai empty state yang jujur, tetapi tidak boleh mengklaim fitur sudah memproses data.

## 12. RBAC

| Role | Akses |
| --- | --- |
| SUPER_ADMIN | penuh |
| ADMIN_BKPSDM | penuh |
| KEPALA_BADAN | view dashboard/laporan/BA |
| KABID | monitor, finalisasi, laporan |
| ANALIS_MADYA | import, matching, verifikasi, tindak lanjut, laporan |
| ANALIS_MUDA | import, matching, verifikasi, tindak lanjut |
| ANALIS_PERTAMA | input/verifikasi awal, catatan |
| PENELAAH | input/verifikasi awal, catatan |
| PPPK | import/input terbatas, tidak finalisasi |
| OPD | tidak akses modul internal |

OPD dapat dilibatkan di kemudian hari melalui mekanisme klarifikasi terpisah, tetapi tidak boleh melihat seluruh data payroll atau matriks temuan internal.

## 13. Quality Gate Import Simgaji

Sebelum batch dianggap valid:

- file harus `.xlsx` atau `.xls`;
- ukuran file mengikuti batas upload internal;
- sheet pertama harus dapat dibaca;
- kolom wajib harus ada;
- baris tanpa NIP tidak boleh dianggap valid;
- NIP ganda diberi warning;
- nilai gaji utama harus dapat dibaca sebagai angka atau kosong terkontrol;
- batch duplikat berdasarkan checksum diberi peringatan;
- data tidak langsung dicommit sebagai hasil rekonsiliasi final.

## 14. Audit

Audit minimal:

| Action | Keterangan |
| --- | --- |
| CREATE_PERIOD | membuat periode rekonsiliasi |
| UPLOAD_BPKAD_PAYROLL | upload file Simgaji |
| VALIDATE_BPKAD_PAYROLL | validasi header/baris |
| CANCEL_IMPORT | membatalkan batch import |
| PREVIEW_IMPORT_ROWS | optional read audit jika diperlukan |

Catatan nama action di implementasi sebaiknya ASCII uppercase dan stabil. Gunakan `UPLOAD_BPKAD_PAYROLL` dan `VALIDATE_BPKAD_PAYROLL` untuk menghindari variasi penulisan Simgaji/SIMGAJI.

## 15. Hubungan Dengan DMS, SOP, dan RHK

Modul rekonsiliasi menghasilkan evidence untuk:

- DMS: dataset, matriks temuan, BA, laporan;
- SOP checklist: pengendalian proses rekonsiliasi;
- SKP/RHK: hanya menjadi kandidat/bukti dukung setelah laporan/BA divalidasi.

Hasil import atau matching tidak otomatis menjadi realisasi kinerja.

## 16. Known Limitations Awal

- File contoh Simgaji memiliki banyak kode numerik; sebagian membutuhkan tabel referensi untuk label manusiawi.
- Nama jabatan lengkap tidak tampak eksplisit dalam file Simgaji; R05 membutuhkan mapping kode jabatan/tunjangan atau pembanding dari BKPSDM/SIASN.
- Kalender cut-off gaji BPKAD belum dimodelkan khusus.
- OPD clarification portal belum dibuat.
- Berita Acara dan laporan belum dibuat pada Sprint 34B.

## 17. Acceptance Criteria Sprint 34A

1. Desain modul Rekonsiliasi BKPSDM-BPKAD terdokumentasi.
2. Struktur menu final disepakati.
3. Mapping awal kolom Simgaji terdokumentasi.
4. Kode temuan R01-R10 terdokumentasi.
5. Status lifecycle terdokumentasi.
6. RBAC internal jelas dan OPD tidak diberi akses internal.
7. Urutan implementasi Sprint 34B-34F jelas.

## 18. Recommended Sprint 34B

Sprint berikutnya sebaiknya langsung membangun import Simgaji BPKAD:

1. tambah model Prisma import batch dan row Simgaji;
2. tambah endpoint upload multipart Excel;
3. parsing workbook memakai dependency `xlsx` yang sudah tersedia di API;
4. validasi header wajib;
5. simpan preview row;
6. buat halaman `/rekonsiliasi-bpkad/import/simgaji`;
7. tampilkan batch, summary, issue, dan preview;
8. belum melakukan matching otomatis.
