# Sprint 14 — SOP Checklist Persistence

**Status:** Selesai  
**Tanggal:** 2026-05-18  
**Branch:** main  

---

## Tujuan Sprint 14

Membuat checklist SOP yang dibuat di Sprint 13 menjadi **persisten ke database**. Data checklist tidak lagi hilang saat halaman direfresh. Sprint ini menambahkan:

1. **Backend** — 3 tabel Prisma baru, NestJS module `sop-checklist`, REST API `GET/POST/PATCH` di `/api/v1/sop-checklists`
2. **Frontend** — API client `sop-checklists.ts`, `persistenceMode="api"` pada panel, update 3 integrasi halaman, `SopChecklistSummaryCard` baru
3. **Audit trail** — Setiap perubahan item dan tindakan approve/reject menulis ke tabel `sop_checklist_audit_log`

---

## File yang Dibuat / Diubah

### Backend

| File | Aksi | Keterangan |
|------|------|------------|
| `api/prisma/schema.prisma` | Update | +3 model: SopChecklistInstance, SopChecklistItem, SopChecklistAuditLog |
| `api/src/modules/sop-checklist/dto/create-instance.dto.ts` | Baru | DTO create instance |
| `api/src/modules/sop-checklist/dto/update-checklist-item.dto.ts` | Baru | DTO update item |
| `api/src/modules/sop-checklist/dto/approve-reject.dto.ts` | Baru | DTO approve/reject |
| `api/src/modules/sop-checklist/dto/list-instances-query.dto.ts` | Baru | Query params list |
| `api/src/modules/sop-checklist/sop-checklist.repository.ts` | Baru | Prisma queries |
| `api/src/modules/sop-checklist/sop-checklist.service.ts` | Baru | Business logic + RBAC guards |
| `api/src/modules/sop-checklist/sop-checklist.controller.ts` | Baru | REST endpoints |
| `api/src/modules/sop-checklist/sop-checklist.module.ts` | Baru | NestJS module |
| `api/src/modules/app.module.ts` | Update | Register SopChecklistModule |

### Frontend

| File | Aksi | Keterangan |
|------|------|------------|
| `apps/web/src/lib/api/sop-checklists.ts` | Baru | Typed API client functions |
| `apps/web/src/lib/sop-checklist/checklist-types.ts` | Update | +backend-aligned fields pada SopChecklistInstance |
| `apps/web/src/components/workspace/sop/sop-checklist-panel.tsx` | Update | +persistenceMode, entityType, entityId, onSaved, onApproved, onRejected |
| `apps/web/src/components/workspace/sop/sop-checklist-summary-card.tsx` | Baru | Ringkasan status semua checklist per modul |
| `apps/web/src/pages/workspace/sipensiun-detail-page.tsx` | Update | +persistenceMode/entityType/entityId |
| `apps/web/src/pages/workspace/dms-document-detail-page.tsx` | Update | +persistenceMode/entityType/entityId |
| `apps/web/src/pages/workspace/sidata-pemutakhiran-page.tsx` | Update | +persistenceMode/entityType/entityId |

---

## Prisma Models

### SopChecklistInstance

```prisma
model SopChecklistInstance {
  id             String    @id @default(cuid()) @db.VarChar(36)
  sopCode        String    @map("sop_code")
  moduleKey      String    @map("module_key")
  entityType     String    @map("entity_type")   // "sipensiun_case" | "dms_document" | "sidata_module"
  entityId       String    @map("entity_id")
  status         String    @default("DRAFT")     // DRAFT | IN_REVIEW | APPROVED | REJECTED
  progress       Int       @default(0)           // 0-100
  completedItems Int       @default(0)
  totalItems     Int       @default(0)
  approvedById   String?
  approvedAt     DateTime?
  rejectedById   String?
  rejectedAt     DateTime?
  approvalNote   String?   @db.Text
  createdById    String?
  updatedById    String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  items          SopChecklistItem[]
  auditLogs      SopChecklistAuditLog[]
}
```

### SopChecklistItem

```prisma
model SopChecklistItem {
  id            String   @id @default(cuid())
  instanceId    String   @map("instance_id")
  itemId        String   @map("item_id")        // matches template item id
  status        String   @default("PENDING")
  notes         String?  @db.Text
  dmsDocumentId String?  @map("dms_document_id")
  updatedById   String?
  instance      SopChecklistInstance @relation(...)
  @@unique([instanceId, itemId])
}
```

### SopChecklistAuditLog

```prisma
model SopChecklistAuditLog {
  id         String   @id @default(cuid())
  instanceId String   @map("instance_id")
  actorId    String?
  action     String    // CREATED | ITEM_UPDATED | APPROVED | REJECTED
  itemId     String?
  fromStatus String?
  toStatus   String?
  notes      String?  @db.Text
  createdAt  DateTime @default(now())
}
```

---

## API Endpoints

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| `GET` | `/api/v1/sop-checklists` | INTERNAL_ROLES | List instances dengan filter |
| `POST` | `/api/v1/sop-checklists/instances` | INTERNAL_ROLES | Get-or-create instance |
| `GET` | `/api/v1/sop-checklists/instances/:id` | INTERNAL_ROLES | Detail instance + items |
| `PATCH` | `/api/v1/sop-checklists/instances/:id/items` | INTERNAL_ROLES | Update satu item |
| `POST` | `/api/v1/sop-checklists/instances/:id/approve` | APPROVER_ROLES | Approve atau reject |
| `GET` | `/api/v1/sop-checklists/instances/:id/audit-logs` | INTERNAL_ROLES | Audit trail |

**APPROVER_ROLES:** SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA  
**INTERNAL_ROLES:** semua kecuali OPD

---

## Frontend — Cara Pakai (Sprint 14)

### Panel dengan persistensi

```tsx
<SopChecklistPanel
  sopCode="SOP-BKPSDM-PAN-002"
  userRole={userRole}
  persistenceMode="api"
  entityType="sipensiun_case"
  entityId={caseId}
/>
```

- `persistenceMode="local"` (default) — perilaku Sprint 13, state lokal tidak persisten
- `persistenceMode="api"` — load/create via `POST /sop-checklists/instances`, update via `PATCH .../items`, approve via `POST .../approve`
- Panel menampilkan loading spinner saat fetch awal
- Setiap perubahan item langsung dikirim ke API (optimistic update)
- Tombol Approve/Tolak memanggil API dan update state dari respons server

### Mapping entityType

| Halaman | entityType | entityId |
|---------|------------|----------|
| SIPENSIUN Detail | `sipensiun_case` | ID kasus dari URL (`/sipensiun/cases/:id`) |
| DMS Document Detail | `dms_document` | `document.id` |
| SIDATA Pemutakhiran | `sidata_module` | `"PEMUTAKHIRAN"` (modul tanpa entitas spesifik) |

### SopChecklistSummaryCard

```tsx
import { SopChecklistSummaryCard } from '@/components/workspace/sop/sop-checklist-summary-card';

// Tampilkan ringkasan semua checklist untuk modul SIPENSIUN
<SopChecklistSummaryCard
  moduleKey="SIPENSIUN"
  entityType="sipensiun_case"
  entityId={caseId}
/>
```

Menampilkan tabel mini: nama SOP, progress bar 0-100%, status badge. Fetch dari `GET /sop-checklists?moduleKey=...`.

---

## Service Logic

### Get-or-create
`POST /instances` — jika instance sudah ada (sopCode + entityType + entityId sama), kembalikan yang ada; jika belum, buat baru.

### Progress auto-update
Setiap `PATCH .../items` — service menghitung ulang `completedItems` (item TERPENUHI atau TIDAK_RELEVAN) dan `progress` (%), lalu:
- `completedItems < totalItems` → status tetap `DRAFT`
- `completedItems >= totalItems` → status naik ke `IN_REVIEW` (kecuali sudah APPROVED/REJECTED)

### RBAC enforcement
| Aksi | Diblokir |
|------|----------|
| View/edit/approve | OPD selalu diblokir di service layer |
| Approve/reject | OPD + PPPK diblokir; harus dari APPROVER_ROLES |
| Approve sebelum IN_REVIEW | Diblokir dengan `BadRequestException` |

### Audit
Setiap operasi tulis menulis ke `SopChecklistAuditLog` via `repo.createAuditLog()`. Approve/reject juga menulis ke `AuditService.record()` (global audit log tabel `audit_log`).

---

## Regression Checklist

### Backend

- [ ] `POST /api/v1/sop-checklists/instances` dengan body valid → return instance dengan items kosong
- [ ] `POST` kedua kali dengan sopCode+entityType+entityId sama → return instance yang sama (idempotent)
- [ ] `PATCH /instances/:id/items` dengan status TERPENUHI → progress naik
- [ ] `PATCH` saat semua item selesai → status berubah ke IN_REVIEW
- [ ] `POST /instances/:id/approve` action=APPROVED saat IN_REVIEW → status APPROVED
- [ ] `POST /instances/:id/approve` action=APPROVED saat DRAFT → 400 BadRequest
- [ ] Role OPD mencoba GET → 403 Forbidden
- [ ] Role PPPK mencoba POST approve → 403 Forbidden
- [ ] `GET /instances/:id/audit-logs` → array log berurutan
- [ ] `npm run build` backend bersih

### Frontend

- [ ] Panel dengan `persistenceMode="api"` menampilkan loading spinner saat mount
- [ ] Setelah load, item yang sudah tersimpan tampil dengan status yang benar
- [ ] Ubah status item → perubahan langsung tersimpan (tidak ada tombol Simpan manual)
- [ ] Approve berhasil → status badge berubah ke "Disetujui"
- [ ] Panel dengan `persistenceMode="local"` masih berfungsi sama persis seperti Sprint 13
- [ ] `SopChecklistSummaryCard` menampilkan tabel ringkasan dan fetching loading state
- [ ] `npm run lint` exit 0
- [ ] `npm run build` hijau tanpa type error baru
- [ ] Tidak ada `any` baru

### Integrasi Halaman

- [ ] SIPENSIUN Detail: checklist PAN-002 ter-persist dengan `entityType=sipensiun_case`
- [ ] DMS Document Detail: checklist DMS-001 ter-persist dengan `entityType=dms_document`
- [ ] SIDATA Pemutakhiran: checklist DAT-002 ter-persist dengan `entityType=sidata_module`

---

## Keterbatasan yang Diketahui

- SIDATA Pemutakhiran menggunakan `entityId="PEMUTAKHIRAN"` yang bersifat singleton per modul (bukan per batch import). Jika dibutuhkan per-batch di masa depan, dapat diganti dengan `entityId={batch.id}`.
- `SopChecklistSummaryCard` hanya bisa meng-fetch dari API (tidak mendukung local mode).
- LAY-001 dan LAY-002 belum diembed di halaman Layanan Kepegawaian — menunggu halaman detail layanan tersedia.
