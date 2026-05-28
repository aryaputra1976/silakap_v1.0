# SIFORMEN — Master Prompt for Claude (VS Code)
> Gunakan prompt ini sebagai konteks tetap di setiap sesi. Copy bagian yang relevan sesuai task.

---

## [CORE CONTEXT] — Selalu sertakan ini

```
Kamu membantu membangun modul SIFORMEN (Sistem Informasi Formasi) dalam aplikasi SILAKAP v1.0 untuk BKPSDM Kabupaten Tolitoli, Sulawesi Tengah.

SIFORMEN adalah modul perencanaan kebutuhan pegawai ASN yang menghitung proyeksi formasi 5 tahun (2024–2028) berdasarkan:
- Bezetting (jumlah pegawai aktif: PNS + PPPK)
- ABK (Analisis Beban Kerja = kebutuhan ideal)
- BUP (Batas Usia Pensiun per tahun per jabatan)
- Formula: Kebutuhan rekrut/tahun = ABK − Bezetting + BUP_tahun_N

STACK:
  BE : NestJS 10 + Prisma 6 + TypeScript 5 + PostgreSQL
       (package: silakap-hostinger-api, entry: src/main.ts)
  FE : React 19 + Vite 7 + TypeScript 5 + TailwindCSS 4
       (package: @silakap/web, router: react-router v7)
  ORM: Prisma — schema di prisma/schema.prisma, migration via prisma migrate
  API: REST, dokumentasi Swagger di /api/docs
  State/Fetch FE: TanStack Query v5 (@tanstack/react-query)
  Table FE: @tanstack/react-table v8
  Form FE: react-hook-form v7 + zod v4
  Chart FE: recharts 2.15 + react-apexcharts
  Export: xlsx (BE + FE)
  Auth: NestJS/JWT + Passport

KONVENSI KODE:
  BE  → NestJS module pattern: *.module.ts / *.service.ts / *.controller.ts / *.dto.ts
  FE  → komponen di src/components, halaman di src/pages atau src/app
  API → prefix /api/v1/... (lihat swagger /api/docs)
  Prisma → gunakan prisma.$transaction untuk operasi multi-tabel
```

---

## [DATA MODEL] — Sertakan saat task terkait database/query

```
HIERARKI DATA (3 level tampilan tabel):
  Level 1 → unit_kerja (OPD): id, nama, kode, tipe, flag_delayering (bool)
  Level 2 → jenis_jabatan: struktural_jpt | struktural_lama | fungsional | pelaksana
  Level 3 → jabatan: id, nama, unit_kerja_id, jenis_jabatan, level_kesetaraan (1–4),
            bezetting, abk, status_posisi (aktif|kandidat_hapus|dihapus),
            flag_delayering (bool)

BUP TABLE: jabatan_id, tahun (2024–2028), jumlah_pensiun

PROYEKSI dihitung per jabatan per tahun:
  kebutuhan[N] = abk - bezetting + bup[N]
  (jika bezetting > abk → gap negatif, tidak ada kebutuhan rekrut)

LEVEL JABATAN (PermenPAN-RB No.1/2023 + PP 18/2016):
  L1 = JPT Pratama (Es. II.b) → Kepala OPD
  L2 = Administrator (Es. III) + JF Ahli Madya (setara Es.III, garis langsung ke Kepala OPD)
  L3 = Pengawas (Es. IV) + JF Ahli Muda (setara Es.IV, Ketua Tim Kerja, pengganti Kasi)
  L4 = JF Ahli Pertama + JF Keterampilan (Mahir/Terampil/Pemula) + Pelaksana/JFU

DELAYERING (Penyederhanaan Birokrasi):
  Model A (flag_delayering=false): Kasi/Kasubid masih ada → jenis = struktural_lama
    → saat pensiun: status → kandidat_hapus, TIDAK otomatis diusulkan pengisian
  Model B (flag_delayering=true): Kasi diganti JF Ahli Muda sebagai Ketua Tim Kerja
    → tidak ada baris Kasi di tabel jabatan
```

---

## [UI RULES] — Sertakan saat task terkait tampilan tabel

```
STRUKTUR TABEL PROYEKSI (urutan tampil):
  [HEADER OPD] nama unit + sub-total kolom, collapsible
    [SUB-GRUP A] Struktural / JPT
      baris jabatan → kolom: bezetting | abk | gap | bup2024..2028 | perlu2024..2028
    [SUB-GRUP B] Jabatan Fungsional
      baris jabatan
    [SUB-GRUP C] Jabatan Pelaksana / JFU
      baris jabatan

ATURAN TAMPIL:
  - gap negatif = merah, positif = hijau, nol = abu
  - kolom BUP: warna amber/kuning
  - kolom PERLU (kebutuhan rekrut): warna hijau
  - jabatan status=kandidat_hapus: italic + strikethrough ringan + tooltip
  - jabatan status=dihapus: tidak ditampilkan (atau toggle show/hide)
  - sub-total per OPD wajib ada di baris footer group
```

---

## [MODULE MAP] — Sertakan saat task lintas modul

```
MENU SIFORMEN (urutan sidebar):
  1. Proyeksi Formasi   → tabel 5 tahun, halaman utama
  2. Rekap Pegawai      → bezetting PNS+PPPK per jabatan per OPD
  3. Profil Daerah      → data wilayah, OPD, fasilitas (Kab. Tolitoli)
  4. Jabatan & Peta     → master jabatan + peta jabatan per OPD (4 level)
  5. Ref. Jabatan Fungsional → referensi JFT: terampil vs ahli, bezetting vs kebutuhan
  6. ABK                → kebutuhan per jabatan berdasarkan analisis beban kerja
  7. BUP / Pensiun      → jadwal pensiun per pegawai per tahun
  8. Bezetting Jabatan  → posisi terisi/kosong per jabatan (lebih detail dari Rekap)
  9. Usulan Formasi     → output final: Proyeksi yang sudah diverifikasi pimpinan,
                          dikunci, dicetak PDF/Excel untuk BKN/Kemenpan-RB

HUBUNGAN PROYEKSI vs USULAN FORMASI:
  Proyeksi = proses (dinamis, bisa hitung ulang, internal BKD)
  Usulan   = produk (statis, sudah disetujui, dokumen resmi keluar)
  Alur: Proyeksi → verifikasi pimpinan → kunci → generate Usulan Formasi
```

---

## [PROMPT SNIPPETS] — Copy-paste sesuai task

### Untuk task PRISMA SCHEMA
```
[CONTEXT: SIFORMEN Core + Data Model]
Stack: NestJS + Prisma 6 + PostgreSQL
Task: Tambahkan model [nama] ke prisma/schema.prisma.
Ikuti data model di CLAUDE.md. Gunakan @@index untuk field yang sering di-query.
Jangan ubah model lain tanpa konfirmasi. Setelah schema, buat migration-nya.
```

### Untuk task BACKEND (NestJS Service + Controller)
```
[CONTEXT: SIFORMEN Core + Data Model]
Stack: NestJS 10 + Prisma 6 + TypeScript
Task: Buat [nama].service.ts + [nama].controller.ts untuk [deskripsi singkat].
Ikuti NestJS module pattern. Gunakan Prisma untuk query.
Output groupBy: unit_kerja → jenis_jabatan → jabatan.
Kalkulasi: gap = abk - bezetting, kebutuhan[N] = Math.max(0, gap) + bup[N].
Tambahkan Swagger decorator (@ApiTags, @ApiOperation, @ApiResponse).
```

### Untuk task FRONTEND (React komponen)
```
[CONTEXT: SIFORMEN Core + UI Rules]
Stack: React 19 + TailwindCSS 4 + @tanstack/react-table v8 + TanStack Query v5
Task: Buat komponen tabel proyeksi.
Struktur: collapsible per OPD → sub-grup A/B/C → baris jabatan.
Kolom: bezetting | abk | gap | bup2024–2028 | perlu2024–2028.
Fetch: gunakan useQuery dari @tanstack/react-query.
Ikuti UI Rules di CLAUDE.md (warna gap/BUP/perlu, sub-total, kandidat_hapus).
```

### Untuk task FORM INPUT
```
[CONTEXT: SIFORMEN Core + Data Model]
Stack: React 19 + react-hook-form v7 + zod v4
Task: Buat form input/edit [nama entitas].
Validasi dengan zod schema. Field jabatan wajib: jenis_jabatan, level_kesetaraan,
flag_delayering, status_posisi. Submit via useMutation TanStack Query ke API.
```

### Untuk task EKSPOR EXCEL
```
[CONTEXT: SIFORMEN Core + Module Map]
Stack: NestJS + xlsx (BE) / xlsx (FE)
Task: Buat endpoint ekspor Excel untuk Usulan Formasi.
Format: per OPD → per jenis jabatan → baris jabatan, kolom proyeksi 5 tahun.
Data hanya dari proyeksi berstatus 'dikunci'. Header: nama kabupaten, tahun anggaran.
Gunakan library xlsx yang sudah ada di dependencies.
```

---

## [JANGAN LAKUKAN INI]

```
× Jangan tampilkan jabatan sebagai flat list tanpa grouping unit kerja
× Jangan otomatis isi/usulkan jabatan struktural_lama saat pensiun
× Jangan hapus kolom BUP dari kalkulasi proyeksi
× Jangan samakan Proyeksi Formasi dengan Usulan Formasi (beda fungsi)
× Jangan abaikan flag_delayering — Model A dan Model B punya logika berbeda
× Jangan hardcode nama OPD atau jabatan — semua dari database
× Jangan gunakan raw SQL jika bisa pakai Prisma query
× Jangan buat komponen fetch data sendiri — gunakan TanStack Query (useQuery/useMutation)
× Jangan gunakan useState untuk server data — semua server state via TanStack Query
× Jangan tambahkan package baru tanpa konfirmasi — cek dulu di package.json
× Jangan buat file migrasi manual — selalu lewat prisma migrate dev
```

---

## [QUICK REFERENCE]

| Istilah | Arti |
|---|---|
| Bezetting | Jumlah pegawai aktif saat ini |
| ABK | Analisis Beban Kerja = jumlah ideal yang dibutuhkan |
| BUP | Batas Usia Pensiun — berapa yang pensiun tahun N |
| GAP | ABK − Bezetting (negatif = lebih, positif = kurang) |
| Perlu/Kebutuhan | Jumlah yang harus direkrut tahun N |
| struktural_lama | Kasi/Kasubid yang belum dihapus (Model A) |
| kandidat_hapus | Posisi yang tidak diisi ulang saat kosong |
| flag_delayering | OPD sudah/belum lakukan penyederhanaan birokrasi |
| JF Ahli Muda | Pengganti Kasi di Model B = Ketua Tim Kerja |
| Usulan Formasi | Proyeksi yang sudah dikunci = dokumen resmi ke BKN |
