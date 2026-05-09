# Event Architecture

## 1. Objective

Membangun automation layer agar sistem dapat bereaksi terhadap kejadian penting.

---

## 2. Event Concept

Semua aktivitas penting menghasilkan event.

Event digunakan untuk:

- automation
- notification
- audit
- analytics
- integration

---

## 3. Example Event

| Event | Action |
|---|---|
| ASN_BUP_DETECTED | create pensiun case |
| CASE_SUBMITTED | create verification task |
| SLA_OVERDUE | escalation |
| APPROVAL_COMPLETED | archive |
| DOCUMENT_INVALID | return workflow |
| TASK_COMPLETED | advance workflow |

---

## 4. Event Standard

| Rule | Ketentuan |
|---|---|
| immutable | wajib |
| timestamped | wajib |
| auditable | wajib |
| replayable | penting |
| idempotent handler | wajib |
| retry mechanism | wajib |

---

## 5. Domain Event Structure

```text
id
event_type
entity_type
entity_id
payload
created_at
processed_at
status
retry_count
error_message
```

---

## 6. Event Processing

Event diproses melalui handler:

```text
Event Created
↓
Event Handler
↓
Action Executed
↓
Audit/Timeline Updated
```

---

## 7. Initial Automation Priority

Prioritas awal:

1. create task setelah case submitted
2. reminder SLA
3. escalation overdue
4. archive setelah approval
5. notification setelah return
