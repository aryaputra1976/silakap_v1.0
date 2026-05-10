Langkah Berikutnya: Phase 5 — SIARSIP Basic

Sekarang yang paling tepat adalah dokumen syarat dan arsip, karena SIPENSIUN sudah punya requirement matrix tapi belum punya upload/checklist dokumen.

Target Phase 5
Area	Target
Document upload metadata	simpan metadata dokumen ke documents
Document list	lihat dokumen per case
Document requirement	bandingkan requirement vs dokumen upload
Checklist	status lengkap/belum
Preview metadata	belum perlu preview file kompleks
Protected endpoint	JWT + RBAC tetap aktif
Endpoint minimal Phase 5
GET  /api/v1/siarsip/documents
GET  /api/v1/siarsip/documents/:id
GET  /api/v1/siarsip/cases/:caseId/documents
POST /api/v1/siarsip/cases/:caseId/documents
GET  /api/v1/siarsip/cases/:caseId/checklist
Alur Phase 5
SIPENSIUN case dibuat
↓
Requirement matrix tersedia
↓
Upload dokumen ke SIARSIP
↓
Dokumen terkait ke SIAP case
↓
Checklist membandingkan required docs vs uploaded docs
↓
Status kelengkapan bisa dibaca UI
Prompt Codex Phase 5
# CODEX TASK — Phase 5 SIARSIP Basic + Document Checklist

Working directory: `D:\Silakap_V1.0\api`

## Goal

Implement SIARSIP basic document management and document checklist foundation for SIAP/SIPENSIUN cases.

## Current Status

Already completed:
- Auth + RBAC
- SIDATA minimal
- SIAP Core Engine + hardening
- SIPENSIUN pilot + hardening
- SIPENSIUN requirement matrix:
  - `GET /api/v1/sipensiun/requirements`

## Required Scope

### 1. SIARSIP Repository

Implement/complete `siarsip.repository.ts`:

- `findDocuments(filters)`
- `findDocumentById(id)`
- `findDocumentsByCaseId(caseId)`
- `createDocument(data)`
- `countDocumentsByCaseId(caseId)`

Repository handles DB query only.

### 2. SIARSIP Service

Implement/complete `siarsip.service.ts`:

- list documents with filters:
  - caseId
  - documentType
  - q
  - page
  - limit
- get document detail
- get documents by case
- create document metadata for a case
- generate checklist for a case

For Phase 5, file storage can be metadata-only if upload middleware is not ready yet.

### 3. SIARSIP Controller

Implement endpoints:

```text
GET  /api/v1/siarsip/documents
GET  /api/v1/siarsip/documents/:id
GET  /api/v1/siarsip/cases/:caseId/documents
POST /api/v1/siarsip/cases/:caseId/documents
GET  /api/v1/siarsip/cases/:caseId/checklist

Keep guards:

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
4. DTO

Create DTOs:

document-list-query.dto.ts
create-document.dto.ts

Create document metadata body:

{
  "documentType": "SK_TERAKHIR",
  "fileName": "sk-terakhir.pdf",
  "originalFileName": "SK Terakhir.pdf",
  "storagePath": "local/dev/sk-terakhir.pdf",
  "mimeType": "application/pdf",
  "fileSize": 120000,
  "checksum": "dev-checksum"
}
5. Checklist Logic

For GET /api/v1/siarsip/cases/:caseId/checklist:

load SIAP case
if case serviceType is SIPENSIUN, load SIPENSIUN detail
get jenisPensiun
load SIPENSIUN requirements matrix
compare required documents with uploaded documents.documentType

Return:

{
  "caseId": "...",
  "serviceType": "SIPENSIUN",
  "isComplete": false,
  "required": [
    {
      "documentType": "SK_TERAKHIR",
      "label": "SK terakhir",
      "uploaded": true
    }
  ],
  "missing": [
    {
      "documentType": "KP_TERAKHIR",
      "label": "KP terakhir"
    }
  ],
  "uploadedDocuments": []
}
6. Requirement Code Alignment

If current SIPENSIUN requirements are text labels only, normalize them into code + label:

{
  documentType: 'SK_TERAKHIR',
  label: 'SK terakhir'
}

Do not break existing /sipensiun/requirements.

7. Rules
Strict TypeScript
No any
No dummy response
Controller stays thin
Service orchestrates
Repository handles DB only
Keep JWT + RolesGuard active
Build must pass
Do not implement real file upload yet unless already available
Metadata-only document creation is acceptable for Phase 5
Validation

Run:

npm run build

Smoke test:

Login as admin
Create or use existing SIPENSIUN case
Get checklist before upload → missing documents shown
Create document metadata for case
Get documents by case → document appears
Get checklist again → uploaded document marked true
List documents with filter caseId
Unauthenticated requests return 401