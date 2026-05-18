# Sprint 15 — Dashboard Kinerja SOP + Integrasi RHK/Bukti Dukung

**Tanggal**: 2026-05-18  
**Status**: SELESAI

## Tujuan

Menambahkan dashboard agregat untuk checklist SOP yang sudah persisten (Sprint 14), dihubungkan dengan data RHK dan bukti dukung dari modul Kinerja Bidang.

## Backend — Patch

### A. DTO Dashboard Query

**File**: `api/src/modules/sop-checklist/dto/dashboard-query.dto.ts`

Parameter filter opsional: `moduleKey`, `sopCode`, `status`, `entityType`, `from`, `to`.

### B. Repository — Dashboard Methods

**File**: `api/src/modules/sop-checklist/sop-checklist.repository.ts`

Tipe data baru:
- `DashboardSummary` — agregat keseluruhan + breakdown by module, by SOP, by status
- `DashboardBySopRow` — ringkasan per SOP per modul
- `DashboardActivity` — log aktivitas checklist dengan join ke instance
- `RhkProgressRow` — progress checklist digabung dengan target/realisasi/bukti dukung RHK

Method baru:
- `getDashboardSummary(q)` — aggregate + groupBy, sub-query breakdown status per SOP
- `getDashboardBySop(q)` — menggunakan getSummary, mengekstrak bySop
- `getRecentActivities(limit)` — findMany audit log dengan include instance
- `getRhkProgress(q)` — groupBy sopCode, join kinerjaBidangSop → rhkMappings, targets, realizations, evidence

### C. Service — Dashboard Methods

**File**: `api/src/modules/sop-checklist/sop-checklist.service.ts`

Empat method baru, semua dengan BLOCKED_VIEW_ROLES check:
- `getDashboardSummary(user, q)`
- `getDashboardBySop(user, q)`
- `getRecentActivities(user, limit?)`
- `getRhkProgress(user, q)`

### D. Controller — Dashboard Endpoints

**File**: `api/src/modules/sop-checklist/sop-checklist.controller.ts`

Empat endpoint baru di bawah `DASHBOARD_ROLES` (semua internal kecuali PPPK dan OPD):

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/v1/sop-checklists/dashboard/summary` | Ringkasan agregat |
| GET | `/api/v1/sop-checklists/dashboard/by-sop` | Breakdown per SOP |
| GET | `/api/v1/sop-checklists/dashboard/recent-activities` | Aktivitas terbaru (`?limit=`) |
| GET | `/api/v1/sop-checklists/dashboard/rhk-progress` | Keterkaitan SOP–RHK |

## Frontend — Patch

### E. API Client

**File**: `apps/web/src/lib/api/sop-checklists.ts`

Tipe data baru: `ChecklistDashboardSummary`, `ChecklistDashboardBySop`, `ChecklistDashboardActivity`, `ChecklistRhkProgressRow`, `DashboardQuery`.

Fungsi baru di `sopChecklistsApi`:
- `fetchChecklistDashboardSummary(params)`
- `fetchChecklistDashboardBySop(params)`
- `fetchChecklistRecentActivities(limit?)`
- `fetchChecklistRhkProgress(params)`

Helper privat `buildDashboardQs(params)`.

### F. Komponen Baru

**`SopChecklistActivityList`** (`sop-checklist-activity-list.tsx`):
- Props: `activities`, `loading?`, `error?`
- Menampilkan badge aksi, SOP code, modul/entityType, transisi status, notes, waktu relatif
- `relativeTime()`: "Baru saja" / "N menit lalu" / "N jam lalu" / "N hari lalu"

**`SopChecklistDashboardPanel`** (`sop-checklist-dashboard-panel.tsx`):
- RBAC: SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA, ANALIS_MUDA, ANALIS_PERTAMA, PENELAAH
- Filter bar: modul (select), status (select), tanggal dari/sampai, tombol Terapkan
- 5 StatCard: Total Checklist, Disetujui, Dalam Review, Ditolak, Rata-rata Progress
- `BySopTable`: tabel dengan kolom kode SOP, modul, total, disetujui, review, ditolak, progress bar, status badge
- Section aktivitas terbaru via `SopChecklistActivityList`

**`SopRhkLinkPanel`** (`sop-rhk-link-panel.tsx`):
- RBAC: sama dengan DashboardPanel
- Mengambil `fetchChecklistRhkProgress(query)`
- Per baris SOP: kode RHK terkait (backend atau fallback taxonomy), progress bar checklist, realisasi/target, jumlah bukti dukung DMS
- Fallback rhkCodes menggunakan `getSopDmsMappingByCode(row.sopCode).relatedRhkCodes`

### G. Integrasi Halaman

**`sop-dashboard-page.tsx`**:
- Menambahkan `SopChecklistDashboardPanel` dan `SopRhkLinkPanel` di bagian bawah halaman

**`dashboard-page.tsx`** (control room utama):
- Menambahkan `SopChecklistDashboardPanel` setelah section Recent Activity
- Role-gated: tidak tampil untuk OPD, PPPK (ditangani di dalam komponen)

## RBAC Dashboard

| Role | Akses Dashboard |
|------|----------------|
| SUPER_ADMIN | Ya |
| ADMIN_BKPSDM | Ya |
| KEPALA_BADAN | Ya |
| KABID | Ya |
| ANALIS_MADYA | Ya |
| ANALIS_MUDA | Ya |
| ANALIS_PERTAMA | Ya |
| PENELAAH | Ya |
| PPPK | Tidak |
| OPD | Tidak |

## Constraints Dipertahankan

- Tidak ada perubahan pada RBAC Sprint 11
- Tidak ada perubahan pada taxonomy Sprint 12
- Tidak ada perubahan pada template checklist Sprint 13
- Tidak ada perubahan pada persistence Sprint 14
- Tidak ada penggunaan `any`
- Tidak ada route yang dihapus
- SEKRETARIS dan AUDITOR tidak ditambahkan
