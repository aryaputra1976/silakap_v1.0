1. Perkuat Validasi Create SIPENSIUN

Saat create SIPENSIUN, sistem harus validasi:

Validasi	Aturan
ASN wajib ada	asnId harus valid
jenis pensiun valid	harus salah satu enum
TMT pensiun valid	tidak boleh format tanggal rusak
case aktif dobel	ASN tidak boleh punya SIPENSIUN aktif yang sama
catatan opsional	boleh kosong

Status aktif yang perlu dicegah dobel:

DRAFT
ACTIVE

Jadi kalau ASN sudah punya case SIPENSIUN aktif, sistem jangan buat case baru untuk jenis yang sama.

2. Response Detail Harus Lengkap

Endpoint:

GET /api/v1/sipensiun/cases/:id

Harus mengembalikan data gabungan:

sipensiunDetail
siapCase
asn
tasks
workflowLogs
slaTracking
timelines

Ini penting untuk frontend nanti, karena halaman detail SIPENSIUN harus menjadi workspace, bukan sekadar form.

3. Tambah Filter List

Endpoint:

GET /api/v1/sipensiun/cases

Minimal mendukung query:

q
jenisPensiun
currentState
status
asnId
page
limit

Contoh:

/api/v1/sipensiun/cases?q=andi
/api/v1/sipensiun/cases?jenisPensiun=BUP
/api/v1/sipensiun/cases?currentState=SUBMITTED
/api/v1/sipensiun/cases?page=1&limit=10

Response tetap:

{
  "items": [],
  "page": 1,
  "limit": 10,
  "total": 0
}
4. Submit Guard

Submit SIPENSIUN harus tetap mengikuti SIAP.

Aturan:

Aksi	Aturan
submit	hanya jika SIAP case masih DRAFT
submit ulang	harus gagal 400
case tidak ada	404
user tanpa hak	403
tanpa token	401

Jangan buat logic workflow baru di SIPENSIUN. Tetap panggil:

SiapService.submitCase()
5. Requirement Matrix Dokumen

Untuk sekarang belum perlu upload dokumen penuh. Tapi siapkan struktur requirement matrix sebagai fondasi Phase 5.

Contoh minimal:

export const SIPENSIUN_REQUIREMENTS = {
  BUP: [
    'SK terakhir',
    'KP terakhir',
    'Kartu Pegawai / Identitas',
  ],
  APS: [
    'Surat permohonan',
    'SK CPNS/PNS',
  ],
  JDU: [
    'Akta kematian',
    'Kartu keluarga',
    'Surat nikah',
  ],
  TWS: [
    'Surat keterangan tewas',
    'SK terakhir',
  ],
  SAK: [
    'Surat keterangan dokter',
    'SK terakhir',
  ],
  HLG: [
    'Surat keterangan hilang',
    'SK terakhir',
  ],
  PTDH: [
    'Keputusan hukuman disiplin',
    'SK terakhir',
  ],
} as const;

Nanti matrix ini dipakai untuk:

checklist dokumen
validasi submit
UI persyaratan
dashboard kelengkapan
Prompt Codex Phase 4.1

Tempel ini ke Codex:

# CODEX TASK — Phase 4.1 SIPENSIUN Hardening

Working directory: `D:\Silakap_V1.0\api`

## Goal

Harden SIPENSIUN pilot so it becomes the standard pattern for future business domains.

## Current Status

Already completed:
- Auth + RBAC
- SIDATA minimal
- SIAP Core Engine + hardening
- SIPENSIUN pilot:
  - create SIPENSIUN creates SiapCase
  - create SIPENSIUN creates SipensiunCase detail
  - submit SIPENSIUN calls SiapService.submitCase()
  - SIAP creates task, workflow log, SLA, and timeline

## Required Scope

### 1. Business Validation

Improve SIPENSIUN create validation:

- ASN must exist
- jenisPensiun must be valid enum
- tmtPensiun must be valid if provided
- prevent duplicate active SIPENSIUN case for the same ASN and same jenisPensiun
- active means related SiapCase status is `DRAFT` or `ACTIVE`
- return clean `BadRequestException` or `NotFoundException`

### 2. Detail Response

Improve:

`GET /api/v1/sipensiun/cases/:id`

Return combined detail:

- sipensiun detail
- siapCase
- asn
- tasks
- workflowLogs
- slaTracking
- timelines

No dummy data.

### 3. List Filters

Improve:

`GET /api/v1/sipensiun/cases`

Support filters:

- q
- jenisPensiun
- currentState
- status
- asnId
- page
- limit

Return:

```json
{
  "items": [],
  "page": 1,
  "limit": 10,
  "total": 0
}
4. Submit Guard

Keep submit delegated to SiapService.submitCase().

Ensure:

submit only works if underlying SiapCase is DRAFT
repeated submit returns clean 400
missing case returns clean 404
unauthenticated request returns 401
unauthorized role returns 403
5. Requirement Matrix

Add a SIPENSIUN requirement matrix constant, for example:

sipensiun-requirements.ts

Include requirements for:

BUP
APS
JDU
TWS
SAK
HLG
PTDH

Expose it through service response if useful, or prepare for Phase 5.

6. Optional Endpoint

Add:

GET /api/v1/sipensiun/requirements

Return requirement matrix by jenis pensiun.

Architecture Rules
Strict TypeScript
No any
No dummy response
Controller stays thin
Service orchestrates
Repository handles DB query only
SIPENSIUN must not duplicate SIAP workflow logic
Use existing response helper
Keep JWT + RolesGuard active
Build must pass