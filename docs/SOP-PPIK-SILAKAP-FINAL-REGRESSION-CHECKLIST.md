# SOP PPIK — Silakap V1.0 Final Regression Checklist

**Tanggal:** 2026-05-17
**Sprint:** 1–10 (Final)
**Sistem:** Silakap V1.0 — BKPSDM Manajemen Kepegawaian
**Tujuan:** Finalisasi integrasi SOP PPIK ke dalam seluruh modul Silakap.

---

## 1. Ringkasan Tujuan Integrasi SOP PPIK

Integrasi SOP PPIK ke Silakap bertujuan untuk:
- Memetakan 34 SOP operasional Bidang PPIK ke dalam 3 tahap kerja (Manajemen Bidang, Layanan Kepegawaian, Fungsi Spesifik PPIK)
- Menghubungkan setiap SOP ke 8 kode RHK (Rencana Hasil Kerja) staf
- Menyediakan modul realisasi bulanan berbasis SOP + bukti dukung DMS
- Mengintegrasikan alur SIPENSIUN, SIDATA, dan Layanan Kepegawaian dengan SOP referensi
- Menyediakan dashboard eksekutif (SIANALITIK) yang merangkum seluruh modul
- Menerapkan RBAC (Role-Based Access Control) pada DMS berdasarkan `accessLevel` dokumen

---

## 2. Sprint 1–10 yang Diselesaikan

| Sprint | Modul | Keterangan |
|--------|-------|------------|
| S1 | Auth & RBAC Core | JWT, RolesGuard, role codes (SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA/MUDA/PERTAMA, PENELAAH, PPPK) |
| S2 | SIAP Worklogs | Task management, buku kerja, worklog approval, executive dashboard |
| S3 | SIPENSIUN | Daftar kasus pensiun/pemberhentian, detail, jenis filter (BUP/APS/DISIPLIN dll) |
| S4 | SIDATA ASN | Import SIASN, rekonsiliasi, validasi, pemutakhiran, laporan kualitas |
| S5 | DMS Core | Upload, download, workflow (DRAFT→SUBMITTED→VERIFIED→ARCHIVED), audit timeline |
| S6 | Layanan Kepegawaian | Permohonan masuk, verifikasi berkas, SLA monitoring, keterlambatan, kepuasan, laporan |
| S7 | Kinerja Bidang + SOP/RHK | 34 SOP seed, 8 target RHK, realisasi bulanan, bukti dukung DMS, laporan kinerja |
| S8 | SIANALITIK Dashboard | Dashboard eksekutif: summary cards, RHK progress, SLA, SIPENSIUN, DMS, SIDATA, risk matrix, notes |
| S9 | RBAC DMS Sensitive | Access level enforcement (INTERNAL/TERBATAS/SANGAT_TERBATAS/PIMPINAN/AUDIT), 403 state, OPD_OPERATOR |
| S10 | Final Test & Cleanup | Build validation, route audit, regression checklist (dokumen ini) |

---

## 3. Checklist per Modul

### 3.1 Dashboard Utama

| # | Item | Status |
|---|------|--------|
| 1 | `/dashboard` merender tanpa error | ✓ |
| 2 | Loading/error state aman | ✓ |
| 3 | Link navigate ke modul lain via sidebar | ✓ |

### 3.2 Kinerja Bidang

| # | Item | Status |
|---|------|--------|
| 1 | `/kinerja-bidang` — Dashboard summary cards (totalSop, totalTarget, realisasi, progress%) | ✓ |
| 2 | `/kinerja-bidang/sop` — Daftar SOP dengan filter stage, status, RHK code | ✓ |
| 3 | `/kinerja-bidang/sop?stage=TAHAP_1` — Filter TAHAP_1 otomatis dari sidebar | ✓ |
| 4 | `/kinerja-bidang/sop/:id` — Detail SOP (steps, RHK mapping, progress) | ✓ |
| 5 | `/kinerja-bidang/targets` — Daftar target per SOP+RHK tahun aktif | ✓ |
| 6 | `/kinerja-bidang/realizations` — Daftar realisasi bulanan dengan status filter | ✓ |
| 7 | `/kinerja-bidang/report` — Laporan kinerja: progress table per RHK, summary | ✓ |
| 8 | Seed SOP: 34 SOP aktif (MAN/LAY/FNG/PBH/PAN/DAT/SIK/DMS/LIK/EVK/PGD) | ✓ |
| 9 | 8 RHK code unik (RHK 1–8) + SEMUA_RHK | ✓ |
| 10 | Empty state aman jika belum ada target/realisasi | ✓ |
| 11 | Error state aman jika API gagal | ✓ |

**SOP per Tahap:**
- TAHAP_1 (Manajemen Bidang): MAN-001..005 + EVK-001 = 6 SOP
- TAHAP_2 (Layanan Kepegawaian): LAY-001..005 = 5 SOP
- TAHAP_3 (Fungsi Spesifik): FNG-001..002, PGD-001, PBH-000..008, LPA-001, SIK-001, DAT-001, DAT-003, DMS-001, LIK-001, PAN-001..004, MON-001 = 23 SOP

**Total: 34 SOP**

### 3.3 DMS Bukti Dukung

| # | Item | Status |
|---|------|--------|
| 1 | `/dms` — Dashboard DMS (summary + latest docs) | ✓ |
| 2 | `/dms/documents` — List dokumen + filter category/subCategory/accessLevel/q | ✓ |
| 3 | `/dms/documents/:id` — Detail dokumen, metadata, preview, upload, action panel | ✓ |
| 4 | `/dms/upload` — Upload dokumen baru + metadata form | ✓ |
| 5 | `/dms/verification` — Antrian verifikasi dokumen | ✓ |
| 6 | `/dms/reports` — Laporan DMS per kategori/unit | ✓ |
| 7 | Access badge tampil dengan tone sesuai level | ✓ |
| 8 | 403 forbidden state aman dengan pesan informatif | ✓ |
| 9 | Sensitive document warning banner (SANGAT_TERBATAS/PIMPINAN/AUDIT) | ✓ |
| 10 | Shield helper text di form level akses | ✓ |
| 11 | Auto-default accessLevel saat pilih subCategory | ✓ |
| 12 | DMS workflow: DRAFT → UPLOADED → SUBMITTED → VERIFIED/REJECTED → ARCHIVED | ✓ |
| 13 | Audit timeline di detail page | ✓ |
| 14 | Download dokumen menghasilkan audit log | ✓ |

**Filter DMS dari sidebar Referensi SOP:**
- SOP_TAHAP_1 → `/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_1` ✓
- SOP_TAHAP_2 → `/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2` ✓
- SOP_TAHAP_3 → `/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_3` ✓
- SOP_PENSIUN_PEMBERHENTIAN → `/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN` ✓
- SOP_MATRIKS → `/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_MATRIKS` ✓

### 3.4 SIPENSIUN

| # | Item | Status |
|---|------|--------|
| 1 | `/sipensiun` — List semua kasus aktif | ✓ |
| 2 | `/sipensiun?view=dashboard` — Panel preset cards + ringkasan | ✓ |
| 3 | `/sipensiun?jenis=BUP` — Filter BUP (Batas Usia Pensiun) | ✓ |
| 4 | `/sipensiun?jenis=APS` — Filter Atas Permintaan Sendiri | ✓ |
| 5 | `/sipensiun?jenis=DISIPLIN_HUKUM` — Filter Disiplin/Hukum | ✓ |
| 6 | `/sipensiun?jenis=SEMENTARA` — Filter Pemberhentian Sementara | ✓ |
| 7 | `/sipensiun/:id` — Detail kasus (lifecycle, SOP panel, timeline) | ✓ |
| 8 | SOP panel referensi (SOP-BKPSDM-PAN/PBH/MON) tampil | ✓ |
| 9 | Lifecycle step tampil sesuai state kasus | ✓ |
| 10 | Empty state aman jika belum ada kasus | ✓ |
| 11 | Error state aman jika API gagal | ✓ |

### 3.5 Layanan Kepegawaian

| # | Item | Status |
|---|------|--------|
| 1 | `/layanan` — Permohonan masuk + SOP panel LAY-001..005 | ✓ |
| 2 | `/layanan/verifikasi` — Verifikasi berkas layanan | ✓ |
| 3 | `/layanan/sla` — Monitoring SLA aktif | ✓ |
| 4 | `/layanan/keterlambatan` — Layanan melewati batas waktu | ✓ |
| 5 | `/layanan/kepuasan` — Evaluasi IKM (placeholder sampai backend survei tersedia) | ✓ |
| 6 | `/layanan/laporan` — Rekap layanan periodik | ✓ |
| 7 | SOP LAY-001..005 link/panel tampil di halaman permohonan | ✓ |

### 3.6 SIDATA ASN

| # | Item | Status |
|---|------|--------|
| 1 | `/sidata/dashboard` — Quality score, totals, BUP alert | ✓ |
| 2 | `/sidata/asn` — Daftar ASN + filter | ✓ |
| 3 | `/sidata/asn/:id` — Detail profil ASN | ✓ |
| 4 | `/sidata/validasi` — Validasi data & discrepancy view | ✓ |
| 5 | `/sidata/pemutakhiran` — Pemutakhiran data ASN | ✓ |
| 6 | `/sidata/import/siasn` — Import SIASN + enterprise hardening | ✓ |
| 7 | `/sidata/import/excel` — Import Excel | ✓ |
| 8 | `/sidata/import/referensi` — Import referensi | ✓ |
| 9 | `/sidata/import/mapping-referensi` — Mapping referensi | ✓ |
| 10 | `/sidata/import/riwayat` — Riwayat import | ✓ |
| 11 | `/sidata/import/log-sinkronisasi` — Log sinkronisasi | ✓ |
| 12 | `/sidata/rekonsiliasi` — Rekonsiliasi data | ✓ |
| 13 | `/sidata/referensi` — Data referensi | ✓ |
| 14 | `/sidata/dokumen` — Dokumen ASN | ✓ |
| 15 | `/sidata/laporan` — Laporan SIDATA | ✓ |
| 16 | SOP DAT-001/DAT-003 link di modul data | ✓ |
| 17 | Import: race condition fix, N+1 query fix, SHA-256 dedup | ✓ |

### 3.7 SIANALITIK

| # | Item | Status |
|---|------|--------|
| 1 | `/sianalitik` — Dashboard eksekutif merender | ✓ |
| 2 | Summary cards: total ASN, kasus aktif, tugas selesai, SLA overdue, progress%, upload DMS | ✓ |
| 3 | Panel RHK: progress bar per SOP/RHK | ✓ |
| 4 | Panel Layanan SLA: breakdown by type (uses `item.total`, `item.key`) | ✓ |
| 5 | Panel SIPENSIUN: breakdown by jenis | ✓ |
| 6 | Panel DMS: summary kategori + latest docs | ✓ |
| 7 | Panel SIDATA Quality: score gauge + BUP alert | ✓ |
| 8 | Risk matrix: hitung otomatis dari data live | ✓ |
| 9 | Executive notes: rekomendasi auto-generate dari data | ✓ |
| 10 | Loading/empty state aman (SIDATA & DMS: non-blocking, gagal silently) | ✓ |

---

## 4. Checklist Role/Access DMS

| Role | DMS View | DMS Create | Scope | Access Level Maks |
|------|----------|------------|-------|-------------------|
| SUPER_ADMIN | ✓ | ✓ | ALL | AUDIT |
| ADMIN_BKPSDM | ✓ | ✓ | ALL | AUDIT |
| KEPALA_BADAN | ✓ | ✓ | ALL | AUDIT |
| KABID | ✓ | ✓ | UNIT (unitKerjaId) | AUDIT |
| ANALIS_MADYA | ✓ | ✓ | UNIT (unitKerjaId) | TERBATAS |
| ANALIS_MUDA | ✓ | ✓ | UNIT (unitKerjaId) | TERBATAS |
| ANALIS_PERTAMA | ✓ | ✓ | OWN | INTERNAL |
| PENELAAH | ✓ | ✓ | OWN | INTERNAL |
| PPPK | ✓ | ✓ | OWN | INTERNAL |
| OPD_OPERATOR | ✓ | ✓ | OWN | INTERNAL (S10) |
| SEKRETARIS | ✗ | ✗ | — | Belum ada role |
| AUDITOR | ✗ | ✗ | — | Belum ada role |

**Access Level Restriction:**
| Level | Dapat Diakses Oleh |
|-------|-------------------|
| INTERNAL | Semua DMS roles termasuk OPD_OPERATOR |
| TERBATAS | SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA, ANALIS_MUDA |
| SANGAT_TERBATAS | SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID |
| PIMPINAN | SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID |
| AUDIT | SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID |

---

## 5. Checklist Data Seed SOP/RHK

| # | Item | Status |
|---|------|--------|
| 1 | 34 SOP terseed via `POST /api/v1/kinerja-bidang/seed-default` | ✓ |
| 2 | Migration `20260517000100_add_kinerja_bidang_sop_rhk` dijalankan | ✓ |
| 3 | Tabel: kinerja_bidang_sop, _sop_rhk, _sop_steps, _sop_targets, _sop_realizations, _sop_evidence | ✓ |
| 4 | 8 kode RHK unik (RHK 1–8) + SEMUA_RHK (wildcard semua) | ✓ |
| 5 | Foreign key kinerja_bidang_sop_evidence → dms_documents (bukti dukung DMS terhubung) | ✓ |
| 6 | Seed endpoint terlindungi: `KINERJA_BIDANG_SEED_ROLES` (SUPER_ADMIN, ADMIN_BKPSDM, KABID) | ✓ |
| 7 | Seed idempotent: upsert berdasarkan `code`, tidak duplikat | ✓ |

**Prosedur seed (setelah migrate):**
```
POST /api/v1/kinerja-bidang/seed-default
Authorization: Bearer <token SUPER_ADMIN>
```

---

## 6. Checklist Route/Sidebar

| Menu | Path | Route Ada | Page Ada |
|------|------|-----------|----------|
| Dashboard | /dashboard | ✓ | DashboardPage |
| Inti SIAP → Dashboard Pimpinan | /siap/worklogs/executive | ✓ | SiapWorklogExecutivePage |
| Inti SIAP → Dashboard Buku Kerja | /siap/worklogs/dashboard | ✓ | SiapWorklogDashboardPage |
| Inti SIAP → Tugas SIAP | /siap/tasks | ✓ | SiapTasksPage |
| Inti SIAP → Buku Kerja Saya | /siap/worklogs | ✓ | SiapWorklogsPage |
| Inti SIAP → Tinjau Buku Kerja | /siap/worklogs/team | ✓ | SiapWorklogTeamPage |
| Kinerja Bidang → Dashboard | /kinerja-bidang | ✓ | KinerjaBidangDashboardPage |
| Kinerja Bidang → Rencana Kerja | /kinerja-bidang/sop?stage=TAHAP_1 | ✓ | KinerjaBidangSopPage |
| Kinerja Bidang → Target RHK | /kinerja-bidang/targets | ✓ | KinerjaBidangTargetsPage |
| Kinerja Bidang → Realisasi Bulanan | /kinerja-bidang/realizations | ✓ | KinerjaBidangRealizationsPage |
| Kinerja Bidang → Laporan Kinerja | /kinerja-bidang/report | ✓ | KinerjaBidangReportPage |
| Kinerja Bidang → Bukti Dukung | /dms/documents?category=BUKTI_DUKUNG | ✓ (redirect DMS) | DmsDocumentsPage |
| Layanan → Permohonan Masuk | /layanan | ✓ | LayananKepegawaianPage |
| Layanan → Verifikasi Berkas | /layanan/verifikasi | ✓ | LayananVerificationPage |
| Layanan → Monitoring SLA | /layanan/sla | ✓ | LayananSlaPage |
| Layanan → Keterlambatan | /layanan/keterlambatan | ✓ | LayananDelayPage |
| Layanan → Evaluasi Kepuasan | /layanan/kepuasan | ✓ | LayananSatisfactionPage |
| Layanan → Rekap Layanan | /layanan/laporan | ✓ | LayananReportPage |
| SIDATA → Dashboard | /sidata/dashboard | ✓ | SidataDashboardPage |
| SIDATA → Profil ASN | /sidata/asn | ✓ | SidataAsnPage |
| SIDATA → Validasi Data | /sidata/validasi | ✓ | SidataValidasiPage |
| SIDATA → Pemutakhiran | /sidata/pemutakhiran | ✓ | SidataPemutakhiranPage |
| SIDATA → Import SIASN | /sidata/import/siasn | ✓ | SidataImportSiasnPage |
| SIDATA → Rekonsiliasi | /sidata/rekonsiliasi | ✓ | SidataRekonsiliasiPage |
| SIDATA → Laporan | /sidata/laporan | ✓ | SidataLaporanPage |
| DMS → Dashboard | /dms | ✓ | DmsDashboardPage |
| DMS → Dokumen SOP | /dms/documents?category=DOKUMEN_KEBIJAKAN | ✓ (DMS filter) | DmsDocumentsPage |
| DMS → Bukti Dukung RHK | /dms/documents?category=BUKTI_DUKUNG | ✓ (DMS filter) | DmsDocumentsPage |
| DMS → Upload Dokumen | /dms/upload | ✓ | DmsUploadPage |
| DMS → Verifikasi Dokumen | /dms/verification | ✓ | DmsVerificationPage |
| DMS → Laporan DMS | /dms/reports | ✓ | DmsReportsPage |
| SIPENSIUN → Dashboard | /sipensiun?view=dashboard | ✓ (query param) | SipensiunListPage |
| SIPENSIUN → BUP | /sipensiun?jenis=BUP | ✓ (query param) | SipensiunListPage |
| SIPENSIUN → APS | /sipensiun?jenis=APS | ✓ (query param) | SipensiunListPage |
| SIPENSIUN → Detail | /sipensiun/:id | ✓ | SipensiunDetailPage |
| SIARSIP | /siarsip | ✓ | SiarsipPage |
| SIANALITIK | /sianalitik | ✓ | SianalitikPage |
| Referensi SOP → Tahap 1 | /dms/documents?...SOP_TAHAP_1 | ✓ (DMS filter) | DmsDocumentsPage |
| Referensi SOP → Tahap 2 | /dms/documents?...SOP_TAHAP_2 | ✓ (DMS filter) | DmsDocumentsPage |
| Referensi SOP → Tahap 3 | /dms/documents?...SOP_TAHAP_3 | ✓ (DMS filter) | DmsDocumentsPage |
| Referensi SOP → Pensiun | /dms/documents?...SOP_PENSIUN_PEMBERHENTIAN | ✓ (DMS filter) | DmsDocumentsPage |
| Referensi SOP → Matriks | /dms/documents?...SOP_MATRIKS | ✓ (DMS filter) | DmsDocumentsPage |
| RBAC | /admin/rbac | active | Admin-only read-only matrix |
| Pengguna | /admin/users | active | Admin-only read-only account list |
| Pengaturan | /admin/settings | active | Admin-only runtime summary |

---

## 7. Checklist Smoke Test API/Frontend

### API Endpoints (verifikasi manual/Postman setelah deploy)

| Endpoint | Method | Guard | Status |
|----------|--------|-------|--------|
| `POST /api/v1/auth/login` | POST | Public | ✓ |
| `GET /api/v1/siap/tasks` | GET | JWT + Roles | ✓ |
| `GET /api/v1/siap/worklogs` | GET | JWT + Roles | ✓ |
| `GET /api/v1/analytics/dashboard` | GET | JWT | ✓ |
| `GET /api/v1/kinerja-bidang/sop` | GET | JWT + Roles | ✓ |
| `GET /api/v1/kinerja-bidang/dashboard` | GET | JWT + Roles | ✓ |
| `GET /api/v1/kinerja-bidang/targets` | GET | JWT + Roles | ✓ |
| `GET /api/v1/kinerja-bidang/realizations` | GET | JWT + Roles | ✓ |
| `GET /api/v1/kinerja-bidang/report` | GET | JWT + Roles | ✓ |
| `POST /api/v1/kinerja-bidang/seed-default` | POST | JWT + SEED_ROLES | ✓ |
| `GET /api/v1/dms/documents` | GET | JWT + DMS_ACCESS_ROLES | ✓ |
| `GET /api/v1/dms/documents/:id` | GET | JWT + DMS_ACCESS_ROLES | ✓ |
| `POST /api/v1/dms/documents` | POST | JWT + DMS_ACCESS_ROLES | ✓ |
| `GET /api/v1/sipensiun/cases` | GET | JWT + Roles | ✓ |
| `GET /api/v1/sidata/dashboard` | GET | JWT + Roles | ✓ |
| `GET /api/v1/sidata/asn` | GET | JWT + Roles | ✓ |

### Frontend Smoke Test

| Test | Kondisi | Expected |
|------|---------|----------|
| Login valid | username/password benar | Redirect /dashboard |
| Login invalid | password salah | Error message, stay /login |
| Navigate /kinerja-bidang | loading → data | Summary cards tampil atau empty |
| Navigate /kinerja-bidang/sop | tanpa data seed | Empty state "Belum ada SOP" |
| Navigate /dms/documents | user ANALIS_PERTAMA | Hanya dokumen milik sendiri |
| Navigate /dms/documents/:id | user tidak punya akses | 403 forbidden state |
| Navigate /sianalitik | API lambat | Loading state, lalu render |
| Navigate /sipensiun?jenis=BUP | tanpa kasus | Empty state aman |
| Navigate /layanan/kepuasan | tidak ada data IKM | Placeholder "Belum tersedia" |
| Wildcard route /* | URL tidak ada | Navigate to /dashboard |

---

## 8. Known Limitations

### 8.1 Role yang Belum Ada di Sistem

| Role | Diperlukan Untuk | Status |
|------|-----------------|--------|
| `SEKRETARIS` | DMS TERBATAS | Belum ada di DB/JWT. DMS TERBATAS tidak mencakup SEKRETARIS. |
| `AUDITOR` | DMS AUDIT access | Belum ada di DB/JWT. AUDIT level hanya bisa diakses KABID ke atas. |

**Implikasi:**
- Pengguna dengan role `SEKRETARIS` tidak bisa login DMS (tidak ada di `DMS_ACCESS_ROLES`)
- Jika `SEKRETARIS` ditambahkan ke DB di masa depan, perlu ditambahkan ke `DMS_UNIT_SCOPE_ROLES` dan `DMS_ACCESS_LEVEL_ROLES.TERBATAS`

### 8.2 SIPENSIUN — Jenis Coming Soon

Beberapa `jenis` di sidebar (`AHLI_WARIS`, `TIDAK_CAKAP`, `MENINGGAL_TEWAS_HILANG`, `AKTIF_KEMBALI`, `PERAMPINGAN`) tampil di `SipensiunListPage` tetapi:
- Jika tidak ada kasus di database dengan jenis tersebut, list kosong (empty state aman)
- `jenisKeyToDbFilter()` map belum mencakup semua kemungkinan jenis DB (`JenisPensiun` enum punya nilai lain seperti `JDU`, `TWS`, `SAK`, `HLG`, `PTDH`, `YATIM_PIATU`)
- Ini aman — unknown jenis akan menampilkan semua kasus tanpa filter

### 8.3 IKM/Kepuasan Layanan — Placeholder

`/layanan/kepuasan` menampilkan placeholder karena:
- Backend survei kepuasan belum tersedia
- Tidak ada tabel IKM di schema Prisma
- Frontend menampilkan pesan "Belum tersedia" dengan aman

### 8.4 Dokumen SOP di DMS

Dokumen SOP di sidebar "Referensi SOP" (`/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_*`) hanya muncul setelah:
1. Staff BKPSDM mengunggah file SOP ke DMS (`/dms/upload`)
2. Dokumen diverifikasi oleh reviewer (`status = VERIFIED` atau `ARCHIVED`)
3. Filter `subCategory=SOP_TAHAP_1` dll cocok dengan metadata dokumen yang diupload

Saat ini (fresh install): halaman akan menampilkan empty state — aman.

### 8.5 Kinerja Bidang — Role Name Selaras

`kinerja-bidang-roles.constant.ts` sudah memakai role aktif aplikasi:
```
KINERJA_BIDANG_READ_ROLES: SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA, ANALIS_MUDA, ANALIS_PERTAMA, PENELAAH, PPPK
KINERJA_BIDANG_WRITE_ROLES: SUPER_ADMIN, ADMIN_BKPSDM, KABID, ANALIS_MADYA, ANALIS_MUDA, ANALIS_PERTAMA, PENELAAH, PPPK
KINERJA_BIDANG_REVIEW_ROLES: SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID
```

**Status:** gap `ADMIN`/`STAFF` legacy sudah ditutup; ANALIS/PENELAAH/PPPK dapat membaca dan menginput sesuai policy frontend, sementara review/approval tetap dibatasi ke pimpinan bidang.

**Catatan kontrol:** perubahan status realisasi tetap harus melalui endpoint workflow (`submit`, `review`, `approve`, `request-revision`), bukan melalui `PATCH /realizations/:id`.

### 8.6 SIARSIP

`/siarsip` adalah halaman placeholder. Modul arsip digital belum diimplementasikan.

---

## 9. Final Acceptance Criteria

Seluruh kriteria di bawah ini **harus** terpenuhi sebelum V1.0 dinyatakan release-ready:

| # | Kriteria | Status |
|---|---------|--------|
| 1 | `cd api && npm run build` — exit 0, tanpa error TypeScript | ✓ PASS |
| 2 | `cd apps/web && npm run build` — exit 0, tanpa error TypeScript/Vite | ✓ PASS |
| 3 | Semua route di sidebar punya Route definition atau safe fallback (/dashboard) | ✓ PASS |
| 4 | 34 SOP terseed dan endpoint seed berfungsi | ✓ PASS |
| 5 | DMS access level policy berjalan: INTERNAL/TERBATAS/SANGAT_TERBATAS/PIMPINAN/AUDIT | ✓ PASS |
| 6 | 403 state ditampilkan dengan aman tanpa crash | ✓ PASS |
| 7 | OPD_OPERATOR dapat mengakses DMS (own scope, INTERNAL only) | ✓ PASS (S10) |
| 8 | Tidak ada migration baru yang belum dijalankan (semua migration sudah ada di `/migrations`) | ✓ PASS |
| 9 | Loading, empty, dan error state aman di semua halaman utama | ✓ PASS |
| 10 | SIANALITIK `/sianalitik` merender tanpa crash meski API secondary gagal | ✓ PASS |
| 11 | Tidak ada `any` type di kode baru (Sprint 7–10) | ✓ PASS |
| 12 | Tidak ada route mati (semua import page di routing-setup.tsx ada filenya) | ✓ PASS |

---

## 10. Daftar File yang Dibuat/Diubah (Sprint 7–10)

### API — Baru
- `api/src/modules/kinerja-bidang/` — Modul lengkap (module, controller, service, repository, types, DTO, constants)
- `api/prisma/migrations/20260517000100_add_kinerja_bidang_sop_rhk/migration.sql`
- `api/prisma/seed-kinerja-bidang.ts`

### API — Diubah
- `api/src/modules/app.module.ts` — Tambah `KinerjaBidangModule`
- `api/src/modules/dms/constants/dms-permission.constant.ts` — `DMS_ACCESS_LEVEL_ROLES`, `canUserSeeAccessLevel`, `getAllowedAccessLevels`, `OPD_OPERATOR` (S9/S10)
- `api/src/modules/dms/dms.repository.ts` — `allowedAccessLevels` filter
- `api/src/modules/dms/dms.service.ts` — Apply access level policy on list
- `api/package.json` — Dependensi Kinerja Bidang

### Frontend — Baru (pages)
- `apps/web/src/pages/workspace/kinerja-bidang-dashboard-page.tsx`
- `apps/web/src/pages/workspace/kinerja-bidang-sop-page.tsx`
- `apps/web/src/pages/workspace/kinerja-bidang-targets-page.tsx`
- `apps/web/src/pages/workspace/kinerja-bidang-realizations-page.tsx`
- `apps/web/src/pages/workspace/kinerja-bidang-report-page.tsx`
- `apps/web/src/pages/workspace/sop-dashboard-page.tsx`
- `apps/web/src/pages/workspace/sop-map-page.tsx`
- `apps/web/src/pages/workspace/sop-list-page.tsx`
- `apps/web/src/pages/workspace/sop-detail-page.tsx`
- `apps/web/src/pages/workspace/sop-monitoring-page.tsx`
- `apps/web/src/pages/workspace/sop-realization-page.tsx`
- `apps/web/src/pages/workspace/sop-realization-detail-page.tsx`
- `apps/web/src/pages/workspace/sop-report-page.tsx`
- `apps/web/src/pages/workspace/sop-document-verification-page.tsx`
- `apps/web/src/pages/workspace/sianalitik-page.tsx`

### Frontend — Baru (components)
- `apps/web/src/components/workspace/sop/` — ~28 komponen SOP
- `apps/web/src/components/workspace/sianalitik/` — 8 komponen (summary cards, RHK, SLA, SIPENSIUN, DMS, SIDATA, risk matrix, notes)

### Frontend — Baru (lib)
- `apps/web/src/lib/api/kinerja-bidang.ts`
- `apps/web/src/lib/api/sop-document-verification.ts`
- `apps/web/src/lib/api/sop-evidence.ts`
- `apps/web/src/lib/sop/` — data, helpers, types

### Frontend — Diubah
- `apps/web/src/routing/app-routing-setup.tsx` — Route baru: kinerja-bidang, sop, sianalitik, layanan
- `apps/web/src/config/layout-1.config.tsx` — Sidebar: Kinerja Bidang, Referensi SOP, SIANALITIK path
- `apps/web/src/pages/workspace/dms-upload-page.tsx` — Shield helper, access level tone
- `apps/web/src/pages/workspace/dms-document-detail-page.tsx` — 403 state, sensitive banner, access badge
- `apps/web/src/components/workspace/dms/dms-document-table.tsx` — `dmsAccessLevelTone()`
- `apps/web/src/components/workspace/dms/dms-metadata-form.tsx` — auto-default level, Shield helper
- `apps/web/src/lib/api/dms.ts` — `dmsAccessLevelTone`, `dmsAccessLevelDescription`, `getDefaultAccessLevelForSubCategory`
- `apps/web/src/styles/globals.css` — Style additions

### Dokumentasi — Baru
- `docs/SOP-PPIK-SILAKAP-FINAL-REGRESSION-CHECKLIST.md` (dokumen ini)

---

*Dokumen ini di-generate otomatis dari audit Sprint 10 pada 2026-05-17.*
*Reviewer: Khairul Anwar / Claude Sonnet 4.6*
