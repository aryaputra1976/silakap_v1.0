# SILAKAP v1.0.0-rc.1 Sign-off Form

**Sprint 35 — Manual Staging Sign-off Execution**  
**Tanggal update:** 2026-05-19  
**Status:** `PENDING SIGN-OFF` — Manual staging execution belum dilakukan.

---

## Release Candidate

| Field | Value |
| --- | --- |
| Release candidate | SILAKAP v1.0.0-rc.1 |
| Commit hash | _Pending final commit after rc.1 updates_ |
| Branch | `main` |

---

## Environment

| Field | Value |
| --- | --- |
| Environment | _To be filled oleh DevOps_ |
| API URL | _To be filled_ |
| Web URL | _To be filled_ |
| Database | _To be filled (bukan production)_ |
| Build/artifact | Local rc.1 working snapshot — final commit/artifact to be filled after commit |

---

## Date

| Field | Value |
| --- | --- |
| Test date (automated, dev) | 2026-05-19 |
| Test date (manual staging) | _To be filled_ |
| Release window | _To be determined_ |

---

## Technical Checks

> Dijalankan di dev lokal. Harus dikonfirmasi ulang di staging sebelum manual E2E.

| Check | Status | Notes |
| --- | --- | --- |
| Prisma validate | **PASS** | "schema is valid 🚀" — dev 2026-05-19 |
| Prisma generate | **PASS** | Prisma Client v6.14.0 — dev 2026-05-19 |
| Prisma migrate status | **PASS** | 13 migrations, database schema up to date — dev 2026-05-19 |
| Backend build | **PASS** | tsc -p tsconfig.build.json, 0 errors — dev 2026-05-19 |
| Frontend lint/build | **PASS\*** | 0 errors (10 warnings pre-existing), 2125 modules — dev 2026-05-19 |
| Full project build | **PASS** | `npm run build` (API + web), 0 errors — dev 2026-05-19 after Prisma Client regenerate |
| Smoke regression 0 FAIL, 0 WARN | **PASS** | 9 checks, 0 FAIL, 0 WARN — dev 2026-05-19 |

---

## QA Checks

> **STATUS: NOT RUN** — Belum dilakukan di staging. Diisi oleh QA lead saat staging execution.

| Check | Status | Notes |
| --- | --- | --- |
| OPD submit flow (draft → submit → SLA start) | NOT RUN | |
| Upload valid diterima / upload invalid ditolak | NOT RUN | |
| PPIK workbench (receive, review, request correction) | NOT RUN | |
| Correction cycle (OPD koreksi, resume SLA, dueAt shift) | NOT RUN | |
| Completion gate blocked saat syarat belum lengkap | NOT RUN | |
| RHK candidate/realization (approved sekali, tidak duplikat) | NOT RUN | |
| Executive report/evidence bundle (hanya realisasi APPROVED) | NOT RUN | |
| Print report (window.print(), bukan klaim PDF) | NOT RUN | |

---

## Functional Sign-off

> **STATUS: NOT RUN** — Diisi oleh perwakilan PPIK fungsional saat staging execution.

| Area | Status | Notes |
| --- | --- | --- |
| OPD Portal (draft, submit, upload, correction, tracking) | NOT RUN | |
| Staff Workbench PPIK (receive, verify, correction, complete) | NOT RUN | |
| SOP Checklist (persist, entity type, audit) | NOT RUN | |
| SLA / Working Calendar (business hours, pause, resume) | NOT RUN | |
| RHK / Kinerja (candidate, approval, realization) | NOT RUN | |
| Executive Report / Evidence Bundle | NOT RUN | |

---

## Security / RBAC Sign-off

> **STATUS: NOT RUN** — Diisi oleh security/RBAC reviewer saat staging execution.

| Check | Status | Notes |
| --- | --- | --- |
| OPD cannot access `/layanan/workbench` | NOT RUN | |
| OPD cannot access `/kinerja-bidang/*` | NOT RUN | |
| OPD cannot access `/working-calendar` | NOT RUN | |
| PPPK cannot approve candidate (tombol tidak ada / API 403) | NOT RUN | |
| PPPK cannot export executive report (tombol tidak ada / API 403) | NOT RUN | |
| KABID can approve RHK candidate | NOT RUN | |
| KEPALA_BADAN can view report (view only, tidak bisa input) | NOT RUN | |
| SUPER_ADMIN/ADMIN_BKPSDM can open `/admin/rbac`, `/admin/users`, `/admin/settings` | NOT RUN | Admin Control is read-only in rc.1 |
| OPD cannot access `/admin/*` | NOT RUN | |
| Non-admin internal role cannot access `/admin/*` | NOT RUN | |

---

## Deployment Sign-off

> **STATUS: NOT RUN** — Diisi oleh DevOps sebelum dan selama staging execution.

| Check | Status | Notes |
| --- | --- | --- |
| DB backup verified (staging backup dibuat dan terbaca) | NOT RUN | |
| Upload/storage backup verified | NOT RUN | |
| Env verified (DATABASE_URL staging, bukan production) | NOT RUN | |
| Rollback plan reviewed (`docs/releases/SILAKAP-v1.0.0-rc.1-ROLLBACK-GUIDE.md`) | NOT RUN | |
| Go-live checklist completed (`docs/releases/SILAKAP-v1.0.0-rc.1-GO-LIVE-CHECKLIST.md`) | NOT RUN | |

---

## Manual Execution Status

> Ringkasan status manual execution per area.  
> Referensi detail: `docs/releases/SILAKAP-v1.0.0-rc.1-MANUAL-EXECUTION-RESULT.md`.

| Area | Jumlah Test | Status | Catatan |
| --- | --- | --- | --- |
| Manual E2E (skenario alur utama) | 20 skenario | NOT RUN | |
| RBAC negative tests | 11 test | NOT RUN | includes Admin Control route checks |
| SLA staging test | 7 test | NOT RUN | |
| Evidence/DMS test | 6 test | NOT RUN | |

---

## Issue Summary

> Diisi setelah staging execution. Jika ada issue ditemukan, catat di sini.

| ID | Severity | Module | Deskripsi | Status | Decision |
| --- | --- | --- | --- | --- | --- |
| — | — | — | _Tidak ada issue — diisi saat staging execution_ | — | — |

---

## RC Decision

> **KEPUTUSAN SAAT INI: PENDING SIGN-OFF**

| Field | Value |
| --- | --- |
| RC decision | **PENDING SIGN-OFF** |
| Alasan | Manual staging execution belum dijadwalkan atau dijalankan |
| Automated pre-check | PASS |
| Manual E2E | NOT RUN |
| RBAC test | NOT RUN |
| Issues blocker | Tidak ada (belum ditemukan) |
| Required follow-up | Jadwalkan staging execution; isi semua tabel; kumpulkan sign-off |

Setelah staging execution selesai, RC decision harus ditetapkan ke salah satu:

| Pilihan | Kondisi |
| --- | --- |
| **PASS** | Semua test PASS, tidak ada issue medium+, semua sign-off APPROVED |
| **PASS WITH NOTES** | Ada issue medium/low yang disetujui sebagai known limitation; semua critical/high resolved atau tidak ada |
| **BLOCKED** | Ada issue critical/high yang belum resolved; tagging dan deploy ditunda |

---

## Approval Table

> Diisi oleh masing-masing penandatangan setelah staging execution selesai.  
> Jangan isi nama atau tanda tangan sebelum pengujian benar-benar dilakukan.

| Peran | Nama | Status | Notes | Tanda Tangan / Tanggal |
| --- | --- | --- | --- | --- |
| Release engineer | _To be filled_ | NOT COMPLETED | | |
| QA lead | _To be filled_ | NOT COMPLETED | | |
| DevOps | _To be filled_ | NOT COMPLETED | | |
| PPIK owner / perwakilan fungsional | _To be filled_ | NOT COMPLETED | | |
| Security/RBAC reviewer | _To be filled_ | NOT COMPLETED | | |
| Perwakilan pimpinan / leadership | _To be filled_ | NOT COMPLETED | | |

---

## Tagging Instruction

> **JANGAN dijalankan sebelum semua kolom "Status" di Approval Table berstatus APPROVED dan RC decision PASS atau PASS WITH NOTES.**

Setelah semua sign-off diperoleh:

```bash
# Pastikan di branch main dan git status clean
git checkout main
git pull origin main
git status --short

# Buat tag RC
git tag -a v1.0.0-rc.1 -m "SILAKAP v1.0.0-rc.1 — Release Candidate 1"
git push origin v1.0.0-rc.1
```

Kemudian lanjutkan ke production deploy sesuai `docs/DEPLOYMENT-RUNBOOK.md`.
