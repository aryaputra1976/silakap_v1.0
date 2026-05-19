# Staging Dry Run Runbook

## Persiapan DB Staging
1. Konfirmasi target `DATABASE_URL` mengarah ke staging.
2. Ambil backup database.
3. Verifikasi backup dapat dibaca/diunduh.
4. Pastikan tidak ada tester memakai production account untuk dry run.

## Apply Migration
```bash
cd api
npm run prisma:validate
npm run prisma:migrate:status
npm run prisma:migrate:deploy
npm run prisma:generate
```

Deployment no-go bila migration status menunjukkan drift atau deploy gagal.

## Seed
```bash
cd api
npm run db:seed
```

Gunakan seed hanya untuk default role/admin/reference/default working calendar. User OPD/staff staging sebaiknya dibuat terkontrol oleh admin jika seed user test belum disepakati.

## Build Backend dan Frontend
```bash
cd api
npm run build
```

```bash
cd apps/web
npm run lint
npm run build
```

## Jalankan Smoke
```bash
cd api
npm run smoke:e2e-regression
```

Target sign-off: 0 FAIL, 0 WARN.

## Jalankan Manual E2E
1. Login OPD dan buat draft.
2. Submit layanan dan upload dokumen.
3. Login staff/analis dan proses workbench.
4. Jalankan correction cycle.
5. Isi checklist SOP.
6. Complete layanan dengan role berwenang.
7. Approve candidate menjadi realization.
8. Generate executive report dan evidence bundle.
9. Jalankan RBAC negative tests.

## Catat Hasil
Gunakan tabel sign-off di `docs/SPRINT-32-STAGING-DRY-RUN-E2E-SIGNOFF.md`. Semua FAIL harus memiliki owner dan keputusan retry/no-go.

## Rollback Jika Gagal
1. Stop service staging.
2. Restore database dari backup awal dry run.
3. Restore artifact/build sebelumnya bila perlu.
4. Bersihkan file upload staging yang dibuat selama dry run bila tidak ikut restore.
5. Jalankan smoke read-only setelah restore.
