# SILAKAP v1.0.0-rc.1 — Manual Execution Result

## 1. Release Candidate

| Field | Value |
| --- | --- |
| Release candidate | SILAKAP v1.0.0-rc.1 |
| Sprint | Sprint 34 — RC Manual Execution |
| Status dokumen | Pre-check SELESAI — Manual E2E **PENDING sign-off** |

---

## 2. Environment

| Field | Value |
| --- | --- |
| Environment | Local dev (staging target: perlu dikonfigurasi oleh DevOps) |
| Database | `silakap_v1_0_dev_clean` @ localhost:3306 |
| API URL staging | _To be filled by DevOps saat staging execution_ |
| Web URL staging | _To be filled by DevOps saat staging execution_ |
| Node version | _To be filled saat staging execution_ |
| OS | Windows 11 Pro (dev); target staging Linux/Docker |

---

## 3. Commit Hash

| Field | Value |
| --- | --- |
| HEAD commit | `b4c45eed4d2471622f48d8ebcba458a5300b5ea3` |
| Commit message | `docs: prepare SILAKAP v1.0.0-rc.1 release candidate` |
| Branch | `main` |
| Tag | **Belum dibuat** — menunggu manual sign-off |

---

## 4. Execution Date

| Field | Value |
| --- | --- |
| Pre-check automated | 2026-05-19 |
| Manual E2E staging | _To be filled saat staging execution_ |
| Sign-off target | _To be determined_ |

---

## 5. Operator / Tester

| Peran | Nama | Tanggal |
| --- | --- | --- |
| Release engineer / pre-check | _To be filled_ | 2026-05-19 |
| QA lead (manual E2E) | _To be filled_ | _Pending_ |
| PPIK functional tester | _To be filled_ | _Pending_ |
| Security/RBAC reviewer | _To be filled_ | _Pending_ |
| DevOps | _To be filled_ | _Pending_ |

---

## 6. Pre-check Result

> Dijalankan di lingkungan dev lokal terhadap commit `b4c45ee` pada 2026-05-19.

| Check | Command | Result | Output / Notes |
| --- | --- | --- | --- |
| git status | `git status --short` | **PASS** | Clean — tidak ada perubahan tidak ter-commit |
| Prisma validate | `npm run prisma:validate` | **PASS** | "The schema at prisma/schema.prisma is valid 🚀" |
| Prisma generate | `npm run prisma:generate` | **PASS** | Prisma Client v6.14.0 generated |
| Migrate status | `npm run prisma:migrate:status` | **PASS** | "10 migrations found — Database schema is up to date!" |
| Smoke E2E regression | `npm run smoke:e2e-regression` | **PASS** | 9 checks, 0 FAIL, 0 WARN (lihat detail di bawah) |
| Backend build | `npm run build` | **PASS** | `tsc -p tsconfig.build.json` sukses, 0 errors |
| Frontend lint | `npm run lint` | **PASS\*** | 0 errors, 10 warnings pre-existing (react-hooks/exhaustive-deps dari Sprint 20) |
| Frontend build | `npm run build` | **PASS** | 2112 modules, built in ~17s |

> \* 10 warnings lint adalah pre-existing dari Sprint 20 dan Sprint 16-19 (sidata, routing). Tidak ada warning baru dari Sprint 29+. 0 errors — build tidak diblokir.

### Detail Smoke E2E Regression

| # | Check | Status | Detail |
| --- | --- | --- | --- |
| 0 | working-calendar.default | PASS | Default aktif: Kalender Kerja BKPSDM (Asia/Makassar) |
| 1 | rbac.legacy-roles-disabled | PASS | SEKRETARIS/AUDITOR tidak aktif |
| 2 | prisma.models-readable | PASS | submissions=0, documents=0, candidates=0, realizations=0, calendars=1, auditLogs=2 |
| 3 | rhk.approved-candidate-has-realization | PASS | 0 kandidat APPROVED tanpa realisasi |
| 4 | rhk.realization-only-from-approved-candidate | PASS | 0 realisasi terhubung ke kandidat non-APPROVED |
| 5 | rhk.no-duplicate-realization-per-candidate | PASS | Tidak ada duplikasi candidateId pada realisasi |
| 6 | opd.completed-has-completed-timeline | PASS | 0 submission COMPLETED tanpa timeline COMPLETED |
| 7 | opd.verified-document-has-submission | PASS | 0 dokumen VERIFIED tanpa submission valid |
| 8 | prisma.critical-migrations-applied | PASS | Semua migration kritikal Sprint 24–29 terdeteksi |

**Summary: 9 checks, 0 FAIL, 0 WARN**

---

## 7. Manual E2E Result

> **STATUS: PENDING** — Belum dieksekusi di lingkungan staging.
> Kolom ini harus diisi oleh QA lead dan tester fungsional selama staging execution.
> Jangan klaim PASS sebelum pengujian benar-benar dilakukan.

| No | Skenario | Langkah Utama | Expected | Result | Notes | Tester |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | OPD login | Login OPD via `/login` | Masuk ke portal OPD, tidak melihat menu internal | _Pending_ | | |
| 2 | OPD buat draft layanan | Buka `/opd/layanan/ajukan`, isi form, simpan | Draft tersimpan, status DRAFT | _Pending_ | | |
| 3 | OPD submit layanan | Submit draft | Status SUBMITTED, `slaStartedAt` terisi, timeline publik muncul | _Pending_ | | |
| 4 | OPD upload dokumen | Upload file valid dari portal OPD | Dokumen UPLOADED, metadata tampil, file tersimpan aman | _Pending_ | | |
| 5 | OPD upload invalid | Upload file melebihi batas atau MIME tidak valid | Ditolak dengan pesan error | _Pending_ | | |
| 6 | PPIK receive | Login staff PPIK, buka `/layanan/workbench`, receive | Status RECEIVED, audit tercatat | _Pending_ | | |
| 7 | PPIK verify document | Verifikasi dokumen dari workbench | Dokumen VERIFIED, status submission berlanjut | _Pending_ | | |
| 8 | Checklist SOP diisi | Buka detail layanan, isi `SopChecklistPanel` | Checklist item tersimpan, entity type `opd_submission` | _Pending_ | | |
| 9 | Request correction | Staff request correction dengan catatan | Status NEEDS_CORRECTION, `slaPausedAt` terisi, OPD melihat catatan | _Pending_ | | |
| 10 | OPD submit correction | OPD upload revisi dan submit perbaikan | Status CORRECTION_SUBMITTED, `slaResumedAt` terisi, `slaDueAt` bergeser | _Pending_ | | |
| 11 | Completion gate gagal | Coba complete sebelum syarat terpenuhi | Ditolak dengan pesan jelas tentang syarat yang kurang | _Pending_ | | |
| 12 | Complete service | Lengkapi semua syarat lalu Kabid complete | Status COMPLETED, timeline COMPLETED, kandidat RHK terbentuk | _Pending_ | | |
| 13 | Candidate RHK terbentuk | Buka `/kinerja-bidang/realizations`, cek kandidat | Kandidat status CANDIDATE muncul, belum menjadi realisasi | _Pending_ | | |
| 14 | Candidate disetujui | Kabid/Admin approve kandidat dengan periode/modul | Realisasi APPROVED terbentuk tepat sekali | _Pending_ | | |
| 15 | Laporan eksekutif tampil | Buka `/kinerja-bidang/report` | Summary hanya dari realisasi APPROVED, stat card terisi | _Pending_ | | |
| 16 | Evidence bundle tampil | Klik "Generate Bundle" | Metadata snapshot tampil, tidak ada klaim PDF/DMS archive final | _Pending_ | | |

---

## 8. RBAC Test Result

> **STATUS: PENDING** — To be filled during staging execution.

| Test | Expected | Result | Notes |
| --- | --- | --- | --- |
| OPD buka `/layanan/workbench` | Forbidden / redirect aman | _Pending_ | |
| OPD buka `/kinerja-bidang/*` | Forbidden / redirect aman | _Pending_ | |
| OPD buka `/working-calendar` | Forbidden / redirect aman | _Pending_ | |
| PPPK approve RHK candidate | Tombol tidak tersedia atau aksi ditolak | _Pending_ | |
| PPPK export laporan executive | Tombol tidak tersedia atau aksi ditolak | _Pending_ | |
| KABID approve RHK candidate | Berhasil jika kandidat valid | _Pending_ | |
| ADMIN_BKPSDM approve RHK candidate | Berhasil jika kandidat valid | _Pending_ | |
| KEPALA_BADAN view executive report | Berhasil view, tidak ada tombol input ulang | _Pending_ | |

---

## 9. SLA Test Result

> **STATUS: PENDING** — To be filled during staging execution.

| Test | Expected | Result | Notes |
| --- | --- | --- | --- |
| Working calendar default aktif | Kalender Kerja BKPSDM (Asia/Makassar) tersedia dan `isDefault=true` | _Pending_ | Smoke: PASS di dev |
| Submit menghasilkan `dueAt` | `slaStartedAt` dan `slaDueAt` terisi berbasis jam kerja | _Pending_ | |
| Correction pause | `slaStatus=PAUSED_FOR_CORRECTION`, `slaPausedAt` terisi | _Pending_ | |
| Correction resume | `slaPausedHours` bertambah, `slaDueAt` bergeser sesuai jam kerja | _Pending_ | |
| Timeline SLA visible | Timeline submission menampilkan urutan status yang benar | _Pending_ | |

---

## 10. Issues Found

> Tidak ada issues baru yang ditemukan saat pre-check.
> Issues dari staging execution diisi di bawah ketika ditemukan.

| # | Severity | Description | Status | Owner | Sprint Temuan |
| --- | --- | --- | --- | --- | --- |
| — | — | _Kosong — diisi saat staging execution_ | — | — | — |

---

## 11. Known Limitations Accepted

Berikut adalah keterbatasan yang sudah diidentifikasi, diakui, dan **tidak menjadi blocker RC**:

| # | Limitation | Status | Notes |
| --- | --- | --- | --- |
| 1 | PDF export masih print HTML via `window.print()` | Accepted | Tidak ada klaim PDF export; label UI sudah sesuai |
| 2 | DMS archive metadata-only untuk executive report belum didukung | Accepted | Endpoint `/archive-to-dms` mengembalikan `400 Bad Request` secara eksplisit; tombol UI menampilkan placeholder informatif |
| 3 | OPD preview/download dokumen dibatasi endpoint aman | Accepted | Policy sesuai keamanan; OPD hanya melihat dokumen milik sendiri |
| 4 | Holiday nasional perlu seed resmi jika belum ada | Accepted | Default kalender aktif; hari libur dikelola manual via halaman Kalender Kerja |
| 5 | Frontend lint: 10 warnings pre-existing (react-hooks/exhaustive-deps) | Accepted | Pre-existing sejak Sprint 16–20, 0 errors, bukan dari Sprint 29+; build tidak terblokir |
| 6 | API lint script belum tersedia | Accepted | Tidak memblokir build; backend menggunakan `tsc --noEmit` sebagai pengganti |

---

## 12. Final RC Status

> **STATUS: PENDING SIGN-OFF**

```
╔══════════════════════════════════════╗
║   RC STATUS: PENDING SIGN-OFF        ║
║                                      ║
║   Pre-check automated: PASS          ║
║   Manual E2E staging:  PENDING       ║
║                                      ║
║   Tidak dapat diklaim PASS sebelum   ║
║   manual staging execution selesai.  ║
╚══════════════════════════════════════╝
```

| Kriteria | Status |
| --- | --- |
| git status clean | ✓ PASS |
| Prisma validate | ✓ PASS |
| Prisma migrate status up to date | ✓ PASS |
| Smoke regression 0 FAIL, 0 WARN | ✓ PASS |
| Backend build sukses | ✓ PASS |
| Frontend build sukses | ✓ PASS |
| Frontend lint 0 errors | ✓ PASS (10 warnings pre-existing) |
| Manual OPD submit flow | ⏳ PENDING |
| Manual PPIK workbench | ⏳ PENDING |
| Manual correction cycle | ⏳ PENDING |
| Manual RHK candidate/realization | ⏳ PENDING |
| Manual executive report | ⏳ PENDING |
| RBAC negative tests | ⏳ PENDING |
| SLA staging verification | ⏳ PENDING |
| Sign-off semua area | ⏳ PENDING |

**RC dapat dinyatakan PASS / PASS WITH NOTES / BLOCKED setelah staging execution selesai dan sign-off diberikan.**

---

## 13. Sign-off Summary

> Diisi oleh masing-masing penandatangan setelah staging execution selesai.

| Area | Peran | Nama | Status | Notes | Tanggal |
| --- | --- | --- | --- | --- | --- |
| Technical | Release engineer | _To be filled_ | _Pending_ | | |
| QA | QA lead | _To be filled_ | _Pending_ | | |
| Functional | Perwakilan PPIK | _To be filled_ | _Pending_ | | |
| Security/RBAC | Admin/Super Admin | _To be filled_ | _Pending_ | | |
| Deployment | DevOps | _To be filled_ | _Pending_ | | |

---

## 14. Next Action

### Jika staging execution selesai dan RC status PASS / PASS WITH NOTES:

1. Lengkapi sign-off table di atas dan di `docs/releases/SILAKAP-v1.0.0-rc.1-SIGNOFF.md`.
2. Jalankan tag command berikut (jangan dijalankan sebelum sign-off final):

```bash
git tag -a v1.0.0-rc.1 -m "SILAKAP v1.0.0-rc.1"
git push origin v1.0.0-rc.1
```

3. Lanjutkan ke production deploy mengikuti `docs/DEPLOYMENT-RUNBOOK.md`.

### Jika RC status BLOCKED:

1. Catat semua blocker di section "Issues Found" di atas.
2. Assign owner dan tentukan sprint fix.
3. Jangan buat tag.
4. Jangan deploy production.
5. Iterasi perbaikan dan ulangi pre-check + staging execution.

---

## 15. Referensi

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
