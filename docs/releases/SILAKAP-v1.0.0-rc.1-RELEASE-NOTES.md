# SILAKAP v1.0.0-rc.1 Release Notes

## 1. Release Candidate Name
SILAKAP v1.0.0-rc.1

## 2. Scope
- SOP PPIK
- OPD Portal
- Staff Workbench
- SLA
- RHK/Kinerja
- Executive Report
- Admin Control (RBAC, Pengguna, Pengaturan)
- Rekonsiliasi BKPSDM-BPKAD
- Deployment baseline

## 3. Major Features
- RBAC role PPIK dan pemisahan akses OPD/internal.
- Admin Control read-only untuk matrix RBAC, daftar pengguna, dan ringkasan pengaturan.
- SOP DMS taxonomy dan mapping dokumen.
- SOP checklist digital dengan persistence dan audit.
- OPD submission flow: draft, submit, status tracking, correction.
- Multipart DMS upload untuk dokumen OPD.
- Staff workbench PPIK untuk receive, verification, correction, verify, reject, complete.
- SLA business hours dengan working calendar.
- Completion gate sebelum layanan menjadi kandidat RHK.
- RHK candidate bridge dari layanan completed.
- RHK realization melalui approval role berwenang.
- Executive report dan evidence bundle berbasis realization APPROVED.
- Rekonsiliasi BKPSDM-BPKAD: import Simgaji, matching, temuan, tindak lanjut, berita acara, dan laporan.

## 4. Validation Summary
- `npm run prisma:validate`: sukses.
- `npm run prisma:generate`: sukses.
- `npm run prisma:migrate:status`: up to date.
- `npm run smoke:e2e-regression`: 0 FAIL, 0 WARN.
- Backend `npm run build`: sukses.
- Full project `npm run build`: sukses (API + web) setelah `prisma generate`.
- Frontend `npm run lint`: exit 0.
- Frontend `npm run build`: sukses.

## 5. Known Limitations
- PDF export masih print HTML/browser print.
- DMS archive metadata-only untuk executive report masih unsupported.
- OPD preview/download masih dibatasi endpoint aman.
- Holiday nasional perlu seed resmi.
- API lint script belum tersedia.
- Admin Control pada rc.1 bersifat read-only; create/edit user, reset password, dan edit role-permission belum dibuka dari UI.

## 6. Upgrade/Deploy Notes
1. Backup database.
2. Backup uploads/storage.
3. Pull release candidate code/artifact.
4. Jalankan `npm run prisma:validate`.
5. Jalankan `npm run prisma:migrate:status`.
6. Jalankan `npm run prisma:migrate:deploy`.
7. Jalankan `npm run prisma:generate`.
8. Jalankan `npm run db:seed` jika default role/calendar/reference belum tersedia.
9. Build backend dan frontend.
10. Jalankan `npm run smoke:e2e-regression`.
11. Lanjutkan manual staging sign-off.

## 7. Rollback Notes
- Restore database dari backup sebelum migration/deploy.
- Restore previous backend/frontend build artifact.
- Restore upload/storage bila dry run menghasilkan file baru yang harus dibatalkan.
- Prisma migrate tidak menyediakan down migration otomatis; rollback production harus menggunakan backup restore yang tervalidasi.
- Jalankan smoke regression setelah rollback.

## 8. Sign-off Status
Pending manual staging sign-off.

Tag command yang disiapkan, tidak dijalankan otomatis:
```bash
git tag -a v1.0.0-rc.1 -m "SILAKAP v1.0.0-rc.1"
git push origin v1.0.0-rc.1
```
