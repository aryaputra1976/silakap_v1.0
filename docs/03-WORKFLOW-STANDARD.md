# Workflow Standard

## 1. Objective

Menstandarkan workflow seluruh layanan agar semua domain menggunakan bahasa proses yang sama.

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
| role restriction | wajib |
| audit log | wajib |
| timeline entry | wajib |

---

## 5. Workflow Transition

| From | Action | To | Default Role |
|---|---|---|---|
| DRAFT | submit | SUBMITTED | ASN / OPD |
| SUBMITTED | verify | VERIFIED_ADMIN | OPD / ANALIS_PERTAMA |
| VERIFIED_ADMIN | validate | VERIFIED_SUBSTANCE | ANALIS_MUDA |
| VERIFIED_SUBSTANCE | qc | QC | ANALIS_MADYA |
| QC | approve | APPROVED | KABID |
| APPROVED | complete | COMPLETED | System / Admin |
| COMPLETED | archive | ARCHIVED | SIARSIP / System |

---

## 6. Workflow Log Standard

```text
WHO
ACTION
FROM_STATE
TO_STATE
WHEN
NOTE
IP_ADDRESS
USER_AGENT
```

---

## 7. Return Rule

Setiap return/revisi wajib memiliki:

- alasan
- catatan
- target role penerima revisi
- dokumen/field yang harus diperbaiki
- deadline perbaikan

---

## 8. Approval Rule

Approval wajib memenuhi:

- role sesuai
- task aktif selesai
- dokumen wajib lengkap
- tidak ada blocking issue
- audit log tercatat
