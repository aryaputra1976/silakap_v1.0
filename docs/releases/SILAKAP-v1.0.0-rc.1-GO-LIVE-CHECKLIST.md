# SILAKAP v1.0.0-rc.1 Go-Live Checklist

## 1. Pre-deploy
| Item | Status | Notes |
| --- | --- | --- |
| `git status --short` clean |  |  |
| DB backup completed |  |  |
| Uploads/storage backup completed |  |  |
| Environment verified |  |  |
| DB credentials verified |  |  |
| Storage writable by app user |  |  |
| Upload directory not public |  |  |

## 2. Migration
| Command | Status | Notes |
| --- | --- | --- |
| `cd api && npm run prisma:validate` |  |  |
| `cd api && npm run prisma:migrate:status` |  |  |
| `cd api && npm run prisma:migrate:deploy` |  |  |
| `cd api && npm run prisma:generate` |  |  |

## 3. Seed
| Item | Status | Notes |
| --- | --- | --- |
| Working calendar default exists |  |  |
| Roles/admin exist |  |  |
| Required reference data exists |  |  |
| Holiday calendar reviewed |  |  |

## 4. Backend
| Item | Status | Notes |
| --- | --- | --- |
| `npm install` or `npm ci` completed |  |  |
| `npm run build` succeeded |  |  |
| Service started/restarted |  |  |
| Health check OK |  |  |
| Logs checked |  |  |

## 5. Frontend
| Item | Status | Notes |
| --- | --- | --- |
| API URL env points to target API |  |  |
| `npm run lint` exit 0 |  |  |
| `npm run build` succeeded |  |  |
| Static assets deployed |  |  |
| Browser cache strategy checked |  |  |

## 6. Smoke
| Item | Status | Notes |
| --- | --- | --- |
| `npm run smoke:e2e-regression` 0 FAIL, 0 WARN |  |  |
| Login OPD |  |  |
| Internal workbench opens |  |  |
| Admin Control opens (`/admin/rbac`, `/admin/users`, `/admin/settings`) for SUPER_ADMIN/ADMIN_BKPSDM only |  |  |
| Upload file path works |  |  |
| Report page opens |  |  |

## 7. Manual E2E
| Item | Status | Notes |
| --- | --- | --- |
| OPD submit |  |  |
| PPIK process |  |  |
| RHK realization |  |  |
| Executive report |  |  |
| Evidence bundle |  |  |
| RBAC negative tests |  |  |
| Admin Control read-only verified |  |  |

## 8. Go/No-Go
Go criteria:
- Migration status up to date.
- Smoke regression 0 FAIL, 0 WARN.
- Manual staging sign-off approved.
- OPD cannot access internal routes.
- OPD/non-admin cannot access Admin Control routes.
- Candidate approval creates realization exactly once.
- Executive report reads only APPROVED realization.

No-go criteria:
- Migration drift or failed migration.
- Smoke regression FAIL or WARN not accepted.
- Manual E2E critical failure.
- OPD can access workbench/kinerja/working calendar.
- OPD or non-admin can access `/admin/*`.
- Upload invalid accepted as success.
- Report counts non-approved candidate/realization.

## 9. Sign-off Table
| Area | Role | Name | Status | Notes | Signature/Date |
| --- | --- | --- | --- | --- | --- |
| Technical | Release engineer |  |  |  |  |
| QA | QA lead |  |  |  |  |
| Functional | PPIK representative |  |  |  |  |
| Security/RBAC | Admin/Super Admin |  |  |  |  |
| Deployment | DevOps |  |  |  |  |
