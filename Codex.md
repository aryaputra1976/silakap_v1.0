1. Buat Domain Detail SIPENSIUN

Minimal perlu tabel/domain detail:

sipensiun_cases

Isi minimal:

id
siap_case_id
asn_id
jenis_pensiun
tmt_pensiun
catatan
created_at
updated_at

Jenis pensiun awal:

BUP
APS
JDU
TWS
SAK
HLG
PTDH
2. Endpoint SIPENSIUN

Minimal:

GET  /api/v1/sipensiun/cases
GET  /api/v1/sipensiun/cases/:id
POST /api/v1/sipensiun/cases
POST /api/v1/sipensiun/cases/:id/submit
3. Relasi Dengan SIAP

Saat create SIPENSIUN:

create SiapCase
↓
create SipensiunCase detail
↓
return combined response

Saat submit SIPENSIUN:

call SIAP submitCase
↓
SIAP membuat task, workflow log, SLA, timeline
↓
SIPENSIUN status mengikuti SIAP


Prompt Codex Phase 4
# CODEX TASK — Phase 4 SIPENSIUN Pilot

Working directory: `D:\Silakap_V1.0\api`

## Goal

Implement SIPENSIUN pilot as the first real business domain using SIAP Core Engine.

## Current Status

Already completed:
- Auth + RBAC
- SIDATA minimal
- SIAP Core Engine
- SIAP hardening:
  - auto case number
  - state guard
  - task guard
  - transaction submit
  - workflow log
  - SLA tracking
  - timeline

## Required Scope

### 1. Prisma Model

Add SIPENSIUN domain detail model:

```prisma
enum JenisPensiun {
  BUP
  APS
  JDU
  TWS
  SAK
  HLG
  PTDH
}

model SipensiunCase {
  id           String       @id @default(uuid()) @db.VarChar(36)
  siapCaseId   String       @unique @map("siap_case_id") @db.VarChar(36)
  asnId        String       @map("asn_id") @db.VarChar(36)
  jenisPensiun JenisPensiun @map("jenis_pensiun")
  tmtPensiun   DateTime?    @map("tmt_pensiun")
  catatan      String?      @db.Text

  createdAt DateTime  @default(now()) @map("created_at")
  createdBy String?   @map("created_by") @db.VarChar(36)
  updatedAt DateTime  @updatedAt @map("updated_at")
  updatedBy String?   @map("updated_by") @db.VarChar(36)
  deletedAt DateTime? @map("deleted_at")

  siapCase SiapCase @relation(fields: [siapCaseId], references: [id], onDelete: Cascade)
  asn      Asn      @relation(fields: [asnId], references: [id], onDelete: Cascade)

  @@index([asnId])
  @@index([jenisPensiun])
  @@index([tmtPensiun])
  @@map("sipensiun_cases")
}

Update related relations in SiapCase and Asn if needed.

2. DTO

Create DTOs:

create-sipensiun-case.dto.ts
sipensiun-case-list-query.dto.ts

Create body:

{
  "asnId": "<ASN_ID>",
  "jenisPensiun": "BUP",
  "tmtPensiun": "2026-12-01",
  "catatan": "Usulan pensiun BUP"
}
3. Repository

Implement sipensiun.repository.ts:

createSipensiunCase()
findCases()
findCaseById()
findBySiapCaseId()

Repository handles DB query only.

4. Service

Implement sipensiun.service.ts:

validate ASN exists
create SIAP case with:
serviceType = SIPENSIUN
title auto: Usulan Pensiun {jenisPensiun} - {nama ASN}
asnId
priority NORMAL
create SIPENSIUN detail linked to SIAP case
submit SIPENSIUN by calling/reusing SIAP submit logic
return combined data:
siapCase
sipensiunDetail
asn
tasks
workflow logs
timeline

Use Prisma transaction where needed.

5. Controller

Implement endpoints:

GET  /api/v1/sipensiun/cases
GET  /api/v1/sipensiun/cases/:id
POST /api/v1/sipensiun/cases
POST /api/v1/sipensiun/cases/:id/submit

Keep guards:

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
6. Rules
Strict TypeScript
No any
No dummy response
Controller stays thin
Service orchestrates
Repository DB-only
SIPENSIUN must reuse SIAP Core Engine
Do not duplicate workflow logic inside SIPENSIUN
Build must pass