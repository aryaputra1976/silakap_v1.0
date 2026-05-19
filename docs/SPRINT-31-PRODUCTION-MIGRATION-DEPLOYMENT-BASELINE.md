# Sprint 31 - Production Migration & Deployment Baseline

## 1. Tujuan Sprint 31
Sprint 31 menetapkan baseline deployment staging/production SILAKAP V1.0 setelah alur OPD -> PPIK -> SOP -> RHK -> laporan selesai diuji pada Sprint 30. Fokusnya runbook, environment, migration, seed, backup/restore, dan smoke test. Tidak ada fitur bisnis baru.

## 2. Kondisi Baseline Setelah Sprint 30
- Prisma validate dan generate berhasil.
- Backend build berhasil.
- Frontend lint/build berhasil.
- Smoke regression berhasil 0 FAIL.
- Warning tersisa: default working calendar belum ada di DB lokal dan migration Sprint 24-29 belum tercatat/applied di DB lokal.
- API belum punya lint script.
- PDF masih browser print HTML.
- DMS archive executive report masih metadata-only.
- OPD preview/download tetap dibatasi endpoint aman.

## 3. Migration Inventory
Migration tersedia:
- `20260509203530_init_auth_rbac_core`
- `20260512000100_add_dms_core`
- `20260515000000_add_asn_documents`
- `20260517000100_add_kinerja_bidang_sop_rhk`
- `20260517000200_add_dms_taxonomy`
- `20260517000300_add_sidata_import_tables`
- Sprint 24: `20260518000000_add_opd_submission_document_file_metadata`
- Sprint 25: `20260518001000_add_opd_submission_sla_timeline`
- Sprint 27: `20260519000000_add_kinerja_rhk_realization_report`
- Sprint 29: `20260519001000_add_working_calendar_sla_accuracy`

## 4. Command Migration
```bash
cd api
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
```

Script package yang setara:
```bash
npm run prisma:validate
npm run prisma:migrate:status
npm run prisma:migrate:deploy
npm run prisma:generate
```

## 5. Urutan Deployment Backend
1. Backup database.
2. Pull code/artifact release.
3. Install dependencies.
4. Validasi environment dengan `npm run predeploy:check`.
5. Jalankan `npm run prisma:validate`.
6. Jalankan `npm run prisma:migrate:status`.
7. Jalankan `npm run prisma:migrate:deploy`.
8. Jalankan `npm run prisma:generate`.
9. Jalankan seed hanya jika dibutuhkan.
10. Jalankan `npm run build`.
11. Restart service.
12. Jalankan `npm run smoke:e2e-regression`.

## 6. Urutan Deployment Frontend
1. Set `VITE_API_BASE_URL` ke API production/staging.
2. Set `VITE_BASE_URL` jika aplikasi tidak berada di root path.
3. Install dependencies.
4. Jalankan `npm run lint`.
5. Jalankan `npm run build`.
6. Deploy folder build/static sesuai hosting.

## 7. ENV Checklist
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `WEB_ORIGIN` / `CORS_ORIGINS`
- `APP_URL`
- `API_URL`
- `API_PREFIX`
- `UPLOAD_ROOT` / `UPLOAD_DIR`
- `BACKUP_DIR`
- `UPLOAD_MAX_SIZE_MB`
- MIME whitelist mengikuti service DMS/SIDATA/SIARSIP yang aktif.

## 8. Storage Checklist
- Upload directory exists.
- Writable by app user.
- Tidak diekspos langsung sebagai public directory.
- Masuk dalam backup.
- Max file size dicek.
- Permission folder dibatasi hanya untuk service account.

## 9. Seed Checklist
- Default roles tersedia.
- Admin/Super Admin tersedia dan password diganti setelah bootstrap.
- OPD sample disabled di production kecuali memang diperlukan.
- `WorkingCalendar` default tersedia.
- Holiday calendar diisi dari sumber resmi/manual yang disetujui.

## 10. Smoke Test Checklist
- `npm run smoke:e2e-regression`.
- Login OPD.
- Submit draft pengajuan.
- Cek internal workbench.
- Cek DMS upload path.
- Cek SLA `dueAt`.
- Cek candidate -> realization -> report.

## 11. Rollback Plan
- Restore DB dari backup sebelum migration.
- Deploy previous build artifact.
- Jangan rollback migration manual tanpa rencana SQL yang teruji.
- Pastikan upload directory konsisten dengan DB hasil restore.
- Jalankan smoke read-only setelah restore.

## 12. Known Limitations
- API lint script not available.
- PDF masih print HTML.
- DMS metadata-only archive unsupported untuk executive report.
- OPD preview/download restricted.
- Holiday national seed not official yet.

## 13. Production Go/No-Go Checklist
Go jika:
- Backup DB berhasil dan restore plan jelas.
- `npm run prisma:migrate:status` tidak menunjukkan drift.
- `npm run prisma:migrate:deploy` berhasil.
- `npm run build` backend berhasil.
- `npm run lint` dan `npm run build` frontend berhasil.
- `npm run smoke:e2e-regression` 0 FAIL.
- Default working calendar aktif.
- Upload directory writable dan tidak public.
- OPD tidak bisa akses route internal.

No-go jika:
- Migration belum sinkron.
- Smoke regression FAIL.
- Secret production belum kuat.
- Upload directory tidak writable atau public.
- Default working calendar belum tersedia untuk SLA production.

## 14. Validasi Lokal Sprint 31
Hasil validasi pada database lokal `silakap_v1_0_dev_clean`:
- `npm run prisma:validate`: sukses.
- `npm run prisma:generate`: sukses.
- `npm run prisma:migrate:status`: belum sinkron. Pending migration: `20260518001000_add_opd_submission_sla_timeline`, `20260519000000_add_kinerja_rhk_realization_report`, `20260519001000_add_working_calendar_sla_accuracy`.
- `npm run build` backend: sukses.
- `npm run smoke:e2e-regression`: sukses dengan 0 FAIL dan 2 WARN. Warning: default working calendar belum ada; 1/4 migration Sprint 24-29 tercatat di `_prisma_migrations`.
- `npm run lint` frontend: exit 0 dengan warning React Hooks lama.
- `npm run build` frontend: sukses.

Status go/no-go lokal: **NO-GO untuk production deploy sampai migration pending diterapkan dan default WorkingCalendar tersedia**.
