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
Audit trail penuh — setiap aksi (upload, map, commit, remap, view issues) dicatat di sidata_import_audit_log.
SIDATA tidak mengedit data ASN secara langsung. Semua perubahan masuk melalui pipeline import yang teraudit.

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
│  /sidata/referensi          — Master referensi          │
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
│  Database (PostgreSQL)                                  │
│                                                         │
│  sidata_asn                    master data ASN          │
│  sidata_asn_import_batch       header batch ASN         │
│  sidata_asn_import_staging     staging baris per batch  │
│  sidata_reference_import_batch header batch referensi   │
│  sidata_reference_import_staging  staging referensi     │
│  sidata_ref_jabatan            master jabatan           │
│  sidata_import_audit_log       audit trail              │
│  + tabel master referensi lain (golongan, pangkat, …)   │
└─────────────────────────────────────────────────────────┘
3. Akses & Peran
Peran	Akses
SUPER_ADMIN	Semua endpoint SIDATA termasuk import & commit
ADMIN_BKPSDM	Semua endpoint SIDATA termasuk import & commit
KABID	Baca data ASN, referensi, dashboard (tidak bisa import/commit)
Endpoint import (/sidata/import/*) hanya terbuka untuk SUPER_ADMIN dan ADMIN_BKPSDM. Endpoint baca ASN (/sidata/asn) terbuka untuk ketiga peran.

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

Catatan: data ini hanya bisa dibaca — tidak ada endpoint edit individual.

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
Remap — ulangi mapping jika referensi diperbarui.
Commit — terapkan data ke master sidata_asn.
Batasan upload: satu batch aktif per waktu dianjurkan. File harus dalam format kolom SIASN standar BKN.

4.6 Import Referensi (/sidata/import/referensi)
Upload file Excel untuk memperbarui master referensi:

Tipe Referensi	Kode
Jabatan Struktural	JABATAN_STRUKTURAL
Jabatan Fungsional	JABATAN_FUNGSIONAL
Jabatan Pelaksana	JABATAN_PELAKSANA
Unit Organisasi	UNIT_ORGANISASI
Golongan	GOLONGAN
Pangkat	PANGKAT
Pendidikan	PENDIDIKAN
Agama	AGAMA
Jenis Kelamin	JENIS_KELAMIN
Status Kawin	STATUS_KAWIN
Kedudukan Hukum	KEDUDUKAN_HUKUM
Jenis ASN	JENIS_ASN
Alur: Upload → Review staging → Commit.

4.7 Mapping Referensi (/sidata/import/mapping-referensi)
Pemetaan manual/semi-otomatis antara kode sumber SIASN dengan entry master referensi lokal. Digunakan jika auto-map batch menghasilkan banyak NEEDS_REVIEW.

4.8 Riwayat Import (/sidata/import/riwayat)
Tabel terpadu seluruh batch ASN + referensi:

Filter: kata kunci, jenis batch, status batch.
Detail batch: summary rows, status, tanggal.
Link ke workspace asal batch.
4.9 Log Sinkronisasi (/sidata/import/log-sinkronisasi)
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
Filter tersedia: batchId, batchType (ASN/REFERENCE), action, dateFrom, dateTo, pagination.

4.10 Referensi Data (/sidata/referensi)
Browser master referensi yang sudah committed:

Jabatan (struktural, fungsional, pelaksana) dengan filter jenis, rumpun, kelas.
Referensi generik (golongan, pangkat, pendidikan, agama, dll.).
4.11 Laporan (/sidata/laporan)
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
└──────┬───────┘
       │  opsional: perbaiki referensi lalu REMAP
       ▼
┌──────────────┐
│   COMMIT     │  POST /sidata/import/asn-batches/:id/commit
│              │  Status: COMMITTED
└──────┬───────┘
       │  upsert ke sidata_asn berdasarkan NIP
       ▼
   Data ASN diperbarui di master
Kondisi commit:

invalidRows = 0
needsReviewRows = 0
unmappedRows = 0
mappedRows > 0
Jika kondisi tidak terpenuhi, gunakan POST .../remap untuk mengulangi mapping setelah referensi diperbarui.

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
GET	/api/v1/sidata/asn/:id	KABID+	Detail satu ASN
GET	/api/v1/sidata/units	KABID+	Daftar unit kerja flat
GET	/api/v1/sidata/units/tree	KABID+	Unit kerja hierarki
Import ASN
Method	Path	Keterangan
POST	/api/v1/sidata/import/asn/upload	Upload file SIASN (multipart)
GET	/api/v1/sidata/import/asn-batches	List semua batch ASN
GET	/api/v1/sidata/import/asn-batches/:id	Detail satu batch
GET	/api/v1/sidata/import/asn-batches/:id/staging	Semua baris staging
GET	/api/v1/sidata/import/asn-batches/:id/summary	Summary batch
GET	/api/v1/sidata/import/asn-batches/:id/issues	Baris bermasalah
GET	/api/v1/sidata/import/asn-batches/:id/needs-review	Baris needs review
GET	/api/v1/sidata/import/asn-batches/:id/invalid	Baris invalid
POST	/api/v1/sidata/import/asn-batches/:id/map	Jalankan mapping
POST	/api/v1/sidata/import/asn-batches/:id/remap	Ulangi mapping
POST	/api/v1/sidata/import/asn-batches/:id/commit	Commit ke master
Import Referensi
Method	Path	Keterangan
POST	/api/v1/sidata/import/reference/upload	Upload referensi generik
POST	/api/v1/sidata/import/reference-jabatan/upload	Upload jabatan khusus
GET	/api/v1/sidata/import/reference-batches	List batch referensi
GET	/api/v1/sidata/import/reference-batches/:id	Detail batch referensi
GET	/api/v1/sidata/import/reference-batches/:id/staging	Staging referensi
GET	/api/v1/sidata/import/reference-batches/:id/summary	Summary batch
POST	/api/v1/sidata/import/reference-batches/:id/commit	Commit jabatan
POST	/api/v1/sidata/import/reference-batches/:id/commit-generic	Commit referensi generik
Audit Log
Method	Path	Keterangan
GET	/api/v1/sidata/import/audit-logs	Daftar log dengan filter
Query params: batchId, batchType (ASN/REFERENCE), action, dateFrom, dateTo, page (default 1), limit (default 20, maks 100).

Referensi Master
Method	Path	Keterangan
GET	/api/v1/sidata/references/jabatan	Daftar jabatan
GET	/api/v1/sidata/references/jabatan/:id	Detail jabatan
GET	/api/v1/sidata/references/jenis-jabatan	Jenis jabatan
GET	/api/v1/sidata/references/generic?type=	Referensi generik
8. Status Implementasi
Selesai ✅
Modul	Fase	Keterangan
Dashboard SIDATA	Phase 1	KPI, kualitas, aksi cepat
Profil ASN	Phase 2	List + detail, filter lengkap
Import Referensi Jabatan	Phase 3–4	Upload, staging, commit jabatan
Import Referensi Generik	Phase 4	9 tipe referensi
Import ASN SIASN	Phase 5	Upload, parsing, validasi
Mapping Referensi	Phase 6	Auto-map semua field ASN
Commit ASN	Phase 7	Upsert ke master berdasarkan NIP
Summary & Issues	Phase 8	Summary batch, tab issue, remap
Validasi Data	Phase 9	Monitor kualitas master ASN
Referensi Data	Phase 10	Browser jabatan & referensi generik
Log Sinkronisasi	Phase 11A	Audit trail dengan filter & pagination
Pemutakhiran Data	Phase 11B	Control center pipeline, KPI ASN-only
Laporan	Phase 10+	Analitik & distribusi
Belum Diimplementasi ⏳
Modul	Ketergantungan	Catatan
Edit Individual ASN	Endpoint PATCH /sidata/asn/:id belum ada	Butuh backend baru + audit trail per field
Rekonsiliasi Data	Endpoint perbandingan SIDATA vs SIASN	Butuh logika diff per NIP
Riwayat Perubahan per ASN	Endpoint GET /sidata/asn/:id/history	Butuh tabel changelog
Dokumen ASN	Integrasi DMS per ASN	Butuh endpoint link DMS–ASN
Import Excel non-SIASN	Definisi format kolom custom	Butuh parser terpisah
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