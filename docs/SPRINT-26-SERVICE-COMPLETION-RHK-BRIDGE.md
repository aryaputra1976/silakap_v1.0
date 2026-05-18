# Sprint 26 — Service Completion → RHK Bridge

**Tanggal:** 2026-05-19  
**Status:** Selesai  
**Build:** 2097 frontend modules, 0 errors; backend tsc clean

---

## 1. Tujuan Sprint

Menghubungkan penyelesaian layanan OPD dengan sistem kinerja bidang BKPSDM melalui mekanisme **kandidat realisasi RHK**. Prinsip inti:

> Pengajuan OPD yang selesai **tidak otomatis** menjadi realisasi kinerja final. Layanan OPD yang sudah selesai hanya menjadi **KANDIDAT**. Realisasi final tetap harus divalidasi role internal berwenang (KABID / Admin BKPSDM / SUPER_ADMIN).

---

## 2. Fitur Baru

### A. Completion Gate (Backend)

File: `api/src/modules/opd-submission/opd-completion.policy.ts`

Sebelum pengajuan OPD dapat diselesaikan, sistem menjalankan `assessCompletionReadiness()`:

| Cek | Kriteria |
|-----|----------|
| Dokumen ditolak | Tidak ada dokumen berstatus `REJECTED` |
| Dokumen terverifikasi | Minimal 1 dokumen `VERIFIED` (jika ada dokumen) |

Jika salah satu gagal: endpoint `/complete` melempar `400 BadRequestException` dengan daftar alasan.

**Override:** KABID/Admin BKPSDM/SUPER_ADMIN dapat melewati gate dengan mengisi field `overrideNote`. Override dicatat di audit log sebagai `[OVERRIDE] <alasan>`.

### B. Skor Kualitas Layanan

`calculateCompletionScores()` menghitung:

| Komponen | Formula | Bobot |
|----------|---------|-------|
| `qualityScore` | Dari checklist SOP (0–100) | 40% |
| `timeScore` | 100 jika on-time, 70 jika overdue | 30% |
| `evidenceScore` | `verified / total * 100` | 30% |
| `overallScore` | Rata-rata berbobot | 100% |

### C. Model Prisma Baru

**`KinerjaRhkCandidate`** (tabel: `kinerja_rhk_candidates`):
- `opdSubmissionId` — unique FK ke layanan OPD yang selesai
- `status`: `CANDIDATE` → `APPROVED` / `REJECTED` / `ARCHIVED`
- `rhkCode`, `sopCode` — dari mapping otomatis
- Skor: `qualityScore`, `timeScore`, `evidenceScore`, `overallScore`
- Info persetujuan/penolakan: `approvedById`, `rejectedById`, notes, timestamps

**`KinerjaRhkCandidateAudit`** (tabel: `kinerja_rhk_candidate_audits`):
- Setiap aksi kandidat (GENERATED / APPROVED / REJECTED / ARCHIVED) tercatat

### D. Module Backend: `kinerja-rhk-candidate`

Lokasi: `api/src/modules/kinerja-rhk-candidate/`

| File | Deskripsi |
|------|-----------|
| `rhk-sop.mapping.ts` | Lookup table: moduleKey+serviceType → rhkCode+sopCode |
| `kinerja-rhk-candidate.repository.ts` | Prisma CRUD + audit |
| `kinerja-rhk-candidate.service.ts` | Business logic: generate, list, approve, reject, archive |
| `kinerja-rhk-candidate.controller.ts` | REST: `/api/v1/internal/rhk-candidates` |
| `kinerja-rhk-candidate.module.ts` | NestJS module, exported |
| `dto/rhk-candidate-query.dto.ts` | Query, action, dan required-note DTOs |

### E. REST API Endpoints (Internal)

Semua di bawah `/api/v1/internal/rhk-candidates`:

| Method | Path | Role | Deskripsi |
|--------|------|------|-----------|
| GET | `/` | KABID/Admin/Analis | List kandidat (dengan filter) |
| GET | `/summary` | KABID/Admin/Analis | Ringkasan statistik |
| GET | `/:id` | KABID/Admin/Analis | Detail kandidat |
| GET | `/by-submission/:submissionId` | KABID/Admin/Analis | Kandidat by OPD submission ID |
| POST | `/:id/approve` | KABID/Admin | Setujui kandidat |
| POST | `/:id/reject` | KABID/Admin | Tolak kandidat (note wajib) |
| POST | `/:id/archive` | KABID/Admin | Arsipkan kandidat |

### F. Update `complete()` Endpoint

- `POST /api/v1/internal/opd-submissions/:id/complete`
- DTO baru: `CompleteOpdSubmissionDto` (`note?`, `overrideNote?`)
- Gate check sebelum completion
- Setelah completion: `generateFromSubmission()` dipanggil secara non-blocking

### G. RHK-SOP Mapping

File: `api/src/modules/kinerja-rhk-candidate/rhk-sop.mapping.ts`

Covers 14 service types dari 4 module (LAYANAN_KEPEGAWAIAN, SIPENSIUN, SIDATA, DMS). Unrecognized types return `{ rhkCode: null, sopCode: null }` — tidak memblokir completion.

---

## 3. Frontend Baru

### Komponen Baru

| File | Deskripsi |
|------|-----------|
| `service-workbench/service-completion-readiness-card.tsx` | Card kesiapan sebelum completion, dengan override note |
| `kinerja/rhk-candidate-summary-panel.tsx` | 4 stat cards ringkasan kandidat |
| `kinerja/rhk-candidate-table.tsx` | Tabel kandidat dengan filter status/search |
| `kinerja/rhk-candidate-detail-panel.tsx` | Detail + approve/reject/archive actions |

### Types & API Client

| File | Deskripsi |
|------|-----------|
| `lib/kinerja-rhk-candidates/types.ts` | TypeScript types + helper functions |
| `lib/api/kinerja-rhk-candidates.ts` | API client wrapping 7 endpoints |
| `lib/opd-submissions/types.ts` | Ditambah `OpdCompletePayload` (note + overrideNote) |
| `lib/api/opd-submissions.ts` | `completeOpdSubmission()` menggunakan `OpdCompletePayload` |

### Halaman Diperbarui

**`layanan-detail-page.tsx`:**
- Import `ServiceCompletionReadinessCard` dan `canCompleteSubmission`
- State `overrideNote`
- Card readiness muncul saat role bisa complete dan status VERIFIED
- Payload `complete` action menyertakan `overrideNote` jika diisi

**`kinerja-bidang-realizations-page.tsx`:**
- Import 3 RHK candidate components
- State `selectedCandidate`
- Di atas tabel realisasi: Summary Panel + Candidate Table + (jika dipilih) Detail Panel

---

## 4. RBAC

| Role | View Candidates | Approve/Reject/Archive | Override Completion |
|------|----------------|------------------------|---------------------|
| SUPER_ADMIN | ✅ | ✅ | ✅ |
| ADMIN_BKPSDM | ✅ | ✅ | ✅ |
| KEPALA_BADAN | ✅ | ✗ | ✗ |
| KABID | ✅ | ✅ | ✅ |
| ANALIS_MADYA | ✅ | ✗ | ✗ |
| ANALIS_MUDA | ✅ | ✗ | ✗ |
| OPD | ✗ | ✗ | ✗ |

OPD tidak pernah bisa melihat atau memengaruhi kandidat RHK.

---

## 5. Alur Kerja Lengkap

```
OPD Submit → Internal Receive → Start Verification
    → Request Correction (jika perlu)
    → Verify
    → [Completion Gate] ← cek dokumen + SLA
         ↓ PASS (atau override oleh KABID/Admin)
    → COMPLETED
         ↓ (non-blocking)
    → KinerjaRhkCandidate CANDIDATE dibuat
         ↓
    → KABID/Admin buka Kinerja Bidang > Realisasi
    → Review kandidat → Approve / Reject / Archive
         ↓ APPROVED
    → Masuk pipeline realisasi RHK manual (manual entry oleh staf)
```

---

## 6. Invariant yang Dipertahankan

- OPD tidak pernah bisa akses endpoint `/internal/rhk-candidates`
- OPD submission tidak otomatis menjadi realisasi final
- Setiap aksi kandidat dicatat di `KinerjaRhkCandidateAudit`
- Override completion dicatat sebagai `[OVERRIDE]` di audit log submission
- Tidak ada `any` di seluruh kode baru
- Tidak ada route existing yang dihapus atau diubah signature-nya

---

## 7. File yang Diubah / Dibuat

### Backend (api/)

| File | Aksi |
|------|------|
| `prisma/schema.prisma` | Tambah `KinerjaRhkCandidate` + `KinerjaRhkCandidateAudit` |
| `src/modules/opd-submission/opd-completion.policy.ts` | **Baru** |
| `src/modules/opd-submission/dto/request-correction.dto.ts` | Tambah `CompleteOpdSubmissionDto` |
| `src/modules/opd-submission/opd-submission.service.ts` | Update `complete()` method |
| `src/modules/opd-submission/opd-submission.controller.ts` | Update `complete()` DTO |
| `src/modules/opd-submission/opd-submission.module.ts` | Import `KinerjaRhkCandidateModule` |
| `src/modules/kinerja-rhk-candidate/rhk-sop.mapping.ts` | **Baru** |
| `src/modules/kinerja-rhk-candidate/kinerja-rhk-candidate.repository.ts` | **Baru** |
| `src/modules/kinerja-rhk-candidate/kinerja-rhk-candidate.service.ts` | **Baru** |
| `src/modules/kinerja-rhk-candidate/kinerja-rhk-candidate.controller.ts` | **Baru** |
| `src/modules/kinerja-rhk-candidate/kinerja-rhk-candidate.module.ts` | **Baru** |
| `src/modules/kinerja-rhk-candidate/dto/rhk-candidate-query.dto.ts` | **Baru** |
| `src/modules/app.module.ts` | Tambah `KinerjaRhkCandidateModule` |

### Frontend (apps/web/)

| File | Aksi |
|------|------|
| `src/lib/kinerja-rhk-candidates/types.ts` | **Baru** |
| `src/lib/api/kinerja-rhk-candidates.ts` | **Baru** |
| `src/lib/opd-submissions/types.ts` | Tambah `OpdCompletePayload` |
| `src/lib/api/opd-submissions.ts` | Update `completeOpdSubmission()` |
| `src/components/workspace/service-workbench/service-completion-readiness-card.tsx` | **Baru** |
| `src/components/workspace/kinerja/rhk-candidate-summary-panel.tsx` | **Baru** |
| `src/components/workspace/kinerja/rhk-candidate-table.tsx` | **Baru** |
| `src/components/workspace/kinerja/rhk-candidate-detail-panel.tsx` | **Baru** |
| `src/pages/workspace/layanan-detail-page.tsx` | Update: readiness card + overrideNote |
| `src/pages/workspace/kinerja-bidang-realizations-page.tsx` | Update: RHK candidate panels |

---

## 8. Checklist Regresi

- [x] `npx prisma validate` — pass
- [x] `npx prisma generate` — pass
- [x] Backend `tsc` build — 0 errors
- [x] Frontend `npm run lint` — 0 errors, 10 pre-existing warnings (tidak berubah dari S20)
- [x] Frontend `npm run build` — 2097 modules, 0 errors
- [x] OPD role tidak bisa akses `/internal/rhk-candidates` (RolesGuard + RBAC)
- [x] OPD submission tidak otomatis disetujui sebagai realisasi
- [x] Override completion hanya untuk FINAL_ROLES

---

## 9. Keterbatasan yang Diketahui

- `checklistPercent` selalu 0 saat kandidat di-generate (tidak ada API untuk fetch checklist completion per submission dari sisi OPD submission service). Untuk iterasi berikutnya: tambahkan query ke `SopChecklistInstance` di service.
- RHK Mapping hanya cover 14 service types; service type yang tidak dikenal `rhkCode = null` (tidak blocking)
- Kandidat yang diapprove belum otomatis membuat `KinerjaBidangSopRealization` — ini harus dientry manual oleh staf kinerja. Otomasi ini adalah scope Sprint 27+.
