Berikut roadmap yang saya sarankan agar SILAKAP/SIDATA naik kelas ke fondasi enterprise.

Phase 1 — Database Foundation
Tujuan: schema bersih, stabil, dan tidak membebani asn.

Refactor asn menjadi current state ramping:

identitas inti
status ASN aktif
current unit/jabatan/golongan
field pencarian cepat
Pindahkan detail SIASN ke:

asn_siasn_profile
asn_import_snapshot
asn_assignment_history
asn_golongan_history
asn_pendidikan_history
Rapikan naming:

siasnJabatanId = ID dari SIASN
jabatanRefId = FK lokal
siasnPendidikanId
pendidikanRefId
siasnUnorId
unitKerjaId
Tambahkan audit standar:

createdAt
updatedAt
deletedAt
sourceBatchId
syncedAt
rawData
checksum/hash
Output phase ini:

schema.prisma enterprise-ready
tabel asn tidak gemuk
detail dan history aman
Phase 2 — Import Pipeline
Tujuan: import berulang aman, idempotent, dan bisa diaudit.

Upload Excel SIASN masuk ke staging.
Validasi wajib:
NIP
Nama
duplikat NIP dalam file
format tanggal
tipe pegawai
Mapping referensi:
unit kerja
jabatan
golongan
pendidikan
agama
kedudukan hukum
Commit idempotent:
tidak membuat ASN dobel
update current asn
update asn_siasn_profile
insert/update asn_import_snapshot
tulis history jika ada perubahan
Tambahkan checksum:
kalau row tidak berubah, tidak perlu tulis history baru
kalau berubah, catat perubahan
Output phase ini:

import PNS/PPPK/Paruh Waktu bisa diulang berkali-kali
tidak error kalau batch lama di-commit ulang
perubahan antar-import bisa dilacak
Phase 3 — Data Quality & Governance
Tujuan: data bisa dipercaya.

Buat halaman/status data quality:
total ASN
invalid
unmapped
needs review
missing NIK
missing unit
missing jabatan
Buat tabel issue:
sidata_import_issues
kategori: validation, mapping, duplicate, missing_reference
Severity:
blocking
warning
info
Buat rule:
invalid NIP = blocking
referensi pendidikan kosong = warning
raw SIASN tetap masuk snapshot
Output phase ini:

admin tahu kualitas data
error tidak tersembunyi
data bisa diaudit
Phase 4 — API Enterprise
Tujuan: backend siap dipakai FE dan modul lain.

Endpoint utama:

GET /sidata/asn
GET /sidata/asn/:id
GET /sidata/asn/:id/profile
GET /sidata/asn/:id/history/assignment
GET /sidata/asn/:id/history/golongan
GET /sidata/asn/:id/history/pendidikan
GET /sidata/import/batches
GET /sidata/import/batches/:id/summary
GET /sidata/import/batches/:id/issues
Fitur API:

pagination
search
filter tipe ASN
filter unit kerja
filter jabatan
filter status ASN
sorting
export-ready response
Output phase ini:

FE tidak perlu baca raw table
modul lain punya API stabil
Phase 5 — Frontend Enterprise
Tujuan: UI terasa seperti sistem kerja, bukan sekadar halaman import.

Halaman utama:

Dashboard SIDATA

total ASN
PNS/PPPK/Paruh Waktu
data quality score
batch terakhir
issue terakhir
Master ASN

table dense
search NIP/nama
filter unit/tipe/jabatan/status
quick detail drawer
export
Detail ASN

profil utama
data SIASN lengkap
riwayat jabatan/unit
riwayat golongan
riwayat pendidikan
raw snapshot per batch
Import Center

upload
validate
map
review issues
commit
audit log
Reference Center

unit kerja
jabatan
pendidikan
golongan
mapping manual
unresolved references
Desain FE:

layout padat, profesional
tabel kuat
filter jelas
drawer/detail panel
badge status
bukan landing page
bukan card berlebihan
Phase 6 — Operational Hardening
Tujuan: aman dipakai produksi lama.

Backup sebelum import besar.
Import transaction-safe.
Background job untuk file besar.
Progress tracking.
Retry failed import.
Audit log lengkap.
Role permission:
viewer
operator import
reviewer mapping
admin
Export laporan.
Monitoring:
import duration
failed rows
changed rows
created/updated ASN
Urutan Eksekusi Yang Saya Sarankan

Finalisasi schema.prisma.
Refactor asn menjadi ramping + profile/history.
Refactor commit import supaya idempotent dan tulis snapshot/history.
Backfill ulang 8379 data.
Buat API ASN list/detail/profile/history.
Buat FE Master ASN + Detail ASN.
Rapikan Import Center.
Tambah Data Quality dashboard.
Tambah permission/audit/export.
Prioritas paling dekat:

1. Final schema enterprise
2. Import pipeline idempotent
3. API master ASN
4. FE Master ASN + Detail ASN