# 11-HOSTINGER-DEPLOYMENT.md

# Hostinger Deployment

## 1. Target

Struktur ini mendukung dua mode kerja:

- Frontend statis React/Vite ke `public_html`.
- Backend NestJS sesuai model Hostinger Node app pada subdomain API.

## 2. Local Development

Untuk development lokal, gunakan:

```bash
npm install --force
npm --prefix api install
npm run dev:api
npm run dev:web
```

Default lokal:

```text
Frontend : http://localhost:5173
API      : http://localhost:3101
API base : http://localhost:3101/api/v1
```

Konfigurasi lokal ada di:

```text
apps/web/.env
api/.env
```

Konfigurasi production frontend ada di:

```text
apps/web/.env.production
```

Catatan folder API:

```text
api/      -> API utama NestJS untuk lokal dan Hostinger
apps/web  -> frontend React/Vite
```

## 3. Frontend

Lokasi source:

```text
apps/web
```

Build lokal:

```bash
npm install --force
npm run build:web
```

Output:

```text
apps/web/dist
```

Upload isi folder `dist` ke:

```text
/home/{username}/domains/{domain}/public_html
```

File `apps/web/public/.htaccess` ikut masuk ke `dist` agar refresh route seperti `/workspace` tetap membuka aplikasi React.

## 4. Backend API Hostinger

Sesuai contoh dashboard Hostinger:

```text
Domain/subdomain  : api.bkpsdm-tolis.or.id
Preset framework  : NestJS
Branch            : main
Versi node        : 18.x
Root directory    : api
Build command     : npm run build
Package manager   : npm
Direktori output  : dist
Entry file        : main.js
```

Folder yang dipakai:

```text
api
```

Endpoint awal:

```text
https://api.bkpsdm-tolis.or.id/health
https://api.bkpsdm-tolis.or.id/api/v1/sidata/asn
```

Environment API:

```text
NODE_ENV=production
PORT=3000
WEB_ORIGIN=https://bkpsdm-tolis.or.id
```

Catatan: biasanya Hostinger akan mengatur port internal sendiri. Jika panel menyediakan environment variable `PORT`, biarkan aplikasi membaca `process.env.PORT`.

## 5. Database

Gunakan MySQL dari Hostinger.

Backend NestJS Hostinger:

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DB_NAME
```

## 6. Environment Frontend

Jika backend NestJS berada di subdomain API, gunakan:

```text
VITE_API_BASE_URL=https://api.bkpsdm-tolis.or.id/api/v1
```

## 7. Catatan Penting

Untuk model pada screenshot, repo harus punya folder root `api/` karena Hostinger menjalankan build dari root directory tersebut.

- Hostinger Node app: `api/`.
- Frontend utama: `apps/web`.
