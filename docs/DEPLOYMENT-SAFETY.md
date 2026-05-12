# Deployment Safety SILAKAP

## Aturan Utama

Jangan menjalankan `prisma db push` di production.

Gunakan:

```bash
npx prisma migrate deploy