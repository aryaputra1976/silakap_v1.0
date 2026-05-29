# Service Catalog PPIK — SILAKAP

## 1. Tujuan

Dokumen ini mendefinisikan katalog layanan awal SILAKAP untuk Bidang Pengadaan, Pemberhentian, dan Informasi Kepegawaian (PPIK).

Katalog ini menjadi dasar untuk:

1. pilihan jenis layanan;
2. dokumen syarat;
3. validasi berkas;
4. workflow;
5. SLA;
6. laporan layanan.

---

## 2. Mana Saja yang Masuk ke Dokumen Ini

Dokumen ini mencakup:

| Kelompok | Masuk di sini? | Keterangan |
|---|---:|---|
| Daftar layanan Peremajaan Data ASN | Ya | Semua kode layanan peremajaan awal |
| Daftar layanan Pemberhentian/Pensiun ASN | Ya | Semua kode layanan pemberhentian/pensiun awal |
| Syarat dokumen per layanan | Ya | Terutama untuk Peremajaan Data ASN |
| Status layanan minimal | Ya | Status bisnis acuan |
| SLA layanan | Ya | Prinsip umum SLA |
| Role layanan | Ya | Role minimal untuk alur PPIK |
| Detail alur teknis | Tidak detail | Ada di dokumen flow masing-masing |

---

## 3. Kelompok Layanan Awal

Untuk fase awal, layanan PPIK dibagi menjadi 2 kelompok besar:

```text
1. Peremajaan Data ASN
2. Pemberhentian/Pensiun ASN
```

---

## 4. Katalog Layanan Peremajaan Data ASN

| Kode Layanan | Nama Layanan | Dokumen Wajib | Catatan |
|---|---|---|---|
| PEREMAJAAN_NIK | Perubahan NIK | KTP | Digunakan untuk koreksi/perubahan NIK ASN |
| PEREMAJAAN_NAMA | Perubahan Nama | Akta Lahir | Harus sesuai dokumen kependudukan |
| PEREMAJAAN_TANGGAL_LAHIR | Perubahan Tanggal Lahir | Akta Lahir | Termasuk koreksi tanggal/bulan/tahun lahir |
| PEREMAJAAN_KELUARGA_TAMBAH_ANAK | Tambah Anak | Akta Kelahiran Anak, KK | Untuk penambahan data anak |
| PEREMAJAAN_KELUARGA_MENIKAH | Perubahan Status Menikah | Buku Nikah/Akta Nikah, KK | Untuk perubahan status perkawinan menjadi menikah |
| PEREMAJAAN_KELUARGA_CERAI | Perubahan Status Cerai | Akta Cerai/Putusan Pengadilan, KK | Untuk perubahan status cerai |
| PEREMAJAAN_KONTAK_ALAMAT_EMAIL | Perubahan Kontak, Alamat, Email | Isian data terbaru, KTP/KK bila diperlukan | Untuk data kontak non-substantif namun tetap tercatat |
| PEREMAJAAN_GOLONGAN | Perubahan Golongan | SK Pangkat/SK Golongan terakhir | Harus sesuai SK resmi |
| PEREMAJAAN_PENDIDIKAN | Perubahan Pendidikan | Ijazah, Transkrip Nilai | Harus sesuai dokumen pendidikan |

---

## 5. Katalog Layanan Pemberhentian/Pensiun ASN

| Kode Layanan | Nama Layanan | Catatan |
|---|---|---|
| PEMBERHENTIAN_BUP | Pemberhentian/Pensiun Batas Usia Pensiun | Untuk ASN yang mencapai BUP |
| PEMBERHENTIAN_APS | Pemberhentian Atas Permintaan Sendiri | Berdasarkan permohonan ASN |
| PEMBERHENTIAN_MENINGGAL | Pemberhentian Karena Meninggal Dunia | Membutuhkan dokumen kematian dan ahli waris |
| PEMBERHENTIAN_TIDAK_CAKAP | Pemberhentian Karena Tidak Cakap Jasmani/Rohani | Membutuhkan dokumen medis/penetapan resmi |
| PEMBERHENTIAN_PIDANA_DISIPLIN | Pemberhentian Karena Pidana/Disiplin | Membutuhkan putusan/keputusan resmi |
| PEMBERHENTIAN_HILANG_TEWAS | Pemberhentian Karena Hilang/Tewas | Membutuhkan dokumen penetapan/keterangan resmi |
| PENSIUN_JANDA_DUDA_AHLI_WARIS | Pensiun Janda/Duda/Ahli Waris | Untuk penerima manfaat/ahli waris |

---

## 6. Aturan Dokumen

1. Setiap jenis layanan wajib memiliki daftar dokumen syarat.
2. Dokumen syarat harus dapat diverifikasi.
3. Dokumen yang belum verified tidak boleh dipakai sebagai dasar penyelesaian layanan.
4. Dokumen yang menjadi dasar perubahan data ASN harus tercatat sebagai evidence.
5. Dokumen harus terhubung ke DMS.
6. Dokumen harus memiliki status minimal:
   - uploaded;
   - submitted;
   - verified;
   - rejected;
   - archived.

---

## 7. Aturan Status Layanan

Status minimal permohonan:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
NEED_REVISION
VERIFIED
IN_PROCESS
COMPLETED
REJECTED
CANCELLED
```

Status ini dapat disesuaikan dengan enum/status yang sudah ada di repo, tetapi makna bisnisnya harus tetap konsisten.

---

## 8. Aturan SLA

Setiap layanan minimal memiliki:

1. tanggal pengajuan;
2. tanggal mulai diproses;
3. batas waktu layanan;
4. status SLA;
5. alasan keterlambatan jika lewat waktu;
6. tanggal selesai.

SLA dihitung berdasarkan kalender kerja.

---

## 9. Role Minimal

| Role | Fungsi |
|---|---|
| OPD/User | Membuat permohonan dan mengunggah dokumen |
| Petugas PPIK | Verifikasi awal dan validasi data |
| Analis | Pemeriksaan substansi |
| Kabid | Persetujuan/pengendalian |
| Kepala Badan | Approval akhir bila diperlukan |
| Admin | Konfigurasi sistem |
| Super Admin | Maintenance dan kontrol penuh |

---

## 10. Prinsip Implementasi

1. Jangan membuat layanan baru tanpa kode layanan.
2. Jangan membuat kode layanan tanpa daftar dokumen syarat.
3. Jangan menyelesaikan layanan tanpa audit log.
4. Jangan mengubah data ASN tanpa evidence.
5. Jangan menjadikan SIPENSIUN sebagai loket awal.
6. Jangan menjadikan DMS hanya sebagai upload bebas tanpa relasi layanan.
