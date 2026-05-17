Roadmap Final 100% Integrasi SOP PPIK ke SILAKAP_V1.0
Target Akhir

SOP tidak hanya menjadi dokumen Word, tetapi benar-benar hidup di aplikasi sebagai:

Area	Bentuk di Aplikasi
Referensi SOP	Master dokumen SOP resmi
Kinerja Bidang	Target RHK, realisasi, bukti dukung, approval
Layanan Kepegawaian	Permohonan, verifikasi, SLA, keterlambatan, evaluasi
SIPENSIUN	Pensiun dan pemberhentian ASN
SIDATA ASN	Pemutakhiran data, SIASN, rekonsiliasi
DMS Bukti Dukung	Arsip SOP, SK, checklist, laporan, bukti RHK
SIANALITIK	Statistik, risiko, capaian, laporan pimpinan
Fase 0 — Audit & Validasi Struktur Existing
Tujuan

Memastikan kita tidak membuat ulang dari nol, tetapi memanfaatkan modul yang sudah ada.

Kondisi Repo Saat Ini
Area	Kondisi
Backend	Sudah NestJS modular
Frontend	Vite + React + TypeScript
Routing	Sudah ada route SIAP, SIDATA, DMS, SIPENSIUN, SIARSIP
Kinerja Bidang API	Sudah ada
DMS	Sudah ada
SIPENSIUN	Sudah ada, tapi masih perlu diperluas
Sidebar	Sudah berubah sesuai konsep SOP PPIK

Backend sudah memuat KinerjaBidangModule, DmsModule, SipensiunModule, SidataModule, SiapModule, SlaModule, dan lainnya di AppModule.

File yang Dicek
api/src/modules/app.module.ts
api/src/modules/kinerja-bidang/*
apps/web/src/routing/app-routing-setup.tsx
apps/web/src/config/layout-1.config.tsx
apps/web/src/lib/api/dms.ts
apps/web/src/pages/workspace/sipensiun-list-page.tsx
apps/web/src/pages/workspace/siap-worklogs-page.tsx
apps/web/src/pages/workspace/dms-documents-page.tsx
Status

✅ Sudah dibaca dan tervalidasi awal.

Fase 1 — Validasi Sidebar & Navigasi
Tujuan

Memastikan menu yang terlihat di aplikasi sudah cocok dengan struktur SOP PPIK.

Status Saat Ini

Sidebar terbaru sudah berisi struktur yang benar:

Workspace
├── Dashboard
├── Inti SIAP
├── Kinerja Bidang
├── Layanan Kepegawaian
├── SIDATA ASN
├── DMS Bukti Dukung
├── SIPENSIUN

Control
├── SIARSIP
├── SIANALITIK
├── Referensi SOP
├── RBAC
├── Pengguna
└── Pengaturan

Ini sudah sesuai dengan mapping SOP yang Bapak validkan.

Masalah Teknis yang Perlu Dirapikan

Di sidebar sekarang ada kategori DMS baru seperti:

SOP
RHK
LAYANAN
KEPUTUSAN
SOP_TAHAP_1
SOP_TAHAP_2
SOP_TAHAP_3
SOP_PENSIUN_PEMBERHENTIAN
SOP_MATRIKS

Padahal enum DMS existing masih:

SKP
LAPORAN_BULANAN
LAPORAN_TRIWULAN
LAPORAN_TAHUNAN
REKON_DATA
DATA_ASN
SURAT_DINAS
NOTA_DINAS
BUKTI_DUKUNG
DOKUMEN_KEBIJAKAN
ARSIP_KEPEGAWAIAN
LAINNYA

Kategori DMS existing terlihat di apps/web/src/lib/api/dms.ts.

Perbaikan Fase 1
File Diubah
apps/web/src/config/layout-1.config.tsx
Perubahan

Ganti link kategori DMS menjadi kategori yang valid dulu:

Menu	Dari	Menjadi
Dokumen SOP	category=SOP	category=DOKUMEN_KEBIJAKAN
Bukti Dukung RHK	category=RHK	category=BUKTI_DUKUNG
Dokumen Layanan	category=LAYANAN	category=ARSIP_KEPEGAWAIAN
Dokumen Keputusan	category=KEPUTUSAN	category=SURAT_DINAS
SOP Tahap 1	category=SOP_TAHAP_1	category=DOKUMEN_KEBIJAKAN&q=Tahap 1
SOP Tahap 2	category=SOP_TAHAP_2	category=DOKUMEN_KEBIJAKAN&q=Tahap 2
SOP Tahap 3	category=SOP_TAHAP_3	category=DOKUMEN_KEBIJAKAN&q=Tahap 3
SOP Pensiun	category=SOP_PENSIUN_PEMBERHENTIAN	category=DOKUMEN_KEBIJAKAN&q=Pensiun Pemberhentian
Matriks SOP	category=SOP_MATRIKS	category=DOKUMEN_KEBIJAKAN&q=Matriks SOP
Output Fase 1

✅ Sidebar aman build
✅ Menu SOP tetap terlihat
✅ DMS filter tidak memakai enum yang belum ada
✅ Tidak perlu migration database dulu

Fase 2 — Buat Frontend Kinerja Bidang Asli
Tujuan

Saat ini menu Kinerja Bidang masih diarahkan ke SIAP Worklog. Ini boleh untuk sementara, tetapi backend sebenarnya sudah punya API khusus Kinerja Bidang.

Endpoint backend sudah tersedia untuk SOP, dashboard, report, targets, realizations, submit, review, approve, request revision, dan evidence.

Konsep Akhir

Menu Kinerja Bidang harus punya halaman sendiri:

Kinerja Bidang
├── Dashboard Kinerja
├── Master SOP/RHK
├── Target RHK
├── Realisasi Bulanan
├── Review Realisasi
├── Laporan Kinerja
└── Bukti Dukung
File yang Ditambah
apps/web/src/lib/api/kinerja-bidang.ts
apps/web/src/pages/workspace/kinerja-bidang-dashboard-page.tsx
apps/web/src/pages/workspace/kinerja-bidang-sop-page.tsx
apps/web/src/pages/workspace/kinerja-bidang-targets-page.tsx
apps/web/src/pages/workspace/kinerja-bidang-realizations-page.tsx
apps/web/src/pages/workspace/kinerja-bidang-review-page.tsx
apps/web/src/pages/workspace/kinerja-bidang-report-page.tsx
Folder Komponen yang Ditambah
apps/web/src/components/workspace/kinerja-bidang/
├── kinerja-summary-cards.tsx
├── kinerja-sop-table.tsx
├── kinerja-target-table.tsx
├── kinerja-realization-table.tsx
├── kinerja-realization-form.tsx
├── kinerja-evidence-panel.tsx
├── kinerja-review-panel.tsx
├── kinerja-report-preview.tsx
└── kinerja-status-badge.tsx
File Routing yang Diubah
apps/web/src/routing/app-routing-setup.tsx
Route Baru
/kinerja-bidang
/kinerja-bidang/sop
/kinerja-bidang/targets
/kinerja-bidang/realizations
/kinerja-bidang/review
/kinerja-bidang/report
File Sidebar Diubah Lagi
apps/web/src/config/layout-1.config.tsx

Menu Kinerja Bidang nanti diarahkan ke route asli:

Dashboard Kinerja      -> /kinerja-bidang
Rencana Kerja Bidang   -> /kinerja-bidang/sop?stage=TAHAP_1
Target RHK             -> /kinerja-bidang/targets
Realisasi Bulanan      -> /kinerja-bidang/realizations
Monitoring Kegiatan    -> /kinerja-bidang/review
Laporan Kinerja        -> /kinerja-bidang/report
Bukti Dukung RHK       -> /dms/documents?category=BUKTI_DUKUNG
Output Fase 2

✅ Modul Kinerja Bidang tidak lagi menumpang SIAP Worklog
✅ SOP/RHK bisa dikelola melalui API yang sudah ada
✅ Realisasi bulanan bisa pakai workflow DRAFT → SUBMITTED → REVIEWED → APPROVED
✅ Bukti DMS bisa ditautkan ke realisasi

Fase 3 — Seed SOP PPIK Lengkap
Tujuan

Backend saat ini sudah punya seed SOP, tetapi paket pensiun/pemberhentian masih belum lengkap per SOP detail. Seed sekarang sudah memuat MAN, LAY, FNG, PBH umum, SIK, DAT, DMS.

Masalah

Paket pensiun/pemberhentian yang sudah disusun berisi banyak SOP detail, misalnya:

PAN-001 Penerimaan Usulan Pensiun ASN
PAN-002 Verifikasi Berkas Usulan Pensiun ASN
PAN-003 Pengusulan Pensiun BUP
PAN-004 Pengusulan Pensiun Ahli Waris
MON-001 Monitoring Status Usulan
PBH-001 APS
PBH-002 Tidak Cakap Jasmani/Rohani
PBH-003 Meninggal/Tewas/Hilang
PBH-004 Disiplin/Hukum
PBH-005 Pemberhentian Sementara
PBH-006 Pengaktifan Kembali
PBH-007 Perampingan Organisasi
PBH-008 Penyerahan Keputusan
DAT-003 Pemutakhiran Data Setelah SK

Tetapi di seed existing masih lebih umum:

SOP-BKPSDM-PBH-001 Pengendalian Pemberhentian ASN
File Diubah
api/src/modules/kinerja-bidang/constants/kinerja-bidang-seed.constant.ts
Tambahan Data Seed

Tambahkan SOP detail:

Kode	Nama SOP	RHK
SOP-BKPSDM-DMS-001	Pengelolaan Dokumen Digital Kepegawaian	RHK 7
SOP-BKPSDM-PAN-001	Penerimaan Usulan Pensiun ASN	RHK 3
SOP-BKPSDM-PAN-002	Verifikasi Berkas Usulan Pensiun ASN	RHK 3
SOP-BKPSDM-PAN-003	Pengusulan Pensiun BUP	RHK 3
SOP-BKPSDM-PAN-004	Pengusulan Pensiun Janda/Duda/Yatim/Piatu/Ahli Waris	RHK 3
SOP-BKPSDM-MON-001	Monitoring Status Usulan Pensiun/Pemberhentian ASN	RHK 3
SOP-BKPSDM-PBH-001	Pemberhentian PNS Atas Permintaan Sendiri	RHK 3
SOP-BKPSDM-PBH-002	Pemberhentian PNS Karena Tidak Cakap Jasmani/Rohani	RHK 3
SOP-BKPSDM-PBH-003	Pemberhentian PNS Karena Meninggal Dunia/Tewas/Hilang	RHK 3
SOP-BKPSDM-PBH-004	Pemberhentian PNS Karena Pelanggaran Disiplin/Hukum	RHK 3
SOP-BKPSDM-PBH-005	Pemberhentian Sementara PNS	RHK 3
SOP-BKPSDM-PBH-006	Pengaktifan Kembali PNS	RHK 3
SOP-BKPSDM-PBH-007	Pemberhentian Karena Perampingan Organisasi/Kebijakan Pemerintah	RHK 3
SOP-BKPSDM-PBH-008	Penyerahan Keputusan Pensiun/Pemberhentian ASN	RHK 3
SOP-BKPSDM-DAT-003	Pemutakhiran Data ASN Setelah Keputusan Pemberhentian/Pensiun	RHK 6
Script yang Dipakai

Backend sudah punya script:

"db:seed-kinerja-bidang": "tsx prisma/seed-kinerja-bidang.ts"

Script ini ada di api/package.json.

Command
cd D:\Silakap_V1.0\api
npm run db:seed-kinerja-bidang
Output Fase 3

✅ Semua SOP yang sudah Bapak susun masuk ke master SOP/RHK
✅ Kinerja Bidang bisa menampilkan SOP detail
✅ Laporan RHK lebih akurat
✅ Bukti dukung bisa ditautkan ke SOP spesifik

Fase 4 — Validasi DMS Kategori, Tag, dan Dokumen SOP
Tujuan

DMS menjadi pusat bukti semua SOP.

Saat ini DMS kategori masih terbatas. Kategori existing sudah cukup untuk jalan awal, tetapi belum ideal untuk membedakan SOP Tahap 1, Tahap 2, Tahap 3, SOP Pensiun, dan Matriks SOP.

Konsep Final

Jangan terlalu banyak enum kategori. Pakai:

category = DOKUMEN_KEBIJAKAN
subCategory = SOP_TAHAP_1 / SOP_TAHAP_2 / SOP_TAHAP_3 / SOP_PENSIUN_PEMBERHENTIAN / SOP_MATRIKS
tags = ["SOP", "PPIK", "RHK 3", "Pensiun"]
File Backend yang Kemungkinan Diubah
api/prisma/schema.prisma
api/src/modules/dms/dto/*
api/src/modules/dms/dms.service.ts
api/src/modules/dms/dms.repository.ts
api/src/modules/dms/dms.controller.ts
File Frontend yang Diubah
apps/web/src/lib/api/dms.ts
apps/web/src/pages/workspace/dms-documents-page.tsx
apps/web/src/pages/workspace/dms-upload-page.tsx
apps/web/src/pages/workspace/dms-document-detail-page.tsx
Field yang Ditambah di DMS
subCategory?: string;
tags?: string[];
accessLevel?: 'INTERNAL' | 'TERBATAS' | 'SANGAT_TERBATAS';
Kategori Final yang Disarankan

Tetap gunakan enum besar:

SKP
LAPORAN_BULANAN
LAPORAN_TRIWULAN
LAPORAN_TAHUNAN
REKON_DATA
DATA_ASN
SURAT_DINAS
NOTA_DINAS
BUKTI_DUKUNG
DOKUMEN_KEBIJAKAN
ARSIP_KEPEGAWAIAN
LAINNYA

Tambahkan subCategory untuk detail:

SOP_TAHAP_1
SOP_TAHAP_2
SOP_TAHAP_3
SOP_PENSIUN_PEMBERHENTIAN
SOP_MATRIKS
SK_PENSIUN
SK_PEMBERHENTIAN
CHECKLIST_VERIFIKASI
BERITA_ACARA
TANDA_TERIMA
LAPORAN_RHK
Output Fase 4

✅ Dokumen SOP tersimpan resmi
✅ Bukti dukung tidak bercampur
✅ Dokumen sensitif bisa dibatasi akses
✅ Referensi SOP bisa memakai filter subCategory, bukan memaksa enum kategori

Fase 5 — Perluas SIPENSIUN menjadi Pensiun & Pemberhentian ASN
Tujuan

SIPENSIUN sekarang perlu diperluas agar tidak hanya membaca “pensiun”, tetapi semua layanan pemberhentian ASN.

File yang Diubah
apps/web/src/pages/workspace/sipensiun-list-page.tsx
apps/web/src/pages/workspace/sipensiun-detail-page.tsx
apps/web/src/lib/api/types.ts
Folder Komponen yang Bisa Ditambah
apps/web/src/components/workspace/sipensiun/
├── sipensiun-service-tabs.tsx
├── sipensiun-service-preset-card.tsx
├── sipensiun-status-timeline.tsx
├── sipensiun-sop-checklist.tsx
├── sipensiun-decision-panel.tsx
├── sipensiun-data-update-panel.tsx
└── sipensiun-report-panel.tsx
Perubahan Konsep UI

Ubah judul halaman:

Dari: Daftar Usulan Pensiun
Menjadi: Pensiun & Pemberhentian ASN
Jenis Layanan Final
BUP
AHLI_WARIS
APS
TIDAK_CAKAP_JASMANI_ROHANI
MENINGGAL_DUNIA
TEWAS
HILANG
DISIPLIN_HUKUM
PEMBERHENTIAN_SEMENTARA
PENGAKTIFAN_KEMBALI
PERAMPINGAN_ORGANISASI
PENYERAHAN_KEPUTUSAN
UPDATE_DATA_SETELAH_SK
Status Layanan Final
DRAFT
RECEIVED
ADMIN_REVIEW
TECHNICAL_REVIEW
NEED_REVISION
NEED_CLARIFICATION
PENDING
VALIDATED
SUBMITTED
EXTERNAL_PROCESS
RETURNED
DECISION_ISSUED
DELIVERED
DATA_UPDATED
DONE
REJECTED
CANCELLED
TEMPORARY_STOP
REACTIVATED
Backend yang Mungkin Perlu Diubah
api/src/modules/sipensiun/*
api/prisma/schema.prisma

Jika model sekarang masih memakai jenisPensiun, nanti bisa dipertimbangkan ubah secara bertahap:

jenisPensiun -> jenisLayanan

Atau aman sementara:

jenisPensiun tetap dipakai, tetapi label UI diganti menjadi Jenis Layanan
Output Fase 5

✅ SIPENSIUN mencakup semua SOP pensiun dan pemberhentian
✅ Menu sidebar benar-benar memfilter data
✅ Detail layanan punya checklist, status, keputusan, DMS, dan update data
✅ Laporan pensiun/pemberhentian bisa dibuat

Fase 6 — Layanan Kepegawaian Umum
Tujuan

Membuat SOP Tahap 2 benar-benar terlihat di aplikasi.

File yang Ditambah
apps/web/src/pages/workspace/layanan-kepegawaian-page.tsx
apps/web/src/pages/workspace/layanan-verification-page.tsx
apps/web/src/pages/workspace/layanan-sla-page.tsx
apps/web/src/pages/workspace/layanan-satisfaction-page.tsx
Folder Komponen
apps/web/src/components/workspace/layanan/
├── layanan-summary-cards.tsx
├── layanan-register-table.tsx
├── layanan-verification-checklist.tsx
├── layanan-sla-table.tsx
├── layanan-delay-panel.tsx
├── layanan-satisfaction-form.tsx
└── layanan-report-panel.tsx
Routing Baru
/layanan
/layanan/verifikasi
/layanan/sla
/layanan/keterlambatan
/layanan/kepuasan
/layanan/laporan
Backend yang Bisa Dipakai

Sementara bisa memanfaatkan:

SiapModule
SlaModule
SiapWorklogModule
DmsModule

Nanti jika perlu, buat modul khusus:

api/src/modules/layanan-kepegawaian/
├── layanan-kepegawaian.module.ts
├── layanan-kepegawaian.controller.ts
├── layanan-kepegawaian.service.ts
├── layanan-kepegawaian.repository.ts
└── dto/
Output Fase 6

✅ LAY-001 sampai LAY-005 hidup di aplikasi
✅ Semua layanan punya register
✅ SLA dan keterlambatan terlihat
✅ Evaluasi kepuasan bisa dicatat

Fase 7 — SIDATA ASN dan SIASN Harmonisasi SOP
Tujuan

SIDATA ASN menjadi tempat SOP:

Pemutakhiran Data ASN;
Sinkronisasi SIASN/MySAPK;
Rekonsiliasi Data;
Discrepancy Data;
Laporan Data ASN.

Sidebar sudah punya menu SIDATA yang cukup lengkap.

File Frontend yang Diubah
apps/web/src/pages/workspace/sidata-asn-page.tsx
apps/web/src/pages/workspace/sidata-import-siasn-page.tsx
apps/web/src/pages/workspace/sidata-import-riwayat-page.tsx
apps/web/src/pages/workspace/sidata-import-mapping-referensi-page.tsx
File API Frontend yang Diubah
apps/web/src/lib/api/sidata.ts
apps/web/src/lib/api/sidata-import.ts
Backend yang Diubah Bila Perlu
api/src/modules/sidata/*
api/src/modules/sidata-import/*
Fitur yang Ditambah
Fitur	Tujuan
Filter data belum sinkron	Melihat ASN bermasalah
Discrepancy summary	Ringkasan data tidak sesuai
Log koreksi data	Audit pemutakhiran
Laporan bulanan DAT-002	Bukti RHK 6
Laporan sinkronisasi SIK-002	Bukti RHK 5
Output Fase 7

✅ DAT/SIK benar-benar berjalan
✅ Data ASN bisa dikendalikan
✅ Bukti RHK 5 dan RHK 6 bisa masuk DMS

Fase 8 — SIANALITIK untuk Pimpinan
Tujuan

Membuat dashboard pimpinan untuk melihat:

capaian RHK;
jumlah layanan;
SLA;
pending;
dokumen DMS;
pensiun/pemberhentian;
data ASN;
risiko.
File Ditambah
apps/web/src/pages/workspace/sianalitik-page.tsx
apps/web/src/components/workspace/sianalitik/
├── executive-summary-cards.tsx
├── rhk-progress-chart.tsx
├── layanan-sla-chart.tsx
├── sipensiun-status-chart.tsx
├── dms-evidence-chart.tsx
├── sidata-quality-chart.tsx
├── risk-matrix.tsx
└── executive-report-card.tsx
Routing
/sianalitik

Saat ini sidebar SIANALITIK masih diarahkan ke:

/dashboard?view=analytics

Nanti lebih rapi diarahkan ke:

/sianalitik
Backend Bisa Pakai
api/src/modules/analytics/*
api/src/modules/kinerja-bidang/*
api/src/modules/dms/*
api/src/modules/sipensiun/*
api/src/modules/sidata/*
Output Fase 8

✅ Kepala Bidang/Kepala Badan bisa lihat ringkasan
✅ Risiko layanan terlihat
✅ Laporan triwulan lebih mudah dibuat

Fase 9 — RBAC dan Akses Dokumen Sensitif
Tujuan

Dokumen SOP umum boleh dilihat internal, tetapi dokumen hukum, disiplin, kesehatan, kematian, ahli waris harus terbatas.

File yang Diubah
api/src/modules/auth/*
api/src/modules/dms/*
api/src/modules/sipensiun/*
apps/web/src/config/layout-1.config.tsx
apps/web/src/lib/auth/*
Role yang Disarankan
KEPALA_BADAN
SEKRETARIS
KABID
ANALIS
STAFF
ADMIN_DMS
ADMIN_DATA
OPD
AUDITOR
Access Level DMS
INTERNAL
TERBATAS
SANGAT_TERBATAS
PIMPINAN
AUDIT
Output Fase 9

✅ Dokumen sensitif tidak terbuka sembarangan
✅ SOP disiplin/hukum/kesehatan aman
✅ Audit trail lebih kuat

Fase 10 — Finalisasi Laporan, SOP, dan Acceptance Test
Tujuan

Menutup pekerjaan sampai 100% siap digunakan.

Dokumen Final yang Dibuat
docs/SOP-PPIK-MAPPING-SILAKAP.md
docs/SOP-PPIK-ROADMAP-FINAL.md
docs/SOP-PPIK-MANUAL-REGRESSION-CHECKLIST.md
docs/SOP-PPIK-ROLE-ACCESS-MATRIX.md
docs/SOP-PPIK-DMS-TAXONOMY.md
docs/SOP-PPIK-FINAL-ACCEPTANCE-CRITERIA.md
Checklist Final
Area	Kriteria 100%
Sidebar	Semua menu sesuai SOP PPIK
Kinerja Bidang	SOP, RHK, target, realisasi, approval berjalan
Layanan Kepegawaian	Register, verifikasi, SLA, keterlambatan, kepuasan berjalan
SIPENSIUN	Semua jenis pensiun/pemberhentian terwakili
SIDATA	Pemutakhiran, SIASN, rekonsiliasi berjalan
DMS	Dokumen SOP dan bukti dukung tertaut
Referensi SOP	Dokumen SOP bisa dicari dan dibuka
SIANALITIK	Ringkasan pimpinan tersedia
RBAC	Dokumen sensitif aman
Laporan	Bulanan/triwulan/tahunan bisa dibuat
Build	npm run build berhasil
Typecheck	tsc --noEmit berhasil
API	npm run build berhasil
Seed	SOP/RHK masuk database
Urutan Kerja yang Saya Sarankan

Agar tidak berantakan, jalankan seperti ini:

Sprint 1 — Validasi Menu Aman

Fokus: sidebar dan DMS category aman.

File:

apps/web/src/config/layout-1.config.tsx

Output:

Menu final tampil
Build aman
Tidak ada kategori DMS invalid
Sprint 2 — Kinerja Bidang Frontend

Fokus: hidupkan backend Kinerja Bidang di frontend.

File ditambah:

apps/web/src/lib/api/kinerja-bidang.ts
apps/web/src/pages/workspace/kinerja-bidang-*.tsx
apps/web/src/components/workspace/kinerja-bidang/*

File diubah:

apps/web/src/routing/app-routing-setup.tsx
apps/web/src/config/layout-1.config.tsx

Output:

Dashboard Kinerja
Master SOP
Target RHK
Realisasi Bulanan
Review
Laporan
Sprint 3 — Seed SOP Detail

Fokus: semua SOP Bapak masuk ke master SOP.

File diubah:

api/src/modules/kinerja-bidang/constants/kinerja-bidang-seed.constant.ts

Command:

cd D:\Silakap_V1.0\api
npm run db:seed-kinerja-bidang

Output:

SOP MAN, LAY, FNG, DAT, SIK, DMS, PAN, PBH, MON tersedia
Sprint 4 — DMS Taxonomy

Fokus: subCategory, tags, access level.

File diubah:

api/prisma/schema.prisma
api/src/modules/dms/*
apps/web/src/lib/api/dms.ts
apps/web/src/pages/workspace/dms-*.tsx

Output:

Dokumen SOP, RHK, SK, laporan, bukti dukung bisa dibedakan rapi
Sprint 5 — SIPENSIUN Extended

Fokus: pensiun + pemberhentian ASN.

File diubah:

apps/web/src/pages/workspace/sipensiun-list-page.tsx
apps/web/src/pages/workspace/sipensiun-detail-page.tsx
apps/web/src/lib/api/types.ts

Tambahan komponen:

apps/web/src/components/workspace/sipensiun/*

Output:

BUP, Ahli Waris, APS, Tidak Cakap, Meninggal, Tewas, Hilang, Disiplin/Hukum, Sementara, Aktif Kembali, Perampingan
Sprint 6 — Layanan Kepegawaian

Fokus: SOP Tahap 2 hidup sebagai modul umum.

File ditambah:

apps/web/src/pages/workspace/layanan-*.tsx
apps/web/src/components/workspace/layanan/*

Output:

Penerimaan, verifikasi, SLA, keterlambatan, kepuasan
Sprint 7 — SIDATA/SIASN Reports

Fokus: laporan DAT/SIK.

File diubah:

apps/web/src/pages/workspace/sidata-*.tsx
apps/web/src/lib/api/sidata*.ts

Output:

Laporan pemutakhiran data ASN
Laporan sinkronisasi SIASN
Discrepancy data
Sprint 8 — SIANALITIK

Fokus: dashboard pimpinan.

File ditambah:

apps/web/src/pages/workspace/sianalitik-page.tsx
apps/web/src/components/workspace/sianalitik/*

Output:

Executive dashboard
Risk matrix
Capaian RHK
SLA
DMS evidence
Sprint 9 — RBAC & Dokumen Sensitif

Fokus: akses aman.

File diubah:

api/src/modules/auth/*
api/src/modules/dms/*
apps/web/src/config/layout-1.config.tsx

Output:

Dokumen hukum/disiplin/kesehatan/ahli waris dibatasi
Sprint 10 — Final Acceptance

Fokus: semua build, test, dokumen, checklist.

Command final:

cd D:\Silakap_V1.0\api
npm run build

cd D:\Silakap_V1.0\apps\web
npm run build

Output final:

SILAKAP_V1.0 siap sebagai sistem SOP + Kinerja + Layanan + DMS PPIK
Struktur Folder Final yang Disarankan
api/src/modules/
├── kinerja-bidang/
├── dms/
├── siap/
├── siap-worklog/
├── sipensiun/
├── sidata/
├── sla/
├── analytics/
└── layanan-kepegawaian/        # opsional jika ingin modul layanan mandiri

apps/web/src/pages/workspace/
├── dashboard-page.tsx
├── kinerja-bidang-dashboard-page.tsx
├── kinerja-bidang-sop-page.tsx
├── kinerja-bidang-targets-page.tsx
├── kinerja-bidang-realizations-page.tsx
├── kinerja-bidang-review-page.tsx
├── kinerja-bidang-report-page.tsx
├── layanan-kepegawaian-page.tsx
├── layanan-verification-page.tsx
├── layanan-sla-page.tsx
├── layanan-satisfaction-page.tsx
├── sipensiun-list-page.tsx
├── sipensiun-detail-page.tsx
├── sidata-asn-page.tsx
├── sidata-import-siasn-page.tsx
├── dms-documents-page.tsx
├── dms-upload-page.tsx
├── dms-reports-page.tsx
└── sianalitik-page.tsx

apps/web/src/components/workspace/
├── kinerja-bidang/
├── layanan/
├── sipensiun/
├── sidata/
├── dms/
├── sianalitik/
└── ui/

apps/web/src/lib/api/
├── kinerja-bidang.ts
├── dms.ts
├── sipensiun.ts
├── sidata.ts
├── sidata-import.ts
├── siap.ts
├── siap-worklog.ts
└── layanan-kepegawaian.ts
Prioritas Patch Pertama

Kalau Bapak mau mulai dari yang paling aman, urutannya:

Validasi layout-1.config.tsx supaya DMS category tidak invalid.
Buat kinerja-bidang.ts frontend API client.
Buat halaman kinerja-bidang-dashboard-page.tsx.
Daftarkan route /kinerja-bidang.
Update sidebar Kinerja Bidang ke route asli.
Tambah seed SOP detail PAN/PBH/MON/DAT-003.
Baru lanjut SIPENSIUN extended.