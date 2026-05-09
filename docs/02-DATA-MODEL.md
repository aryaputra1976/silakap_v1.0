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
| SLA | pengendalian waktu |
| AUDIT | jejak perubahan |
| TIMELINE | riwayat proses user |

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
closed_at
created_by
updated_by
deleted_at
```

---

## 5. TASK Entity

```text
id
case_id
task_type
title
description
status
priority
assigned_to
assigned_by
due_date
started_at
completed_at
created_at
updated_at
deleted_at
```

---

## 6. DOCUMENT Entity

```text
id
case_id
document_type
file_name
original_file_name
storage_path
mime_type
file_size
checksum
version
uploaded_by
uploaded_at
deleted_at
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
created_at
updated_at
deleted_at
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

Untuk entity sensitif, tambahkan:

```text
approved_at
approved_by
locked_at
locked_by
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
| foreign key | wajib |
| indexed search field | wajib untuk entity besar |

---

## 10. Analytics Ready

Semua entity utama wajib memiliki:

- owner
- unit
- timestamp
- status
- role
- service type
- state
