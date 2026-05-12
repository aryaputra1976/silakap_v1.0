# RBAC Matrix SIAP

## Prinsip

- Staf hanya mengelola buku kerja miliknya.
- Kabid melihat dan mereview buku kerja staf di unit/bidangnya.
- Kepala Badan melihat dashboard eksekutif lintas bidang.
- Admin BKPSDM dan Super Admin dapat melakukan kontrol penuh untuk dukungan teknis.
- Endpoint produksi wajib dilindungi JWT dan RolesGuard.

## Role

| Role | Fungsi |
|---|---|
| SUPER_ADMIN | Akses penuh teknis |
| ADMIN_BKPSDM | Akses administrasi BKPSDM |
| KEPALA_BADAN | Monitoring eksekutif lintas bidang |
| KABID | Review dan monitoring bidang |
| ANALIS_MADYA | Koordinator/reviewer bidang |
| ANALIS_MUDA | Koordinator/reviewer bidang |
| ANALIS_PERTAMA | Staf pengisi buku kerja |
| PENELAAH | Staf pengisi buku kerja |
| PPPK | Staf pengisi buku kerja |

## Worklog

| Endpoint | Staf | Kabid | Kaban | Admin |
|---|---:|---:|---:|---:|
| GET /siap/worklogs/my | ✅ | ✅ | ✅ | ✅ |
| POST /siap/worklogs | ✅ | ✅ | ❌ | ✅ |
| PATCH /siap/worklogs/:id | milik sendiri | milik sendiri | ❌ | ✅ |
| POST /siap/worklogs/:id/submit | milik sendiri | milik sendiri | ❌ | ✅ |
| GET /siap/worklogs/team | ❌ | ✅ unit | ✅ semua | ✅ semua |
| POST /siap/worklogs/:id/approve | ❌ | ✅ unit | ✅ semua | ✅ semua |
| POST /siap/worklogs/:id/revision | ❌ | ✅ unit | ✅ semua | ✅ semua |

## Dashboard

| Endpoint | Staf | Kabid | Kaban | Admin |
|---|---:|---:|---:|---:|
| GET /siap/worklogs/dashboard/team | ❌ | ✅ unit | ✅ semua | ✅ semua |
| GET /siap/worklogs/dashboard/executive | ❌ | ❌ | ✅ semua | ✅ semua |

## Export

| Endpoint | Staf | Kabid | Kaban | Admin |
|---|---:|---:|---:|---:|
| GET /siap/worklogs/export/excel | ❌ | ✅ unit | ✅ semua | ✅ semua |
| GET /siap/worklogs/export/pdf | ❌ | ✅ unit | ✅ semua | ✅ semua |

## Bukti Dukung

| Endpoint | Staf | Kabid | Kaban | Admin |
|---|---:|---:|---:|---:|
| GET /siap/worklogs/:id/attachments | milik sendiri | ✅ unit | ✅ semua | ✅ semua |
| POST /siap/worklogs/:id/attachments | milik sendiri | ❌ | ❌ | ✅ |
| DELETE /siap/worklogs/:id/attachments/:attachmentId | milik sendiri saat belum final | ❌ | ❌ | ✅ |