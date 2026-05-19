# Production Environment Example

Template ini adalah dokumentasi placeholder. Jangan commit file `.env` asli, secret asli, dump database, atau file backup ke repository.

## Backend `.env`

```env
NODE_ENV=production
PORT=3000

# MySQL/MariaDB production. Gunakan user DB dengan privilege terbatas.
DATABASE_URL=mysql://<db_user>:<db_password>@<db_host>:3306/<db_name>

# Minimal 32 karakter, unik per environment.
JWT_SECRET=<replace-with-strong-access-token-secret>
JWT_REFRESH_SECRET=<replace-with-strong-refresh-token-secret>

# Origin frontend yang diizinkan. Pisahkan dengan koma jika lebih dari satu.
WEB_ORIGIN=https://<frontend-domain>
CORS_ORIGINS=https://<frontend-domain>

# URL aplikasi.
APP_URL=https://<frontend-domain>
API_URL=https://<api-domain>
API_PREFIX=/api/v1

# Upload/storage.
UPLOAD_ROOT=/var/lib/silakap/uploads
UPLOAD_DIR=/var/lib/silakap/uploads
UPLOAD_MAX_SIZE_MB=10
BACKUP_DIR=/var/backups/silakap

# Hardening opsional sesuai environment.
REQUEST_BODY_LIMIT=1mb
SECURITY_HEADERS_ENABLED=true
TRUST_PROXY=true
```

## Frontend `.env.production`

```env
VITE_API_BASE_URL=https://<api-domain>/api/v1
VITE_BASE_URL=/
```

## Catatan

- Simpan secret di secret manager, panel hosting, atau environment server.
- Pastikan `.env`, `.env.local`, dan `.env.production` tidak masuk git.
- Rotasi `JWT_SECRET` dan `JWT_REFRESH_SECRET` membutuhkan strategi invalidasi sesi.
- `UPLOAD_ROOT` tidak boleh diekspos langsung sebagai public static directory.
