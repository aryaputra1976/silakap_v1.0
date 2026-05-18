# Sprint 22 - OPD Submission Flow

## 1. Tujuan
Sprint 22 menambahkan alur backend untuk pengajuan OPD: draft, submit, status tracking, metadata dokumen, perbaikan berkas, dan antrian internal PPIK.

## 2. Status Lifecycle Pengajuan OPD
Status yang digunakan:
- `DRAFT`
- `SUBMITTED`
- `RECEIVED`
- `IN_VERIFICATION`
- `NEEDS_CORRECTION`
- `CORRECTION_SUBMITTED`
- `VERIFIED`
- `REJECTED`
- `COMPLETED`
- `CANCELLED`

## 3. Model Data
Model baru:
- `OpdSubmission`
- `OpdSubmissionDocument`
- `OpdSubmissionAuditLog`

Data OPD disimpan terpisah dari realisasi kinerja bidang. Field `opdUserId` dan `opdUnitId` dipakai untuk scoping data milik OPD.

## 4. Endpoint OPD
Base path: `/api/v1/opd/submissions`

- `GET /`
- `GET /summary`
- `GET /:id`
- `POST /`
- `PATCH /:id`
- `POST /:id/submit`
- `POST /:id/cancel`
- `POST /:id/documents`
- `POST /:id/correction-submit`

## 5. Endpoint Internal PPIK
Base path: `/api/v1/internal/opd-submissions`

- `GET /`
- `GET /summary`
- `GET /:id`
- `POST /:id/receive`
- `POST /:id/start-verification`
- `POST /:id/request-correction`
- `POST /:id/verify`
- `POST /:id/reject`
- `POST /:id/complete`

## 6. RBAC
OPD hanya dapat mengakses endpoint `/opd/submissions` dan hanya data miliknya sendiri. Endpoint internal hanya untuk role internal aktif. Aksi final dibatasi:
- `PPPK`, `PENELAAH`, `ANALIS_PERTAMA`: receive/start verification/request correction.
- `ANALIS_MUDA`, `ANALIS_MADYA`: verify/reject/request correction.
- `KABID`, `ADMIN_BKPSDM`, `SUPER_ADMIN`: complete/reject/full internal action.
- `KEPALA_BADAN`: monitor/view internal queue.

## 7. Audit Log Coverage
Audit ditulis ke `OpdSubmissionAuditLog` dan audit global untuk:
- `CREATE_DRAFT`
- `UPDATE_DRAFT`
- `SUBMIT`
- `CANCEL`
- `UPLOAD_DOCUMENT`
- `RECEIVE`
- `START_VERIFICATION`
- `REQUEST_CORRECTION`
- `CORRECTION_SUBMITTED`
- `VERIFY`
- `REJECT`
- `COMPLETE`

## 8. Hubungan OPD ke PPIK ke SOP Checklist ke Kinerja Bidang
OPD mengajukan atau menambahkan metadata dokumen. PPIK menerima, memverifikasi, meminta perbaikan, atau menyelesaikan. Checklist SOP tetap dilakukan oleh role internal. Pengajuan OPD tidak otomatis menjadi realisasi kinerja bidang; data baru dapat dipakai setelah validasi internal.

## 9. DMS Integration Notes
Sprint 22 mendukung `dmsDocumentId` pada metadata dokumen OPD. Upload file fisik langsung dari portal OPD belum diaktifkan; UI menyimpan metadata dokumen dan tidak mengklaim file sudah tersimpan.

## 10. Known Limitations
- Upload file OPD belum memakai multipart endpoint khusus OPD.
- Detail internal PPIK penuh belum dibuat; halaman layanan internal sudah menampilkan antrian OPD masuk.
- Nomor pengajuan memakai format sederhana `OPD-YYYYMMDD-XXXX`.

## 11. Regression Checklist
- Prisma validate dan generate berhasil.
- Backend build berhasil.
- Frontend lint dan build berhasil.
- OPD bisa create draft, submit, melihat status, menambah metadata dokumen, dan submit correction.
- OPD hanya melihat pengajuan miliknya.
- Internal PPIK bisa melihat antrian OPD.
- Aksi internal menulis audit log.
- Pengajuan OPD tidak otomatis menjadi realisasi kinerja bidang.
