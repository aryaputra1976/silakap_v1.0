# Database Schema Blueprint

## 1. Objective

Menjadi acuan awal Prisma schema dan relational database.

---

## 2. Core Table

| Table | Fungsi |
|---|---|
| users | akun |
| roles | role |
| permissions | permission |
| units | unit organisasi |
| asn | master ASN |
| cases | layanan |
| tasks | pekerjaan |
| workflow_definitions | definisi workflow |
| workflow_transitions | aturan transisi |
| workflow_logs | histori workflow |
| sla_tracking | SLA |
| documents | arsip |
| timeline_entries | timeline user |
| audit_logs | audit |
| domain_events | event automation |

---

## 3. Relationship

```text
ASN
 └── CASE
      ├── TASK
      ├── DOCUMENT
      ├── WORKFLOW_LOG
      ├── SLA_TRACKING
      ├── TIMELINE_ENTRY
      └── AUDIT_LOG
```

---

## 4. Database Rule

- soft delete default
- UUID untuk public id
- audit field wajib
- foreign key wajib
- no duplicate ASN
- index untuk pencarian utama
- unique constraint untuk NIP
- enum/status harus konsisten

---

## 5. Prisma Convention

```text
camelCase untuk field
snake_case untuk table mapping
PascalCase untuk model
explicit relation name jika relasi ganda
```

---

## 6. Migration Rule

- migration wajib versioned
- migration tidak boleh edit manual production
- rollback strategy wajib
- gunakan `prisma migrate dev` untuk development
- gunakan `prisma migrate deploy` untuk production
- jangan menjalankan reset di production

---

## 7. Initial Core Models

Minimal model awal:

- User
- Role
- Permission
- Unit
- Asn
- SiapCase
- SiapTask
- WorkflowDefinition
- WorkflowTransition
- WorkflowLog
- SlaTracking
- Document
- TimelineEntry
- AuditLog
- DomainEvent

---

## 8. Index Priority

Index awal:

- asn.nip
- asn.nama
- cases.case_number
- cases.service_type
- cases.current_state
- tasks.assigned_to
- tasks.status
- tasks.due_date
- workflow_logs.case_id
- documents.case_id
