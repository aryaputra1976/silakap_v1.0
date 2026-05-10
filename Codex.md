Langkah Berikutnya: Phase 5.1 — Real Upload Middleware

Karena saat ini SIARSIP masih metadata-only, tahap berikutnya adalah membuat upload file nyata ke storage lokal.

Target Phase 5.1
Area	Target
Upload file	multipart/form-data
Storage lokal	simpan file ke folder uploads/
Metadata otomatis	fileName, originalFileName, mimeType, fileSize
Checksum	hash file untuk integritas
File validation	hanya PDF/JPG/PNG, batas ukuran
Download endpoint	akses file by id
Security	path traversal protection
Endpoint tambahan
POST /api/v1/siarsip/cases/:caseId/upload
GET  /api/v1/siarsip/documents/:id/download
Struktur folder storage
api/
 └── uploads/
     └── cases/
         └── {caseId}/
             └── {documentType}-{timestamp}.pdf
Prompt Codex Phase 5.1
# CODEX TASK — Phase 5.1 SIARSIP Real Upload Middleware

Working directory: `D:\Silakap_V1.0\api`

## Goal

Add real file upload support to SIARSIP while preserving the existing metadata-only document API.

## Current Status

Already completed:
- Auth + RBAC
- SIDATA minimal
- SIAP Core Engine + hardening
- SIPENSIUN pilot + hardening
- SIARSIP Basic:
  - document metadata create
  - document list/detail
  - documents by case
  - checklist by case
  - SIPENSIUN requirements normalized as `{ documentType, label }`

## Required Scope

### 1. Upload Endpoint

Add endpoint:

```text
POST /api/v1/siarsip/cases/:caseId/upload

Use multipart/form-data fields:

file
documentType

Optional fields:

description
2. Download Endpoint

Add endpoint:

GET /api/v1/siarsip/documents/:id/download

Return the stored file safely.

3. File Storage

Store files under:

api/uploads/cases/{caseId}/

Generate safe stored filename:

{documentType}-{timestamp}-{random}.{ext}

Never trust original filename as storage filename.

4. Metadata

When upload succeeds, create Document record with:

caseId
documentType
fileName
originalFileName
storagePath
mimeType
fileSize
checksum
uploadedBy
5. Validation

Allow only:

application/pdf
image/jpeg
image/png

Max size:

2 MB

Reject invalid file type with BadRequestException.

Reject missing case with NotFoundException.

6. Checksum

Generate SHA-256 checksum from file buffer.

7. Security Rules
prevent path traversal
do not expose absolute server path in API response
download only by document id
keep JWT + RolesGuard active
no public unauthenticated file access
8. Architecture Rules
Strict TypeScript
No any
Controller stays thin
Service orchestrates
Repository handles DB only
Use existing response helper
Build must pass
Do not remove metadata-only document creation endpoint