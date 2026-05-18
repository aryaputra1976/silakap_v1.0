# Sprint 25 - Service SLA & Status Timeline

## 1. Tujuan

Sprint 25 menambahkan pengendalian waktu layanan end-to-end untuk pengajuan OPD. SLA mulai saat OPD submit, dijeda saat PPIK meminta perbaikan, dilanjutkan saat OPD mengirim perbaikan, dan berhenti saat pengajuan final.

## 2. Field SLA

Field SLA pada `OpdSubmission`:

- `slaStartedAt`
- `slaPausedAt`
- `slaResumedAt`
- `slaStoppedAt`
- `slaDueAt`
- `slaTargetHours`
- `slaElapsedHours`
- `slaPausedHours`
- `slaStatus`
- `lastStatusChangedAt`
- `lastStatusChangedById`

## 3. SLA Status

Status SLA:

- `NOT_STARTED`
- `ON_TRACK`
- `DUE_SOON`
- `OVERDUE`
- `PAUSED_FOR_CORRECTION`
- `COMPLETED`
- `CANCELLED`

`REJECTED` adalah status final pengajuan dan menghentikan SLA, tetapi status SLA disimpan sebagai `COMPLETED` karena daftar status SLA tidak memiliki nilai khusus `REJECTED`.

## 4. SLA Policy Default

Policy awal berada di `api/src/modules/opd-submission/opd-sla.policy.ts`.

- `LAYANAN_KEPEGAWAIAN`: 72 jam
- `SIPENSIUN`: 120 jam
- `SIDATA`: 72 jam
- `DMS`: 48 jam

Perhitungan Sprint 25 memakai jam kalender.

## 5. Pause/Resume Correction

Saat PPIK menjalankan request correction:

- status menjadi `NEEDS_CORRECTION`
- `slaPausedAt` diisi
- `slaElapsedHours` dihitung sampai titik pause
- `slaStatus` menjadi `PAUSED_FOR_CORRECTION`

Saat OPD mengirim correction:

- status menjadi `CORRECTION_SUBMITTED`
- durasi pause ditambahkan ke `slaPausedHours`
- `slaDueAt` digeser sesuai durasi pause
- `slaPausedAt` dikosongkan
- SLA dihitung ulang

Waktu perbaikan OPD tidak dihitung sebagai keterlambatan internal PPIK.

## 6. Timeline Formal vs Audit Log

`OpdSubmissionAuditLog` tetap menjadi jejak teknis/internal.

`OpdSubmissionTimeline` menjadi riwayat formal status layanan, dengan field:

- `fromStatus`
- `toStatus`
- `action`
- `actorId`
- `actorRole`
- `note`
- `publicNote`
- `isVisibleToOpd`

OPD hanya menerima timeline miliknya dan hanya item yang `isVisibleToOpd = true`.

## 7. Endpoint SLA

Endpoint timeline:

- `GET /api/v1/opd/submissions/:id/timeline`
- `GET /api/v1/internal/opd-submissions/:id/timeline`

Endpoint SLA internal:

- `GET /api/v1/internal/opd-submissions/sla/summary`
- `GET /api/v1/internal/opd-submissions/sla/overdue`
- `GET /api/v1/internal/opd-submissions/sla/due-soon`

Filter awal:

- `moduleKey`
- `serviceType`
- `status`
- `slaStatus`
- `from`
- `to`

## 8. Frontend Components

Komponen baru:

- `opd-submission-timeline.tsx`
- `service-sla-card.tsx`
- `service-sla-summary-panel.tsx`
- `service-status-timeline.tsx`

Integrasi:

- OPD detail menampilkan SLA card dan timeline publik.
- Workbench menampilkan summary SLA dan badge SLA di tabel.
- Detail workbench menampilkan SLA card dan timeline internal penuh.
- Dashboard OPD menampilkan ringkasan aktif, perbaikan, selesai, dan mendekati tenggat.

## 9. RBAC

- OPD hanya melihat timeline publik pengajuan miliknya.
- Internal PPIK melihat timeline penuh.
- Endpoint SLA summary hanya untuk internal.
- Tidak ada akses internal yang dibuka ke OPD.

## 10. Limitation

Kalender hari kerja dan libur nasional belum diterapkan. Perhitungan target Sprint 25 memakai jam kalender, sehingga angka SLA belum mengakomodasi hari libur resmi atau jam operasional layanan.

## 11. Regression Checklist

- OPD submit memulai SLA.
- Request correction menjeda SLA.
- Correction submit melanjutkan SLA dan menggeser due date.
- Complete/reject/cancel menghentikan SLA.
- OPD melihat timeline publik.
- Internal melihat timeline penuh.
- Workbench menampilkan SLA summary aman saat data kosong.
- Pengajuan OPD tidak otomatis menjadi realisasi kinerja bidang.
