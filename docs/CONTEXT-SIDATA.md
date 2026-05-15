# SILAKAP V1.0 — Context Prompt untuk AI Assistant

> Dokumen ini menjelaskan konteks lengkap proyek, keputusan arsitektur, dan status terkini
> untuk melanjutkan pengembangan modul SIDATA tanpa perlu mengulang pembahasan dari awal.

---

## 1. Stack Teknologi

| Layer     | Teknologi                                   |
|-----------|---------------------------------------------|
| Backend   | NestJS (TypeScript), Prisma ORM, MySQL      |
| Frontend  | React + TypeScript + Vite                   |
| Excel     | `xlsx` (SheetJS) untuk parsing file SIASN   |
| Auth      | JWT + Refresh Token                         |

Struktur monorepo:
```
d:\Silakap_V1.0\
├── api/              ← NestJS backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts                       ← seed user/role awal
│   │   └── seed-sidata-references.ts     ← seed referensi SIASN (BARU)
│   └── src/modules/sidata/
│       ├── sidata-import.controller.ts
│       ├── sidata-import.service.ts      ← parsing Excel ASN & referensi
│       ├── sidata-import.repository.ts   ← mapping, commit ke DB
│       └── sidata-import.types.ts
├── apps/web/src/
│   ├── lib/api/sidata-import.ts          ← API client frontend
│   └── pages/workspace/sidata-*.tsx      ← halaman UI SIDATA
└── data/                                  ← file Excel SIASN
    ├── HierarkiUnor (6).xlsx             (946 unit organisasi)
    ├── Referensi-Jabatan-Struktural (6).xlsx  (946 jabatan)
    ├── Referensi-Jabatan-Fungsional (2).xlsx  (1315 jabatan)
    ├── Referensi-Jabatan-Pelaksana (2).xlsx   (316 jabatan)
    ├── Database_Profil_JF_2024_BKN.xlsx  (1152 jabatan BKN, enrichment)
    ├── 4 . Data PNS 24 April 2026.xlsx   (4190 ASN)
    ├── 4 . Data PPPK 24 April 2026.xlsx  (1410 ASN)
    └── Data Paruh Waktu 23 Februari 2026.xlsx (2779 ASN)
```

---

## 2. Tujuan Modul SIDATA

SIDATA adalah modul untuk mensinkronisasi data ASN dari sistem SIASN BKN ke database lokal SILAKAP.

**Dua fase utama:**

```
FASE 1 — Setup awal (sekali saja)
  npx ts-node api/prisma/seed-sidata-references.ts
  → Seeds: unit_kerja, ref_jabatan (STRUKTURAL/FUNGSIONAL/PELAKSANA)
  → Hasil: ~964 unit, ~2806 jabatan, match rate 100% terhadap data ASN

FASE 2 — Sync ASN berkala (berulang)
  Upload file Excel ASN → SIDATA Pipeline → Map → Commit
  → Tidak perlu import referensi ulang
  → Mapping by SIASN UUID (hampir 100% langsung cocok)
```

---

## 3. Arsitektur SIDATA Pipeline

### Alur Import ASN

```
Upload Excel ASN
      ↓
parseSiasnAsnExcel()       ← service.ts: deteksi header fleksibel
      ↓
validateSiasnAsnRows()     ← validasi NIP wajib ada
      ↓
[staging: sidata_asn_import_staging]
      ↓
mapSiasnAsnBatch()         ← repository.ts: cari FK di tabel referensi
      ↓
commitSiasnAsnBatch()      ← repository.ts: upsert ke tabel asn
      ↓
[tabel asn terisi]
```

### Filosofi Data (PENTING)

> **Data ASN dari SIASN adalah sumber kebenaran (source of truth).**

- `jabatan_nama`, `golongan_nama` di tabel `asn` = **string langsung dari SIASN**, tidak perlu mapping
- `unit_kerja_id` = FK opsional, boleh null jika unit tidak ditemukan
- Tabel `ref_jabatan` adalah **enrichment/referensi**, bukan syarat commit
- **NEEDS_REVIEW dan UNMAPPED tidak memblokir commit** — semua baris dengan NIP valid di-commit

### Mapping Priority di `findJabatanIdInTx`

```
1. siasnKode = JABATAN ID (UUID dari SIASN) → match langsung ~100%
2. namaNormalized exact match
3. nama exact match
4. Fuzzy: strip punctuation ("Tingkat. I" → "Tingkat I")
5. GURU_LAMA_MAP: nama jabatan lama → nama baru
   ("GURU MADYA" → "GURU MAHIR", "GURU PEMBINA" → "GURU AHLI MUDA", dst.)
```

---

## 4. Tabel Database (Prisma Schema)

### Tabel inti untuk SIDATA

```prisma
model Asn {                           // tabel ASN utama
  nip          String  @unique
  nama         String
  unitKerjaId  String?               // FK ke unit_kerja (nullable)
  jabatanNama  String?               // string dari SIASN
  golonganNama String?               // string dari SIASN
  jenisAsn     String?
  statusAsn    String?
  tmtPensiun   DateTime?
}

model UnitKerja {                     // unit organisasi
  kode     String  @unique           // = SIASN ID (UUID hex)
  nama     String
  parentId String?                   // self-referential FK
  level    Int
}

model RefJenisJabatan {               // STRUKTURAL / FUNGSIONAL / PELAKSANA
  kode String @unique
}

model RefJabatan {                    // katalog jabatan
  jenisJabatanId String              // FK ke ref_jenis_jabatan
  siasnKode      String?             // = SIASN ID (UUID hex) — kunci utama matching
  nama           String
  namaNormalized String?
  jenjang        String?
  bup            Int?
}
```

### Tabel Staging (pipeline SIDATA)

```
sidata_asn_import_batch      ← metadata batch import
sidata_asn_import_staging    ← baris per-pegawai sebelum commit
sidata_reference_import_*    ← staging untuk import tabel referensi
sidata_reference_mappings    ← cache mapping yang sudah ditemukan
```

---

## 5. Perubahan Penting yang Sudah Dilakukan

### 5.1 `api/src/modules/sidata/sidata-import.repository.ts`

**a) Commit tidak memblokir NEEDS_REVIEW:**
```typescript
// SEBELUM (salah):
if (row.mappingStatus === NEEDS_REVIEW) { skippedRows++; continue; }

// SESUDAH (benar):
if (row.mappingStatus === NEEDS_REVIEW) { needsReviewRows++; }
// Lanjut commit — jabatanNama tetap terisi dari string SIASN
```

**b) GURU_LAMA_MAP untuk jabatan fungsional lama:**
```typescript
private readonly GURU_LAMA_MAP: Record<string, string> = {
  'GURU PRATAMA TINGKAT. I': 'GURU PEMULA',
  'GURU MADYA TINGKAT. I':   'GURU MAHIR',
  'GURU MADYA':              'GURU MAHIR',
  'GURU PEMBINA':            'GURU AHLI MUDA',
  'GURU DEWASA':             'GURU AHLI PERTAMA',
  'PENGAWAS MADYA':          'PENGAWAS SEKOLAH AHLI MUDA',
  // dst.
};
```

**c) Fuzzy punctuation matching:**
```typescript
private stripPunctuation(value: string): string {
  return value.toLowerCase().replace(/[.,'\-\/\\()]/g, ' ').replace(/\s+/g, ' ').trim();
}
```

**d) `normalizeJenisJabatanKode` menerima kode numerik SIASN:**
- "1" → STRUKTURAL, "2" → FUNGSIONAL, "4" → PELAKSANA

**e) `findUnitKerjaIdInTx` mencoba semua level eselon:**
- Coba kode SIASN dulu, lalu nama eselon 4→3→2→1 sebagai fallback

**f) `upsertUnitKerjaInTx` match hanya by `kode` (bukan nama):**
- Mencegah unit berbeda dengan nama sama saling di-merge

**g) Remap dapat dijalankan meskipun batch sudah COMMITTED:**
- Guard `if (status === COMMITTED) throw` dihapus dari remap dan commit

### 5.2 `api/src/modules/sidata/sidata-import.service.ts`

**Header candidates diperluas** untuk kolom SIASN BKN:
```typescript
// Contoh:
const hNamaGolongan = h(['nama_golongan', 'gol awal nama', 'golongan awal nama', ...]);
const hKdUnor       = h(['kd_unor', 'kode_unor', 'id_unor', 'unor id', ...]);
const hTmtPensiun   = h(['tmt_pensiun', 'bup', 'batas usia pensiun', ...]);
```

### 5.3 `api/prisma/seed-sidata-references.ts` (FILE BARU)

Script seed yang men-setup semua tabel referensi dari file Excel SIASN:
- Idempotent (aman dijalankan ulang)
- Gap fill otomatis: scan file ASN untuk jabatan/unit yang tidak ada di file referensi
- Hasil: match rate 100.0% JABATAN ID, 100.0% UNOR ID terhadap 8379 baris ASN

---

## 6. Kolom Penting File Excel SIASN

### File ASN (PNS/PPPK/Paruh Waktu)

| Kolom Excel        | Field `asn`       | Keterangan                           |
|--------------------|-------------------|--------------------------------------|
| `NIP BARU`         | `nip`             | Strip apostrophe awal `'`            |
| `NAMA`             | `nama`            |                                      |
| `JABATAN ID`       | —                 | UUID SIASN → match `ref_jabatan.siasnKode` |
| `JABATAN NAMA`     | `jabatanNama`     | String langsung disimpan             |
| `JENIS JABATAN ID` | —                 | 1=Struktural, 2=Fungsional, 4=Pelaksana |
| `UNOR ID`          | —                 | UUID SIASN → match `unit_kerja.kode` |
| `GOL AKHIR NAMA`   | `golonganNama`    | String langsung disimpan             |
| `TANGGAL LAHIR`    | `tanggalLahir`    | Excel serial number → Date           |
| `KEDUDUKAN HUKUM NAMA` | `statusAsn`  |                                      |
| `JENIS PEGAWAI NAMA`   | `jenisAsn`   |                                      |

### File HierarkiUnor

| Kolom     | Field `unit_kerja` |
|-----------|--------------------|
| `ID`      | `kode` (unique)    |
| `NAMA_UNOR` | `nama`           |
| `ID_ATASAN` | `parentId` (FK, two-pass) |

### File Jabatan (Struktural/Fungsional/Pelaksana)

| Kolom          | Field `ref_jabatan`     |
|----------------|------------------------|
| `ID`           | `siasnKode`, `kode`    |
| `Nama_jabatan` / `Nama` | `nama`, `namaNormalized` |
| `Eselon_id`    | `jenjang` (Struktural) |
| `JENJANG`      | `jenjang` (Fungsional, kode singkat: UT/MD/MU/PT/PY/MH/TR/PM) |
| `BUP`          | `bup` (Int, Fungsional) |

---

## 7. Status Saat Ini & Pekerjaan Berikutnya

### Sudah Selesai ✅
- [x] Seed referensi: 964 unit_kerja, 2806 ref_jabatan
- [x] Match rate 100% JABATAN ID, 100% UNOR ID (dari 8379 baris ASN)
- [x] Commit ASN tidak diblokir oleh NEEDS_REVIEW
- [x] GURU_LAMA_MAP fallback di findJabatanIdInTx
- [x] Fuzzy punctuation matching
- [x] Remap bisa dijalankan meski batch sudah COMMITTED

### Belum Dikerjakan ⏳
- [ ] **Import ASN via pipeline**: Belum dijalankan ulang setelah semua fix
  - Upload PNS → Remap → Commit → verifikasi NULL fields hilang
  - Upload PPPK dan Paruh Waktu
- [ ] **Parent ID unit_kerja**: Sudah terhubung di seed, tapi level belum dihitung
- [ ] **Ref tables lainnya**: `ref_golongan`, `ref_agama`, dll belum di-seed
  - Untuk saat ini tidak memblokir import (commit tidak butuh mapping ini)
- [ ] **PPPK jabatan format "TERAMPIL - PERAWAT"**: Format "JENJANG - NAMA"
  - Perlu normalizeJabatan di `findJabatanIdInTx` sebagai fallback ke-6
  - Pattern: "TERAMPIL - PERAWAT" → cari "PERAWAT TERAMPIL" di ref_jabatan

---

## 8. Cara Menjalankan

```bash
# Setup referensi (sekali saja):
cd api && npx ts-node prisma/seed-sidata-references.ts

# Jalankan server:
cd api && npm run start:dev

# Import ASN (via UI atau API):
POST /sidata/import/asn/upload   (upload file Excel)
POST /sidata/import/asn-batches/:id/map
POST /sidata/import/asn-batches/:id/commit
```

---

## 9. Pola Kode yang Perlu Diketahui

```typescript
// normalizeHeader: trim + lowercase + spaces→underscore
// normalizeText:   trim + lowercase + collapse spaces
// normId:          strip dashes + uppercase (untuk compare SIASN UUID)
// cleanStr:        strip apostrophe + trim (untuk field Excel)

// findHeader(headers, candidates):
//   iterasi candidates dulu (prioritas pertama = paling spesifik)
//   match setelah normalizeHeader kedua sisi

// SIDATA_IMPORT_STATUS tidak punya state MAPPED
//   → setelah remap: status diset ke VALIDATED
//   → setelah commit: status diset ke COMMITTED

// Untuk add fallback baru di findJabatanIdInTx:
//   tambahkan SETELAH fuzzy+GURU_LAMA_MAP, sebelum `return null`
```

---

*Dokumen ini dibuat otomatis dari sesi pengembangan SIDATA pada 2026-05-14.*
