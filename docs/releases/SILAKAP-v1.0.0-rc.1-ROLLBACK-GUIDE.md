# SILAKAP v1.0.0-rc.1 Rollback Guide

## 1. Kapan Rollback Dilakukan
Rollback dilakukan jika:
- Migration/deploy gagal dan aplikasi tidak dapat beroperasi.
- Smoke regression gagal pada staging/production after deploy.
- Manual E2E menemukan critical failure.
- RBAC membuka akses internal ke OPD.
- Data submission/RHK/report tidak konsisten.

## 2. Backup DB Restore
1. Stop backend service.
2. Pastikan tidak ada job/write process aktif.
3. Restore database dari backup sebelum deployment.
4. Verifikasi tabel utama dapat dibaca.
5. Jalankan smoke read-only jika memungkinkan.

## 3. Restore Previous Build
1. Restore backend artifact/build sebelumnya.
2. Restore frontend static artifact sebelumnya.
3. Pastikan environment tetap sesuai artifact lama.
4. Restart service.
5. Cek log startup.

## 4. Storage Restore
1. Identifikasi file upload yang dibuat setelah deployment.
2. Restore upload/storage dari backup bila DB juga di-restore.
3. Pastikan metadata DB dan file storage konsisten.
4. Jangan expose storage langsung ke publik selama rollback.

## 5. Migration Rollback Caution
Prisma migrate tidak otomatis menyediakan down migration.

Rollback production harus mengutamakan restore backup database. Jangan menjalankan SQL rollback manual tanpa script yang sudah diuji di staging dan disetujui release owner.

## 6. Smoke After Rollback
Jalankan:
```bash
cd api
npm run prisma:migrate:status
npm run smoke:e2e-regression
```

Manual check:
- Login admin/internal.
- Login OPD.
- Cek workbench.
- Cek report.
- Cek upload directory readable.

## 7. Communication Checklist
| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| Informasikan rollback dimulai |  |  |  |
| Freeze akses user sementara |  |  |  |
| Konfirmasi restore DB selesai |  |  |  |
| Konfirmasi service lama aktif |  |  |  |
| Konfirmasi smoke setelah rollback |  |  |  |
| Kirim incident note dan next action |  |  |  |
