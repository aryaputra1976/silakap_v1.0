# Flow SIPENSIUN dan Pemberhentian ASN — SILAKAP PPIK

## 1. Tujuan

Dokumen ini mengunci alur layanan Pemberhentian/Pensiun ASN dalam SILAKAP.

SIPENSIUN adalah modul spesialis untuk memproses layanan pensiun dan pemberhentian ASN.

SIPENSIUN bukan loket awal layanan.

Loket awal tetap:

```text
Layanan Kepegawaian / OpdSubmission
```

---

## 2. Mana Saja yang Masuk ke Dokumen Ini

Dokumen ini mencakup:

| Bagian | Masuk di sini? | Keterangan |
|---|---:|---|
| Pemberhentian BUP | Ya | Pensiun batas usia pensiun |
| Pemberhentian APS | Ya | Atas permintaan sendiri |
| Pemberhentian meninggal dunia | Ya | Termasuk dokumen ahli waris |
| Pemberhentian tidak cakap jasmani/rohani | Ya | Berdasarkan dokumen resmi |
| Pemberhentian pidana/disiplin | Ya | Berdasarkan putusan/keputusan resmi |
| Pemberhentian hilang/tewas | Ya | Berdasarkan penetapan/keterangan resmi |
| Pensiun janda/duda/ahli waris | Ya | Untuk penerima manfaat |
| Peremajaan Data ASN | Tidak | Ada di `PEREMAJAAN-DATA-ASN-FLOW.md` |
| Katalog layanan umum | Tidak detail | Ada di `SERVICE-CATALOG-PPIK.md` |

---

## 3. Keputusan Arsitektur

```text
OpdSubmission = permohonan resmi dari OPD/user
SiapCase      = case kerja internal
SipensiunCase = detail khusus pensiun/pemberhentian
DmsDocument   = dokumen syarat dan arsip
Asn           = data ASN yang terdampak
```

Dengan demikian, SIPENSIUN harus menempel pada alur layanan, bukan berdiri sendiri sebagai sistem usulan paralel.

---

## 4. Jenis Layanan

| Kode Layanan | Nama |
|---|---|
| PEMBERHENTIAN_BUP | Pemberhentian/Pensiun BUP |
| PEMBERHENTIAN_APS | Pemberhentian Atas Permintaan Sendiri |
| PEMBERHENTIAN_MENINGGAL | Pemberhentian Karena Meninggal Dunia |
| PEMBERHENTIAN_TIDAK_CAKAP | Pemberhentian Karena Tidak Cakap Jasmani/Rohani |
| PEMBERHENTIAN_PIDANA_DISIPLIN | Pemberhentian Karena Pidana/Disiplin |
| PEMBERHENTIAN_HILANG_TEWAS | Pemberhentian Karena Hilang/Tewas |
| PENSIUN_JANDA_DUDA_AHLI_WARIS | Pensiun Janda/Duda/Ahli Waris |

---

## 5. Alur Bisnis

```text
OPD/User membuat permohonan
        ↓
Jenis layanan dipilih: Pemberhentian/Pensiun
        ↓
OpdSubmission dibuat
        ↓
Dokumen syarat diunggah
        ↓
Verifikasi awal
        ↓
SiapCase dibuat untuk proses internal
        ↓
SipensiunCase dibuat
        ↓
Validasi substansi pensiun/pemberhentian
        ↓
Proses teknis/SIASN/BKN bila diperlukan
        ↓
Approval berjenjang
        ↓
SK/Keputusan terbit
        ↓
Penyerahan keputusan
        ↓
Update data ASN setelah SK
        ↓
Arsip dan laporan
```

---

## 6. Alur Teknis

```text
OpdSubmission
        ↓
OpdSubmissionDocument / DmsDocument
        ↓
SiapCase
        ↓
SipensiunCase
        ↓
SiapTask
        ↓
Timeline / WorkflowLog / AuditLog
        ↓
DmsDocument arsip SK
        ↓
Asn update status
        ↓
Selesai
```

---

## 7. Aturan Bisnis Wajib

1. SipensiunCase wajib memiliki SiapCase.
2. SipensiunCase wajib memiliki ASN.
3. Dokumen syarat wajib tersimpan/terhubung ke DMS.
4. Status pensiun/pemberhentian tidak boleh lepas dari status case.
5. Setelah SK terbit, data ASN harus diperbarui sesuai keputusan.
6. Setiap perubahan status harus masuk timeline/audit log.
7. Setiap pengembalian berkas wajib memiliki alasan.
8. Setiap approval wajib mencatat actor, waktu, dan catatan jika ada.
9. Penyerahan keputusan harus tercatat.
10. Arsip final harus tersimpan di DMS.

---

## 8. Status Minimal

Status bisnis minimal:

```text
DRAFT
SUBMITTED
VERIFIKASI_BERKAS
PERBAIKAN_BERKAS
VALIDASI_SUBSTANSI
PROSES_TEKNIS
APPROVAL
SK_TERBIT
PENYERAHAN_SK
UPDATE_DATA_ASN
SELESAI
DITOLAK
DIBATALKAN
```

Status teknis dapat menyesuaikan enum/status di repo.

---

## 9. Role dan Tanggung Jawab

| Role | Tanggung Jawab |
|---|---|
| OPD/User | Mengajukan permohonan dan melengkapi dokumen |
| Petugas PPIK | Verifikasi awal dan kelengkapan dokumen |
| Analis Pertama | Pemeriksaan awal substansi |
| Analis Muda | Review lanjutan |
| Analis Madya | Validasi teknis/administratif |
| Kabid | Pengendalian dan approval bidang |
| Kepala Badan | Approval akhir bila diperlukan |
| Admin | Konfigurasi layanan |
| Super Admin | Maintenance sistem |

---

## 10. Integrasi DMS

DMS digunakan untuk:

1. dokumen usulan;
2. dokumen identitas;
3. dokumen kepegawaian;
4. dokumen ahli waris;
5. nota usul;
6. SK/Keputusan;
7. bukti penyerahan SK;
8. arsip akhir.

Setiap dokumen harus memiliki status:

```text
UPLOADED
SUBMITTED
VERIFIED
REJECTED
ARCHIVED
```

---

## 11. Integrasi ASN

Setelah SK/keputusan terbit, sistem harus memperbarui data ASN sesuai keputusan.

Contoh perubahan:

1. status ASN;
2. kedudukan hukum;
3. TMT pensiun/pemberhentian;
4. data ahli waris/penerima manfaat jika diperlukan;
5. catatan pensiun/pemberhentian.

Perubahan data ASN wajib tercatat dalam audit log atau change log.

---

## 12. Larangan

1. SIPENSIUN tidak boleh menjadi loket awal yang terpisah dari layanan.
2. SipensiunCase tidak boleh dibuat tanpa ASN.
3. SipensiunCase tidak boleh dibuat tanpa SiapCase.
4. SK tidak boleh diarsipkan tanpa relasi layanan/case.
5. Status selesai tidak boleh diberikan jika update data ASN belum dilakukan.
6. Dokumen rejected tidak boleh menjadi dasar penyelesaian.
7. Perubahan status tidak boleh dilakukan tanpa actor dan audit trail.

---

## 13. Definisi Selesai

Flow SIPENSIUN/Pemberhentian dianggap stabil jika:

1. Permohonan bisa dibuat dari loket layanan.
2. SiapCase terbentuk untuk proses internal.
3. SipensiunCase terbentuk sebagai detail domain.
4. Dokumen syarat tersimpan di DMS.
5. Verifikasi berkas berjalan.
6. Status proses tercatat.
7. SK/keputusan bisa diarsipkan.
8. Data ASN diperbarui setelah SK.
9. Timeline/audit log tercatat.
10. Laporan dapat membaca data proses.
