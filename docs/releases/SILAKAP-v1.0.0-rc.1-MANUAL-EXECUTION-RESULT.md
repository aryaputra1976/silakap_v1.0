# SILAKAP v1.0.0-rc.1 — Manual Execution Result

**Sprint 35 — Manual Staging Sign-off Execution**  
**Tanggal update:** 2026-05-19  
**RC status dokumen ini:** `PENDING SIGN-OFF` — Manual E2E belum dijalankan di staging.

---

## 1. Staging Environment

| Field | Value |
| --- | --- |
| Release candidate | SILAKAP v1.0.0-rc.1 |
| Environment | **Staging** — perlu dikonfigurasi oleh DevOps sebelum execution |
| URL Frontend | _To be filled oleh DevOps_ |
| URL Backend / API | _To be filled oleh DevOps_ |
| Database | _To be filled oleh DevOps (bukan production)_ |
| Commit hash | _Pending final commit after rc.1 updates_ |
| Commit message | `docs: add RC manual execution result for v1.0.0-rc.1` |
| Branch | `main` |
| Tag | **Belum dibuat** — menunggu sign-off final |
| Node version | _To be filled saat staging execution_ |
| Deployment timestamp | _To be filled saat staging execution_ |
| Tester utama | _To be filled_ |
| Execution date (manual) | _To be filled_ |

---

## 2. Automated Pre-check Result

> Dijalankan di dev lokal pada **2026-05-19** terhadap local rc.1 working snapshot.  
> Harus diulang di environment staging sebelum manual E2E dimulai.

| Check | Command | Result (dev) | Notes |
| --- | --- | --- | --- |
| git status | `git status --short` | **PENDING** | Belum clean karena perubahan rc.1 masih dalam working tree; wajib clean sebelum tagging |
| Prisma validate | `npm run prisma:validate` | **PASS** | "schema is valid 🚀" |
| Prisma generate | `npm run prisma:generate` | **PASS** | Prisma Client v6.14.0 generated |
| Migrate status | `npm run prisma:migrate:status` | **PASS** | 13 migrations, "Database schema is up to date!" |
| Smoke E2E regression | `npm run smoke:e2e-regression` | **PASS** | 9 checks, 0 FAIL, 0 WARN |
| Backend build | `npm run build` | **PASS** | `tsc -p tsconfig.build.json` sukses, 0 errors |
| Frontend lint | `npm run lint` | **PASS\*** | 0 errors, 10 warnings pre-existing |
| Frontend build | `npm run build` | **PASS** | 2125 modules, ~16s |
| Full project build | `npm run build` | **PASS** | API + web sukses setelah Prisma Client regenerate |

> \* 10 warnings `react-hooks/exhaustive-deps` adalah pre-existing sejak Sprint 16–20. Tidak ada warning baru. 0 errors — build tidak terblokir.

### Detail Smoke E2E Regression

| # | Check | Status | Detail |
| --- | --- | --- | --- |
| 0 | working-calendar.default | PASS | Default aktif: Kalender Kerja BKPSDM (Asia/Makassar) |
| 1 | rbac.legacy-roles-disabled | PASS | SEKRETARIS/AUDITOR tidak aktif |
| 2 | prisma.models-readable | PASS | submissions=0, documents=0, candidates=0, realizations=0, calendars=1, auditLogs=3 |
| 3 | rhk.approved-candidate-has-realization | PASS | 0 kandidat APPROVED tanpa realisasi |
| 4 | rhk.realization-only-from-approved-candidate | PASS | 0 realisasi terhubung ke kandidat non-APPROVED |
| 5 | rhk.no-duplicate-realization-per-candidate | PASS | Tidak ada duplikasi candidateId |
| 6 | opd.completed-has-completed-timeline | PASS | 0 submission COMPLETED tanpa timeline COMPLETED |
| 7 | opd.verified-document-has-submission | PASS | 0 dokumen VERIFIED tanpa submission valid |
| 8 | prisma.critical-migrations-applied | PASS | Semua migration kritikal Sprint 24–29 terdeteksi |

**Summary: 9 checks, 0 FAIL, 0 WARN**

---

## 3. Manual E2E Execution Table

> **STATUS KESELURUHAN: NOT RUN** — Belum dieksekusi di staging.  
> Isi kolom "Actual Result" dan "Status" hanya berdasarkan hasil aktual saat staging execution.  
> Jangan klaim PASS sebelum langkah benar-benar diuji.

| Step | Skenario | Expected Result | Actual Result | Status | Evidence / Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | OPD login | Masuk ke portal OPD `/opd/dashboard`. Menu internal (workbench, kinerja, working-calendar) tidak tampil. | _To be filled_ | NOT RUN | |
| 2 | OPD buat draft layanan | Buka `/opd/layanan/ajukan`, isi form, simpan. Draft tersimpan, status `DRAFT`, tidak ada efek SLA. | _To be filled_ | NOT RUN | |
| 3 | OPD submit layanan | Submit draft. Status `SUBMITTED`, `slaStartedAt` terisi, `slaDueAt` terisi berbasis jam kerja, timeline publik muncul. | _To be filled_ | NOT RUN | |
| 4 | OPD upload dokumen valid | Upload file PDF/JPG/PNG/DOCX/XLSX ≤10MB dari portal OPD. Dokumen `UPLOADED`, metadata tampil, file tersimpan aman. | _To be filled_ | NOT RUN | |
| 5 | OPD upload dokumen invalid ditolak | Upload file >10MB atau MIME tidak valid. Permintaan ditolak dengan pesan error yang jelas, tidak ada file tersimpan. | _To be filled_ | NOT RUN | |
| 6 | Staff PPIK melihat antrian | Login staff internal (ANALIS_PERTAMA/PENELAAH), buka `/layanan/workbench`. Submission baru muncul di antrian. | _To be filled_ | NOT RUN | |
| 7 | Staff PPIK receive | Klik receive pada submission. Status menjadi `RECEIVED`, audit log dan timeline tercatat. | _To be filled_ | NOT RUN | |
| 8 | Staff PPIK request correction | Isi catatan koreksi, kirim request. Status `NEEDS_CORRECTION`, `slaPausedAt` terisi, OPD melihat catatan. | _To be filled_ | NOT RUN | |
| 9 | OPD submit correction | OPD upload revisi dan submit perbaikan. Status `CORRECTION_SUBMITTED`, `slaResumedAt` terisi, `slaDueAt` bergeser sesuai jam kerja. | _To be filled_ | NOT RUN | |
| 10 | Analis verify dokumen | Login analis (ANALIS_MUDA/ANALIS_MADYA), verifikasi dokumen dari workbench. Dokumen `VERIFIED`, audit tercatat. | _To be filled_ | NOT RUN | |
| 11 | Checklist SOP diisi | Buka detail layanan, isi `SopChecklistPanel`. Checklist item tersimpan dengan entity type `opd_submission` dan entity id sesuai submission. | _To be filled_ | NOT RUN | |
| 12 | SLA/timeline dicek | Periksa detail submission OPD dan internal. `dueAt`, `slaPausedAt`/`slaResumedAt`, dan urutan timeline konsisten dan akurat. | _To be filled_ | NOT RUN | |
| 13 | Completion gate blocked saat syarat belum lengkap | Coba complete sebelum dokumen VERIFIED atau checklist belum cukup. Ditolak dengan pesan jelas tentang syarat yang belum terpenuhi. | _To be filled_ | NOT RUN | |
| 14 | Kabid/Admin complete/override jika valid | Lengkapi semua syarat (dokumen verified, checklist), Kabid complete. Status `COMPLETED`, timeline COMPLETED tercatat. | _To be filled_ | NOT RUN | |
| 15 | Candidate RHK generated | Setelah COMPLETED, buka `/kinerja-bidang/realizations`, cek kandidat. Kandidat status `CANDIDATE` muncul, belum jadi realisasi. | _To be filled_ | NOT RUN | |
| 16 | Candidate approved | Kabid/Admin approve kandidat dengan periode dan modul. Realisasi `APPROVED` terbentuk tepat sekali per kandidat. | _To be filled_ | NOT RUN | |
| 17 | Realization created | Verifikasi realisasi di database dan UI. Status `APPROVED`, terhubung ke kandidat yang sama, tidak ada duplikasi. | _To be filled_ | NOT RUN | |
| 18 | Executive report displayed | Buka `/kinerja-bidang/report`. Summary panel tampil, stat card menampilkan angka dari realisasi `APPROVED` saja. | _To be filled_ | NOT RUN | |
| 19 | Evidence bundle displayed | Klik "Generate Bundle" di panel evidence. Metadata snapshot tampil, tidak ada klaim PDF/DMS archive final. Placeholder DMS informatif (bukan crash). | _To be filled_ | NOT RUN | |
| 20 | Print report tested | Klik Print pada panel laporan. `window.print()` terpicu, layout cetak formal kop surat tampil. Tidak ada klaim PDF export. | _To be filled_ | NOT RUN | |

---

## 4. RBAC Negative Test Table

> **STATUS: NOT RUN** — Diisi saat staging execution.

| # | Test | Expected | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| R1 | OPD buka `/layanan/workbench` | Forbidden — redirect aman, tidak ada data internal terekspos | _To be filled_ | NOT RUN | |
| R2 | OPD buka `/kinerja-bidang/*` | Forbidden — redirect aman | _To be filled_ | NOT RUN | |
| R3 | OPD buka `/working-calendar` | Forbidden — redirect aman | _To be filled_ | NOT RUN | |
| R4 | PPPK coba approve RHK candidate | Tombol approve tidak tersedia; jika via API langsung → 403 Forbidden | _To be filled_ | NOT RUN | |
| R5 | PPPK coba export executive report | Tombol export tidak tersedia; jika via API langsung → 403 Forbidden | _To be filled_ | NOT RUN | |
| R6 | Internal user (bukan OPD) dibuka portal OPD | Tidak redirect ke OPD portal; melihat workbench internal sesuai role | _To be filled_ | NOT RUN | |
| R7 | KABID approve RHK candidate valid | Berhasil approve; realisasi terbentuk sekali | _To be filled_ | NOT RUN | |
| R8 | KEPALA_BADAN view executive report | Berhasil view; tidak ada tombol input/edit | _To be filled_ | NOT RUN | |
| R9 | SUPER_ADMIN/ADMIN_BKPSDM buka Admin Control | `/admin/rbac`, `/admin/users`, `/admin/settings` terbuka dan menampilkan data read-only | _To be filled_ | NOT RUN | |
| R10 | OPD buka `/admin/*` | Forbidden / redirect aman, tidak ada data admin terekspos | _To be filled_ | NOT RUN | |
| R11 | Role internal non-admin buka `/admin/*` | Forbidden / redirect aman, tidak ada data admin terekspos | _To be filled_ | NOT RUN | |

---

## 5. SLA Test Table

> **STATUS: NOT RUN** — Diisi saat staging execution.

| # | Test | Expected | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| S1 | Working calendar default active | Kalender Kerja BKPSDM (Asia/Makassar) tersedia dengan `isDefault=true` — smoke PASS di dev | _To be filled_ | NOT RUN | Smoke dev: PASS |
| S2 | DueAt generated from business hours | Setelah submit, `slaDueAt` = waktu submit + target jam kerja sesuai modul | _To be filled_ | NOT RUN | |
| S3 | Correction pauses SLA | Saat `NEEDS_CORRECTION`, `slaStatus=PAUSED_FOR_CORRECTION`, `slaPausedAt` terisi | _To be filled_ | NOT RUN | |
| S4 | Correction submit resumes SLA | Saat `CORRECTION_SUBMITTED`, `slaResumedAt` terisi, `slaDueAt` bergeser sesuai jam kerja yang terpakai | _To be filled_ | NOT RUN | |
| S5 | Completed stops SLA | Saat `COMPLETED`, `slaStoppedAt` terisi, `slaStatus` final | _To be filled_ | NOT RUN | |
| S6 | OPD sees public timeline | OPD hanya melihat timeline dengan `isVisibleToOpd=true` | _To be filled_ | NOT RUN | |
| S7 | Internal sees full timeline | Staff PPIK melihat semua timeline termasuk action internal | _To be filled_ | NOT RUN | |

---

## 6. Evidence / DMS Test Table

> **STATUS: NOT RUN** — Diisi saat staging execution.

| # | Test | Expected | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| D1 | File valid uploaded | PDF/JPG/PNG/DOCX/XLSX ≤10MB diterima; metadata tersimpan di DB; file di storage path aman | _To be filled_ | NOT RUN | |
| D2 | DMS document linked | Dokumen terhubung ke `OpdSubmission` via `submissionId`; metadata DMS dapat diambil internal | _To be filled_ | NOT RUN | |
| D3 | PPIK sees metadata | Staff PPIK melihat metadata dokumen (nama file, ukuran, tanggal upload) dari workbench | _To be filled_ | NOT RUN | |
| D4 | PPIK verify/reject/correction document | PPIK dapat verify, reject, atau request correction document; status dokumen berubah sesuai | _To be filled_ | NOT RUN | |
| D5 | OPD sees document correction note | OPD melihat catatan koreksi pada dokumen yang diminta diperbaiki | _To be filled_ | NOT RUN | |
| D6 | OPD cannot see internal sensitive document | OPD tidak melihat dokumen yang dibuat/diupload oleh PPIK internal; hanya dokumen milik sendiri | _To be filled_ | NOT RUN | |

---

## 7. Issues Found

> Tidak ada issues yang ditemukan saat automated pre-check.  
> Issues dari staging execution diisi di bawah ketika ditemukan.

| ID | Severity | Module | Description | Steps to Reproduce | Owner | Status | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | _Kosong — diisi saat staging execution_ | — | — | — | — |

**Panduan severity:**
- **Critical** — Blocker RC: data corruption, akses RBAC salah, submission tidak bisa dibuat, SLA salah total.
- **High** — Fungsional utama rusak tapi ada workaround; must-fix sebelum production.
- **Medium** — Fungsional minor atau UX; dapat dirilis dengan note.
- **Low** — Kosmetik, label, atau improvement; dapat ditunda ke sprint berikutnya.

---

## 8. Known Limitations Accepted

Keterbatasan berikut sudah diidentifikasi, diakui, dan **bukan blocker RC**:

| # | Limitation | Status | Notes |
| --- | --- | --- | --- |
| L1 | PDF export masih `window.print()` | Accepted | Label UI sudah jujur; tidak ada klaim PDF export |
| L2 | DMS archive metadata-only belum didukung | Accepted | `/archive-to-dms` mengembalikan `400` secara eksplisit; tombol UI placeholder informatif |
| L3 | OPD preview/download dibatasi endpoint aman | Accepted | Sesuai policy keamanan; OPD hanya melihat dokumen miliknya |
| L4 | Holiday nasional perlu seed resmi | Accepted | Default kalender aktif; hari libur dikelola manual via halaman Kalender Kerja |
| L5 | Frontend lint: 10 warnings pre-existing | Accepted | Pre-existing sejak Sprint 16–20; 0 errors; build tidak terblokir |
| L6 | API lint script belum tersedia | Accepted | Backend menggunakan `tsc --noEmit` dan `tsconfig.build.json`; tidak memblokir |
| L7 | Admin Control rc.1 read-only | Accepted | RBAC, Pengguna, dan Pengaturan dapat dilihat oleh admin; create/edit user, reset password, dan edit permission belum dibuka |

---

## 9. Final RC Decision

> **KEPUTUSAN: PENDING SIGN-OFF**  
> RC tidak dapat dinyatakan PASS / PASS WITH NOTES / BLOCKED sebelum manual staging execution selesai.

```
╔═══════════════════════════════════════════════════╗
║   RC STATUS: PENDING SIGN-OFF                     ║
║                                                   ║
║   Automated pre-check (dev):   PASS              ║
║   Manual E2E staging:          NOT RUN           ║
║   RBAC negative tests:         NOT RUN           ║
║   SLA staging:                 NOT RUN           ║
║   Evidence/DMS:                NOT RUN           ║
║   Sign-off:                    NOT COMPLETED     ║
║                                                   ║
║   Tagging diblokir sampai sign-off final.        ║
╚═══════════════════════════════════════════════════╝
```

| Kriteria | Status | Catatan |
| --- | --- | --- |
| git status clean | ⏳ PENDING | Working tree must be clean before tagging |
| Prisma validate | ✓ PASS | |
| Prisma migrate status up to date | ✓ PASS | 13 migrations |
| Smoke regression 0 FAIL, 0 WARN | ✓ PASS | 9 checks |
| Backend build | ✓ PASS | |
| Frontend build | ✓ PASS | 2125 modules |
| Frontend lint 0 errors | ✓ PASS | 10 warnings pre-existing |
| Manual E2E (20 skenario) | ⏳ NOT RUN | Diisi saat staging execution |
| RBAC negative tests (11 test) | ⏳ NOT RUN | Diisi saat staging execution |
| SLA staging test (7 test) | ⏳ NOT RUN | Diisi saat staging execution |
| Evidence/DMS test (6 test) | ⏳ NOT RUN | Diisi saat staging execution |
| Sign-off semua area | ⏳ NOT COMPLETED | Menunggu staging execution |

**Reason:** Manual staging execution belum dijadwalkan atau dijalankan. Semua automated check hijau dan siap mendukung staging execution kapan pun dijadwalkan.

**Required follow-up:** Jadwalkan staging execution dengan tester dari tiap area (QA, PPIK fungsional, security/RBAC, DevOps). Isi tabel di atas berdasarkan hasil aktual.

---

## 10. Sign-off Summary

> Diisi oleh masing-masing penandatangan setelah staging execution selesai.

| Area | Peran | Nama | Status | Notes | Tanggal |
| --- | --- | --- | --- | --- | --- |
| Technical | Release engineer | _To be filled_ | NOT COMPLETED | | |
| QA | QA lead | _To be filled_ | NOT COMPLETED | | |
| Functional | Perwakilan PPIK | _To be filled_ | NOT COMPLETED | | |
| Security/RBAC | Admin/Super Admin | _To be filled_ | NOT COMPLETED | | |
| Deployment | DevOps | _To be filled_ | NOT COMPLETED | | |
| Leadership | Perwakilan pimpinan | _To be filled_ | NOT COMPLETED | | |

---

## 11. Tagging Instruction

> **JANGAN dijalankan sebelum semua sign-off di section 10 berstatus APPROVED dan RC decision bukan BLOCKED.**

Setelah sign-off final diperoleh dari semua area, jalankan perintah berikut oleh release engineer:

```bash
# Pastikan di branch main dan git status clean
git checkout main
git pull origin main
git status --short

# Buat dan push tag RC
git tag -a v1.0.0-rc.1 -m "SILAKAP v1.0.0-rc.1 — Release Candidate 1"
git push origin v1.0.0-rc.1
```

Kemudian lanjutkan ke production deploy mengikuti `docs/DEPLOYMENT-RUNBOOK.md`.

---

## 12. Referensi

| Dokumen | Path |
| --- | --- |
| Release Notes | `docs/releases/SILAKAP-v1.0.0-rc.1-RELEASE-NOTES.md` |
| Go-Live Checklist | `docs/releases/SILAKAP-v1.0.0-rc.1-GO-LIVE-CHECKLIST.md` |
| Rollback Guide | `docs/releases/SILAKAP-v1.0.0-rc.1-ROLLBACK-GUIDE.md` |
| Sign-off Form | `docs/releases/SILAKAP-v1.0.0-rc.1-SIGNOFF.md` |
| Staging Dry Run E2E | `docs/SPRINT-32-STAGING-DRY-RUN-E2E-SIGNOFF.md` |
| Staging Dry Run Runbook | `docs/STAGING-DRY-RUN-RUNBOOK.md` |
| Deployment Runbook | `docs/DEPLOYMENT-RUNBOOK.md` |
| Changelog | `CHANGELOG.md` |
