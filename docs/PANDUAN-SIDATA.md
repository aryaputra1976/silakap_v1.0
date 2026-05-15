PANDUAN SIDATA — Sistem Informasi Data ASN
Silakap V1.0 · Versi dokumen: Mei 2026

Daftar Isi
Ringkasan Sistem
Arsitektur
Akses & Peran
Modul & Fitur
Pipeline Import SIASN
Master Referensi
API Reference
Status Implementasi
Pengembangan Lanjutan
1. Ringkasan Sistem
SIDATA adalah modul pengelolaan data Aparatur Sipil Negara (ASN) dalam platform Silakap. Fungsi utamanya:

Sumber tunggal data ASN — menjadi master reference untuk modul lain (SIAP, SIPENSIUN, DMS).
Sinkronisasi SIASN — import file Excel dari portal BKN/SIASN, proses validasi, mapping referensi, dan commit ke database utama.
Kontrol kualitas — setiap import menghasilkan quality score berdasarkan valid/invalid/unmapped rows.
Audit trail penuh — setiap aksi (upload, map, commit, remap, view issues, cancel, extract-references) dicatat di sidata_import_audit_log.
SIDATA tidak mengedit data ASN secara langsung melalui pipeline. Edit manual terbatas tersedia via PATCH /sidata/asn/:id dengan audit trail.

2. Arsitektur

┌─────────────────────────────────────────────────────────┐
│  Frontend  (apps/web)                                   │
│                                                         │
│  /sidata/dashboard          — KPI & status global       │
│  /sidata/asn                — Profil ASN (read-only)    │
│  /sidata/validasi           — Quality check data        │
│  /sidata/pemutakhiran       — Control center pipeline   │
│  /sidata/import/siasn       — Upload + commit ASN       │
│  /sidata/import/referensi   — Upload referensi          │
│  /sidata/import/mapping-referensi  — Petakan referensi  │
│  /sidata/import/riwayat     — Semua batch               │
│  /sidata/import/log-sinkronisasi  — Audit trail         │
│  /sidata/rekonsiliasi       — Rekonsiliasi data ASN     │
│  /sidata/referensi          — Master referensi          │
│  /sidata/dokumen            — Dokumen per ASN           │
│  /sidata/laporan            — Laporan & analitik        │
└─────────────────────────────────────────────────────────┘
                        │  REST API
┌─────────────────────────────────────────────────────────┐
│  Backend  (api/src/modules/sidata)                      │
│                                                         │
│  SidataController           — ASN list, unit tree       │
│  SidataImportController     — Upload, map, commit       │
│  SidataReferenceController  — Jabatan, referensi        │
└─────────────────────────────────────────────────────────┘
                        │  Prisma ORM
┌─────────────────────────────────────────────────────────┐
│  Database (MySQL)                                       │
│                                                         │
│  asn                           master data ASN          │
│  sidata_asn_import_batch       header batch ASN         │
│  sidata_asn_import_staging     staging baris per batch  │
│  sidata_reference_import_batches  header batch referensi│
│  sidata_reference_import_staging  staging referensi     │
│  sidata_reference_mappings     peta referensi lokal     │
│  ref_jabatan                   master jabatan           │
│  sidata_import_audit_log       audit trail              │
│  + tabel master referensi lain (golongan, pangkat, …)   │
└─────────────────────────────────────────────────────────┘
3. Akses & Peran
Peran	Akses
SUPER_ADMIN	Semua endpoint SIDATA termasuk import, commit, edit ASN, dan CRUD referensi
ADMIN_BKPSDM	Semua endpoint SIDATA termasuk import, commit, edit ASN, dan CRUD referensi
KABID	Baca data ASN, referensi, dashboard, rekonsiliasi (tidak bisa import/commit/edit)
OPERATOR_IMPORT	Upload file, cancel batch (tidak bisa map, commit, atau edit ASN)
REVIEWER_MAPPING	Upload file, map, remap, extract-references (tidak bisa commit atau edit ASN)

Endpoint import (/sidata/import/*) terbuka untuk SUPER_ADMIN, ADMIN_BKPSDM, OPERATOR_IMPORT, dan REVIEWER_MAPPING dengan batasan per aksi seperti tabel di atas. Endpoint baca ASN (/sidata/asn) terbuka untuk semua peran.

4. Modul & Fitur
4.1 Dashboard (/sidata/dashboard)
Menampilkan ringkasan keseluruhan:

KPI Cards: Total ASN, batch ASN, batch referensi, committed batch, problem batch, quality score.
Detail kualitas: Valid/invalid/warning/mapped/unmapped/committed rows dari semua batch.
Aksi Cepat: Navigasi ke workspace import.
Batch terbaru: 8 batch terakhir gabungan ASN + referensi.
Data source: /sidata/asn?limit=1 + /sidata/import/asn-batches + /sidata/import/reference-batches.

4.2 Profil ASN (/sidata/asn)
Daftar seluruh ASN di master SIDATA.

Filter tersedia:

Kata kunci (nama, NIP, jabatan)
Unit kerja
Status ASN: AKTIF PENSIUN CLTN BERHENTI MENINGGAL
Jenis ASN: PNS PPPK
Detail ASN (/sidata/asn/:id): profil lengkap satu ASN.

Export: GET /sidata/asn/export menghasilkan file CSV seluruh ASN sesuai filter aktif.

Edit manual: PATCH /sidata/asn/:id tersedia untuk SUPER_ADMIN dan ADMIN_BKPSDM. Setiap perubahan dicatat di riwayat.

Riwayat: GET /sidata/asn/:id/history menampilkan changelog per ASN.

4.3 Validasi Data (/sidata/validasi)
Monitoring kualitas data master ASN dari sisi field:

Kelengkapan data wajib (NIP, nama, jabatan, golongan, unit kerja).
Konsistensi referensi (jabatan & golongan terhubung ke master).
Distribusi status ASN.
4.4 Pemutakhiran Data (/sidata/pemutakhiran)
Pusat kontrol pipeline pemutakhiran — bukan editor manual.

Konten:

KPI ASN-only: total ASN, batch, committed, needs review, unmapped, invalid, quality score.
Alur Pipeline (klikable): Upload SIASN → Mapping Referensi → Validasi Data → Commit Data → Audit Log.
Quality bar: persentase data bersih dengan breakdown per status.
Tindak Lanjut: 5 shortcut ke workspace terkait.
Batch ASN Terbaru: tabel 10 batch terbaru dengan status mapping & commit.
Catatan Batasan: transparansi tentang fitur yang belum tersedia.
4.5 Import SIASN (/sidata/import/siasn)
Workspace operasional import data ASN dari file SIASN. Alur lengkap:

Upload — drag & drop atau pilih file .xlsx (maks. 25 MB).
Review batch — lihat summary: total/valid/invalid/duplicate/warning rows.
Map — jalankan auto-mapping referensi (jabatan, golongan, unit kerja, dll.).
Review issues — tab Issues, Needs Review, Invalid dengan filter & pagination.
Export issues — unduh baris bermasalah sebagai CSV via GET .../export-issues.
Extract references — ekstrak referensi unik dari batch ke tabel master via POST .../extract-references.
Remap — ulangi mapping jika referensi diperbarui.
Commit — terapkan data ke master asn.
Cancel — batalkan batch yang belum commit via POST .../cancel.
Batasan upload: satu batch aktif per waktu dianjurkan. File harus dalam format kolom SIASN standar BKN.

4.6 Import Referensi (/sidata/import/referensi)
Upload file Excel untuk memperbarui master referensi:

Urutan import setelah database bersih:

1. Unit kerja - dari HierarkiUnor.xlsx ke unit_kerja.
2. Jenis jabatan - seed manual ref_jenis_jabatan: STRUKTURAL, FUNGSIONAL, PELAKSANA.
3. Jabatan - dari Referensi-Jabatan-*.xlsx ke ref_jabatan.
4. Referensi generik - golongan, pangkat, pendidikan, agama, jenis kelamin, status kawin, kedudukan hukum, jenis ASN, dll.
5. Profil jabatan fungsional - dari Database_Profil_JF_2024_BKN.xlsx ke ref_jabatan_fungsional_profile.
6. ASN - dari Data PNS.xlsx dan Data PPPK.xlsx ke asn.

Tipe Referensi	Kode	Endpoint upload
Jabatan Struktural	JABATAN_STRUKTURAL	POST /import/reference-jabatan/upload
Jabatan Fungsional	JABATAN_FUNGSIONAL	POST /import/reference-jabatan/upload
Jabatan Pelaksana	JABATAN_PELAKSANA	POST /import/reference-jabatan/upload
Profil JF	JF_PROFILE	POST /import/reference-jf-profile/upload
Unit Organisasi	UNIT_ORGANISASI	POST /import/reference/upload
Golongan	GOLONGAN	POST /import/reference/upload
Pangkat	PANGKAT	POST /import/reference/upload
Pendidikan	PENDIDIKAN	POST /import/reference/upload
Agama	AGAMA	POST /import/reference/upload
Jenis Kelamin	JENIS_KELAMIN	POST /import/reference/upload
Status Kawin	STATUS_KAWIN	POST /import/reference/upload
Kedudukan Hukum	KEDUDUKAN_HUKUM	POST /import/reference/upload
Jenis ASN	JENIS_ASN	POST /import/reference/upload
Alur: Upload (maks. 10 MB) → Review staging → Commit.

Commit jabatan struktural/fungsional/pelaksana: POST .../commit
Commit profil JF: POST .../commit-jf-profile
Commit referensi generik: POST .../commit-generic
4.7 Mapping Referensi (/sidata/import/mapping-referensi)
Pemetaan manual/semi-otomatis antara kode sumber SIASN dengan entry master referensi lokal. Digunakan jika auto-map batch menghasilkan banyak NEEDS_REVIEW.

4.8 Rekonsiliasi Data (/sidata/rekonsiliasi)
Perbandingan data antara staging ASN dengan master, per batch. Tersedia via endpoint GET /sidata/import/asn-batches/:id/reconciliation dengan filter tipe rekonsiliasi. Menampilkan baris yang berubah, baru, atau tidak berubah dibandingkan master.

4.9 Riwayat Import (/sidata/import/riwayat)
Tabel terpadu seluruh batch ASN + referensi:

Filter: kata kunci, jenis batch, status batch.
Detail batch: summary rows, status, tanggal.
Link ke workspace asal batch.
4.10 Log Sinkronisasi (/sidata/import/log-sinkronisasi)
Audit trail setiap aksi import. Tersimpan di sidata_import_audit_log.

Aksi yang dicatat:

Aksi	Trigger
UPLOAD_REFERENCE	Upload file referensi
COMMIT_REFERENCE	Commit batch referensi
UPLOAD_ASN	Upload file SIASN
MAP_ASN	Jalankan mapping batch ASN
REMAP_ASN	Jalankan ulang mapping
COMMIT_ASN	Commit batch ASN
VIEW_ISSUES	Akses halaman issues batch
EXTRACT_REFERENCES	Ekstrak referensi dari batch ASN
CANCEL_BATCH	Batalkan batch (ASN atau referensi)
Filter tersedia: batchId, batchType (ASN/REFERENCE), action, dateFrom, dateTo, pagination.

4.11 Referensi Data (/sidata/referensi)
Browser master referensi yang sudah committed:

Jabatan (struktural, fungsional, pelaksana) dengan filter jenis, rumpun, kelas.
Referensi generik (golongan, pangkat, pendidikan, agama, dll.).
CRUD manual tersedia untuk SUPER_ADMIN dan ADMIN_BKPSDM:
POST/PATCH/DELETE /api/v1/sidata/references/jabatan
POST/PATCH/DELETE /api/v1/sidata/references/generic/:type/:id
POST/PATCH/DELETE /api/v1/sidata/references/units
4.12 Dokumen ASN (/sidata/dokumen)
Manajemen dokumen yang dilampirkan per ASN:

Upload dokumen (PDF, dll.) per ASN dengan tipe dokumen (SK, dll.).
Download dan hapus (soft delete) dokumen.
Terintegrasi langsung dengan detail ASN.
4.13 Laporan (/sidata/laporan)
Laporan analitik dan distribusi data ASN:

Distribusi per unit kerja, jabatan, golongan, jenis ASN.
Tren import & quality score lintas waktu.
5. Pipeline Import SIASN

File .xlsx dari SIASN/BKN
        │
        ▼
┌──────────────┐
│   UPLOAD     │  POST /sidata/import/asn/upload
│  (parsing)   │  Status: UPLOADED
└──────┬───────┘
       │  batch dibuat, staging diisi, validasi baris
       ▼
┌──────────────┐
│    MAP       │  POST /sidata/import/asn-batches/:id/map
│  (mapping)   │  Status: PROCESSING → VALIDATED (jika selesai)
└──────┬───────┘
       │  setiap staging row → MAPPED / NEEDS_REVIEW / UNMAPPED
       ▼
┌──────────────┐
│   REVIEW     │  GET /sidata/import/asn-batches/:id/issues
│   ISSUES     │  GET /sidata/import/asn-batches/:id/needs-review
│              │  GET /sidata/import/asn-batches/:id/invalid
│              │  GET /sidata/import/asn-batches/:id/export-issues (CSV)
└──────┬───────┘
       │  opsional: ekstrak referensi → POST .../extract-references
       │  opsional: perbaiki referensi lalu REMAP
       ▼
┌──────────────┐
│   COMMIT     │  POST /sidata/import/asn-batches/:id/commit
│              │  Status: COMMITTED
└──────┬───────┘
       │  upsert ke tabel asn berdasarkan NIP
       ▼
   Data ASN diperbarui di master
Kondisi commit:

invalidRows = 0
needsReviewRows = 0
unmappedRows = 0
mappedRows > 0
Jika kondisi tidak terpenuhi, gunakan POST .../remap untuk mengulangi mapping setelah referensi diperbarui.
Untuk membatalkan batch sebelum commit: POST /sidata/import/asn-batches/:id/cancel.

Status Batch
Status	Arti
UPLOADED	File berhasil diparse, staging terisi
PROCESSING	Sedang diproses (map/commit berjalan)
VALIDATED	Mapping selesai, siap review
COMMITTED	Data sudah masuk master ASN
FAILED	Terjadi error tak terduga
CANCELLED	Dibatalkan
Status Baris Mapping
Status	Arti
MAPPED	Semua referensi ditemukan
NEEDS_REVIEW	Sebagian referensi ambigu atau tidak pasti
UNMAPPED	Referensi tidak ditemukan sama sekali
IGNORED	Baris diabaikan secara manual
6. Master Referensi
Jabatan
Endpoint: GET /api/v1/sidata/references/jabatan

Query params: q, jenisJabatanKode (STRUKTURAL/FUNGSIONAL/PELAKSANA), rumpun, kelasJabatan, isActive, page, limit.

Referensi Generik
Endpoint: GET /api/v1/sidata/references/generic?type=<TIPE>

Tipe tersedia: GOLONGAN PANGKAT PENDIDIKAN AGAMA JENIS_KELAMIN STATUS_KAWIN KEDUDUKAN_HUKUM JENIS_ASN.

7. API Reference
ASN
Method	Path	Peran	Keterangan
GET	/api/v1/sidata/asn	KABID+	Daftar ASN dengan filter & pagination
GET	/api/v1/sidata/asn/export	KABID+	Export daftar ASN ke CSV
GET	/api/v1/sidata/asn/:id	KABID+	Detail satu ASN
PATCH	/api/v1/sidata/asn/:id	ADMIN_BKPSDM+	Edit data ASN manual
GET	/api/v1/sidata/asn/:id/history	KABID+	Riwayat perubahan satu ASN
GET	/api/v1/sidata/asn/:id/documents	KABID+	Daftar dokumen ASN
POST	/api/v1/sidata/asn/:id/documents	KABID+	Upload dokumen ASN
GET	/api/v1/sidata/asn/:id/documents/:docId/download	KABID+	Download dokumen
DELETE	/api/v1/sidata/asn/:id/documents/:docId	ADMIN_BKPSDM+	Hapus (soft delete) dokumen
GET	/api/v1/sidata/units	KABID+	Daftar unit kerja flat
GET	/api/v1/sidata/units/tree	KABID+	Unit kerja hierarki
Import ASN
Method	Path	Keterangan
POST	/api/v1/sidata/import/asn/upload	Upload file SIASN (multipart, maks. 25 MB)
GET	/api/v1/sidata/import/asn-batches	List semua batch ASN
GET	/api/v1/sidata/import/asn-batches/:id	Detail satu batch
GET	/api/v1/sidata/import/asn-batches/:id/staging	Semua baris staging (pagination maks. 200/hal)
GET	/api/v1/sidata/import/asn-batches/:id/summary	Summary batch
GET	/api/v1/sidata/import/asn-batches/:id/issues	Baris bermasalah
GET	/api/v1/sidata/import/asn-batches/:id/export-issues	Export baris bermasalah ke CSV
GET	/api/v1/sidata/import/asn-batches/:id/needs-review	Baris needs review
GET	/api/v1/sidata/import/asn-batches/:id/invalid	Baris invalid
GET	/api/v1/sidata/import/asn-batches/:id/reconciliation	Rekonsiliasi batch vs master
POST	/api/v1/sidata/import/asn-batches/:id/map	Jalankan mapping
POST	/api/v1/sidata/import/asn-batches/:id/remap	Ulangi mapping
POST	/api/v1/sidata/import/asn-batches/:id/extract-references	Ekstrak referensi ke master
POST	/api/v1/sidata/import/asn-batches/:id/commit	Commit ke master
POST	/api/v1/sidata/import/asn-batches/:id/cancel	Batalkan batch
Import Referensi
Method	Path	Keterangan
POST	/api/v1/sidata/import/reference/upload	Upload referensi generik (maks. 10 MB)
POST	/api/v1/sidata/import/reference-jabatan/upload	Upload jabatan (maks. 10 MB)
POST	/api/v1/sidata/import/reference-jf-profile/upload	Upload profil JF (maks. 10 MB)
GET	/api/v1/sidata/import/reference-batches	List batch referensi
GET	/api/v1/sidata/import/reference-batches/:id	Detail batch referensi
GET	/api/v1/sidata/import/reference-batches/:id/staging	Staging referensi (pagination maks. 200/hal)
GET	/api/v1/sidata/import/reference-batches/:id/summary	Summary batch
POST	/api/v1/sidata/import/reference-batches/:id/commit	Commit jabatan struktural/fungsional/pelaksana
POST	/api/v1/sidata/import/reference-batches/:id/commit-generic	Commit referensi generik
POST	/api/v1/sidata/import/reference-batches/:id/commit-jf-profile	Commit profil JF
POST	/api/v1/sidata/import/reference-batches/:id/cancel	Batalkan batch referensi
Audit Log
Method	Path	Keterangan
GET	/api/v1/sidata/import/audit-logs	Daftar log dengan filter
Query params: batchId, batchType (ASN/REFERENCE), action, dateFrom, dateTo, page (default 1), limit (default 20, maks 100).

Referensi Master
Method	Path	Keterangan
GET	/api/v1/sidata/references/jabatan	Daftar jabatan
GET	/api/v1/sidata/references/jabatan/:id	Detail jabatan
POST	/api/v1/sidata/references/jabatan	Buat jabatan manual
PATCH	/api/v1/sidata/references/jabatan/:id	Update jabatan
DELETE	/api/v1/sidata/references/jabatan/:id	Nonaktifkan jabatan
GET	/api/v1/sidata/references/jenis-jabatan	Jenis jabatan
GET	/api/v1/sidata/references/generic?type=	Referensi generik
POST	/api/v1/sidata/references/generic	Buat referensi generik manual
PATCH	/api/v1/sidata/references/generic/:type/:id	Update referensi generik
DELETE	/api/v1/sidata/references/generic/:type/:id	Nonaktifkan referensi generik
POST	/api/v1/sidata/references/units	Buat unit kerja manual
PATCH	/api/v1/sidata/references/units/:id	Update unit kerja
DELETE	/api/v1/sidata/references/units/:id	Nonaktifkan unit kerja
8. Status Implementasi
Selesai ✅
Modul	Fase	Keterangan
Dashboard SIDATA	Phase 1	KPI, kualitas, aksi cepat
Profil ASN	Phase 2	List + detail, filter lengkap, export CSV
Import Referensi Jabatan	Phase 3–4	Upload, staging, commit jabatan
Import JF Profile	Phase 3B	Upload dan commit profil jabatan fungsional
Import Referensi Generik	Phase 4	9 tipe referensi + CRUD manual
Import ASN SIASN	Phase 5	Upload, parsing, validasi
Mapping Referensi	Phase 6	Auto-map semua field ASN
Commit ASN	Phase 7	Upsert ke master berdasarkan NIP
Summary & Issues	Phase 8	Summary batch, tab issue, remap, export CSV, extract-references, cancel
Validasi Data	Phase 9	Monitor kualitas master ASN
Referensi Data	Phase 10	Browser jabatan & referensi generik + CRUD manual
Laporan	Phase 10+	Analitik & distribusi
Log Sinkronisasi	Phase 11A	Audit trail dengan filter & pagination (9 action types)
Pemutakhiran Data	Phase 11B	Control center pipeline, KPI ASN-only
Edit Individual ASN	Phase 12A	PATCH /sidata/asn/:id dengan audit trail riwayat
Riwayat Perubahan per ASN	Phase 12B	GET /sidata/asn/:id/history
Dokumen ASN	Phase 12C	Upload, download, soft delete dokumen per ASN
Rekonsiliasi Data	Phase 12D	Perbandingan staging vs master per batch
Belum Diimplementasi ⏳
Modul	Ketergantungan	Catatan
Import Excel non-SIASN	Definisi format kolom custom	Butuh parser terpisah (menu sidebar sudah ada: disabled)
Notifikasi Batch Selesai	WebSocket / SSE	Real-time status commit
9. Pengembangan Lanjutan
Menambah Endpoint Backend
Ikuti pola file yang sudah ada:


sidata-import.types.ts   — DTO, response types, konstanta
sidata-import.repository.ts  — akses Prisma, query builder
sidata-import.service.ts  — logika bisnis, normalisasi filter
sidata-import.controller.ts  — route, thin controller
Aturan wajib:

Jangan gunakan any — gunakan Prisma.GetPayload untuk tipe Prisma.
Controller tipis — satu baris panggil service, satu baris return ok(result).
Setiap operasi mutasi wajib panggil createImportAuditLog(...) di service.
Response selalu dalam envelope { status, data } via helper ok().
Menambah Halaman Frontend
Ikuti pola halaman yang sudah ada:


src/pages/workspace/sidata-*.tsx
Komponen wajib dari @/components/workspace/ui:
PageHeader SectionCard StatCard StatusBadge DataTable ActionButton LoadingState EmptyState ErrorAlert

Helper dari @/lib/sidata:
getErrorMessage shortId toNumber formatDateTime buildImportAggregate getQualityTone

API call selalu via apiClient.get / .post dari @/lib/api/client.

Mengaktifkan Menu Sidebar
File: src/config/layout-1.config.tsx

Ubah entri dari disabled: true menjadi path: '/sidata/...' setelah halaman siap.

Quality Score
Formula: max(0, round((totalRows - issueRows) / totalRows * 100))

di mana issueRows = invalidRows + warningRows + needsReviewRows + unmappedRows.

Threshold: >= 90% hijau · >= 70% kuning · < 70% merah.

Panduan ini mencerminkan status implementasi per Mei 2026. Selalu cek kode aktual untuk detail terbaru.
