# Sprint 28 — Kinerja Executive Report & DMS Evidence Bundle

**Tanggal:** 2026-05-19  
**Sprint:** 28  
**Status:** Selesai

---

## Tujuan Sprint

Membangun modul laporan eksekutif kinerja bidang yang membaca data HANYA dari `KinerjaRhkRealization` dengan status `APPROVED`. Menambahkan endpoint evidence bundle dan log ekspor dengan audit trail lengkap.

---

## Batasan (JANGAN)

- **Jangan** membuka akses laporan kinerja ke OPD dan PPPK — keduanya diblokir di level service.
- **Jangan** membuat laporan dari candidate yang belum approved — data source hanya `status = 'APPROVED'`.
- **Jangan** mengubah RBAC yang sudah ada.
- **Jangan** menyimpan laporan ke DMS — endpoint `archive-to-dms` mengembalikan `BadRequestException` secara eksplisit (DMS tidak mendukung metadata-only creation tanpa file fisik).
- **Jangan** menghapus route existing — semua endpoint realization sebelumnya tetap aktif.
- **Jangan** klaim PDF export — print menggunakan `window.print()`.

---

## Perubahan Backend

### Modul Baru: `api/src/modules/kinerja-executive-report/`

**Endpoint prefix:** `GET|POST /api/v1/kinerja/executive-report/...`

| Method | Path | Roles | Keterangan |
|--------|------|-------|------------|
| GET | `/summary` | VIEW_ROLES | Aggregat realisasi APPROVED |
| GET | `/monthly` | VIEW_ROLES | Laporan bulanan (delegasi ke realization service) + audit |
| GET | `/quarterly` | VIEW_ROLES | Laporan triwulan + audit |
| GET | `/evidence-bundle` | VIEW_ROLES | Snapshot bukti dari realisasi APPROVED |
| GET | `/print-summary` | VIEW_ROLES | Ringkasan cetak |
| POST | `/export-log` | EXPORT_ROLES | Catat log ekspor ke audit_logs |
| POST | `/archive-to-dms` | EXPORT_ROLES | Selalu `400 Bad Request` (placeholder) |

**VIEW_ROLES:** SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA, ANALIS_MUDA  
**EXPORT_ROLES:** SUPER_ADMIN, ADMIN_BKPSDM, KABID

**File-file:**
- `dto/executive-report-query.dto.ts` — Query DTO dengan validasi class-validator
- `dto/export-log.dto.ts` — DTO untuk log ekspor
- `kinerja-executive-report.repository.ts` — Query evidence bundle dari Prisma
- `kinerja-executive-report.service.ts` — Logika bisnis + audit non-blocking
- `kinerja-executive-report.controller.ts` — HTTP controller
- `kinerja-executive-report.module.ts` — NestJS module (imports KinerjaRhkRealizationModule + AuditModule)

### Audit Actions Baru

| Action | Entity Type | Trigger |
|--------|-------------|---------|
| `KINERJA_EXECUTIVE_REPORT_GENERATED` | KINERJA_EXECUTIVE_REPORT | GET /monthly, GET /quarterly |
| `KINERJA_EVIDENCE_BUNDLE_GENERATED` | KINERJA_EXECUTIVE_REPORT | GET /evidence-bundle |
| `KINERJA_EXECUTIVE_REPORT_EXPORTED` | KINERJA_EXECUTIVE_REPORT | POST /export-log |

Semua audit ditulis non-blocking via `void this.audit.record(...)`.

### `api/src/modules/app.module.ts`

Ditambahkan `KinerjaExecutiveReportModule`.

---

## Perubahan Frontend

### File Baru

| File | Keterangan |
|------|------------|
| `src/lib/kinerja-executive-report/types.ts` | Re-export tipe dari kinerja-rhk-realizations + tipe baru |
| `src/lib/api/kinerja-executive-report.ts` | API client menggunakan `apiClient` |
| `src/components/workspace/kinerja/kinerja-executive-summary-panel.tsx` | Panel ringkasan 4 stat card |
| `src/components/workspace/kinerja/kinerja-evidence-bundle-panel.tsx` | Panel bundle bukti dukung |
| `src/components/workspace/kinerja/kinerja-executive-report-panel.tsx` | Panel laporan bulanan/triwulan + ekspor |
| `src/components/workspace/kinerja/kinerja-executive-report-print.tsx` | Layout cetak formal kop surat BKPSDM |

### File Diperbarui

**`src/pages/workspace/kinerja-bidang-report-page.tsx`** — Sepenuhnya diperbarui dari laporan KinerjaBidang lama ke tiga panel eksekutif baru:
1. `KinerjaExecutiveSummaryPanel` — auto-load ringkasan APPROVED
2. `KinerjaExecutiveReportPanel` — laporan bulanan/triwulan dengan tombol log ekspor
3. `KinerjaEvidenceBundlePanel` — bundle bukti on-demand

---

## Arsitektur & Keputusan Desain

### Delegasi ke Realization Service

Modul eksekutif tidak menduplikasi logika laporan. Ia mendelegasikan ke `KinerjaRhkRealizationService`:
- `getSummary()` — dipanggil dengan `status: 'APPROVED'` dipaksakan
- `getMonthlyReport()` / `getQuarterlyReport()` / `getPrintSummary()` — sudah memfilter APPROVED secara internal

### Evidence Bundle

Data bukti disimpan sebagai `evidenceSnapshotJson` (JSON field) di `KinerjaRhkRealization`. Tidak ada file fisik yang disalin atau dipindahkan. Bundle hanya menampilkan metadata snapshot yang ada.

### Archive to DMS

DmsService tidak mendukung pembuatan dokumen tanpa file fisik (require upload + buffer). Endpoint mengembalikan `400 Bad Request` dengan pesan jelas, dan tombol di frontend ditampilkan sebagai placeholder informatif (bukan tersembunyi atau crash).

### Print Layout

`kinerja-executive-report-print.tsx` menggunakan `window.print()` menghasilkan layout formal kop surat. Bukan PDF — konsisten dengan batasan sprint.

---

## Validasi

| Check | Hasil |
|-------|-------|
| `prisma validate` | Schema valid |
| Backend `tsc --noEmit` | Bersih (errors di seed.ts/scripts/* adalah pre-existing, bukan dari Sprint 28) |
| Frontend `tsc` | 0 errors |
| Frontend ESLint | 0 warnings |
| Frontend `npm run build` | 2108 modules, sukses |
