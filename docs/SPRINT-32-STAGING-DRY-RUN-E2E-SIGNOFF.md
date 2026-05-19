# Sprint 32 - Staging Dry Run & Manual E2E Sign-off

## 1. Tujuan Sprint 32
Sprint 32 menyiapkan checklist manual E2E untuk staging sign-off. Fokusnya memastikan alur OPD -> PPIK -> SOP -> SLA -> RHK -> laporan dapat diuji manusia secara lengkap sebelum klaim production ready.

## 2. Pre-check Staging
| Item | Command/Check | Result | Notes |
| --- | --- | --- | --- |
| DB backup | Backup database staging sebelum dry run |  |  |
| Migrate status | `cd api && npm run prisma:migrate:status` |  | Harus up to date |
| Migrate deploy | `cd api && npm run prisma:migrate:deploy` |  | Jalankan hanya setelah backup |
| Prisma generate | `cd api && npm run prisma:generate` |  |  |
| Seed default calendar | `cd api && npm run db:seed` atau seed terkontrol |  | Pastikan WorkingCalendar default aktif |
| Smoke regression | `cd api && npm run smoke:e2e-regression` |  | Harus 0 FAIL, 0 WARN untuk sign-off |
| Backend build | `cd api && npm run build` |  |  |
| Frontend build | `cd apps/web && npm run lint && npm run build` |  | Lint exit 0 |

## 3. Akun Uji
Gunakan akun staging yang dibuat oleh admin atau seed terkontrol. Jangan membuat user production dummy tanpa persetujuan.

| Persona | Role | Username | Tester | Notes |
| --- | --- | --- | --- | --- |
| OPD | OPD |  |  | Portal OPD dan data milik sendiri |
| Staff awal | ANALIS_PERTAMA atau PENELAAH |  |  | Receive/start/request correction |
| Analis verifikator | ANALIS_MUDA atau ANALIS_MADYA |  |  | Verify/reject/request correction |
| Kabid | KABID |  |  | Complete dan approve candidate |
| Admin | ADMIN_BKPSDM atau SUPER_ADMIN |  |  | Full internal dan fallback admin |
| Kepala Badan | KEPALA_BADAN |  |  | View report/monitoring |

## 4. Skenario E2E Utama
| No | Scenario | Langkah | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | OPD membuat draft layanan | Login OPD, buka `/opd/layanan/ajukan`, isi form, simpan draft | Draft tersimpan, tidak mengklaim realisasi |  |  |
| 2 | OPD submit layanan | Submit draft | Status SUBMITTED, SLA started, timeline publik muncul |  |  |
| 3 | OPD upload dokumen | Upload file valid dari `/opd/dokumen/upload` atau detail | Dokumen UPLOADED/TERUNGGAH, metadata aman tampil |  |  |
| 4 | Staff PPIK menerima antrian | Login staff, buka `/layanan/workbench`, receive | Status RECEIVED, audit/timeline bertambah |  |  |
| 5 | Staff meminta perbaikan dokumen | Request correction dengan catatan | Status NEEDS_CORRECTION, SLA pause, OPD melihat catatan |  |  |
| 6 | OPD submit correction | OPD upload revisi dan kirim perbaikan | Status CORRECTION_SUBMITTED, SLA resume |  |  |
| 7 | Analis verify dokumen | Login analis, verify dokumen | Dokumen VERIFIED, audit tercatat |  |  |
| 8 | Checklist SOP diisi | Isi `SopChecklistPanel` pada detail layanan | Checklist persisted untuk entity `opd_submission` |  |  |
| 9 | SLA/timeline dicek | Cek detail OPD dan internal | `dueAt`, paused/resumed, dan timeline konsisten |  |  |
| 10 | Completion gate diuji gagal | Coba complete sebelum syarat terpenuhi | Ditolak dengan pesan jelas |  |  |
| 11 | Kabid complete jika syarat terpenuhi | Lengkapi syarat lalu complete | Status COMPLETED, timeline COMPLETED |  |  |
| 12 | Candidate RHK terbentuk | Buka kandidat RHK | Candidate CANDIDATE muncul, belum realization |  |  |
| 13 | Candidate approved menjadi realization | Kabid/Admin approve kandidat dengan periode | Realization APPROVED tercipta sekali |  |  |
| 14 | Laporan executive tampil | Buka `/kinerja-bidang/report` | Summary/report hanya dari realization APPROVED |  |  |
| 15 | Evidence bundle tampil | Generate evidence bundle | Snapshot metadata tampil, tidak klaim PDF/DMS archive final |  |  |

## 5. RBAC Manual Test
| Test | Expected | Result | Notes |
| --- | --- | --- | --- |
| OPD buka `/layanan/workbench` | Forbidden/redirect aman |  |  |
| OPD buka `/kinerja-bidang/*` | Forbidden/redirect aman |  |  |
| OPD buka `/working-calendar` | Forbidden/redirect aman |  |  |
| PPPK approve candidate | Ditolak/tombol tidak tersedia |  |  |
| PPPK report/export | Ditolak/tombol tidak tersedia |  |  |
| Kabid approve candidate | Berhasil jika candidate valid |  |  |
| Kepala Badan view report | Berhasil view report, tidak input ulang |  |  |

## 6. SLA Manual Test
| Test | Expected | Result | Notes |
| --- | --- | --- | --- |
| Submit menghasilkan `dueAt` | `slaStartedAt` dan `slaDueAt` terisi |  |  |
| Request correction pause | `slaStatus=PAUSED_FOR_CORRECTION`, `slaPausedAt` terisi |  |  |
| Correction submit resume | `slaPausedHours` bertambah dan due date bergeser |  |  |
| Working calendar default dipakai | Perhitungan mengikuti jam/hari kerja default |  |  |

## 7. Evidence/DMS Test
| Test | Expected | Result | Notes |
| --- | --- | --- | --- |
| Upload file valid | Dokumen tersimpan sebagai metadata/file aman |  |  |
| File invalid ditolak | MIME/extension/size ditolak |  |  |
| Dokumen PPIK terlihat di workbench | Panel dokumen internal tampil sesuai policy |  |  |
| OPD tidak melihat dokumen internal sensitif | OPD hanya melihat dokumen yang boleh terlihat |  |  |

## 8. Database Integrity Checks
Jalankan query melalui Prisma Studio, SQL client, atau script smoke:
- `OpdSubmission`: status, `opdUserId`, `slaDueAt`, `completedAt`.
- `OpdSubmissionDocument`: `submissionId`, status, metadata file.
- `OpdSubmissionTimeline`: timeline ordered dan visible-to-OPD benar.
- `SopChecklistInstance`: entity type `opd_submission`, entity id sesuai submission.
- `KinerjaRhkCandidate`: candidate muncul setelah COMPLETED.
- `KinerjaRhkRealization`: realization hanya dari candidate APPROVED.

Minimal SQL:
```sql
SELECT id, status, sla_due_at, completed_at FROM opd_submissions ORDER BY created_at DESC LIMIT 10;
SELECT id, submission_id, status, document_type FROM opd_submission_documents ORDER BY created_at DESC LIMIT 10;
SELECT submission_id, to_status, action, is_visible_to_opd FROM opd_submission_timelines ORDER BY created_at DESC LIMIT 20;
SELECT id, opd_submission_id, status, rhk_code FROM kinerja_rhk_candidates ORDER BY created_at DESC LIMIT 10;
SELECT id, candidate_id, status, period_year, period_month FROM kinerja_rhk_realizations ORDER BY created_at DESC LIMIT 10;
```

## 9. Sign-off Table
| Test item | Tester | Result | Notes | Date |
| --- | --- | --- | --- | --- |
| Pre-check staging |  |  |  |  |
| OPD portal submit |  |  |  |  |
| Multipart upload |  |  |  |  |
| PPIK workbench |  |  |  |  |
| Correction cycle |  |  |  |  |
| Checklist SOP |  |  |  |  |
| SLA/timeline |  |  |  |  |
| Completion gate |  |  |  |  |
| Candidate approval |  |  |  |  |
| Executive report |  |  |  |  |
| Evidence bundle |  |  |  |  |
| RBAC negative tests |  |  |  |  |

## 10. Known Limitations
- API lint script belum tersedia.
- PDF masih print HTML/browser print.
- DMS archive metadata-only masih unsupported untuk laporan eksekutif.
- OPD preview/download masih dibatasi.
- Holiday national seed belum official jika belum ada seed resmi.

## 11. Go/No-Go Criteria
Go jika:
- Migration status up to date.
- Smoke regression 0 FAIL, 0 WARN.
- Semua skenario utama minimal PASS atau PASS WITH NOTE yang disetujui.
- RBAC negative tests PASS.
- Candidate approved menghasilkan realization, bukan otomatis dari OPD submission.
- Executive report hanya membaca realization APPROVED.
- Working calendar default aktif dan dipakai SLA.

No-go jika:
- Ada FAIL pada smoke regression.
- OPD bisa membuka internal route.
- Completion bisa melewati gate tanpa syarat.
- Candidate menjadi realization tanpa approval.
- Report menghitung candidate mentah/non-approved.
- Upload invalid diterima sebagai sukses.
