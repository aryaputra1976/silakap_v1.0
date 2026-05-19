# SILAKAP Deployment Runbook

## Staging Deploy
1. Backup database staging.
2. Pull code dari branch release.
3. Install dependency backend dan frontend.
4. Set environment staging tanpa secret di repository.
5. Jalankan `npm run prisma:validate`.
6. Jalankan `npm run prisma:migrate:status`.
7. Jalankan `npm run prisma:migrate:deploy`.
8. Jalankan `npm run prisma:generate`.
9. Jalankan `npm run build`.
10. Jalankan `npm run smoke:e2e-regression`.
11. Build frontend dengan `npm run lint` dan `npm run build`.

## Production Deploy
1. Freeze window perubahan data.
2. Ambil backup database production dan verifikasi file backup terbaca.
3. Pull artifact/code release yang sama dengan staging.
4. Validasi env dan storage.
5. Jalankan migration deploy.
6. Generate Prisma Client.
7. Build backend.
8. Restart service Node/PM2.
9. Deploy frontend static build.
10. Jalankan smoke test dan manual login.

## Migration Deploy
```bash
cd api
npm run prisma:validate
npm run prisma:migrate:status
npm run prisma:migrate:deploy
npm run prisma:generate
```

Jangan gunakan `prisma db push` di staging/production.

Jika `npm run prisma:migrate:status` menampilkan migration pending, status deployment adalah no-go sampai backup tersedia dan `npm run prisma:migrate:deploy` berhasil dijalankan.

## Smoke Test
```bash
cd api
npm run smoke:e2e-regression
```

Manual smoke:
- Login OPD dan cek menu portal.
- Buat draft pengajuan di staging.
- Cek workbench internal.
- Cek DMS upload path.
- Cek SLA `dueAt`.
- Cek candidate, realization, dan executive report.

## Rollback
1. Stop service aplikasi.
2. Restore database dari backup terakhir yang diverifikasi.
3. Deploy artifact/build sebelumnya.
4. Jalankan smoke read-only.
5. Catat migration yang sudah sempat diterapkan.

Rollback migration manual harus dianggap operasi berisiko. Utamakan restore backup DB.

## Backup
- Backup sebelum migration.
- Simpan minimal satu backup off-server.
- Uji restore secara berkala.
- Sertakan upload directory dan metadata DB dalam strategi backup.

## Storage
- Pastikan upload directory ada dan writable oleh app user.
- Jangan expose upload directory langsung ke publik.
- Pastikan limit ukuran file dan MIME whitelist aktif.
- Sertakan upload directory dalam backup.
