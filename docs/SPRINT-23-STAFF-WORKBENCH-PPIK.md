# Sprint 23 - Staff Workbench PPIK

## 1. Tujuan

Sprint 23 menambahkan Meja Kerja Verifikasi PPIK untuk memproses pengajuan OPD yang masuk dari portal OPD Sprint 21B dan backend submission flow Sprint 22. Workbench dipakai untuk melihat antrian, membuka detail pengajuan, memeriksa data OPD, memeriksa dokumen awal, menjalankan checklist SOP, mengisi catatan verifikasi, menjalankan aksi internal, dan membaca audit timeline.

## 2. Kenapa Workbench Bukan Input Manual Ulang

Data layanan, ASN terkait, keterangan, dan dokumen pendukung sudah dikirim OPD melalui portal. Workbench menampilkan data tersebut sebagai sumber verifikasi agar staff/analis tidak mengetik ulang seluruh usulan. Perubahan status dilakukan melalui aksi internal yang tercatat audit log.

## 3. Route Baru

- `/layanan/workbench`: daftar antrian pengajuan OPD internal.
- `/layanan/:id`: detail internal pengajuan OPD.

Route ini berada di area internal Layanan Kepegawaian dan tidak tersedia untuk role OPD. Portal OPD tetap memakai route `/opd/*`.

## 4. Komponen Service Workbench

Komponen frontend berada di `apps/web/src/components/workspace/service-workbench/`:

- `service-workbench-header.tsx`
- `service-workbench-stat-cards.tsx`
- `service-workbench-table.tsx`
- `service-status-badge.tsx`
- `service-submission-data-card.tsx`
- `service-document-panel.tsx`
- `service-verification-note-panel.tsx`
- `service-internal-document-panel.tsx`
- `service-audit-timeline.tsx`
- `service-action-panel.tsx`

Komponen tersebut menjaga layar detail tetap terstruktur: header, data OPD, dokumen OPD, checklist SOP, catatan verifikasi, dokumen internal, audit timeline, dan panel aksi.

## 5. Mapping SOP

Helper `apps/web/src/lib/opd-submissions/sop-mapping.ts` memetakan pengajuan ke SOP awal:

- `SIPENSIUN` -> `SOP-BKPSDM-PAN-002`
- `SIDATA` -> `SOP-BKPSDM-DAT-002`
- `LAYANAN_KEPEGAWAIAN` -> `SOP-BKPSDM-LAY-002`
- `DMS` -> `SOP-BKPSDM-DMS-001`

`SopChecklistPanel` berjalan dengan `persistenceMode="api"`, `entityType="opd_submission"`, dan `entityId=submission.id`.

## 6. Internal Action Policy

Policy frontend berada di `apps/web/src/lib/opd-submissions/internal-policy.ts`.

- OPD: tidak memiliki aksi internal.
- PPPK: receive dan start verification untuk status masuk/perbaikan masuk.
- ANALIS_PERTAMA/PENELAAH: receive, start verification, request correction.
- ANALIS_MUDA/ANALIS_MADYA: request correction, verify, reject.
- KABID: verify, reject, complete.
- ADMIN_BKPSDM/SUPER_ADMIN: full.
- KEPALA_BADAN: monitor/view tanpa aksi operasional.

Catatan wajib untuk aksi `request-correction` dan `reject`.

## 7. Alur Aksi

Alur utama:

`SUBMITTED -> RECEIVED -> IN_VERIFICATION -> NEEDS_CORRECTION / VERIFIED / REJECTED -> COMPLETED`

Jika OPD mengirim perbaikan, status kembali masuk sebagai `CORRECTION_SUBMITTED`, lalu PPIK dapat menerima atau memproses kembali sesuai policy.

## 8. Hubungan Checklist SOP

Checklist SOP bukan realisasi kinerja final. Checklist berfungsi sebagai bukti proses verifikasi layanan. Pengajuan OPD baru dapat masuk ke alur kinerja bidang setelah PPIK memverifikasi, melengkapi bukti DMS/checklist, dan melakukan validasi sesuai tata kelola Sprint 11-20.

## 9. Batasan Upload Dokumen Internal

Panel dokumen internal PPIK masih placeholder aman. Belum ada klaim upload file fisik internal pada workbench jika endpoint multipart khusus belum tersedia. Dokumen dapat ditautkan melalui mekanisme DMS/checklist yang sudah ada bila metadata DMS tersedia.

## 10. Regression Checklist

- OPD tidak dapat membuka `/layanan/workbench` atau `/layanan/:id`.
- Sidebar OPD tidak menampilkan Meja Kerja Verifikasi.
- Internal berhak dapat membuka workbench.
- Tabel workbench mengambil data dari endpoint internal OPD submissions.
- Detail menampilkan data usulan OPD tanpa input ulang.
- Dokumen OPD tampil sebagai bukti awal.
- Checklist SOP memakai `entityType=opd_submission`.
- Panel aksi memakai API Sprint 22.
- Request correction dan reject wajib catatan.
- Audit timeline tampil dari `auditLogs`.
- Pengajuan OPD tidak otomatis menjadi realisasi kinerja bidang.
