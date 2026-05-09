# 04-TASK-ENGINE.md

# Task Engine

## 1. Objective

Mengatur seluruh pekerjaan organisasi.

---

## 2. Task Lifecycle

```text
CREATED
ASSIGNED
IN_PROGRESS
WAITING
RETURNED
COMPLETED
OVERDUE
CANCELLED
```

---

## 3. Task Type

| Type | Fungsi |
|---|---|
| VALIDATION | verifikasi |
| APPROVAL | approval |
| REVIEW | telaah |
| ARCHIVE | arsip |
| SYSTEM | task otomatis |

---

## 4. Assignment Model

| Model | Fungsi |
|---|---|
| manual | assign langsung |
| rule-based | berdasarkan role |
| workload-based | balancing |
| skill-based | kompetensi |

---

## 5. Task Queue

### My Tasks

- assigned
- in progress
- overdue
- waiting

### Team Tasks

Untuk:
- Kabid
- Madya

---

## 6. Timeline

Semua task wajib memiliki timeline.

---

## 7. Task Rule

| Rule | Ketentuan |
|---|---|
| task wajib owner | wajib |
| task wajib SLA | wajib |
| task wajib timeline | wajib |
| task bisa escalation | wajib |

---