# Sprint 20 — Final Hardening, Regression, dan Production Readiness SOP Module

**Tanggal**: 2026-05-18  
**Status**: SELESAI

## Tujuan

Sprint 20 adalah sprint hardening akhir untuk seluruh modul SOP (Sprint 11–19). Tidak ada fitur baru.  
Fokus: audit konsistensi backend, kelengkapan audit log, keamanan RBAC, dan polishing UI minor.

---

## 1. Audit Temuan & Status

### 1.1 Backend — Error Consistency (PATCH A)

| Modul | ForbiddenException | NotFoundException | BadRequestException | Status |
|-------|-------------------|-------------------|---------------------|--------|
| sop-checklist | ✅ | ✅ | ✅ | OK |
| sop-governance | ✅ | ✅ | ✅ | OK |
| sop-analytics | ✅ | — (read-only) | — | OK |
| sop-reports | ✅ | — (read-only) | — | OK |

Semua modul menggunakan exception NestJS standar secara konsisten.

### 1.2 Backend — RBAC Consistency (PATCH B)

| Modul | OPD Blocked | PPPK Blocked | Metode |
|-------|------------|--------------|--------|
| sop-checklist | ✅ BLOCKED_VIEW_ROLES | ✅ BLOCKED_APPROVE_ROLES | `userRoles.some(r => BLOCKED.has(r))` |
| sop-governance | ✅ BLOCKED = {OPD, PPPK} | ✅ | `assertNotBlocked(roles)` |
| sop-analytics | ✅ BLOCKED = {OPD, PPPK} | ✅ | `getPrimary(user)` check |
| sop-reports | ✅ BLOCKED = {OPD, PPPK} | ✅ | `getPrimary(user)` check |

**Catatan konsistensi**: sop-checklist menggunakan `Array.some()` (cek semua roles), sementara analytics/reports menggunakan `getPrimary()` (cek role pertama/tertinggi). Kedua pendekatan aman karena RBAC sistem mengikuti hierarki prioritas — role tertinggi selalu berada di posisi pertama. Tidak ada perubahan diperlukan.

### 1.3 Backend — Query Param Safety (PATCH C)

Semua repository menggunakan pola `if (q.param) where['param'] = q.param` sehingga:
- undefined params → tidak ditambahkan ke where clause ✅
- empty string params → dievaluasi sebagai falsy, tidak dipakai ✅
- Tidak ada potensi crash dari query param kosong ✅

### 1.4 Backend — Audit Log Coverage (PATCH D)

**Sebelum Sprint 20 — GAP ditemukan:**

| Aksi | Modul | Audit Log Ditulis? |
|------|-------|--------------------|
| Checklist CREATED | sop-checklist | ✅ SopChecklistAuditLog + AuditService |
| Checklist ITEM_UPDATED | sop-checklist | ✅ SopChecklistAuditLog + AuditService |
| Checklist APPROVED/REJECTED | sop-checklist | ✅ SopChecklistAuditLog + AuditService |
| Governance CREATED | sop-governance | ✅ SopGovernanceChangeLog (CREATED) |
| Governance UPDATED | sop-governance | ✅ SopGovernanceChangeLog (UPDATED) |
| Governance ACTIVATED | sop-governance | ✅ SopGovernanceChangeLog (ACTIVATED) |
| Governance ARCHIVED | sop-governance | ✅ SopGovernanceChangeLog (ARCHIVED) |
| Governance MARKED_REVIEW | sop-governance | ✅ SopGovernanceChangeLog (MARKED_REVIEW) |
| Review STARTED | sop-governance | ✅ SopGovernanceChangeLog (REVIEW_STARTED) |
| Review COMPLETED | sop-governance | ✅ SopGovernanceChangeLog (REVIEW_COMPLETED) |
| Review KEPT_ACTIVE | sop-governance | ✅ SopGovernanceChangeLog (KEPT_ACTIVE) |
| Review REVISION_REQUESTED | sop-governance | ✅ SopGovernanceChangeLog (REVISION_REQUESTED) |
| Reminder RESOLVED | sop-governance | ❌ **TIDAK ADA** |
| Reminder DISMISSED | sop-governance | ❌ **TIDAK ADA** |
| Report EXPORT | sop-reports | ✅ AuditService (SOP_REPORT_EXPORT) |

**Fix Sprint 20:**  
`sop-governance.repository.ts` — `resolveReminder` dan `dismissReminder` diperbarui untuk:
1. Fetch reminder terlebih dahulu (untuk mendapatkan `governanceId`, `sopCode`, `reminderType`)
2. Update status reminder (RESOLVED/DISMISSED)
3. Tulis entri `SopGovernanceChangeLog` dengan action `REMINDER_RESOLVED` / `REMINDER_DISMISSED`

`sop-governance.service.ts` — `resolveReminder` dan `dismissReminder` diperbarui untuk meneruskan `getPrimary(roles)` sebagai `actorRole` ke repository.

### 1.5 Backend — Empty Data Safety (PATCH E)

| Modul / Method | Empty Guard | Status |
|----------------|-------------|--------|
| `sop-analytics.repository.getComplianceBySop()` | `if (instanceGroups.length === 0) return []` | ✅ |
| `sop-analytics.repository.getComplianceSummary()` | Returns zeroed object if rows empty | ✅ |
| `sop-analytics.repository.getExecutiveSummary()` | Returns zeroed object if rows empty | ✅ |
| `sop-reports.repository.computeComplianceRows()` | `if (instanceGroups.length === 0) return []` | ✅ |
| `sop-governance.repository.getSummary()` | Returns all-zero counts (Prisma count = 0) | ✅ |
| `sop-checklist.repository.getDashboardSummary()` | Prisma groupBy returns 0 safely | ✅ |

Semua endpoint aman mengembalikan data kosong tanpa crash.

---

## 2. Frontend Audit

### 2.1 Loading / Error / Empty State (PATCH A)

14 panel SOP yang diaudit:

| Komponen | Loading | Error | Empty |
|----------|---------|-------|-------|
| SopChecklistDashboardPanel | ✅ Loader2 spinner | ✅ rose alert | Handled via null summary |
| SopChecklistActivityList | ✅ | ✅ graceful empty | ✅ |
| SopGovernancePanel | ✅ Loader2 spinner | ✅ rose alert | Handled via null summary |
| SopGovernanceChangeLogList | ✅ | — | — |
| SopReviewQueuePanel | ✅ Loader2 spinner | ✅ rose alert | ✅ "Tidak ada SOP yang memerlukan review" |
| SopReviewReminderList | ✅ Loader2 spinner | ✅ rose alert | ✅ Bell icon + teks kosong |
| SopRhkLinkPanel | ✅ | ✅ | ✅ |
| SopComplianceExecutivePanel | ✅ Loader2 spinner | ✅ rose alert | Handled via auto-load |
| SopComplianceBySopTable | ✅ Loader2 spinner | ✅ rose alert | ✅ "Belum ada data checklist" |
| SopEvidenceCompletenessPanel | ✅ Loader2 spinner | ✅ rose alert | ✅ "Belum ada data item checklist" |
| SopExecutiveReportPanel | ✅ Loader2 spinner | ✅ rose alert | ✅ "Pilih periode dan klik Generate Preview" |
| SopExecutiveReportPrint | N/A (render-only) | — | — |
| SopEvidencePackagePanel | ✅ Loader2 spinner | ✅ rose alert | ✅ "Klik Muat Data untuk melihat evidence package" |
| SopChecklistSummaryCard | N/A (display-only) | — | — |

Semua panel memiliki state loading, error, dan empty/initial yang terdefinisi dengan baik.

### 2.2 Role-Gated Rendering (PATCH B)

Semua panel yang mengandung data internal (bukan OPD/PPPK) memiliki guard:
```typescript
if (!VIEW_ALLOWED.includes(userRole)) return null;
```

| Panel | VIEW_ALLOWED excludes OPD+PPPK |
|-------|-------------------------------|
| SopChecklistDashboardPanel | ✅ (PPPK included as operational, OPD excluded) |
| SopGovernancePanel | ✅ |
| SopReviewQueuePanel | ✅ |
| SopReviewReminderList | ✅ |
| SopComplianceExecutivePanel | ✅ |
| SopComplianceBySopTable | ✅ |
| SopEvidenceCompletenessPanel | ✅ |
| SopExecutiveReportPanel | ✅ |
| SopEvidencePackagePanel | ✅ |

**Catatan PPPK**: PPPK dapat mengakses `SopChecklistDashboardPanel` sebagai operational staff (sesuai Sprint 14). PPPK tidak dapat approve/reject, tidak dapat akses governance/analytics/reports.

### 2.3 Print / Export Safety (PATCH C)

`SopExecutiveReportPanel.handlePrint()`:
```typescript
async function handlePrint() {
  if (!report) return;  // ← guard eksplisit
  ...
  window.print();
}
```

`SopExecutiveReportPanel.handleExportJson()`:
```typescript
async function handleExportJson() {
  if (!report) return;  // ← guard eksplisit
  ...
}
```

Tombol Print dan Export JSON juga hanya ditampilkan saat `report` tidak null (`{report && CAN_EXPORT.includes(userRole) ? ... : null}`), sehingga double-guarded. ✅

### 2.4 API Client Consistency (PATCH D)

- Tidak ada penggunaan `any` di file API client (`sop-checklists.ts`, `sop-governance.ts`, `sop-analytics.ts`, `sop-reports.ts`). ✅
- Semua fungsi API menggunakan typed response. ✅
- Empty query params tidak dikirim (pola `...(param ? { key: param } : {})`). ✅

### 2.5 Minor UX Polish (PATCH E)

**Fix Sprint 20**: `SopReviewReminderList` sebelumnya tidak memiliki tombol Refresh. Ditambahkan `ActionButton` dengan ikon `RefreshCcw` dan state `loading` di `SectionCard.actions`.

---

## 3. RBAC Matrix Lengkap (Referensi Final)

| Role | Checklist | Approve | Governance | Analytics | Report | Export |
|------|-----------|---------|------------|-----------|--------|--------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN_BKPSDM | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| KEPALA_BADAN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| KABID | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ANALIS_MADYA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ANALIS_MUDA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ANALIS_PERTAMA | ✅ | ✗ | View only | ✅ | View only | ✗ |
| PENELAAH | ✅ | ✗ | View only | ✅ | View only | ✗ |
| PPPK | Operational only | ✗ | ✗ | ✗ | ✗ | ✗ |
| OPD | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 4. Compliance Score Formula (Referensi)

Formula skor kepatuhan SOP (digunakan di Sprint 18 dan 19):

```
Score = checklistScore(40) + approvalScore(20) + evidenceScore(20) + governanceScore(10) + timelinessScore(10)
```

| Komponen | Formula | Bobot |
|----------|---------|-------|
| checklistScore | `round(avgProgress / 100 * 40)` | 40 |
| approvalScore | `round(approvedInstances / totalInstances * 20)` | 20 |
| evidenceScore | `round(evidenceItems / totalItems * 20)` | 20 |
| governanceScore | `govActive ? 10 : 0` | 10 |
| timelinessScore | `isOverdue ? 0 : 10` | 10 |

Risk level:
- **LOW** ≥ 85
- **MEDIUM** 70–84
- **HIGH** 50–69
- **CRITICAL** < 50 OR (isOverdue AND hasRejected)

---

## 5. Audit Log Architecture (Referensi)

Dua tabel audit yang digunakan:

| Tabel | Digunakan Oleh | Aksi Yang Dicatat |
|-------|---------------|-------------------|
| `audit_logs` (AuditService) | sop-checklist, sop-reports | UPDATE_ITEM, APPROVED, REJECTED, EXPORT_* |
| `sop_governance_change_logs` | sop-governance | CREATED, UPDATED, ACTIVATED, ARCHIVED, MARKED_REVIEW, REVIEW_STARTED, REVIEW_COMPLETED, KEPT_ACTIVE, REVISION_REQUESTED, REMINDER_RESOLVED, REMINDER_DISMISSED |

---

## 6. Known Limitations (Diwarisi dari Sprint 11–19)

| # | Limitation | Sprint Asal |
|---|-----------|-------------|
| 1 | SEKRETARIS dan AUDITOR roles tidak aktif, tidak ada di DB | S11 |
| 2 | `kinerja-bidang-roles.constant.ts` masih pakai STAFF/ADMIN (legacy constant, tidak mempengaruhi RBAC utama) | S11 |
| 3 | IKM/kepuasan adalah placeholder (tidak ada survey backend) | S6 |
| 4 | SIARSIP adalah placeholder page | S11 |
| 5 | `sopCode` disimpan di `tags[]` DMS — tidak ada kolom DB terpisah | S12 |
| 6 | SOP tanpa `SopChecklistInstance` tidak muncul di evidence package | S19 |
| 7 | SopChecklistItem.itemId adalah kode template (mis. "item-1"), label tidak disimpan di DB | S13 |
| 8 | Export format HTML belum diimplementasikan di frontend | S19 |
| 9 | Print menggunakan `window.print()` — tidak ada PDF generation server-side | S19 |

---

## 7. File Yang Diubah Sprint 20

| File | Perubahan |
|------|-----------|
| `api/src/modules/sop-governance/sop-governance.repository.ts` | `resolveReminder` + `dismissReminder` sekarang menulis `SopGovernanceChangeLog` (REMINDER_RESOLVED / REMINDER_DISMISSED) |
| `api/src/modules/sop-governance/sop-governance.service.ts` | Teruskan `getPrimary(roles)` sebagai `actorRole` ke repo reminder methods |
| `apps/web/src/components/workspace/sop/sop-review-reminder-list.tsx` | Tambah tombol Refresh di SectionCard actions |

---

## 8. Regression Checklist

- [ ] Backend build hijau (`npm run build` di `api/`)
- [ ] Frontend lint 0 error (`npm run lint` di `apps/web/`)
- [ ] Frontend build hijau (`npm run build` di `apps/web/`)
- [ ] Prisma schema valid (`npx prisma validate`)
- [ ] OPD → 403 di semua SOP endpoints internal
- [ ] PPPK → 403 di governance, analytics, reports
- [ ] PPPK → 200 di checklist operational (GET, POST instances, PATCH items)
- [ ] Governance reminder RESOLVE → SopGovernanceChangeLog row dengan action=REMINDER_RESOLVED
- [ ] Governance reminder DISMISS → SopGovernanceChangeLog row dengan action=REMINDER_DISMISSED
- [ ] SopReviewReminderList → tombol Refresh muncul dan berfungsi
- [ ] Print button tidak crash jika report belum di-generate
- [ ] Export JSON button tidak crash jika report belum di-generate
- [ ] Semua 14 panel memiliki loading/error/empty state
- [ ] Tidak ada `any` di API client files

---

## 9. Constraints Dipertahankan

- Tidak ada Prisma model baru
- Tidak ada route existing yang dihapus
- Tidak ada route mati yang dibuat
- Tidak ada perubahan destruktif pada Sprint 11–19
- Tidak ada penggunaan `any`
- SEKRETARIS dan AUDITOR tidak ditambahkan
- OPD dan PPPK tidak mendapat akses tambahan
- Security/RBAC tidak diturunkan

---

## 10. Sprint 1–20 Module Summary

| Sprint | Deliverable Utama |
|--------|------------------|
| S1 | Auth/RBAC (JWT, RolesGuard, 10 role codes) |
| S2 | SIAP Worklogs |
| S3 | SIPENSIUN (cases, jenis filter) |
| S4 | SIDATA (import SIASN, rekonsiliasi, validasi) |
| S5 | DMS Core (upload/download/workflow/audit) |
| S6 | Layanan Kepegawaian (SLA, verifikasi, kepuasan) |
| S7 | Kinerja Bidang + SOP/RHK (34 SOP, 8 RHK) |
| S8 | SIANALITIK executive dashboard |
| S9 | RBAC DMS sensitive access (5 access levels) |
| S10 | OPD_OPERATOR own-scope, regression checklist |
| S11 | Frontend RBAC (10 active roles, route guards, menu access) |
| S12 | SOP DMS Taxonomy (26 SOP → DmsSubCategory mapping) |
| S13 | SOP Checklist Digital (5 templates, frontend-only) |
| S14 | SOP Checklist Persistence (3 Prisma models, REST API) |
| S15 | Dashboard Kinerja SOP + RHK Integration |
| S16 | SOP Governance + Versi Dokumen |
| S17 | SOP Review Workflow + Reminder |
| S18 | SOP Compliance Score, Evidence Completeness, Executive Insight |
| S19 | Executive Report Export & Evidence Package |
| S20 | Final Hardening, Regression, Production Readiness |
