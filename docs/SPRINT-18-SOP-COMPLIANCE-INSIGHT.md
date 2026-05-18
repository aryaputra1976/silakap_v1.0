# Sprint 18 — SOP Compliance Score, Evidence Completeness, dan Executive Insight

**Tanggal**: 2026-05-18  
**Status**: SELESAI

## Tujuan

Menambahkan modul analytics SOP yang menghitung skor kepatuhan (compliance score) per SOP, kelengkapan bukti dukung, dan executive summary, tanpa menambahkan model Prisma baru. Data dihitung real-time dari tabel yang sudah ada (SopChecklistInstance, SopChecklistItem, SopGovernanceRecord).

---

## Formula Compliance Score (0–100)

| Komponen | Bobot | Kalkulasi |
|----------|-------|-----------|
| Checklist Completion | 40 | (avgProgress / 100) × 40 |
| Approval | 20 | (approvedInstances / totalInstances) × 20 |
| Evidence | 20 | (evidenceItems / totalItems) × 20 |
| Governance | 10 | 10 jika SopGovernanceRecord ACTIVE+isCurrent, else 0 |
| Review Timeliness | 10 | 10 jika tidak overdue, else 0 |

### Risk Level

| Level | Kondisi |
|-------|---------|
| LOW | skor ≥ 85 |
| MEDIUM | skor 70–84 |
| HIGH | skor 50–69 |
| CRITICAL | skor < 50 ATAU (isOverdue DAN hasRejected) |

---

## Backend Module: `sop-analytics`

**Base path**: `/api/v1/sop-analytics`

Tidak ada Prisma model baru. Data diambil dari:
- `sop_checklist_instance` — progress, status, approvedAt
- `sop_checklist_item` — totalItems, dmsDocumentId (evidence)
- `sop_governance_record` — status, isCurrent, reviewDueDate

### File Baru

| File | Keterangan |
|------|-----------|
| `api/src/modules/sop-analytics/dto/analytics-query.dto.ts` | Query params: moduleKey?, sopCode? |
| `api/src/modules/sop-analytics/sop-analytics.repository.ts` | 5 repository methods, Prisma aggregate tanpa N+1 |
| `api/src/modules/sop-analytics/sop-analytics.service.ts` | ForbiddenException untuk OPD/PPPK |
| `api/src/modules/sop-analytics/sop-analytics.controller.ts` | 5 GET endpoints |
| `api/src/modules/sop-analytics/sop-analytics.module.ts` | NestJS module (AuthModule, PrismaModule) |

### Endpoints

| Method | Path | Keterangan |
|--------|------|-----------|
| GET | /compliance-summary | Agregat keseluruhan: avgScore, riskDistribution, byModule |
| GET | /compliance-by-sop | Per-SOP: score, riskLevel, semua komponen |
| GET | /risk-insights | Hanya CRITICAL + HIGH, diurutkan skor terendah, dengan reasons |
| GET | /evidence-completeness | Per-SOP: totalItems, evidenceItems, evidencePercent, diurutkan terendah |
| GET | /executive-summary | Gabungan: overallScore, riskDistribution, topRisks, byModule, overdueCount, evidenceGapCount |

### Role Policy

Semua endpoint: VIEW_ROLES (SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA, ANALIS_MUDA, ANALIS_PERTAMA, PENELAAH)  
OPD dan PPPK → 403 ForbiddenException via service.

---

## Frontend

### File Baru

| File | Keterangan |
|------|-----------|
| `apps/web/src/lib/sop-analytics/types.ts` | RiskLevel, ComplianceBySopRow, ComplianceSummary, RiskInsightRow, EvidenceCompletenessRow, ExecutiveSummary, AnalyticsQuery |
| `apps/web/src/lib/api/sop-analytics.ts` | sopAnalyticsApi (5 fetch methods) |
| `apps/web/src/components/workspace/sop/sop-compliance-executive-panel.tsx` | SopComplianceExecutivePanel |
| `apps/web/src/components/workspace/sop/sop-compliance-by-sop-table.tsx` | SopComplianceBySopTable |
| `apps/web/src/components/workspace/sop/sop-evidence-completeness-panel.tsx` | SopEvidenceCompletenessPanel |

### `SopComplianceExecutivePanel`

- RBAC: VIEW_ALLOWED (kecuali OPD, PPPK)
- Hero score card (skor keseluruhan 0–100, color-coded)
- 4 StatCard: Risiko Rendah, Sedang, Tinggi, Kritis
- Tabel per modul: total SOP, skor rata-rata, jumlah kritis
- Daftar top risks (CRITICAL + HIGH) dengan reasons
- Tombol Refresh

### `SopComplianceBySopTable`

- RBAC: VIEW_ALLOWED
- Tabel per SOP dengan semua komponen skor + bar chart mini
- Row highlight: CRITICAL = rose-50, HIGH = orange-50
- Diurutkan dari skor terendah (risiko tertinggi di atas)

### `SopEvidenceCompletenessPanel`

- RBAC: VIEW_ALLOWED
- Banner warning jika ada SOP <50% bukti dukung
- Tabel: sopCode, moduleKey, totalItems, evidenceItems, EvidenceBar (colored)
- Row highlight: merah jika <50%
- Diurutkan dari persentase terendah

### Integrasi `sop-dashboard-page.tsx`

Urutan panel setelah update Sprint 18:

1. SopComplianceExecutivePanel ← baru Sprint 18
2. SopComplianceBySopTable ← baru Sprint 18
3. SopEvidenceCompletenessPanel ← baru Sprint 18
4. SopReviewQueuePanel (Sprint 17)
5. SopGovernancePanel (Sprint 16)
6. SopChecklistDashboardPanel (Sprint 15)
7. SopRhkLinkPanel (Sprint 15)
8. SopReviewReminderList (Sprint 17)

---

## Regression Checklist

- [ ] Backend build hijau
- [ ] Frontend lint 0 error, 0 warning
- [ ] Frontend build hijau (2049 modules)
- [ ] GET /compliance-summary: returns averageScore, riskDistribution
- [ ] GET /compliance-by-sop: per-SOP rows dengan komponen scores
- [ ] GET /risk-insights: hanya CRITICAL + HIGH, ada reasons
- [ ] GET /evidence-completeness: diurutkan evidencePercent terendah
- [ ] GET /executive-summary: overallScore, topRisks, byModule
- [ ] OPD/PPPK → 403 di semua endpoints
- [ ] SopComplianceExecutivePanel tidak render untuk OPD/PPPK
- [ ] Score 0 jika tidak ada checklist instance
- [ ] governanceScore=10 hanya jika status ACTIVE DAN isCurrent=true
- [ ] timelinessScore=0 jika reviewDueDate < now
- [ ] evidencePercent dihitung dari dmsDocumentId != null

## Constraints Dipertahankan

- Tidak ada Prisma model baru
- Tidak ada perubahan destruktif pada Sprint 11–17
- Tidak ada route existing yang dihapus
- Tidak ada penggunaan `any`
- SEKRETARIS dan AUDITOR tidak ditambahkan
