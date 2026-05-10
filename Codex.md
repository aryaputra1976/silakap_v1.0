Langkah Berikutnya: Phase 7 — Analytics Dashboard Basic

Sekarang waktunya dashboard tidak hanya menampilkan layout, tetapi mulai menjadi control room.

Target Phase 7

Buat endpoint analytics yang membaca data nyata dari database:

GET /api/v1/analytics/dashboard

Isi minimal:

Data	Sumber
total ASN	Asn
total SIPENSIUN	SipensiunCase
total SIAP case	SiapCase
task pending	SiapTask
task completed	SiapTask
dokumen uploaded	Document
case by state	SiapCase.currentState
case by service type	SiapCase.serviceType
task by status	SiapTask.status
dokumen by type	Document.documentType
Setelah Analytics Basic

Urutan lanjutannya:

Phase 7    Analytics Dashboard Basic
Phase 7.1  Kabid Control Room
Phase 8    Generate Surat / Template Dokumen
Phase 9    Notification & Event Automation
Phase 10   Production Hardening
Prompt Codex Phase 7
# CODEX TASK — Phase 7 Analytics Dashboard Basic

Working directory: `D:\Silakap_V1.0\api`

## Goal

Implement backend analytics dashboard using real Prisma database data.

## Current Status

Completed:
- Auth + RBAC
- SIDATA minimal
- SIAP core engine
- SIPENSIUN pilot
- SIARSIP upload/checklist
- Frontend workspace polished
- Existing endpoint: `GET /api/v1/analytics/dashboard`

## Required Scope

### 1. Analytics Repository

Implement/complete:

- `analytics.repository.ts`

Methods:
- `countAsn()`
- `countSipensiunCases()`
- `countSiapCases()`
- `countPendingTasks()`
- `countCompletedTasks()`
- `countDocuments()`
- `groupCasesByState()`
- `groupCasesByServiceType()`
- `groupTasksByStatus()`
- `groupDocumentsByType()`

### 2. Analytics Service

Implement:

- `getDashboard()`

Return structure:

```json
{
  "summary": {
    "totalAsn": 0,
    "totalSipensiun": 0,
    "totalSiapCases": 0,
    "pendingTasks": 0,
    "completedTasks": 0,
    "uploadedDocuments": 0
  },
  "casesByState": [],
  "casesByServiceType": [],
  "tasksByStatus": [],
  "documentsByType": []
}
3. Analytics Controller

Keep endpoint:

GET /api/v1/analytics/dashboard

Protected with:

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
4. Rules
Strict TypeScript
No any
No dummy data
Repository handles DB only
Service handles response shaping
Controller stays thin
Build must pass
Validation

Run:

npm run build

Smoke test with admin token:

Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/analytics/dashboard `
  -Headers @{ Authorization = "Bearer $token" }

Expected:

returns real counts from database
unauthenticated request returns 401
build succeeds

---

# Setelah Backend Phase 7

Lanjut frontend kecil:

```text
Phase 7.0 Web — Dashboard consume analytics endpoint

Dashboard frontend tinggal baca /analytics/dashboard dan tampilkan:

summary cards
chart sederhana
case state distribution
task status distribution