# Sprint 27 - RHK Realization Approval & Monthly Performance Report

## 1. Tujuan
Sprint 27 menetapkan batas formal antara kandidat RHK dan realisasi kinerja resmi. Pengajuan OPD yang selesai hanya menjadi kandidat; realisasi bulanan/triwulan baru terbentuk setelah kandidat disetujui role internal berwenang.

## 2. Candidate -> Realization Lifecycle
- OPD submission selesai oleh PPIK.
- Sistem membuat `KinerjaRhkCandidate` sebagai kandidat.
- KABID/Admin/Super Admin memvalidasi kandidat.
- Approval kandidat membuat `KinerjaRhkRealization` resmi untuk periode yang dipilih.
- Kandidat rejected tidak membuat realisasi.
- CandidateId unik mencegah realisasi ganda.

## 3. Model Data
Model baru:
- `KinerjaRhkRealization`
- `KinerjaRhkRealizationAudit`

Field utama realisasi mencakup kode RHK, module, periode, skor, status, source OPD submission, SOP, evidence snapshot metadata, approver, dan audit trail.

## 4. Evidence Snapshot
Evidence lock disimpan sebagai JSON metadata, bukan menyalin atau menghapus file fisik. Snapshot memuat source id, SOP code, status evidence/checklist/SLA, skor, dan waktu pembuatan.

## 5. API Contract
Base path: `/api/v1/kinerja/rhk-realizations`

Endpoint:
- `GET /`
- `GET /summary`
- `GET /:id`
- `POST /from-candidate/:candidateId`
- `POST /:id/archive`
- `GET /report/monthly`
- `GET /report/quarterly`
- `GET /report/print-summary`

Approval kandidat juga menerima payload periode:
- `periodType`
- `periodYear`
- `periodMonth`
- `periodQuarter`
- `note`

## 6. Period Logic
Default approval memakai periode bulanan tahun/bulan berjalan. Untuk triwulan, `periodQuarter` digunakan. Untuk tahunan, hanya `periodYear` disimpan.

## 7. RBAC
- OPD tidak diberi akses endpoint/menu realisasi internal.
- PPPK dapat melihat jika policy internal mengizinkan, tetapi tidak approve/archive.
- ANALIS_PERTAMA dan PENELAAH view/list.
- ANALIS_MUDA dan ANALIS_MADYA view/report.
- KABID approve/archive/report.
- KEPALA_BADAN view/report.
- ADMIN_BKPSDM dan SUPER_ADMIN full.

## 8. Report Structure
Laporan bulanan memuat period label, jumlah RHK, total realisasi, kuantitas, skor rata-rata, achievements, issues, evidence summary, rekomendasi, dan narasi.

Laporan triwulan memuat breakdown bulanan, ringkasan strategis, trend notes, high-risk notes, dan rekomendasi pimpinan.

## 9. Known Limitations
- Evidence snapshot masih metadata JSON, bukan mekanisme file immutability fisik.
- Narasi laporan masih rule-based sederhana.
- Print menggunakan tampilan browser sederhana, belum template surat dinas final.

## 10. Regression Checklist
- Kandidat approved membuat realisasi.
- Kandidat rejected tidak membuat realisasi.
- Approval ganda tidak menggandakan realisasi.
- OPD tidak melihat menu/route realisasi internal.
- PPPK tidak bisa approve/archive.
- Summary realisasi menghitung data approved.
- Laporan bulanan aman saat data kosong.
- Laporan triwulan aman saat data kosong.
- Evidence snapshot tersimpan sebagai metadata.
- Audit kandidat dan realisasi tercatat.
