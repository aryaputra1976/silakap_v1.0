Phase 6.2 — Enterprise UI Polish / Metronic-Like Workspace

Tujuannya:

Mengubah frontend dari “berfungsi” menjadi “layak dipakai demo pimpinan dan terasa seperti aplikasi enterprise.”

Bukan tambah fitur besar dulu, tetapi memperhalus:

layout
sidebar
topbar
card
tabel
badge
form
detail workspace
timeline
checklist
empty/loading/error state
Prinsip Desain Phase 6.2
Jangan seperti form biasa

Tampilan harus terasa sebagai:

BKPSDM Command Workspace

Bukan halaman CRUD sederhana.

Target Tampilan
Area	Target
Login	lebih elegan, government enterprise
Sidebar	lebih modern, ikon, active state, grouping
Topbar	user profile, role badge, logout rapi
Dashboard	KPI cards + quick actions
SIDATA ASN	tabel profesional
SIPENSIUN list	filter + status badge
SIPENSIUN detail	workspace lengkap
Checklist	progress visual
Timeline	vertical timeline
Task SIAP	action workflow jelas
SIARSIP	dokumen rapi, download jelas
Phase 6.2 Jangan Mengubah Backend

Backend sudah cukup.
Fokus hanya di:

apps/web

Backend hanya dipakai sebagai sumber data.

Prompt Codex Phase 6.2

Tempel ini ke Codex:

# CODEX TASK — Phase 6.2 Enterprise UI Polish / Metronic-Like Workspace

Working directory: `D:\Silakap_V1.0\apps\web`

## Goal

Polish SILAKAP frontend into a professional, enterprise-grade, Metronic-inspired government workspace.

The frontend already works functionally, but the UI still feels rough. Improve the visual design, layout consistency, spacing, cards, tables, badges, forms, timeline, checklist, and workspace feel.

## Current Status

Already completed:
- Login works with backend
- AuthProvider/session restore works
- ProtectedRoute works
- Dashboard loads current user
- SIDATA ASN list/search works
- SIPENSIUN list/detail works
- SIPENSIUN requirements now structured
- SIPENSIUN templates endpoint exists
- SIARSIP upload/download/checklist works
- SIAP tasks start/complete works
- Build passes

Backend endpoints are already available. Do not change backend in this task.

## Design Direction

Make the UI feel like a modern enterprise/government workspace:

- clean
- dense but readable
- professional
- card-based
- soft borders
- subtle shadows
- strong status badges
- clear workflow states
- dashboard/workspace oriented
- similar quality direction to Metronic/Trezo enterprise admin UI

Do not copy external commercial code. Create original styling inspired by enterprise admin patterns.

## Required Scope

### 1. Global Visual System

Create or improve shared UI primitives:

- `PageHeader`
- `SectionCard`
- `StatCard`
- `StatusBadge`
- `RoleBadge`
- `WorkflowBadge`
- `SlaBadge`
- `DataTable`
- `EmptyState`
- `LoadingState`
- `ErrorAlert`
- `ActionButton`
- `Toolbar`
- `FilterBar`
- `Timeline`
- `ChecklistItem`
- `FileUploadButton`

Use consistent:

- spacing
- border radius
- colors
- typography
- hover states
- focus states
- disabled states

### 2. Layout Polish

Improve the main workspace layout:

- fixed sidebar
- clean sidebar header
- grouped navigation
- active menu highlight
- compact topbar
- user name + role badge
- logout icon/button
- responsive content width
- subtle background color
- card-based content areas

Sidebar menu:

- Dashboard
- SIDATA ASN
- SIPENSIUN
- SIAP Tasks
- SIARSIP

### 3. Login Page Polish

Improve `/login`:

- stronger branding
- cleaner split layout
- better typography
- refined login card
- password field style
- loading state on submit
- error alert if login fails
- professional footer/label

Keep login using:

```json
{
  "username": "admin",
  "password": "admin123"
}
4. Dashboard Polish

Improve /dashboard:

Show real or derived cards:

Total ASN
Total SIPENSIUN
Pending Task
Uploaded Documents
Current User
Unit Kerja
Platform Status

Create quick action cards:

Cari ASN
Buat Usulan Pensiun
Lihat Task SIAP
Arsip Dokumen

Cards should look polished, not plain boxes.

5. SIDATA ASN Page Polish

Improve /sidata/asn:

page header
search/filter toolbar
professional table
status/unit/jabatan display
pagination
row action: Buat Usulan Pensiun
empty state
loading state

Table columns:

NIP
Nama
Unit Kerja
Jabatan
Golongan
Status ASN
Action
6. SIPENSIUN List Polish

Improve /sipensiun:

filter toolbar:
q
jenisPensiun
currentState
professional table/card list
badge for jenis pensiun
badge for SIAP state
badge for status
action: open detail

Columns:

Nomor Case
Nama ASN
NIP
Jenis Pensiun
TMT Pensiun
State
Status
Action
7. SIPENSIUN Detail Workspace Polish

Improve /sipensiun/:id into a true workspace.

Layout:

Top summary header:

case number
ASN name
NIP
jenis pensiun
currentState badge
status badge
submit button

Main sections:

ASN Profile Card
nama
NIP
unit kerja
jabatan
golongan
status ASN
SIPENSIUN Detail Card
jenis pensiun
TMT pensiun
catatan
recipient rule:
BKN Pusat / Kanreg
city
needsReview if any
Requirement Checklist Card
progress count uploaded/required
progress bar
group by category:
KEPEGAWAIAN
KELUARGA
PERNYATAAN
KEMATIAN
FOTO
FISIK
LAINNYA
uploaded item green
missing item warning
upload button per documentType
download button if uploaded
SIAP Task Card
list tasks
status badge
start button only when ASSIGNED
complete button only when IN_PROGRESS
invalid actions hidden or disabled
Timeline Card
vertical timeline
event title
event type
timestamp
actor if available
Workflow Log Card
from/to state
action
note
performedAt
8. SIAP Tasks Page Polish

Improve /siap/tasks:

filter by status if already available
task cards or table
status badge
due date/SLA if available
start/complete buttons
refresh after action
empty state if no task
9. SIARSIP Page Polish

Improve /siarsip:

document list table
filters:
q
caseId
document type badge
file metadata:
original file name
mime type
size
download button
empty/loading/error states
10. Frontend Types

Update frontend types if needed to match Phase 5.2 backend:

SIPENSIUN requirements now include:

{
  documentType: string;
  label: string;
  category: string;
  required: boolean;
  digital: boolean;
  notes?: string;
}

SIPENSIUN detail/list may include:

recipient?: {
  category: string;
  recipientName: string;
  recipientCity: string;
  needsReview?: boolean;
}
11. UX Rules
No dummy data
Use backend data only
All pages must have loading state
All pages must have empty state
All API errors must show readable message
Do not expose token
Do not break current working flow
Do not redesign backend calls unnecessarily
Keep forms simple and reliable
12. Technical Rules
Strict TypeScript
No any
Keep existing Vite setup
Keep current routing
Keep AuthProvider
Keep protected routes
Build must pass
Do not introduce heavy UI library unless already installed
Use existing icons if available
Keep code modular and maintainable