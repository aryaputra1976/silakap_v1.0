# 03-WORKFLOW-STANDARD.md

# Workflow Standard

## 1. Objective

Menstandarkan workflow seluruh layanan.

---

## 2. Universal Workflow

```text
DRAFT
↓
SUBMITTED
↓
VERIFIED_ADMIN
↓
VERIFIED_SUBSTANCE
↓
QC
↓
APPROVED
↓
COMPLETED
↓
ARCHIVED
```

---

## 3. Exception Workflow

```text
RETURNED
REJECTED
CANCELLED
EXPIRED
```

---

## 4. Workflow Rules

| Rule | Ketentuan |
|---|---|
| satu owner aktif | wajib |
| semua transisi tercatat | wajib |
| approval bertingkat | configurable |
| return wajib catatan | wajib |
| SLA per state | wajib |

---

## 5. Workflow Transition

| From | Action | To |
|---|---|---|
| DRAFT | submit | SUBMITTED |
| SUBMITTED | verify | VERIFIED_ADMIN |
| VERIFIED_ADMIN | validate | VERIFIED_SUBSTANCE |
| VERIFIED_SUBSTANCE | qc | QC |
| QC | approve | APPROVED |

---

## 6. Workflow Log Standard

```text
WHO
ACTION
FROM_STATE
TO_STATE
WHEN
NOTE
```

---