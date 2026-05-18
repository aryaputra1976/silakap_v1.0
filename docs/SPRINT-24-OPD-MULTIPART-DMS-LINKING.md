# Sprint 24 - OPD Multipart Upload & DMS Linking

## 1. Tujuan

Sprint 24 mengaktifkan upload file fisik untuk dokumen pengajuan OPD. File diunggah melalui endpoint khusus OPD, ditautkan ke pengajuan, dibuatkan dokumen DMS internal, dan dicatat pada audit log lokal maupun global.

## 2. Endpoint Upload OPD

Endpoint:

- `POST /api/v1/opd/submissions/:id/documents/upload`

Multipart field:

- `file`

Body:

- `documentType`
- `title`
- `note`
- `category`
- `subCategory`

Rule utama:

- hanya role `OPD`
- submission harus milik user OPD login
- status yang diizinkan: `DRAFT`, `SUBMITTED`, `NEEDS_CORRECTION`
- file tidak otomatis membuat dokumen terverifikasi

## 3. Endpoint Upload Internal

Endpoint internal tersedia untuk dokumen PPIK:

- `POST /api/v1/internal/opd-submissions/:id/documents/upload`

Dokumen internal diberi `uploadedByRole` role internal dan tidak dikembalikan pada response OPD. Response internal workbench tetap melihatnya.

## 4. Status Dokumen

Status dokumen OPD:

- `UPLOADED`
- `NEEDS_CORRECTION`
- `VERIFIED`
- `REJECTED`
- `TERUNGGAH` untuk metadata lama tanpa file

Endpoint aksi internal:

- `POST /api/v1/internal/opd-submissions/:id/documents/:documentId/verify`
- `POST /api/v1/internal/opd-submissions/:id/documents/:documentId/request-correction`
- `POST /api/v1/internal/opd-submissions/:id/documents/:documentId/reject`

## 5. Security Upload

Validasi backend:

- maksimal 10 MB
- MIME whitelist: PDF, JPG, PNG, DOCX, XLSX
- ekstensi harus cocok dengan MIME
- filename disanitasi dengan `basename`
- file disimpan lewat DMS storage path internal
- absolute/raw path tidak diekspos ke frontend OPD
- OPD tidak dapat upload ke submission milik OPD lain

## 6. DMS Linking Behavior

Upload OPD membuat DMS document kategori `BUKTI_DUKUNG`, access level `INTERNAL`, status `UPLOADED`, lalu mengisi `dmsDocumentId` pada `OpdSubmissionDocument`.

Subcategory default:

- `SIPENSIUN` -> `DOKUMEN_PENSIUN`
- `SIDATA` -> `DOKUMEN_DATA_ASN`
- `LAYANAN_KEPEGAWAIAN` -> `DOKUMEN_LAYANAN`
- `DMS` -> `DOKUMEN_DMS`

## 7. RBAC

- OPD hanya memakai endpoint `/opd/submissions/:id/documents/upload`.
- Internal PPIK memakai endpoint `/internal/opd-submissions/*`.
- PPPK tidak dapat verify/reject dokumen final.
- ANALIS_PERTAMA/PENELAAH dapat request correction.
- ANALIS_MUDA/ANALIS_MADYA/KABID/ADMIN/SUPER_ADMIN dapat verify/reject sesuai policy.

## 8. Audit Log Coverage

Audit lokal `OpdSubmissionAuditLog`:

- `UPLOAD_DOCUMENT_FILE`
- `INTERNAL_UPLOAD_DOCUMENT_FILE`
- `DOCUMENT_VERIFIED`
- `DOCUMENT_CORRECTION_REQUESTED`
- `DOCUMENT_REJECTED`

Audit global `AuditService` juga dicatat untuk aksi OPD submission dan DMS upload.

## 9. Frontend Behavior

- OPD upload page memakai multipart API.
- OPD detail menampilkan metadata file, status dokumen, dan catatan verifikator.
- OPD documents page menampilkan status dan metadata file.
- Workbench PPIK menampilkan dokumen OPD dan tombol verifikasi/perbaikan/tolak dokumen.
- Catatan wajib untuk perbaikan dan penolakan dokumen.

## 10. Known Limitations

- Preview/download langsung dari OPD portal belum dibuka agar path storage tidak terekspos.
- DMS document dibuat sebagai `BUKTI_DUKUNG` karena enum `OPD_SUBMISSION` belum ada di schema DMS.
- Dokumen internal PPIK tersimpan di tabel pengajuan tetapi difilter dari response OPD.

## 11. Regression Checklist

- Prisma validate dan generate sukses.
- Backend build sukses.
- Frontend lint dan build sukses.
- OPD upload hanya untuk submission miliknya.
- File invalid dan file lebih dari 10 MB ditolak.
- `OpdSubmissionDocument` berisi metadata file.
- `dmsDocumentId` terisi setelah upload sukses.
- Workbench PPIK melihat dokumen OPD.
- PPIK bisa verify/request correction/reject dokumen.
- OPD melihat status dan catatan perbaikan dokumen.
- Audit log lokal dan global tercatat.
