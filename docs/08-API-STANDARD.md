# 08-API-STANDARD.md

# API Standard

## 1. Principle

- backend is source of truth
- thin controller
- service orchestration
- repository only DB access

---

## 2. REST Naming

```text
/cases
/tasks
/workflows
/documents
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
POST   /tasks/:id/complete
```

---