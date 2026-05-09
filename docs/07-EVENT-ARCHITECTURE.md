# 07-EVENT-ARCHITECTURE.md

# Event Architecture

## 1. Objective

Membangun automation layer.

---

## 2. Event Concept

Semua aktivitas penting menghasilkan event.

---

## 3. Example Event

| Event | Action |
|---|---|
| ASN BUP | create case |
| SLA overdue | escalation |
| approval selesai | archive |
| document invalid | return workflow |

---

## 4. Event Standard

| Rule | Ketentuan |
|---|---|
| immutable | wajib |
| timestamped | wajib |
| auditable | wajib |
| replayable | penting |

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
```

---