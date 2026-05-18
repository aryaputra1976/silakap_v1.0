# Sprint 19 — Executive Report Export & Evidence Package

**Tanggal**: 2026-05-18  
**Status**: SELESAI

## Tujuan

Menyediakan endpoint laporan eksekutif SOP yang typed, evidence package per SOP dari DMS/checklist, layout print-ready formal pemerintahan, dan audit log export. Tidak ada model Prisma baru.

---

## API Contract

**Base path**: `/api/v1/sop-reports`

### Query Params (semua endpoint GET)

| Param | Tipe | Keterangan |
|-------|------|-----------|
| moduleKey | string? | Filter per modul |
| sopCode | string? | Filter per kode SOP |
| from | ISO8601? | Batas awal periode (CUSTOM) |
| to | ISO8601? | Batas akhir periode (CUSTOM) |
| periodType | MONTHLY \| QUARTERLY \| YEARLY \| CUSTOM | Tipe periode |
| format | JSON \| HTML \| PRINT | Format output (informasional) |

### Endpoints

| Method | Path | Role | Keterangan |
|--------|------|------|-----------|
| GET | /executive | VIEW_ROLES | Laporan eksekutif lengkap |
| GET | /evidence-package | VIEW_ROLES | Evidence package per SOP |
| GET | /summary-print | VIEW_ROLES | Struktur siap render print |
| POST | /export-log | WRITE_ROLES | Catat aksi export ke AuditLog |

**VIEW_ROLES**: SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA, ANALIS_MUDA, ANALIS_PERTAMA, PENELAAH  
**WRITE_ROLES**: SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID, ANALIS_MADYA, ANALIS_MUDA  
**BLOCKED**: OPD, PPPK — ForbiddenException

---

## Struktur Response

### GET /executive

```json
{
  "periodLabel": "Tahun 2026",
  "generatedAt": "2026-05-18T...",
  "generatedByRole": "KABID",
  "overallScore": 72,
  "totalSops": 26,
  "riskDistribution": { "LOW": 10, "MEDIUM": 8, "HIGH": 6, "CRITICAL": 2 },
  "complianceSummary": { ... },
  "topRisks": [ { "sopCode": "PAN-001", "score": 38, "riskLevel": "CRITICAL", "reasons": [...] } ],
  "byModule": [ { "moduleKey": "SIPENSIUN", "averageScore": 68, "total": 5, "criticalCount": 1 } ],
  "bySop": [ { "sopCode": "...", "score": ..., "riskLevel": "HIGH", ... } ],
  "governanceSummary": { "total": 20, "active": 15, "draft": 3, ... },
  "reviewSummary": { "dueSoon": 3, "overdue": 2, "needsReview": 4, "openReminders": 5 },
  "recommendedActions": [ "Prioritaskan perbaikan 2 SOP dengan risiko CRITICAL..." ],
  "conclusion": "Kepatuhan SOP berada pada kategori CUKUP (72/100)..."
}
```

### GET /evidence-package

```json
{
  "periodLabel": "Tahun 2026",
  "totalSop": 26,
  "totalEvidence": 48,
  "bySop": [
    {
      "sopCode": "PAN-001",
      "title": "Pengelolaan Administrasi Pensiun",
      "moduleKey": "SIPENSIUN",
      "relatedRhkCodes": ["RHK-1", "RHK-2"],
      "evidenceCompletenessPercent": 75,
      "evidenceDocuments": [
        {
          "id": "...",
          "title": "SK Pensiun 2026",
          "category": "BUKTI_DUKUNG",
          "subCategory": "Pensiun",
          "accessLevel": "INTERNAL",
          "uploadedAt": "2026-04-15T...",
          "linkedChecklistItemId": "item-1"
        }
      ],
      "missingEvidenceItems": ["item-2", "item-3"]
    }
  ]
}
```

### GET /summary-print

```json
{
  "header": {
    "organization": "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",
    "reportTitle": "Laporan Kepatuhan SOP Bidang PPIK",
    "period": "Tahun 2026"
  },
  "generatedAt": "...",
  "sections": [
    { "title": "Ringkasan Capaian Kepatuhan SOP", "type": "compliance_summary", "rows": [...] },
    { "title": "Daftar SOP Risiko Tinggi dan Kritis", "type": "risk_table", "rows": [...] },
    { "title": "Tabel Compliance Per SOP", "type": "compliance_table", "rows": [...] }
  ],
  "signatures": [
    { "roleLabel": "Kepala Bidang PPIK", "namePlaceholder": "...", "nipPlaceholder": "NIP. ..." },
    { "roleLabel": "Kepala Badan BKPSDM", "namePlaceholder": "...", "nipPlaceholder": "NIP. ..." }
  ]
}
```

### POST /export-log

Request:
```json
{ "reportType": "EXECUTIVE", "format": "PRINT", "moduleKey": "SIPENSIUN" }
```

Response: `{ "data": { "ok": true } }`

Tulis ke `audit_logs` dengan `entityType = "SOP_REPORT_EXPORT"`, `action = "EXPORT_EXECUTIVE"`.

---

## Evidence Package

Evidence diambil dari dua sumber:
1. **SopChecklistItem.dmsDocumentId** → DmsDocument (primary source, Sprint 14/15)
2. **KinerjaBidangSop.rhkMappings** → relatedRhkCodes (Sprint 7)

Title SOP: KinerjaBidangSop.title → fallback SopGovernanceRecord.title → fallback sopCode.

---

## Print / Export Behavior

### `SopExecutiveReportPrint`
- Layout formal pemerintahan: KOP SURAT, judul, 4 seksi (ringkasan, tabel compliance, rekomendasi, kesimpulan), tanda tangan 2 kolom
- CSS inline (tidak bergantung Tailwind saat `window.print()`)
- Font: Times New Roman
- Dipanggil via `window.print()` dari `SopExecutiveReportPanel`

### Export JSON
- Tombol "Export JSON" di panel → `Blob` download langsung dari browser
- Menulis export-log ke backend (WRITE_ROLES only)

### Preview
- Tombol "Generate Preview" → fetch `/executive` → render preview di panel
- ANALIS_PERTAMA / PENELAAH: bisa lihat preview, tidak ada tombol Print/Export

---

## Frontend Components

| File | Keterangan |
|------|-----------|
| `apps/web/src/lib/sop-reports/types.ts` | Semua types Sprint 19 |
| `apps/web/src/lib/api/sop-reports.ts` | sopReportsApi (4 functions) |
| `sop-executive-report-panel.tsx` | Panel preview dengan filter periode, generate, print, export JSON |
| `sop-executive-report-print.tsx` | Layout print formal pemerintahan |
| `sop-evidence-package-panel.tsx` | Evidence package expandable per SOP |

### Integrasi `sop-dashboard-page.tsx`

Urutan panel Sprint 19:
1. SopComplianceExecutivePanel (Sprint 18)
2. **SopExecutiveReportPanel** ← baru Sprint 19
3. **SopEvidencePackagePanel** ← baru Sprint 19
4. SopComplianceBySopTable (Sprint 18)
5. SopEvidenceCompletenessPanel (Sprint 18)
6. SopReviewQueuePanel (Sprint 17)
7. SopGovernancePanel (Sprint 16)
8. SopChecklistDashboardPanel (Sprint 15)
9. SopRhkLinkPanel (Sprint 15)
10. SopReviewReminderList (Sprint 17)

---

## Role Policy

| Role | Lihat Preview | Generate Report | Print/Export | Export Log |
|------|--------------|----------------|--------------|-----------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| ADMIN_BKPSDM | ✓ | ✓ | ✓ | ✓ |
| KEPALA_BADAN | ✓ | ✓ | ✓ | ✓ |
| KABID | ✓ | ✓ | ✓ | ✓ |
| ANALIS_MADYA | ✓ | ✓ | ✓ | ✓ |
| ANALIS_MUDA | ✓ | ✓ | ✓ | ✓ |
| ANALIS_PERTAMA | ✓ | ✓ | ✗ | ✗ |
| PENELAAH | ✓ | ✓ | ✗ | ✗ |
| PPPK | ✗ | ✗ | ✗ | ✗ |
| OPD | ✗ | ✗ | ✗ | ✗ |

---

## Limitation

- Evidence package hanya mencakup SOP yang sudah memiliki SopChecklistInstance. SOP tanpa checklist tidak muncul.
- SopChecklistItem.itemId adalah kode item template (mis. "item-1"). Label item tidak disimpan di DB — hanya kode.
- Export format HTML belum diimplementasikan di frontend (endpoint backend menerima format=HTML tetapi response tetap JSON struktur).
- Print menggunakan `window.print()` — styling bergantung pada CSS `@media print` browser. Tidak ada PDF generation server-side.
- sopCode disimpan di `tags[]` DMS (Sprint 12) — tidak ada join DmsDocument → sopCode di evidence package; join dilakukan via SopChecklistItem.dmsDocumentId.

---

## Regression Checklist

- [ ] Backend build hijau
- [ ] Frontend lint 0 error, 0 warning
- [ ] Frontend build hijau (2053 modules)
- [ ] GET /executive: response lengkap dengan semua field
- [ ] GET /evidence-package: bySop berisi evidenceDocuments + missingEvidenceItems
- [ ] GET /summary-print: sections[0].type = "compliance_summary"
- [ ] POST /export-log: AuditLog row ditulis (entityType = SOP_REPORT_EXPORT)
- [ ] OPD/PPPK → 403 di semua endpoints
- [ ] SopExecutiveReportPanel tidak render untuk OPD/PPPK
- [ ] Tombol Print/Export tidak tampil untuk ANALIS_PERTAMA/PENELAAH
- [ ] Generate Preview berhasil load dan menampilkan skor
- [ ] SopEvidencePackagePanel: baris SOP expandable
- [ ] window.print() dipanggil saat tombol Print diklik
- [ ] Export JSON mengunduh file .json dari browser
- [ ] Audit log export-log mengirim writeSopExportLog ke backend

## Constraints Dipertahankan

- Tidak ada Prisma model baru
- Tidak ada perubahan destruktif pada Sprint 11–18
- Tidak ada route existing yang dihapus
- Tidak ada penggunaan `any`
- SEKRETARIS dan AUDITOR tidak ditambahkan
