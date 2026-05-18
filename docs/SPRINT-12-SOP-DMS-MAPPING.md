# Sprint 12 — SOP PPIK DMS Taxonomy Integration

**Status:** Selesai  
**Tanggal:** 2026-05-18  
**Branch:** main  

---

## Tujuan Sprint 12

Mengintegrasikan seluruh dokumen SOP PPIK ke dalam DMS agar:

1. Setiap SOP dapat disimpan sebagai dokumen DMS dengan metadata terstruktur.
2. SOP dipetakan ke `subCategory`, `tags`, dan `accessLevel` yang konsisten.
3. Metadata SOP tampil di halaman detail dokumen DMS.
4. SOP dapat dipakai sebagai bukti dukung Kinerja Bidang.
5. Akses dokumen tidak bocor ke role yang tidak berhak.

---

## File yang Dibuat / Diubah

| File | Aksi | Keterangan |
|------|------|------------|
| `src/lib/dms/sop-taxonomy.ts` | Baru | Mapping lengkap semua SOP + helper functions |
| `src/lib/api/dms.ts` | Update | +9 `DmsSubCategory` baru, label, dan `getDefaultAccessLevelForSubCategory` |
| `src/components/workspace/dms/dms-metadata-form.tsx` | Update | Field `sopCode`, auto-tags, `SopCodeField` component |
| `src/components/workspace/dms/detail/dms-document-metadata-section.tsx` | Update | `SopMetadataPanel` di view mode |
| `src/pages/workspace/dms-document-detail-page.tsx` | Update | `toFormValue` mendeteksi `sopCode` dari tags |
| `src/components/workspace/sop/sop-reference-panel.tsx` | Baru | Komponen reusable referensi SOP dengan filter modul/kategori |

---

## Kategori SOP (SopDmsCategory)

| Kategori | Label | Modul Utama |
|----------|-------|-------------|
| `SOP_MANAJEMEN_PPIK` | Manajemen Bidang PPIK | KINERJA_BIDANG |
| `SOP_LAYANAN_KEPEGAWAIAN` | Layanan Kepegawaian | LAYANAN_KEPEGAWAIAN |
| `SOP_PENGADAAN_ASN` | Pengadaan ASN | KINERJA_BIDANG |
| `SOP_DATA_KEPEGAWAIAN` | Data Kepegawaian | SIDATA |
| `SOP_SIASN` | SIASN / MySAPK | SIDATA |
| `SOP_DMS` | Pengelolaan Dokumen Digital | DMS |
| `SOP_PENSIUN` | Pensiun ASN | SIPENSIUN |
| `SOP_PEMBERHENTIAN` | Pemberhentian ASN | SIPENSIUN |
| `SOP_MONITORING` | Monitoring Status | SIPENSIUN |

---

## Mapping SOP ke Modul

### KINERJA_BIDANG
| Kode SOP | Judul | Kategori |
|----------|-------|----------|
| SOP-BKPSDM-MAN-001 | Perencanaan Program dan Kegiatan Bidang PPIK | SOP_MANAJEMEN_PPIK |
| SOP-BKPSDM-MAN-002 | Pembagian Tugas Internal Bidang PPIK | SOP_MANAJEMEN_PPIK |
| SOP-BKPSDM-MAN-003 | Monitoring Pelaksanaan Kegiatan Bidang PPIK | SOP_MANAJEMEN_PPIK |
| SOP-BKPSDM-MAN-004 | Pelaporan Kinerja Bidang PPIK | SOP_MANAJEMEN_PPIK |
| SOP-BKPSDM-FNG-001 | Penyusunan Rencana Kebutuhan ASN | SOP_PENGADAAN_ASN |
| SOP-BKPSDM-FNG-002 | Verifikasi Usulan Formasi ASN | SOP_PENGADAAN_ASN |

### LAYANAN_KEPEGAWAIAN
| Kode SOP | Judul | Kategori |
|----------|-------|----------|
| SOP-BKPSDM-LAY-001 | Penerimaan Permohonan Layanan Kepegawaian | SOP_LAYANAN_KEPEGAWAIAN |
| SOP-BKPSDM-LAY-002 | Verifikasi Kelengkapan Berkas Layanan | SOP_LAYANAN_KEPEGAWAIAN |
| SOP-BKPSDM-LAY-003 | Monitoring SLA Layanan Kepegawaian | SOP_LAYANAN_KEPEGAWAIAN |
| SOP-BKPSDM-LAY-004 | Penanganan Keterlambatan Layanan | SOP_LAYANAN_KEPEGAWAIAN |
| SOP-BKPSDM-LAY-005 | Evaluasi Kepuasan Layanan Kepegawaian | SOP_LAYANAN_KEPEGAWAIAN |

### DMS
| Kode SOP | Judul | Kategori |
|----------|-------|----------|
| SOP-BKPSDM-MAN-005 | Pengelolaan Dokumen dan Arsip Bidang PPIK | SOP_MANAJEMEN_PPIK |
| SOP-BKPSDM-DMS-001 | Pengelolaan Dokumen Digital Kepegawaian | SOP_DMS |

### SIDATA
| Kode SOP | Judul | Kategori |
|----------|-------|----------|
| SOP-BKPSDM-DAT-002 | Pemutakhiran Data ASN Umum / Non-Pensiun | SOP_DATA_KEPEGAWAIAN |
| SOP-BKPSDM-SIK-002 | Sinkronisasi Data Kepegawaian dengan SIASN/MySAPK | SOP_SIASN |
| SOP-BKPSDM-DAT-003 | Pemutakhiran Data ASN Setelah Keputusan Pemberhentian/Pensiun | SOP_DATA_KEPEGAWAIAN |

### SIPENSIUN
| Kode SOP | Judul | Kategori |
|----------|-------|----------|
| SOP-BKPSDM-PAN-001 | Penerimaan Usulan Pensiun ASN | SOP_PENSIUN |
| SOP-BKPSDM-PAN-002 | Verifikasi Berkas Usulan Pensiun ASN | SOP_PENSIUN |
| SOP-BKPSDM-PAN-003 | Pengusulan Pensiun BUP | SOP_PENSIUN |
| SOP-BKPSDM-PAN-004 | Pengusulan Pensiun Janda/Duda/Yatim/Piatu/Ahli Waris | SOP_PENSIUN |
| SOP-BKPSDM-MON-001 | Monitoring Status Usulan Pensiun/Pemberhentian ASN | SOP_MONITORING |
| SOP-BKPSDM-PBH-001 | Pemberhentian PNS Atas Permintaan Sendiri | SOP_PEMBERHENTIAN |
| SOP-BKPSDM-PBH-002 | Pemberhentian PNS Karena Tidak Cakap Jasmani/Rohani | SOP_PEMBERHENTIAN |
| SOP-BKPSDM-PBH-003 | Pemberhentian PNS Karena Meninggal Dunia/Tewas/Hilang | SOP_PEMBERHENTIAN |
| SOP-BKPSDM-PBH-004 | Pemberhentian PNS Karena Pelanggaran Disiplin/Hukum | SOP_PEMBERHENTIAN |
| SOP-BKPSDM-PBH-005 | Pemberhentian Sementara PNS | SOP_PEMBERHENTIAN |
| SOP-BKPSDM-PBH-006 | Pengaktifan Kembali PNS | SOP_PEMBERHENTIAN |
| SOP-BKPSDM-PBH-007 | Pemberhentian Karena Perampingan Organisasi/Kebijakan Pemerintah | SOP_PEMBERHENTIAN |
| SOP-BKPSDM-PBH-008 | Penyerahan Keputusan Pensiun/Pemberhentian ASN | SOP_PEMBERHENTIAN |

---

## Mapping AccessLevel

### Semantic Level → DmsAccessLevel

| SopDmsAccessLevel | DmsAccessLevel | Deskripsi |
|-------------------|----------------|-----------|
| `PUBLIC_INTERNAL` | `INTERNAL` | SOP prosedur umum, seluruh staf internal |
| `BIDANG_PPIK` | `TERBATAS` | SOP kerja bidang, analis ke atas |
| `CONFIDENTIAL` | `SANGAT_TERBATAS` | Dokumen pensiun/pemberhentian sensitif |
| `LEADERSHIP_ONLY` | `PIMPINAN` | Laporan/persetujuan pimpinan (KABID+) |
| `ADMIN_ONLY` | `AUDIT` | Konfigurasi/master/admin saja |

### SubCategory → Default DmsAccessLevel

| SubCategory | Default AccessLevel |
|-------------|---------------------|
| `SOP_PEMBERHENTIAN` | `SANGAT_TERBATAS` |
| `SOP_PENSIUN` | `SANGAT_TERBATAS` |
| `SOP_MANAJEMEN_PPIK` | `TERBATAS` |
| `SOP_LAYANAN_KEPEGAWAIAN` | `TERBATAS` |
| `SOP_PENGADAAN_ASN` | `TERBATAS` |
| `SOP_DATA_KEPEGAWAIAN` | `TERBATAS` |
| `SOP_SIASN` | `TERBATAS` |
| `SOP_DMS` | `TERBATAS` |
| `SOP_MONITORING` | `TERBATAS` |

---

## Role Access Notes

| Role | Akses SOP |
|------|-----------|
| `SUPER_ADMIN` | Semua SOP semua level |
| `ADMIN_BKPSDM` | Semua SOP semua level |
| `KEPALA_BADAN` | Semua SOP kecuali `ADMIN_ONLY` |
| `KABID` | PUBLIC_INTERNAL + BIDANG_PPIK + CONFIDENTIAL + LEADERSHIP_ONLY |
| `ANALIS_MADYA` | PUBLIC_INTERNAL + BIDANG_PPIK + CONFIDENTIAL |
| `ANALIS_MUDA` | PUBLIC_INTERNAL + BIDANG_PPIK |
| `ANALIS_PERTAMA` | PUBLIC_INTERNAL + BIDANG_PPIK |
| `PENELAAH` | PUBLIC_INTERNAL + BIDANG_PPIK |
| `PPPK` | PUBLIC_INTERNAL saja |
| `OPD` | Tidak ada akses SOP internal |

**Catatan RBAC:** Role `SEKRETARIS` dan `AUDITOR` belum diaktifkan (Sprint 11–12). Ketika diaktifkan, tambahkan ke `allowedRoles` di `sop-taxonomy.ts` sesuai kebutuhan.

---

## Cara Pakai

### 1. Lookup SOP dari kode
```typescript
import { getSopDmsMappingByCode } from '@/lib/dms/sop-taxonomy';

const mapping = getSopDmsMappingByCode('SOP-BKPSDM-PAN-003');
// → { sopCode, title, accessLevel: 'CONFIDENTIAL', allowedRoles: [...], ... }
```

### 2. Cek apakah role bisa akses SOP
```typescript
import { canAccessSopDocument } from '@/lib/dms/sop-taxonomy';

canAccessSopDocument('PPPK', 'SOP-BKPSDM-PAN-003'); // → false
canAccessSopDocument('KABID', 'SOP-BKPSDM-PAN-003'); // → true
```

### 3. Ambil semua SOP untuk modul
```typescript
import { getSopDmsMappingsByModule } from '@/lib/dms/sop-taxonomy';

const sopPensiun = getSopDmsMappingsByModule('SIPENSIUN');
```

### 4. Gunakan panel referensi SOP
```tsx
import { SopReferencePanel } from '@/components/workspace/sop/sop-reference-panel';

// Tampilkan semua SOP yang bisa diakses user
<SopReferencePanel userRole={userRole} />

// Filter per modul
<SopReferencePanel userRole={userRole} moduleKey="SIPENSIUN" />

// Compact mode (tanpa deskripsi dan tags)
<SopReferencePanel userRole={userRole} compact />
```

---

## Manual Regression Checklist

### DMS Upload Page
- [ ] Pilih subCategory `SOP_MANAJEMEN_PPIK` → field "Kode SOP" muncul dengan dropdown pilihan SOP
- [ ] Pilih SOP-BKPSDM-MAN-001 → tags otomatis terisi, accessLevel menjadi `TERBATAS`
- [ ] Pilih SOP-BKPSDM-PAN-003 → accessLevel menjadi `SANGAT_TERBATAS`
- [ ] Pilih subCategory non-SOP → field "Kode SOP" tidak muncul
- [ ] Form existing (title, description, dll) tidak rusak

### DMS Document List
- [ ] Subkategori SOP_MANAJEMEN_PPIK tampil label "Manajemen Bidang PPIK"
- [ ] Subkategori SOP_PENSIUN tampil label "Pensiun ASN"
- [ ] Subkategori SOP_PEMBERHENTIAN tampil label "Pemberhentian ASN"
- [ ] Filter subCategory berfungsi untuk kategori baru

### DMS Document Detail
- [ ] Dokumen dengan subCategory SOP_* menampilkan panel "Metadata SOP"
- [ ] Panel metadata SOP menampilkan: Kode SOP, Modul Terkait, Subkategori, Access Level, RHK Terkait (jika ada), Deskripsi
- [ ] Dokumen dengan subCategory non-SOP tidak menampilkan panel metadata SOP
- [ ] Badge accessLevel SOP tampil dengan warna yang benar

### RBAC SOP Access
- [ ] Role OPD: `canAccessSopDocument('OPD', 'SOP-BKPSDM-MAN-001')` → false
- [ ] Role PPPK: akses hanya PUBLIC_INTERNAL (LAY-001, LAY-002, PAN-001)
- [ ] Role ANALIS_MUDA: tidak bisa akses CONFIDENTIAL (PAN-003, PAN-004, PBH-*)
- [ ] Role KABID: bisa akses semua kecuali ADMIN_ONLY
- [ ] Role KEPALA_BADAN: bisa akses semua kecuali ADMIN_ONLY

### SopReferencePanel
- [ ] `<SopReferencePanel />` tanpa props menampilkan semua 26 SOP
- [ ] Filter modul SIPENSIUN menampilkan 14 SOP (PAN + PBH + MON + DAT-003)
- [ ] `userRole="OPD"` menampilkan 0 SOP (semua difilter)
- [ ] `userRole="PPPK"` menampilkan SOP PUBLIC_INTERNAL saja
- [ ] Legend access level tampil di bawah panel

### Build & Lint
- [ ] `npm run lint` exit 0 (atau hanya warning lama yang tidak blocking)
- [ ] `npm run build` hijau tanpa type error baru
- [ ] Tidak ada `any` baru yang ditambahkan

---

## Catatan Teknis

- `sopCode` disimpan sebagai field pertama di `tags[]` dokumen DMS (karena schema DMS tidak punya kolom `sopCode` terpisah).
- Saat membuka detail dokumen, `sopCode` diekstrak dari tags dengan prefix `SOP-BKPSDM-`.
- `SopDmsAccessLevel` (semantic) ≠ `DmsAccessLevel` (storage). Konversi via `sopAccessLevelToDms()`.
- Route baru tidak ditambahkan di Sprint 12. `SopReferencePanel` adalah komponen reusable yang bisa di-embed di halaman existing.
- Kolom `sopCode` tidak dikirim ke API; nilai disimpan dalam `tags[]`.
