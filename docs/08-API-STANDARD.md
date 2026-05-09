# API Standard

## 1. Principle

- backend is source of truth
- thin controller
- service orchestration
- repository only DB access
- validation before service
- transaction for workflow mutation

---

## 2. REST Naming

```text
/cases
/tasks
/workflows
/documents
/sla
/audit
/analytics
```

---

## 3. Response Standard

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

---

## 4. Error Standard

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

## 5. Endpoint Example

```text
GET    /cases
GET    /cases/:id
POST   /cases
POST   /cases/:id/submit
POST   /cases/:id/action

GET    /tasks/my
GET    /tasks/team
POST   /tasks/:id/start
POST   /tasks/:id/complete
POST   /tasks/:id/return
POST   /tasks/:id/assign
```

---

## 6. Controller Rule

Controller hanya boleh:

- menerima request
- validasi input
- memanggil service
- mengembalikan response

Controller tidak boleh berisi business logic.

---

## 7. Service Rule

Service bertanggung jawab untuk:

- orchestration
- transaction
- workflow decision
- audit call
- event publishing

---

## 8. Repository Rule

Repository hanya bertanggung jawab untuk:

- query database
- mutation database
- tidak boleh business rule
