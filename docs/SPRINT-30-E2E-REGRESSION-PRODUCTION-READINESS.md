# Sprint 30 - E2E Regression & Production Readiness

## 1. Ringkasan Arsitektur Akhir Sprint 11-30
SILAKAP V1.0 kini memiliki alur internal PPIK yang menyambungkan portal OPD, workbench verifikasi, SOP checklist, SLA berbasis kalender kerja, kandidat RHK, realisasi resmi, laporan eksekutif, dan evidence bundle. OPD hanya menjadi sumber pengajuan dan dokumen awal. Data kinerja resmi tetap dibentuk oleh role internal melalui validasi kandidat.

## 2. End-to-End Flow
1. OPD submit pengajuan layanan melalui `/opd/*`.
2. OPD upload dokumen fisik melalui multipart upload yang terhubung ke metadata DMS bila tersedia.
3. PPIK melihat antrian melalui `/layanan/workbench`.
4. PPIK receive dan start verification.
5. PPIK memeriksa data OPD, dokumen OPD, dan mengisi catatan verifikasi.
6. PPIK menjalankan checklist SOP dengan entity `opd_submission`.
7. SLA berjalan sejak submit, pause saat NEEDS_CORRECTION, resume saat correction submitted, dan stop saat final.
8. Completion gate memastikan layanan tidak selesai tanpa prasyarat penting.
9. Submission COMPLETED menghasilkan kandidat RHK, bukan realisasi.
10. KABID/Admin menyetujui kandidat menjadi `KinerjaRhkRealization`.
11. Executive report dan evidence bundle hanya membaca realisasi APPROVED.

## 3. Role Access Matrix Final
| Role | Akses utama | Batasan |
| --- | --- | --- |
| OPD | Portal OPD, pengajuan, upload dokumen milik sendiri, timeline publik | Tidak akses workbench, RHK, report, working calendar internal |
| PPPK | Input terbatas dan view operasional sesuai policy | Tidak approve kandidat, archive, export report |
| ANALIS_PERTAMA/PENELAAH | Receive/start/request correction dan view kandidat/realisasi terbatas | Tidak approve RHK/realisasi |
| ANALIS_MUDA/MADYA | Verifikasi, request correction, report operasional | Tidak final archive/approval kecuali policy eksplisit |
| KABID | Verify, reject, complete, approve candidate, report/export | Tidak membuka portal OPD |
| KEPALA_BADAN | Monitoring dan laporan | Tidak input ulang data OPD |
| ADMIN/SUPER_ADMIN | Full internal | Tetap tidak membuat OPD submission otomatis jadi realisasi |

## 4. Endpoint Inventory
| Area | Endpoint |
| --- | --- |
| OPD submissions | `/api/v1/opd/submissions` |
| Internal OPD submissions | `/api/v1/internal/opd-submissions` |
| SOP checklist | `/api/v1/sop-checklists` |
| RHK candidate | `/api/v1/internal/rhk-candidates` |
| RHK realization | `/api/v1/kinerja/rhk-realizations` |
| Executive report | `/api/v1/kinerja/executive-report` |
| Working calendar | `/api/v1/working-calendar` |

## 5. Data Lifecycle Table
| Tahap | Data | Pemilik aksi |
| --- | --- | --- |
| Draft pengajuan | `OpdSubmission` DRAFT | OPD |
| Submit | `OpdSubmission` SUBMITTED + SLA start | OPD |
| Verifikasi | Timeline, audit, checklist, dokumen | PPIK |
| Perbaikan | NEEDS_CORRECTION dan dokumen revisi | PPIK/OPD |
| Completion | COMPLETED + completion gate | PPIK |
| Kandidat | `KinerjaRhkCandidate` CANDIDATE | Sistem setelah completion |
| Realisasi | `KinerjaRhkRealization` APPROVED | KABID/Admin |
| Laporan | Summary/report/evidence bundle | Internal authorized |

## 6. Status Lifecycle Table
| Entity | Status |
| --- | --- |
| OpdSubmission | DRAFT, SUBMITTED, RECEIVED, IN_VERIFICATION, NEEDS_CORRECTION, CORRECTION_SUBMITTED, VERIFIED, REJECTED, COMPLETED, CANCELLED |
| OpdSubmissionDocument | UPLOADED/TERUNGGAH, NEEDS_CORRECTION, VERIFIED, REJECTED |
| SLA | NOT_STARTED, ON_TRACK, DUE_SOON, OVERDUE, PAUSED_FOR_CORRECTION, COMPLETED, CANCELLED |
| Candidate | CANDIDATE, APPROVED, REJECTED, ARCHIVED |
| Realization | DRAFT, APPROVED, REJECTED, ARCHIVED |

## 7. Audit Coverage Matrix
| Aksi | Audit |
| --- | --- |
| OPD submit/cancel/correction | OpdSubmissionAuditLog + timeline |
| Upload dokumen OPD | OpdSubmissionAuditLog + global audit bila tersedia |
| Verify/reject/request correction dokumen | OpdSubmissionAuditLog |
| Receive/start verification/request correction | OpdSubmissionAuditLog + timeline |
| Complete/reject submission | OpdSubmissionAuditLog + timeline |
| Candidate generated/approved/rejected | KinerjaRhkCandidateAudit |
| Realization created/archived | KinerjaRhkRealizationAudit + global audit |
| Executive report generate/export log | global AuditLog |
| Working calendar create/update/holiday changes | global AuditLog |

## 8. Manual Regression Scenarios
| Scenario | Langkah | Expected |
| --- | --- | --- |
| A - OPD submit layanan umum | Login OPD, buat draft, submit | Status SUBMITTED, SLA start, timeline publik muncul |
| B - OPD upload dokumen invalid | Upload file tipe/size invalid | Request ditolak, tidak ada klaim upload sukses |
| C - PPIK minta perbaikan | Internal request correction dengan catatan | Status NEEDS_CORRECTION, SLA pause, OPD melihat catatan |
| D - OPD submit correction | OPD upload revisi dan correction-submit | Status CORRECTION_SUBMITTED, SLA resume |
| E - PPIK verify + complete | Verify dokumen/checklist lalu complete | Status COMPLETED, timeline COMPLETED |
| F - Completion gate blocked | Complete tanpa prasyarat | Action ditolak dengan alasan jelas |
| G - KABID override | Role KABID menjalankan aksi final sesuai policy | Audit mencatat actor |
| H - Candidate approved -> realization | KABID approve kandidat dengan periode | Realisasi APPROVED tercipta sekali |
| I - Executive report | Generate monthly/quarterly/evidence bundle | Hanya realisasi APPROVED yang dihitung |
| J - Working calendar holiday impact | Tambah holiday, cek SLA/due calculation | Hari libur memengaruhi kalkulasi sesuai konfigurasi |

## 9. Build/Validation Commands
Backend:
```bash
cd api
npx prisma validate
npx prisma generate
npx prisma migrate status
npm run build
npm run smoke:e2e-regression
```

Frontend:
```bash
cd apps/web
npm run lint
npm run build
```

Catatan: `api/package.json` belum memiliki script `lint`.

Hasil cek lokal Sprint 30:
- `npx prisma validate`: valid.
- `npx prisma generate`: berhasil.
- `npx prisma migrate status`: database lokal `silakap_v1_0_dev_clean` masih memiliki 4 migration belum diterapkan: Sprint 24 file metadata, Sprint 25 SLA timeline, Sprint 27 realization report, Sprint 29 working calendar.
- `npm run smoke:e2e-regression`: 0 FAIL, 2 WARN. Warning berasal dari default working calendar belum ada dan 4 migration kritikal belum tercatat di `_prisma_migrations` pada DB lokal tersebut.

## 10. Known Limitations
- API lint script belum ada.
- PDF export belum native PDF; print masih HTML/browser print.
- DMS archive untuk executive report masih metadata-only dan belum membuat file arsip final.
- Kalender libur nasional perlu seed resmi dari sumber pemerintah.
- Preview/download OPD masih dibatasi oleh endpoint aman yang tersedia.
- Smoke script membaca integritas DB, bukan menjalankan browser automation.

## 11. Production Readiness Checklist
- Prisma validate/generate/migrate status hijau.
- Backend build hijau.
- Frontend lint exit 0.
- Frontend build hijau.
- OPD tidak melihat menu internal.
- OPD forbidden untuk `/layanan/*`, `/kinerja-bidang/*`, dan `/working-calendar`.
- Internal default tetap `/dashboard` atau area internal, bukan portal OPD.
- Candidate APPROVED memiliki realization.
- Realization tidak berasal dari candidate non-APPROVED.
- Executive report hanya membaca realization APPROVED.
- Working calendar default tersedia atau fallback terdokumentasi.
- Audit utama tercatat.

## 12. Recommended Sprint 31
- Tambahkan automated API scenario test berbasis seeded user OPD/internal.
- Tambahkan Playwright smoke untuk route guard dan empty state.
- Tambahkan template PDF resmi untuk laporan eksekutif.
- Seed kalender libur nasional resmi per tahun.
- Tambahkan API lint script backend dan CI gate.
