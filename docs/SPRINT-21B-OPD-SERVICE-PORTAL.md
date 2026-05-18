# Sprint 21B - OPD Service Portal

## 1. Tujuan
Sprint 21B menyederhanakan pengalaman OPD menjadi portal layanan yang fokus pada pengajuan, dokumen, dan status milik OPD sendiri.

## 2. Kenapa Menu OPD Dipisahkan
OPD bukan role internal PPIK. Menu OPD dipisahkan agar OPD tidak melihat Kinerja Bidang, SOP Governance, SIANALITIK, analytics, report, RBAC, pengguna, atau pengaturan internal.

## 3. Struktur Menu OPD
- Dashboard OPD: `/opd/dashboard`
- Layanan Saya: `/opd/layanan`, `/opd/layanan/ajukan`, `/opd/layanan/perbaikan`, `/opd/layanan/riwayat`
- SIPENSIUN: `/opd/sipensiun`, `/opd/sipensiun/ajukan`, `/opd/sipensiun/perbaikan`, `/opd/sipensiun/status`
- SIDATA ASN: `/opd/sidata/pemutakhiran`, `/opd/sidata/status`, `/opd/sidata/dokumen`
- Dokumen Saya: `/opd/dokumen`, `/opd/dokumen/upload`, `/opd/dokumen/perbaikan`

## 4. Route OPD
Semua route OPD berada di namespace `/opd/*` dan hanya boleh diakses role `OPD` dari route guard frontend.

## 5. Komponen Frontend
Komponen portal OPD berada di `apps/web/src/components/workspace/opd`:
- `opd-page-header.tsx`
- `opd-summary-cards.tsx`
- `opd-request-table.tsx`
- `opd-status-timeline.tsx`
- `opd-upload-guidance-card.tsx`
- `opd-empty-state.tsx`
- `opd-service-card-grid.tsx`

## 6. RBAC OPD
Helper menu OPD berada di `apps/web/src/lib/rbac/opd-menu.ts`. Sidebar memakai menu OPD khusus saat role utama adalah `OPD`. Route `/opd/*` dibatasi untuk `OPD`, sedangkan route internal dibatasi untuk role internal.

## 7. Batasan Kinerja
Input OPD bukan realisasi kinerja final. Pengajuan, upload, dan usulan OPD adalah bahan kerja yang harus diverifikasi sebelum menjadi bukti atau realisasi bidang.

## 8. Alur OPD ke PPIK
1. OPD mengajukan layanan atau mengunggah bukti dukung.
2. PPIK melakukan verifikasi.
3. Checklist SOP dijalankan oleh role internal.
4. Bukti masuk ke DMS sesuai hasil verifikasi.
5. Validasi dilakukan oleh petugas berwenang.
6. Setelah valid, data dapat dipakai dalam kinerja bidang.

## 9. Known Limitations
Endpoint submit OPD belum tersedia pada sprint ini. Form OPD menampilkan draft lokal dan tombol kirim/upload final dibuat nonaktif agar tidak memberi kesan data sudah terkirim ke backend.

## 10. Regression Checklist
- OPD hanya melihat menu portal OPD.
- OPD tidak melihat menu internal PPIK.
- `/opd/dashboard`, `/opd/layanan`, `/opd/layanan/ajukan`, `/opd/sipensiun`, `/opd/sipensiun/ajukan`, `/opd/sidata/pemutakhiran`, `/opd/dokumen`, dan `/opd/dokumen/upload` hidup.
- Role internal tidak diarahkan ke portal OPD sebagai default.
- Route internal tidak terbuka untuk OPD.
- Lint dan build frontend berhasil.
