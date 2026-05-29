# Flow Peremajaan Data ASN — SILAKAP PPIK

## 1. Tujuan

Dokumen ini mengunci alur Peremajaan Data ASN dalam SILAKAP PPIK.

Peremajaan Data ASN adalah layanan untuk perubahan, koreksi, atau pemutakhiran data ASN berdasarkan dokumen resmi.

---

## 2. Mana Saja yang Masuk ke Dokumen Ini

Dokumen ini mencakup:

| Bagian | Masuk di sini? | Keterangan |
|---|---:|---|
| Perubahan NIK | Ya | Wajib KTP |
| Perubahan Nama | Ya | Wajib Akta Lahir |
| Perubahan Tanggal Lahir | Ya | Wajib Akta Lahir |
| Perubahan Data Keluarga | Ya | Anak, menikah, cerai |
| Perubahan Kontak/Alamat/Email | Ya | Data kontak non-substantif |
| Perubahan Golongan | Ya | Wajib SK Golongan/Pangkat |
| Perubahan Pendidikan | Ya | Wajib Ijazah dan Transkrip Nilai |
| Update ASN | Ya | Setelah validasi dan approval |
| AsnChangeLog | Ya | Wajib untuk setiap perubahan |
| DMS evidence | Ya | Dokumen bukti wajib tersimpan |
| Pemberhentian/Pensiun | Tidak | Ada di `SIPENSIUN-PEMBERHENTIAN-FLOW.md` |

---

## 3. Prinsip Utama

1. Peremajaan Data ASN dimulai dari permohonan resmi.
2. Perubahan data ASN tidak boleh langsung dilakukan tanpa verifikasi.
3. Setiap perubahan data ASN wajib memiliki dokumen bukti.
4. Setiap perubahan data ASN wajib dicatat dalam AsnChangeLog.
5. Dokumen bukti wajib tersimpan/terhubung ke DMS.
6. Backend menjadi sumber kebenaran status dan validasi.

---

## 4. Jenis Peremajaan Data

| Jenis Perubahan | Dokumen Wajib |
|---|---|
| NIK | KTP |
| Nama | Akta Lahir |
| Tanggal Lahir | Akta Lahir |
| Tambah Anak | Akta Kelahiran Anak, KK |
| Menikah | Buku Nikah/Akta Nikah, KK |
| Cerai | Akta Cerai/Putusan Pengadilan, KK |
| Kontak, Alamat, Email | Isian data terbaru, KTP/KK bila diperlukan |
| Golongan | SK Pangkat/SK Golongan terakhir |
| Pendidikan | Ijazah, Transkrip Nilai |

---

## 5. Alur Bisnis

```text
OPD/User membuat permohonan
        ↓
Pilih jenis peremajaan data
        ↓
Isi data lama dan data baru
        ↓
Upload dokumen wajib
        ↓
Submit permohonan
        ↓
Petugas PPIK memverifikasi dokumen
        ↓
Petugas/Analis memvalidasi kesesuaian data
        ↓
Jika tidak valid → dikembalikan untuk perbaikan
        ↓
Jika valid → disetujui untuk perubahan data
        ↓
Data ASN diperbarui
        ↓
AsnChangeLog dibuat
        ↓
Dokumen diarsipkan di DMS
        ↓
Permohonan selesai
```

---

## 6. Alur Teknis

```text
OpdSubmission dibuat
        ↓
OpdSubmissionDocument / DmsDocument dibuat
        ↓
Status dokumen diverifikasi
        ↓
Jika dokumen verified, perubahan dapat diproses
        ↓
Asn diupdate
        ↓
AsnChangeLog ditulis
        ↓
Timeline/AuditLog ditulis
        ↓
Status permohonan menjadi completed
```

---

## 7. Validasi Wajib

Sebelum update ASN:

1. Permohonan harus berstatus valid untuk diproses.
2. Jenis layanan harus termasuk katalog Peremajaan Data ASN.
3. Dokumen wajib harus lengkap.
4. Dokumen wajib harus verified.
5. Data baru tidak boleh kosong.
6. Data baru harus berbeda dari data lama.
7. User harus punya permission untuk memproses perubahan.
8. ASN target harus ditemukan dan aktif.
9. Perubahan harus memiliki catatan/alasan.
10. Evidence document harus tersedia.

---

## 8. Aturan Perubahan Data ASN

Setiap field yang berubah wajib menghasilkan log:

```text
asnId
fieldName
oldValue
newValue
changedBy
changedAt
reason
evidenceDocumentId
source
metadata
```

Field sensitif:

```text
nik
nama
tanggal_lahir
golongan
pendidikan
status_keluarga
alamat
email
kontak
```

---

## 9. Status Permohonan

Status minimal:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
DOCUMENT_VERIFIED
NEED_REVISION
APPROVED
UPDATED
COMPLETED
REJECTED
CANCELLED
```

Catatan:

Status teknis boleh menyesuaikan implementasi repo, tetapi makna bisnis harus tetap sama.

---

## 10. Prioritas Implementasi

Tahap pertama:

```text
1. PEREMAJAAN_NIK
2. PEREMAJAAN_NAMA
3. PEREMAJAAN_TANGGAL_LAHIR
4. PEREMAJAAN_GOLONGAN
5. PEREMAJAAN_PENDIDIKAN
```

Tahap kedua:

```text
6. PEREMAJAAN_KELUARGA_TAMBAH_ANAK
7. PEREMAJAAN_KELUARGA_MENIKAH
8. PEREMAJAAN_KELUARGA_CERAI
9. PEREMAJAAN_KONTAK_ALAMAT_EMAIL
```

---

## 11. Larangan

1. Dilarang update ASN langsung dari frontend.
2. Dilarang update ASN tanpa dokumen bukti.
3. Dilarang menyelesaikan layanan jika dokumen wajib belum verified.
4. Dilarang menghapus jejak perubahan.
5. Dilarang mengganti data lama tanpa AsnChangeLog.
6. Dilarang memakai dokumen rejected sebagai evidence.

---

## 12. Definisi Selesai

Flow Peremajaan Data ASN dianggap selesai jika:

1. Permohonan bisa dibuat.
2. Jenis perubahan bisa dipilih.
3. Dokumen wajib tervalidasi.
4. Dokumen bisa diverifikasi.
5. Data ASN bisa diperbarui setelah verifikasi.
6. AsnChangeLog tercatat otomatis.
7. DMS menyimpan dokumen bukti.
8. Timeline/audit log tercatat.
9. Laporan peremajaan bisa membaca data perubahan.
