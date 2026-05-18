# Sprint 11 RBAC PPIK

## Role Aktif

- SUPER_ADMIN
- ADMIN_BKPSDM
- KEPALA_BADAN
- KABID
- ANALIS_MADYA
- ANALIS_MUDA
- ANALIS_PERTAMA
- PENELAAH
- PPPK
- OPD

Role yang belum dipakai pada Sprint 11: `SEKRETARIS` dan `AUDITOR`.

## Mapping Modul

| Modul | Akses Utama |
|---|---|
| Dashboard | Internal BKPSDM sesuai role |
| Kinerja Bidang | KABID dan analis bidang, PPPK terbatas input/upload |
| SIAP | Kendali kerja internal; review untuk KABID/Analis Madya |
| DMS | Dokumen internal, upload bukti, verifikasi, dan laporan |
| SIPENSIUN | Input, verifikasi, monitoring, approval, dan laporan pensiun/pemberhentian |
| Layanan Kepegawaian | Pengajuan, verifikasi, SLA, monitoring, dan laporan |
| SIDATA | Data ASN, validasi, import, rekonsiliasi, dan laporan |
| SIANALITIK | Pimpinan, KABID, dan analis senior |
| SIARSIP | Arsip bidang untuk internal operasional |
| ADMIN | SUPER_ADMIN dan ADMIN_BKPSDM saja |

## Catatan Role

- `PENELAAH` diperlakukan setara `ANALIS_PERTAMA` untuk akses operasional: input, upload, dan verifikasi awal.
- `PPPK` hanya mendapat akses terbatas untuk input/upload/checklist awal dan tidak mendapat menu approval, pimpinan, atau admin.
- `OPD` hanya diarahkan ke pengajuan, status, dan dokumen miliknya sendiri dari sisi UI. OPD tidak mendapat dashboard pimpinan, DMS internal, SIDATA internal, SIANALITIK, atau admin.
- `KEPALA_BADAN` difokuskan pada dashboard, monitoring, approval, laporan, dan SIANALITIK.
- `KABID` mendapat kendali bidang dan approval bidang.
- `SUPER_ADMIN` dan `ADMIN_BKPSDM` mendapat akses luas termasuk admin.

## Manual Regression Checklist

1. Login sebagai `SUPER_ADMIN` atau `ADMIN_BKPSDM`; pastikan semua modul operasional dan menu admin terlihat.
2. Login sebagai `KEPALA_BADAN`; pastikan dashboard pimpinan, monitoring, approval, laporan, dan SIANALITIK terlihat, tetapi menu admin tersembunyi.
3. Login sebagai `KABID`; pastikan Kinerja Bidang, SIAP, DMS, SIPENSIUN, Layanan, SIDATA, SIANALITIK bidang, dan SIARSIP terlihat.
4. Login sebagai `ANALIS_PERTAMA` dan `PENELAAH`; pastikan keduanya mendapat akses operasional yang sama.
5. Login sebagai `PPPK`; pastikan menu approval, pimpinan, SIANALITIK, SIDATA internal, dan admin tidak tampil.
6. Login sebagai `OPD`; pastikan hanya menu pengajuan/status layanan yang relevan terlihat.
7. Buka URL terproteksi langsung dengan role tidak berhak; pastikan redirect aman atau halaman akses ditolak tampil tanpa loop.
8. Pastikan route existing yang hidup tetap dapat dibuka oleh role yang berhak.
