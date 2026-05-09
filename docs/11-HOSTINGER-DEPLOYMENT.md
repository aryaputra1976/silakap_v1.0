# Hostinger Deployment Standard

## 1. Objective

Standar deployment SILAKAP pada environment Hostinger VPS atau Node.js Hosting.

---

## 2. Required Environment

| Component | Version |
|---|---|
| Node.js | 20.x atau 22.x |
| MySQL | 8.x / MariaDB compatible |
| PM2 | latest |
| Nginx | latest |

---

## 3. Backend Build Command

```bash
npm ci
npm run build
```

---

## 4. Backend Start Command

```bash
npm run start
```

Atau dengan PM2:

```bash
pm2 start dist/main.js --name silakap-api
```

---

## 5. Frontend Build Command

```bash
npm ci
npm run build
```

Frontend dapat dijalankan dengan:

```bash
npm run start
```

---

## 6. Environment Variable

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
APP_URL=
API_URL=
UPLOAD_DIR=
```

---

## 7. Deployment Rule

- gunakan production build
- jangan commit `.env`
- gunakan `prisma migrate deploy`
- gunakan backup database otomatis
- aktifkan audit logging
- gunakan HTTPS
- batasi akses upload directory
- aktifkan log rotation

---

## 8. Pre-Deployment Checklist

- build backend berhasil
- build frontend berhasil
- migration berhasil
- seed role awal berhasil
- health endpoint OK
- login admin OK
- upload directory writable
