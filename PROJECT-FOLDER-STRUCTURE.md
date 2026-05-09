# SILAKAP Folder Structure

Struktur ini dibuat untuk target Hostinger: frontend statis React/Vite dan backend NestJS pada root `api/` sesuai dashboard Hostinger.

```text
Silakap_V1.0/
|-- apps/
|   |-- web/                 # Frontend React + Vite
|   |   |-- src/
|   |   |   |-- components/  # Komponen UI aplikasi
|   |   |   |-- config/      # API base URL dan konfigurasi FE
|   |   |   |-- pages/       # Halaman workspace SILAKAP
|   |   |   |-- routing/     # Routing frontend
|   |   |   `-- styles/      # Tailwind dan style aplikasi
|   |   `-- public/          # Asset publik dan .htaccess SPA
|-- api/                     # Backend NestJS untuk Hostinger root directory api
|   |-- src/
|   |   `-- modules/         # health, sidata, siap, sipensiun, siarsip, analytics
|   |-- package.json
|   |-- tsconfig.json
|   `-- tsconfig.build.json
|-- docs/                    # Dokumen arsitektur
`-- package.json             # Scripts lokal: dev:api, dev:web, build
```

## Prinsip

- `apps/web/` adalah frontend SILAKAP yang boleh dimodifikasi.
- `api/` adalah backend utama untuk local development dan model Hostinger pada screenshot: NestJS, root directory `api`, output `dist`, entry `main.js`.
- Upload hasil build `apps/web/dist` ke `public_html`.

## Perintah Utama Lokal

```bash
npm run dev:api
npm run dev:web
```

Perintah legacy jika masih ingin menjalankan Express lama:

```bash
Tidak ada. Folder legacy sudah dihapus agar struktur tetap fokus.
```
