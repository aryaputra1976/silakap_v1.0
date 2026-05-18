# Sprint 17 — SOP Review Workflow, Notifikasi, dan Due Reminder

**Tanggal**: 2026-05-18  
**Status**: SELESAI

## Tujuan

Menambahkan workflow review berkala pada `SopGovernanceRecord` Sprint 16: mulai review, catat keputusan (tetap berlaku / perlu revisi / arsip), due reminder internal, dan review queue dashboard untuk role yang berwenang.

---

## Lifecycle Review SOP

```
ACTIVE (reviewDueDate mendekati)
  └─ masuk dueSoon queue
  └─ masuk overdue queue jika sudah lewat

Kabid/Admin → Mulai Review
  └─ status → NEEDS_REVIEW (action: REVIEW_STARTED)
  └─ masuk needsReview queue

Keputusan review (KEPALA_BADAN / KABID / ADMIN):
  ├─ Tetap Berlaku → status → ACTIVE, isCurrent=true, reviewDueDate diperbarui (action: KEPT_ACTIVE)
  ├─ Perlu Revisi  → status → REVISION (action: REVISION_REQUESTED)
  └─ Selesaikan Review (dengan decision) → action: REVIEW_COMPLETED
       ├─ KEEP_ACTIVE   → ACTIVE + isCurrent
       ├─ REVISION_REQ  → REVISION
       └─ ARCHIVED      → ARCHIVED, isCurrent=false
```

---

## Reminder Type & Status

### Reminder Types
| Kode | Label | Tone |
|------|-------|------|
| DUE_SOON | Due Soon | warning |
| OVERDUE | Overdue | danger |
| MANUAL_REVIEW | Review Manual | info |
| REVISION_REQUIRED | Revisi Diperlukan | info |

### Reminder Status
| Kode | Keterangan |
|------|-----------|
| OPEN | Aktif, belum ditangani |
| RESOLVED | Ditandai selesai |
| DISMISSED | Diabaikan |

---

## Role Policy

| Role | Lihat Queue | Mulai Review | Keputusan | Resolve/Dismiss Reminder |
|------|-------------|--------------|-----------|--------------------------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| ADMIN_BKPSDM | ✓ | ✓ | ✓ | ✓ |
| KEPALA_BADAN | ✓ | ✓ | ✓ | ✓ |
| KABID | ✓ | ✓ | ✓ | ✓ |
| ANALIS_MADYA | ✓ | ✓ | ✗ | ✓ |
| ANALIS_MUDA | ✓ | ✓ | ✗ | ✓ |
| ANALIS_PERTAMA | ✓ | ✗ | ✗ | ✗ |
| PENELAAH | ✓ | ✗ | ✗ | ✗ |
| PPPK | ✗ | ✗ | ✗ | ✗ |
| OPD | ✗ | ✗ | ✗ | ✗ |

---

## Model Data

### SopReviewReminder

| Field | Tipe | Keterangan |
|-------|------|-----------|
| id | cuid | Primary key |
| governanceId | String | FK → SopGovernanceRecord |
| sopCode | String | Kode SOP |
| title | String | Judul SOP |
| moduleKey | String | Modul |
| reminderType | String | DUE_SOON / OVERDUE / MANUAL_REVIEW / REVISION_REQUIRED |
| status | String | OPEN / RESOLVED / DISMISSED |
| dueDate | DateTime? | Tanggal jatuh tempo |
| sentToRole | String? | Role tujuan |
| sentToUserId | String? | User tujuan |
| message | String? | Pesan reminder |
| createdById | String? | Pembuat |
| resolvedById | String? | Yang me-resolve/dismiss |
| resolvedAt | DateTime? | Waktu resolve/dismiss |

**Table**: `sop_review_reminder`

### SopGovernanceRecord — tambahan changelog actions

| Action | Trigger |
|--------|---------|
| REVIEW_STARTED | POST /records/:id/start-review |
| REVIEW_COMPLETED | POST /records/:id/complete-review |
| KEPT_ACTIVE | POST /records/:id/keep-active |
| REVISION_REQUESTED | POST /records/:id/request-revision |

---

## API Contract

**Base**: `/api/v1/sop-governance`

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | /review/queue | VIEW_ROLES | Review queue (dueSoon, overdue, needsReview, inRevision, recentActions) |
| POST | /records/:id/start-review | WRITE_ROLES | Mulai review, status → NEEDS_REVIEW |
| POST | /records/:id/complete-review | ACTION_ROLES | Selesaikan review dengan decision |
| POST | /records/:id/keep-active | ACTION_ROLES | Tetap berlaku + perbarui reviewDueDate |
| POST | /records/:id/request-revision | ACTION_ROLES | Minta revisi, status → REVISION |
| POST | /records/:id/reminders | WRITE_ROLES | Buat reminder manual |
| GET | /reminders | VIEW_ROLES | List reminder (filter: governanceId, status, moduleKey) |
| POST | /reminders/:id/resolve | WRITE_ROLES | Set status RESOLVED |
| POST | /reminders/:id/dismiss | WRITE_ROLES | Set status DISMISSED |

### GET /review/queue — Response

```json
{
  "dueSoon": [ { "id": "...", "sopCode": "...", "reviewDueDate": "2026-06-01", ... } ],
  "overdue": [ ... ],
  "needsReview": [ ... ],
  "inRevision": [ ... ],
  "recentReviewActions": [ { "action": "REVIEW_STARTED", "sopCode": "...", ... } ]
}
```

### POST /records/:id/keep-active — Payload

```json
{ "note": "Masih relevan, review berikutnya 6 bulan", "reviewDueDate": "2026-11-18" }
```

### POST /records/:id/complete-review — Payload

```json
{ "decision": "KEEP_ACTIVE", "note": "...", "reviewDueDate": "2026-11-18" }
```

---

## UI Integration

### `SopReviewQueuePanel` (`sop-review-queue-panel.tsx`)

- RBAC: VIEW_ALLOWED (semua kecuali OPD, PPPK)
- 4 StatCard: Due Soon, Overdue, Perlu Review, Dalam Revisi
- Tabel per kategori (Overdue → Due Soon → Perlu Review → Dalam Revisi)
- Tombol aksi inline:
  - **Mulai Review** (ANALIS_MUDA ke atas) — status ACTIVE/NEEDS_REVIEW
  - **Tetap Berlaku** (KABID ke atas) — status NEEDS_REVIEW
  - **Perlu Revisi** (KABID ke atas) — status NEEDS_REVIEW
  - **Selesaikan** (KABID ke atas) — status REVISION
- Inline form catatan + tanggal review berikutnya (untuk Tetap Berlaku)
- Seksi "Aksi Review Terbaru" dari changelog

### `SopReviewReminderList` (`sop-review-reminder-list.tsx`)

- RBAC: VIEW_ALLOWED
- Hanya menampilkan OPEN reminders
- Badge type: DUE_SOON=warning, OVERDUE=danger, MANUAL=info
- Resolve / Dismiss (ANALIS_MUDA ke atas)
- Overdue date ditandai merah

### `sop-dashboard-page.tsx`

Urutan panel:
1. SopGovernancePanel
2. **SopReviewQueuePanel** ← baru Sprint 17
3. **SopReviewReminderList** ← baru Sprint 17
4. SopChecklistDashboardPanel
5. SopRhkLinkPanel

---

## Regression Checklist

- [ ] Prisma schema valid
- [ ] Backend build hijau
- [ ] Frontend lint 0 error
- [ ] Frontend build hijau
- [ ] GET /review/queue: dueSoon/overdue berdasarkan reviewDueDate
- [ ] GET /review/queue: needsReview = records dengan status NEEDS_REVIEW
- [ ] GET /review/queue: inRevision = records dengan status REVISION
- [ ] POST /records/:id/start-review: status → NEEDS_REVIEW, changelog REVIEW_STARTED
- [ ] POST /records/:id/keep-active: status → ACTIVE, reviewDueDate diperbarui, isCurrent=true
- [ ] POST /records/:id/request-revision: status → REVISION, changelog REVISION_REQUESTED
- [ ] POST /records/:id/complete-review decision=KEEP_ACTIVE: ACTIVE + isCurrent
- [ ] POST /records/:id/complete-review decision=REVISION_REQUIRED: REVISION
- [ ] POST /records/:id/complete-review decision=ARCHIVED: ARCHIVED, isCurrent=false
- [ ] POST /records/:id/reminders: reminder OPEN dibuat
- [ ] GET /reminders: filter status=OPEN berhasil
- [ ] POST /reminders/:id/resolve: status → RESOLVED
- [ ] POST /reminders/:id/dismiss: status → DISMISSED
- [ ] OPD/PPPK → 403 pada semua review endpoint
- [ ] ANALIS_PERTAMA/PENELAAH tidak dapat start-review (403)
- [ ] ANALIS_MUDA tidak dapat complete-review (403)
- [ ] SopReviewQueuePanel tidak render untuk OPD/PPPK
- [ ] SopReviewReminderList tidak render untuk OPD/PPPK
- [ ] Tombol "Tetap Berlaku" dan "Perlu Revisi" tidak tampil untuk ANALIS_*
- [ ] DueDateLabel merah jika overdue

## Constraints Dipertahankan

- Tidak ada perubahan destruktif pada Sprint 11–16
- Tidak ada route existing yang dihapus
- Tidak ada penggunaan `any`
- SEKRETARIS dan AUDITOR tidak ditambahkan
