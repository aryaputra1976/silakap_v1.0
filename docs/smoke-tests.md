# Smoke Test Notes

Smoke data should use one of these identifiers so it can be cleaned safely:

- `SMOKE-` prefix for `siap_cases.case_number`
- `SMOKE` service type for disposable SIAP cases
- `SMOKE_` prefix for notification types and domain event entity IDs

Cleanup local smoke data:

```powershell
cd D:\Silakap_V1.0\api
npm run db:cleanup-smoke
```

Recommended production-hardening smoke checks:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/health
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/v1/auth/login -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
```

SLA smoke data should be removed after validation with `npm run db:cleanup-smoke`.
