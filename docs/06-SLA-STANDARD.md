# SLA Standard

## 1. Objective

Mengatur standar waktu layanan dan mekanisme eskalasi.

---

## 2. SLA Status

```text
ON_TRACK
WARNING
OVERDUE
ESCALATED
COMPLETED
```

---

## 3. Escalation Model

```text
Hari 1 → reminder owner
Hari 3 → supervisor
Hari 5 → Kabid
Hari 7 → critical
```

---

## 4. SLA Rules

| Rule | Ketentuan |
|---|---|
| setiap state punya SLA | wajib |
| overdue wajib escalation | wajib |
| SLA analytics | wajib |
| reminder otomatis | wajib |
| pause SLA untuk waiting external | configurable |
| SLA per service type | wajib |

---

## 5. Example SLA

| Tahap | SLA |
|---|---|
| Verifikasi awal | 2 hari |
| Validasi substansi | 3 hari |
| QC | 2 hari |
| Approval | 1 hari |
| Arsip final | 1 hari |

---

## 6. SLA Calculation

SLA dihitung dari:

```text
started_at → due_at → completed_at
```

SLA dapat memiliki status:

- tepat waktu
- hampir terlambat
- terlambat
- dieskalasi
- selesai

---

## 7. SLA Analytics

Minimal dashboard SLA:

- SLA compliance
- overdue task
- average processing time
- bottleneck state
- unit paling lambat
- role paling overload
