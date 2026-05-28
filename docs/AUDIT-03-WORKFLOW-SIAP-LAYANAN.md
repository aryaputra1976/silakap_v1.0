# AUDIT-03 - Workflow SIAP dan Layanan Kepegawaian

Tanggal audit: 2026-05-28

---

## 1. Kondisi Aktual

OPD Submission sudah terintegrasi dengan SIAP. Pada `submitMine`, sistem:

1. memastikan status OPD masih `DRAFT`;
2. membuat nomor pengajuan;
3. menghitung SLA OPD;
4. membuat dan submit SIAP Case;
5. menyimpan `siapCaseId`;
6. mengubah status menjadi `SUBMITTED`;
7. menulis timeline `SIAP_CASE_CREATED`.

Ini sudah menjadi fondasi workflow lintas aplikasi yang baik.

---

## 2. Masalah Utama Workflow

### P0 - Tahap awal masih memakai `ADMIN_BKPSDM`

Seed workflow masih membuat transition:

```text
DRAFT -> VERIFIKASI_ADMIN
allowedRole = ADMIN_BKPSDM
```

Ini bertentangan dengan prinsip:

- admin teknis bukan aktor bisnis;
- pekerjaan OPD harus langsung masuk ke teknis;
- Kabid bukan bottleneck penugasan rutin.

### P0 - Auto-assignment belum workload-aware

Pada pembuatan task, SIAP mengambil user aktif berdasarkan role transition. Repository memilih userRole pertama berdasarkan `createdAt asc`.

Dampak:

- pegawai pertama bisa selalu menerima pekerjaan;
- tidak ada pemerataan;
- tidak ada pembelajaran merata lintas jenis layanan;
- dashboard pemerataan tidak bermakna jika assignment belum benar.

### P0 - Role penugasan terlalu luas

Role assign saat ini masih memasukkan:

- `ADMIN_BKPSDM`
- `ANALIS_MUDA`

Padahal desain kewenangan meminta:

- `KABID` hanya untuk pekerjaan penting, eskalasi, atau reassign tertentu;
- `ANALIS_MADYA` jika didelegasikan;
- `SUPER_ADMIN` hanya emergency teknis;
- `ADMIN_BKPSDM`, `ANALIS_MUDA`, `ANALIS_PERTAMA`, `PENELAAH`, `PPPK`, `OPD` tidak boleh menugaskan rutin.

---

## 3. Workflow Target

### 3.1 Pengajuan normal dari OPD

```text
OPD Submit
  -> SIAP Case ACTIVE
  -> Task VERIFIKASI_TEKNIS / VERIFIKASI_AWAL
  -> Auto assign ke ANALIS_PERTAMA_POOL
  -> Analis Pertama Pool memproses
  -> Analis Muda/Madya melakukan review substansi jika diperlukan
  -> Kabid approval hanya jika layanan butuh keputusan/validasi pimpinan
  -> Kepala Badan hanya untuk jenis layanan yang memerlukan persetujuan final
```

### 3.2 Pool teknis awal

`ANALIS_PERTAMA_POOL` terdiri dari:

- Analis SDMA Ahli Pertama;
- Penelaah Teknis Kebijakan;
- PPPK Analis SDMA Ahli Pertama.

PPPK Paruh Waktu tidak masuk pool teknis digital.

### 3.3 Kabid dalam workflow

Kabid masuk pada kondisi:

- approval pekerjaan penting;
- eskalasi SLA;
- konflik assignment;
- reassign manual;
- validasi akhir jika SOP layanan mensyaratkan;
- monitoring pemerataan.

Kabid tidak klik `Tugaskan` untuk setiap pengajuan OPD.

---

## 4. Patch Bertahap yang Disarankan

### Patch 1 - Koreksi role assignment

Ubah daftar role penugasan di backend:

```ts
const SIAP_ASSIGN_ROLES = [
  'SUPER_ADMIN',
  'KABID',
  'ANALIS_MADYA',
];
```

Catatan:

- `SUPER_ADMIN` hanya emergency.
- `KABID` tidak berarti aktor utama penugasan, hanya bisa reassign/escalation.
- `ANALIS_MADYA` perlu validasi delegasi pada tahap berikutnya.

### Patch 2 - Koreksi workflow awal seed

Ganti transition awal:

```text
DRAFT -> VERIFIKASI_ADMIN / VERIFIKASI_AWAL
allowedRole: ANALIS_PERTAMA
```

Jika nama state tetap `VERIFIKASI_ADMIN` untuk kompatibilitas, role tetap harus `ANALIS_PERTAMA`, bukan `ADMIN_BKPSDM`.

### Patch 3 - Auto-assignment beban paling ringan

Tambahkan method repository:

```ts
findLeastLoadedActiveUserByRole(roleCode)
```

Hitung task aktif:

```text
ASSIGNED
IN_PROGRESS
WAITING
RETURNED
OVERDUE
```

Urutkan:

1. jumlah task aktif paling sedikit;
2. due date paling ringan;
3. nama/createdAt sebagai tie breaker.

### Patch 4 - Pool role alias

Karena `WorkflowTransition.allowedRole` masih satu string, patch minimal:

```ts
resolveAssignmentRoleCodes('ANALIS_PERTAMA')
  -> ['ANALIS_PERTAMA', 'PENELAAH', 'PPPK']
```

Namun PPPK harus difilter agar hanya PPPK Analis SDMA Ahli Pertama yang masuk, bukan PPPK Paruh Waktu.

### Patch 5 - Dashboard pemerataan

Endpoint baru:

```text
GET /api/v1/siap/workload
```

Response minimal:

```ts
{
  userId,
  name,
  roles,
  activeTasks,
  completedTasks,
  overdueTasks,
  workloadScore,
  averageCompletionHours,
  serviceTypeDistribution
}
```

---

## 5. Prompt Codex Patch Kecil

```text
Audit dan patch kecil modul SIAP assignment.

Batasan:
- Jangan refactor besar.
- Jangan ubah struktur folder.
- Backend tetap sumber kebenaran RBAC.
- OPD submit harus tetap otomatis membuat dan submit SIAP Case.
- Kabid bukan aktor utama penugasan rutin; Kabid hanya untuk reassign/escalation/pekerjaan penting.
- ADMIN_BKPSDM tidak boleh menjadi aktor bisnis workflow.
- ANALIS_MUDA tidak boleh menugaskan/reassign rutin.
- Pengajuan OPD harus auto-assign ke teknis.

Target patch:
1. Ubah SIAP_ASSIGN_ROLES di siap.controller.ts dan siap.service.ts agar hanya:
   SUPER_ADMIN, KABID, ANALIS_MADYA.
2. Ubah seed workflow SIAP agar transition awal DRAFT -> VERIFIKASI_ADMIN tidak lagi allowedRole ADMIN_BKPSDM, tetapi ANALIS_PERTAMA.
3. Tambahkan repository method untuk memilih user aktif dengan role target dan task aktif paling sedikit.
4. Ubah createTaskForTransition agar memakai method least-loaded, bukan findActiveUserIdByRole pertama.
5. Pastikan build api tetap sukses.
6. Jangan patch frontend dulu kecuali ada error compile.
```
