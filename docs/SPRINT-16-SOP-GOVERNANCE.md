# Sprint 16 — SOP Governance, Review Berkala, dan Versi Dokumen

**Tanggal**: 2026-05-18  
**Status**: SELESAI

## Tujuan

Menambahkan governance SOP: versi, status lifecycle, tanggal berlaku, jadwal review berkala, riwayat perubahan, dan integrasi DMS. Menyediakan API dan UI untuk manajemen SOP aktif, perlu review, dan arsip, dengan akses berbasis RBAC.

---

## Model Data

### SopGovernanceRecord

| Field | Tipe | Keterangan |
|-------|------|-----------|
| id | cuid | Primary key |
| sopCode | String | Kode SOP (e.g. SOP-BKPSDM-PAN-002) |
| title | String | Judul SOP |
| moduleKey | String | Modul terkait |
| version | String | Versi SOP (e.g. "1.0", "2.1") |
| status | String | Status lifecycle (lihat di bawah) |
| isCurrent | Boolean | Hanya satu per sopCode yang isCurrent=true |
| effectiveDate | DateTime? | Tanggal mulai berlaku |
| reviewDueDate | DateTime? | Tanggal review berikutnya |
| dmsDocumentId | String? | Referensi dokumen DMS |
| approvedById | String? | User yang mengaktifkan |
| approvedAt | DateTime? | Waktu aktivasi |
| ownerRole | String? | Role penanggungjawab SOP |
| notes | String? | Catatan tambahan |
| createdById | String? | User pembuat |
| updatedById | String? | User terakhir update |

**Table**: `sop_governance_record`

### SopGovernanceChangeLog

| Field | Tipe | Keterangan |
|-------|------|-----------|
| id | cuid | Primary key |
| governanceId | String | FK → SopGovernanceRecord |
| action | String | Aksi yang dilakukan |
| beforeJson | Json? | Snapshot sebelum perubahan |
| afterJson | Json? | Snapshot setelah perubahan |
| actorId | String? | User pelaku |
| actorRole | String? | Role pelaku |
| note | String? | Catatan aksi |
| createdAt | DateTime | Waktu perubahan |

**Table**: `sop_governance_change_log`

---

## Status SOP (Lifecycle)

```
DRAFT → ACTIVE → NEEDS_REVIEW → REVISION → ACTIVE (ulang)
                               ↓
                            ARCHIVED
```

| Status | Kode | Keterangan |
|--------|------|-----------|
| Draft | DRAFT | Record baru, belum aktif |
| Aktif | ACTIVE | SOP berlaku, hanya satu isCurrent per sopCode |
| Perlu Review | NEEDS_REVIEW | Ditandai untuk ditinjau |
| Revisi | REVISION | Dalam proses revisi |
| Arsip | ARCHIVED | Tidak berlaku, tidak dapat diubah |

**Aturan isCurrent**:
- Saat activate: semua record dengan sopCode yang sama di-set `isCurrent=false`, record ini di-set `isCurrent=true`.
- Saat archive: record di-set `isCurrent=false`.

---

## Aksi & Riwayat

Setiap perubahan status menulis `SopGovernanceChangeLog` dengan action:

| Action | Trigger |
|--------|---------|
| CREATED | POST /records |
| UPDATED | PATCH /records/:id |
| ACTIVATED | POST /records/:id/activate |
| ARCHIVED | POST /records/:id/archive |
| MARKED_REVIEW | POST /records/:id/mark-review |

---

## Role Policy

| Role | Lihat | Buat/Edit | Mark Review | Aktifkan/Arsipkan |
|------|-------|-----------|-------------|-------------------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| ADMIN_BKPSDM | ✓ | ✓ | ✓ | ✓ |
| KEPALA_BADAN | ✓ | ✓ | ✓ | ✓ |
| KABID | ✓ | ✓ | ✓ | ✓ |
| ANALIS_MADYA | ✓ | ✓ | ✓ | ✗ |
| ANALIS_MUDA | ✓ | ✓ | ✓ | ✗ |
| ANALIS_PERTAMA | ✓ | ✗ | ✗ | ✗ |
| PENELAAH | ✓ | ✗ | ✗ | ✗ |
| PPPK | ✗ | ✗ | ✗ | ✗ |
| OPD | ✗ | ✗ | ✗ | ✗ |

---

## API Contract

**Base path**: `/api/v1/sop-governance`

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | /records | VIEW_ROLES | Daftar semua record |
| GET | /records/:id | VIEW_ROLES | Detail record |
| POST | /records | WRITE_ROLES | Buat record baru |
| PATCH | /records/:id | WRITE_ROLES | Update record (tidak bisa jika ARCHIVED) |
| POST | /records/:id/activate | ACTION_ROLES | Aktifkan, set isCurrent |
| POST | /records/:id/archive | ACTION_ROLES | Arsipkan |
| POST | /records/:id/mark-review | WRITE_ROLES | Tandai perlu review |
| GET | /summary | VIEW_ROLES | Ringkasan agregat |
| GET | /due-review | VIEW_ROLES | SOP dengan review mendekati |
| GET | /change-logs?governanceId= | VIEW_ROLES | Riwayat perubahan |

**Response format** (semua endpoint):
```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

### GET /summary — Response

```json
{
  "total": 26,
  "active": 14,
  "draft": 5,
  "needsReview": 3,
  "revision": 2,
  "archived": 2,
  "dueIn30Days": 4,
  "overdueReview": 1,
  "byModule": [
    { "moduleKey": "KINERJA_BIDANG", "total": 10, "active": 7 }
  ],
  "recentChanges": [ ... ]
}
```

---

## Frontend

### Tipe Data

**File**: `apps/web/src/lib/sop-governance/types.ts`

- `SopGovernanceStatus` — union type 5 nilai
- `SopGovernanceRecord` — interface lengkap
- `SopGovernanceChangeLog` — interface dengan sopCode/title dari join
- `SopGovernanceSummary` — agregat + byModule + recentChanges
- Helper: `governanceStatusLabel()`, `governanceStatusTone()`, `governanceActionLabel()`, `governanceActionTone()`

### API Client

**File**: `apps/web/src/lib/api/sop-governance.ts`

Fungsi di `sopGovernanceApi`:
- `fetchSopGovernanceRecords(params)`
- `fetchSopGovernanceRecord(id)`
- `createSopGovernanceRecord(payload)`
- `updateSopGovernanceRecord(id, payload)`
- `activateSopGovernanceRecord(id, payload?)`
- `archiveSopGovernanceRecord(id, payload?)`
- `markSopGovernanceForReview(id, payload?)`
- `fetchSopGovernanceSummary(params)`
- `fetchSopGovernanceDueReview(params)`
- `fetchSopGovernanceChangeLogs(params)`

### Komponen

**`SopGovernanceChangeLogList`** (`sop-governance-change-log.tsx`):
- Timeline perubahan dengan badge aksi, sopCode/judul, actorRole, catatan, waktu relatif

**`SopGovernancePanel`** (`sop-governance-panel.tsx`):
- RBAC: VIEW_ALLOWED = semua kecuali PPPK, OPD
- Filter: modul, status
- 6 StatCard: Total, Aktif, Draft, Perlu Review, Due 30 Hari, Arsip
- Tabel record: kode, judul, modul, versi, status badge, tanggal review, tombol aksi (role-gated)
- Section riwayat perubahan via `SopGovernanceChangeLogList`

### Integrasi Halaman

**`sop-dashboard-page.tsx`**: `SopGovernancePanel` ditambahkan di bagian atas dashboard (sebelum SopChecklistDashboardPanel).

---

## Regression Checklist

- [ ] Prisma schema valid (`npx prisma validate`)
- [ ] Backend build hijau (`npm run build` di api/)
- [ ] Frontend lint 0 error (`npm run lint` di apps/web/)
- [ ] Frontend build hijau (`npm run build` di apps/web/)
- [ ] GET /records mengembalikan data (empty array jika belum ada)
- [ ] POST /records berhasil membuat record + tulis changelog
- [ ] PATCH /records/:id berhasil update + tulis changelog
- [ ] POST /records/:id/activate: isCurrent=true, record lama isCurrent=false
- [ ] POST /records/:id/activate pada ARCHIVED: tolak 400
- [ ] POST /records/:id/archive: status=ARCHIVED, isCurrent=false
- [ ] POST /records/:id/mark-review: status=NEEDS_REVIEW
- [ ] GET /summary: total/active/draft/needsReview/archived/dueIn30Days benar
- [ ] GET /due-review: hanya SOP non-ARCHIVED dengan reviewDueDate ≤ 30 hari
- [ ] GET /change-logs: urut terbaru, opsional filter governanceId
- [ ] OPD request → 403 Forbidden
- [ ] PPPK request → 403 Forbidden
- [ ] ANALIS_PERTAMA/PENELAAH bisa GET records, tidak bisa POST/PATCH/activate/archive
- [ ] ANALIS_MUDA bisa mark-review, tidak bisa activate/archive
- [ ] Kabid/Admin/Kepala Badan bisa activate dan archive
- [ ] `SopGovernancePanel` tidak render untuk OPD/PPPK
- [ ] Tombol Aktifkan hanya tampil jika role ≥ KABID
- [ ] Status badge warna sesuai: success=ACTIVE, warning=NEEDS_REVIEW, dark=ARCHIVED

## Constraints Dipertahankan

- Tidak ada perubahan pada RBAC Sprint 11
- Tidak ada perubahan destruktif pada taxonomy Sprint 12
- Tidak ada perubahan pada checklist Sprint 13–15
- Tidak ada penggunaan `any`
- Tidak ada route existing yang dihapus
- SEKRETARIS dan AUDITOR tidak ditambahkan
