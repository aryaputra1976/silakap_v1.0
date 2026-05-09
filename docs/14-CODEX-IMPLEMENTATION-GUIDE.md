# Codex Implementation Guide

## 1. Objective

Standar implementasi AI coding assistant untuk SILAKAP.

---

## 2. Architecture Rule

- thin controller
- service orchestration
- repository only DB access
- no business logic in controller
- strict TypeScript
- no `any`
- no duplicated business logic

---

## 3. Workflow Rule

- semua layanan memakai workflow engine
- semua pekerjaan memakai task engine
- semua perubahan wajib audit log
- semua layanan wajib SLA
- semua transisi workflow harus tervalidasi role dan state

---

## 4. Database Rule

- jangan duplikasi ASN
- gunakan soft delete
- gunakan audit field
- gunakan relation explicit
- gunakan transaction untuk workflow mutation
- jangan edit migration production secara manual

---

## 5. Frontend Rule

- workspace-based UI
- role-oriented page
- reusable component
- unified table component
- unified status badge
- no dummy data di production page
- loading, empty, dan error state wajib

---

## 6. Backend Rule

- Zod validation
- service layer mandatory
- repository pattern mandatory
- Prisma transaction untuk workflow penting
- controller tidak boleh query Prisma langsung
- response API konsisten

---

## 7. Coding Standard

```text
- strict mode
- ESLint clean
- build must pass
- no placeholder code
- no duplicated business logic
- no direct DB from controller
- no hardcoded role logic jika bisa dikonfigurasi
```

---

## 8. AI Prompt Rule

Gunakan prompt:

```text
Implement this as enterprise-grade production-ready TypeScript.
Follow SILAKAP architecture:
- workflow-first
- task-oriented
- thin controller
- service orchestration
- repository-only database access
- strict TypeScript
- no any
- no dummy implementation
- all mutations audited
- all workflow transitions validated
```

---

## 9. Required Check Before Commit

- `npm run build`
- `npm run lint`
- `npm run typecheck` jika tersedia
- `npx prisma validate`
- `npx prisma generate`
- `git diff --check`

---

## 10. Final Principle

Semua implementasi SILAKAP harus mengikuti:

- workflow-first
- task-oriented
- centralized governance
- auditability
- scalability
- production readiness
