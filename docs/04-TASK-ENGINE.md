# Task Engine

## 1. Objective

Mengatur seluruh pekerjaan organisasi melalui SIAP sebagai task orchestration engine.

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
| DOCUMENT_CHECK | cek dokumen |
| NOTIFICATION | pengingat |
| SYSTEM | task otomatis |

---

## 4. Assignment Model

| Model | Fungsi |
|---|---|
| manual | assign langsung |
| rule-based | berdasarkan role |
| workload-based | balancing |
| skill-based | kompetensi |
| unit-based | berdasarkan unit kerja |

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
- supervisor role

---

## 6. Timeline

Semua task wajib memiliki timeline.

Contoh timeline:

```text
Task created
Task assigned
Task started
Task returned
Task completed
Task escalated
```

---

## 7. Task Rule

| Rule | Ketentuan |
|---|---|
| task wajib owner | wajib |
| task wajib SLA | wajib |
| task wajib timeline | wajib |
| task bisa escalation | wajib |
| task bisa reassignment | wajib |
| task selesai wajib catatan/output | wajib |

---

## 8. Task Completion Rule

Task dapat diselesaikan jika:

- user adalah assignee atau supervisor
- mandatory checklist selesai
- required note diisi jika diperlukan
- file output ada jika task menghasilkan dokumen
- audit log berhasil dibuat
