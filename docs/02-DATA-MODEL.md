# 02-DATA-MODEL.md

# Unified Data Model

## 1. Objective

Menyediakan data model global yang dipakai seluruh domain.

---

## 2. Core Entity

| Entity | Fungsi |
|---|---|
| ASN | master pegawai |
| CASE | layanan |
| TASK | pekerjaan |
| DOCUMENT | arsip |
| WORKFLOW | state |
| USER | akun |
| ROLE | akses |
| UNIT | organisasi |

---

## 3. Core Relationship

```text
ASN
 └── CASE
      ├── TASK
      ├── DOCUMENT
      ├── WORKFLOW LOG
      ├── SLA
      ├── TIMELINE
      └── AUDIT
```

---

## 4. CASE Entity

```text
id
case_number
service_type
asn_id
current_state
status
priority
created_at
submitted_at
completed_at
```

---

## 5. TASK Entity

```text
id
case_id
task_type
status
assigned_to
assigned_by
due_date
started_at
completed_at
```

---

## 6. DOCUMENT Entity

```text
id
case_id
document_type
file_name
storage_path
version
uploaded_by
uploaded_at
```

---

## 7. USER Entity

```text
id
name
email
role_id
unit_id
position_id
status
```

---

## 8. Audit Fields

Semua entity wajib memiliki:

```text
created_at
created_by
updated_at
updated_by
deleted_at
```

---

## 9. Data Rules

| Rule | Ketentuan |
|---|---|
| no duplicate ASN | wajib |
| soft delete | default |
| immutable history | wajib |
| auditability | wajib |
| timestamped | wajib |

---

## 10. Analytics Ready

Semua entity wajib memiliki:

- owner
- unit
- timestamp
- status
- role

---