# Sprint 13 — SOP Checklist Digital

**Status:** Selesai  
**Tanggal:** 2026-05-18  
**Branch:** main  

---

## Tujuan Sprint 13

Membuat fondasi checklist digital berbasis SOP agar setiap SOP prioritas "hidup" di aplikasi — bukan hanya sebagai referensi statis, tetapi sebagai daftar pemeriksaan yang dapat diisi, dilacak statusnya, dan disetujui oleh pejabat berwenang.

Checklist ini **frontend-only** (state lokal, belum persisten ke backend). Data akan hilang saat halaman direfresh. Persistensi ke database adalah scope Sprint selanjutnya.

---

## 5 Checklist Prioritas

| # | Kode SOP | Judul | Modul | AccessLevel |
|---|----------|-------|-------|-------------|
| 1 | SOP-BKPSDM-PAN-002 | Verifikasi Berkas Usulan Pensiun ASN | SIPENSIUN | BIDANG_PPIK |
| 2 | SOP-BKPSDM-LAY-001 | Penerimaan Permohonan Layanan Kepegawaian | LAYANAN_KEPEGAWAIAN | PUBLIC_INTERNAL |
| 3 | SOP-BKPSDM-LAY-002 | Verifikasi Kelengkapan Berkas Layanan | LAYANAN_KEPEGAWAIAN | PUBLIC_INTERNAL |
| 4 | SOP-BKPSDM-DAT-002 | Pemutakhiran Data ASN Umum / Non-Pensiun | SIDATA | BIDANG_PPIK |
| 5 | SOP-BKPSDM-DMS-001 | Pengelolaan Dokumen Digital Kepegawaian | DMS | BIDANG_PPIK |

---

## File yang Dibuat / Diubah

| File | Aksi | Keterangan |
|------|------|------------|
| `src/lib/sop-checklist/checklist-types.ts` | Baru | Type utama: status item, template, instance, helpers |
| `src/lib/sop-checklist/checklist-templates.ts` | Baru | 5 template prioritas dengan item detail |
| `src/lib/sop-checklist/checklist-policy.ts` | Baru | Lookup template + canView/canEdit/canApprove |
| `src/components/workspace/sop/sop-checklist-panel.tsx` | Baru | Panel reusable: item list, status, catatan, approve/reject |
| `src/pages/workspace/sipensiun-detail-page.tsx` | Update | Embed SopChecklistPanel PAN-002 |
| `src/pages/workspace/dms-document-detail-page.tsx` | Update | Embed SopChecklistPanel jika dokumen memiliki sopCode |
| `src/pages/workspace/sidata-pemutakhiran-page.tsx` | Update | Embed SopChecklistPanel DAT-002 |

---

## Struktur Template Checklist

Setiap `SopChecklistTemplate` berisi:
```typescript
{
  sopCode: string,
  title: string,
  moduleKey: SopModuleKey,
  description: string,
  relatedDmsRequired: boolean,
  defaultOverallStatus: SopChecklistOverallStatus,
  rolePolicy: {
    viewers: AppRole[],
    editors: AppRole[],
    approvers: AppRole[],
  },
  items: SopChecklistTemplateItem[],
}
```

Setiap `SopChecklistTemplateItem`:
```typescript
{
  id: string,              // unique key dalam template
  label: string,
  description?: string,
  category?: string,       // grouping display
  required: boolean,
  allowNotes?: boolean,
  allowDmsLink?: boolean,
}
```

---

## Status Item

| Status | Label | Warna |
|--------|-------|-------|
| `PENDING` | Belum Dicek | Abu-abu (neutral) |
| `TERPENUHI` | Terpenuhi | Hijau (success) |
| `TIDAK_TERPENUHI` | Tidak Terpenuhi | Merah (danger) |
| `TIDAK_RELEVAN` | Tidak Relevan | Biru (info) |
| `PERLU_PERBAIKAN` | Perlu Perbaikan | Kuning (warning) |

**Checklist dianggap selesai** jika semua item `required: true` berstatus `TERPENUHI` atau `TIDAK_RELEVAN`.

---

## Role Policy

### canViewChecklist
| Role | Dapat Melihat |
|------|---------------|
| SUPER_ADMIN | ✅ Semua |
| ADMIN_BKPSDM | ✅ Semua |
| KEPALA_BADAN | ✅ Semua |
| KABID | ✅ Semua |
| ANALIS_MADYA | ✅ Semua |
| ANALIS_MUDA | ✅ Semua |
| ANALIS_PERTAMA | ✅ Semua |
| PENELAAH | ✅ Semua |
| PPPK | ✅ Semua internal |
| OPD | ❌ Tidak dapat melihat checklist internal |

### canEditChecklist
| Role | Dapat Edit |
|------|------------|
| SUPER_ADMIN | ✅ |
| ADMIN_BKPSDM | ✅ |
| KEPALA_BADAN | ✅ |
| KABID | ✅ |
| ANALIS_MADYA | ✅ |
| ANALIS_MUDA | ✅ |
| ANALIS_PERTAMA | ✅ |
| PENELAAH | ✅ |
| PPPK | ✅ (sesuai template editors) |
| OPD | ❌ Tidak bisa edit |

### canApproveChecklist
| Role | Dapat Approve |
|------|---------------|
| SUPER_ADMIN | ✅ |
| ADMIN_BKPSDM | ✅ |
| KEPALA_BADAN | ✅ (untuk semua template) |
| KABID | ✅ (sesuai template approvers) |
| ANALIS_MADYA | ✅ (sesuai template approvers) |
| ANALIS_MUDA | ❌ |
| ANALIS_PERTAMA | ❌ |
| PENELAAH | ❌ |
| PPPK | ❌ Tidak bisa approve |
| OPD | ❌ Tidak bisa approve |

---

## Mapping SOP ke Modul (Integrasi)

| SOP | Modul Integrasi | Halaman yang Diembed |
|-----|-----------------|----------------------|
| SOP-BKPSDM-PAN-002 | SIPENSIUN | `sipensiun-detail-page.tsx` (bawah dokumen) |
| SOP-BKPSDM-LAY-001 | LAYANAN_KEPEGAWAIAN | Tersedia via panel, belum diembed di halaman spesifik |
| SOP-BKPSDM-LAY-002 | LAYANAN_KEPEGAWAIAN | Tersedia via panel, belum diembed |
| SOP-BKPSDM-DAT-002 | SIDATA | `sidata-pemutakhiran-page.tsx` |
| SOP-BKPSDM-DMS-001 | DMS | `dms-document-detail-page.tsx` (jika dokumen punya sopCode DMS-001) |

---

## Cara Pakai Panel

### Embed di halaman
```tsx
import { SopChecklistPanel } from '@/components/workspace/sop/sop-checklist-panel';

// Panel otomatis tersembunyi jika sopCode tidak punya template
// atau user tidak memiliki akses view
<SopChecklistPanel
  sopCode="SOP-BKPSDM-PAN-002"
  userRole={userRole}
  contextId={caseId}         // opsional
  readOnly={false}           // opsional, default false
/>
```

### Cek policy secara programatis
```typescript
import {
  canViewChecklist,
  canEditChecklist,
  canApproveChecklist,
  getChecklistCapability,
} from '@/lib/sop-checklist/checklist-policy';

canViewChecklist('KABID', 'SOP-BKPSDM-PAN-002');    // true
canEditChecklist('OPD', 'SOP-BKPSDM-PAN-002');       // false
canApproveChecklist('PPPK', 'SOP-BKPSDM-PAN-002');  // false

const cap = getChecklistCapability('ANALIS_MADYA', 'SOP-BKPSDM-PAN-002');
// { canView: true, canEdit: true, canApprove: true }
```

---

## Catatan Backend

Checklist Sprint 13 adalah **frontend-only**. State disimpan di React `useState` dan **tidak** dikirim ke server. Untuk persistensi ke database, Sprint selanjutnya perlu:

1. Endpoint `POST /sop-checklist` — create instance
2. Endpoint `PATCH /sop-checklist/:id` — update item status/notes
3. Endpoint `POST /sop-checklist/:id/approve` — approve/reject
4. Endpoint `GET /sop-checklist?sopCode=&contextId=` — load instance

Schema database minimal:
```sql
sop_checklist (id, sop_code, context_id, overall_status, approved_by, approval_note, created_at, updated_at)
sop_checklist_item (id, checklist_id, item_id, status, notes, dms_document_id)
```

---

## Regression Checklist

### Komponen SopChecklistPanel
- [ ] `<SopChecklistPanel sopCode="SOP-BKPSDM-PAN-002" userRole="KABID" />` — panel muncul dengan 10 item
- [ ] `<SopChecklistPanel sopCode="SOP-BKPSDM-PAN-002" userRole="OPD" />` — panel tidak muncul (render null)
- [ ] `<SopChecklistPanel sopCode="TIDAK-ADA" userRole="KABID" />` — render null tanpa error
- [ ] Tombol status dropdown muncul jika `canEdit` true
- [ ] Tombol status tidak muncul jika `readOnly={true}` atau role tidak punya edit
- [ ] Tombol "Setujui Checklist" muncul hanya jika `canApprove` true
- [ ] Tombol "Setujui" disabled jika ada item wajib belum TERPENUHI/TIDAK_RELEVAN
- [ ] Progress bar update saat status item diubah
- [ ] Tombol "Simpan Draft" menampilkan "Tersimpan" setelah diklik

### SIPENSIUN Detail
- [ ] Panel checklist PAN-002 muncul di bawah section dokumen
- [ ] KABID dan ANALIS_MADYA bisa edit dan approve
- [ ] PPPK bisa lihat tapi tidak bisa approve
- [ ] OPD tidak melihat panel sama sekali

### DMS Document Detail
- [ ] Dokumen dengan tag `SOP-BKPSDM-DMS-001` menampilkan checklist panel
- [ ] Dokumen tanpa sopCode di tags tidak menampilkan panel
- [ ] Dokumen dengan sopCode yang tidak punya template tidak menampilkan panel

### SIDATA Pemutakhiran
- [ ] Panel checklist DAT-002 muncul di bawah SOP panel existing
- [ ] Items: 8 item termasuk "Bukti dukung tersimpan di DMS"

### Policy
- [ ] `canApproveChecklist('PPPK', 'SOP-BKPSDM-PAN-002')` → false
- [ ] `canApproveChecklist('KABID', 'SOP-BKPSDM-PAN-002')` → true
- [ ] `canEditChecklist('OPD', 'SOP-BKPSDM-LAY-001')` → false
- [ ] `canViewChecklist('OPD', 'SOP-BKPSDM-LAY-001')` → false (OPD bukan di viewers)

### Build & Lint
- [ ] `npm run lint` exit 0
- [ ] `npm run build` hijau tanpa type error baru
- [ ] Tidak ada `any` baru
