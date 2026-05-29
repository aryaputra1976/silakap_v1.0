# SILAKAP Core Flow — Layanan PPIK

## 1. Tujuan

Dokumen ini mengunci arah arsitektur inti SILAKAP untuk fase awal pengembangan.

Untuk sementara, SILAKAP difokuskan pada Bidang Pengadaan, Pemberhentian, dan Informasi Kepegawaian (PPIK), dengan layanan awal:

1. Peremajaan Data ASN
2. Pemberhentian/Pensiun ASN

Dokumen ini menjadi pedoman agar pengembangan tidak tumpang tindih antara Layanan Kepegawaian, OPD Submission, SIAP, SIPENSIUN, DMS, SIDATA ASN, dan modul laporan.

---

## 2. Keputusan Arsitektur Inti

Keputusan final:

```text
Layanan Kepegawaian = menu/loket utama layanan PPIK
OpdSubmission       = permohonan resmi dari OPD/user
SiapCase            = case kerja internal/workflow
SipensiunCase       = detail khusus pensiun/pemberhentian
DmsDocument         = dokumen syarat, bukti dukung, dan arsip
Asn                 = master data ASN
AsnChangeLog        = catatan perubahan data ASN
```

Dengan keputusan ini, Layanan Kepegawaian tidak boleh menjadi sistem paralel yang tumpang tindih dengan SIPENSIUN atau SIAP.

---

## 3. Mana Saja yang Masuk ke Dokumen Ini

Dokumen ini mencakup:

| Bagian | Masuk di sini? | Keterangan |
|---|---:|---|
| Definisi Layanan Kepegawaian | Ya | Sebagai loket/menu utama layanan PPIK |
| Definisi OpdSubmission | Ya | Sebagai permohonan resmi |
| Definisi SiapCase | Ya | Sebagai mesin kerja internal |
| Definisi SipensiunCase | Ya | Sebagai detail pensiun/pemberhentian |
| Definisi DMS | Ya | Sebagai tempat dokumen syarat/bukti dukung |
| Definisi ASN | Ya | Sebagai data ASN yang menjadi objek layanan |
| Definisi AsnChangeLog | Ya | Sebagai audit perubahan data ASN |
| Detail daftar layanan | Tidak detail | Detailnya ada di `SERVICE-CATALOG-PPIK.md` |
| Detail alur Peremajaan Data | Tidak detail | Detailnya ada di `PEREMAJAAN-DATA-ASN-FLOW.md` |
| Detail alur SIPENSIUN | Tidak detail | Detailnya ada di `SIPENSIUN-PEMBERHENTIAN-FLOW.md` |

---

## 4. Peran Tiap Komponen

| Komponen | Peran Final |
|---|---|
| Layanan Kepegawaian | Loket/menu utama layanan PPIK |
| OpdSubmission | Entitas permohonan resmi dari OPD/user |
| SiapCase | Mesin kerja internal untuk case, tugas, disposisi, dan tindak lanjut |
| SipensiunCase | Detail domain khusus pensiun dan pemberhentian ASN |
| DmsDocument | Penyimpanan dokumen syarat, bukti dukung, dan arsip |
| Asn | Master data ASN |
| AsnChangeLog | Audit perubahan data ASN |
| SiapTask | Tugas internal yang lahir dari case |
| SiapWorklog | Catatan kerja pegawai terhadap case/tugas |
| Audit Log / Timeline | Jejak proses, perubahan status, dan tindakan user |

---

## 5. Alur Besar SILAKAP PPIK

```text
OPD/User mengajukan layanan
        ↓
OpdSubmission dibuat
        ↓
Dokumen syarat diunggah
        ↓
Verifikasi awal
        ↓
Jika perlu proses internal → SiapCase dibuat
        ↓
Jika jenis layanan pensiun/pemberhentian → SipensiunCase dibuat
        ↓
Dokumen tersimpan/terhubung ke DMS
        ↓
Proses verifikasi dan tindak lanjut
        ↓
Jika perubahan data ASN → update Asn + tulis AsnChangeLog
        ↓
Selesai + arsip + laporan
```

---

## 6. Aturan Relasi Final

| Relasi | Aturan |
|---|---|
| OpdSubmission → SiapCase | Dibuat ketika permohonan membutuhkan proses internal |
| SiapCase → SipensiunCase | Hanya dibuat untuk layanan pensiun/pemberhentian |
| SiapCase → DmsDocument | Digunakan untuk dokumen syarat dan bukti proses |
| Asn → AsnChangeLog | Wajib dibuat setiap ada perubahan data ASN |
| DmsDocument → Asn | Digunakan untuk dokumen yang melekat pada ASN |
| DmsDocument → SiapCase | Digunakan untuk dokumen layanan/case |
| DmsDocument → SiapWorklog | Digunakan untuk bukti kerja atau tindak lanjut |
| SiapTask → SiapWorklog | Tugas internal dapat menghasilkan catatan kerja |

---

## 7. Larangan Arsitektur

Hindari pola berikut:

```text
Layanan Kepegawaian punya status sendiri
SIPENSIUN punya status sendiri
SIAP punya status sendiri
DMS punya status sendiri
semuanya tidak sinkron
```

Yang benar:

```text
OpdSubmission = status permohonan
SiapCase      = status pekerjaan internal
SipensiunCase = detail teknis pensiun/pemberhentian
DMS           = status dokumen
AsnChangeLog  = audit perubahan data ASN
```

---

## 8. Prinsip Backend

1. Backend adalah single source of truth.
2. Frontend tidak boleh menentukan status akhir tanpa validasi backend.
3. Semua aksi penting wajib melalui service.
4. Semua perubahan data ASN wajib punya audit log.
5. Semua perubahan data ASN sensitif wajib punya dokumen bukti.
6. Semua dokumen syarat wajib tersimpan atau terhubung ke DMS.
7. Semua workflow harus tervalidasi berdasarkan role, permission, dan status saat ini.

---

## 9. Prioritas Implementasi

Urutan implementasi:

```text
1. Kunci katalog layanan PPIK
2. Peremajaan Data ASN
3. Pemberhentian/Pensiun ASN
4. Integrasi DMS
5. Integrasi SIAP task/worklog
6. Dashboard dan laporan
```

---

## 10. Definisi Selesai

Core flow dianggap stabil jika:

1. Permohonan layanan bisa dibuat.
2. Dokumen wajib bisa ditentukan berdasarkan jenis layanan.
3. Dokumen bisa diverifikasi.
4. Peremajaan data tidak bisa selesai tanpa dokumen verified.
5. Perubahan data ASN tercatat di AsnChangeLog.
6. SIPENSIUN tidak berdiri sendiri tanpa OpdSubmission/SiapCase.
7. DMS menjadi sumber dokumen syarat dan bukti dukung.
8. Timeline/audit log tercatat pada setiap aksi penting.
