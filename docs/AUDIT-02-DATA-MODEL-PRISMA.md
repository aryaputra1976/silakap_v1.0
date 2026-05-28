# AUDIT-02 - Data Model Prisma SILAKAP v1.0

Tanggal audit: 2026-05-28

---

## 1. Model Inti yang Sudah Terbentuk

Schema Prisma sudah memuat pondasi enterprise:

- User, Role, Permission, UserRole, RolePermission;
- UnitKerja;
- ASN dan riwayat/referensi;
- SIAP Case, Task, Workflow, SLA, Timeline, Worklog;
- OPD Submission, Document, Timeline, Audit;
- DMS Document;
- Kinerja Bidang/SOP/RHK;
- SIFORMEN;
- SIDATA;
- Pemberhentian/Sipensiun.

---

## 2. SIAP Data Model

### 2.1 Model `SiapCase`

`SiapCase` sudah memiliki:

- `caseNumber`
- `serviceType`
- `currentState`
- `status`
- `priority`
- relasi ke ASN
- relasi ke tasks, workflow logs, SLA tracking, timeline, DMS, OPD Submission

Ini sudah cukup untuk menjadi aggregate utama case layanan.

### 2.2 Model `SiapTask`

`SiapTask` sudah memiliki:

- `taskType`
- `status`
- `priority`
- `assignedTo`
- `assignedBy`
- `dueDate`
- `startedAt`
- `completedAt`

Ini sudah cukup untuk assignment dasar. Namun belum ada atribut tambahan untuk workload scoring, seperti bobot, kategori layanan, assignment source, atau pool.

### 2.3 Model `WorkflowTransition`

`WorkflowTransition` sudah menyimpan:

- `fromState`
- `toState`
- `actionCode`
- `allowedRole`
- `slaDays`

Ini fleksibel, tetapi `allowedRole` saat ini hanya satu role string. Untuk desain pool, perlu pendekatan tambahan.

---

## 3. OPD Submission Data Model

`OpdSubmission` sudah memiliki:

- `submissionNumber`
- `opdUserId`
- `opdUnitId`
- `serviceType`
- `moduleKey`
- `status`
- `assignedToId`
- `assignedToName`
- `siapCaseId`
- field SLA OPD
- relasi ke SIAP Case

`siapCaseId` sudah `unique`, cocok untuk relasi one-to-one opsional OPD Submission -> SIAP Case.

Catatan audit: `assignedToId` dan `assignedToName` pada `OpdSubmission` masih perlu dipastikan apakah akan tetap dipakai sebagai assignment OPD-level atau digantikan oleh `SiapTask.assignedTo` sebagai sumber kebenaran pekerjaan internal.

---

## 4. DMS Data Model

`DmsDocument` sudah memiliki:

- kategori;
- status;
- period year/month/quarter;
- unit kerja;
- ASN;
- caseId;
- worklogId;
- file metadata;
- submitted/verified/rejected/archived;
- audit actor references.

Ini sudah baik untuk bukti dukung kinerja dan dokumen layanan.

Rekomendasi: setiap dokumen OPD yang masuk sebagai bukti layanan sebaiknya memiliki relasi yang konsisten ke:

- `OpdSubmissionDocument`;
- `DmsDocument`;
- `SiapCase` atau `SiapTask`;
- jika menjadi bukti kerja harian, `SiapWorklog`.

---

## 5. Kebutuhan Model Tambahan untuk Assignment

Untuk mendukung assignment otomatis berbasis beban kerja, opsi patch minimal:

### Opsi A - Tanpa migration awal

Hitung beban kerja langsung dari `SiapTask`:

```text
active workload = count task where assignedTo = user.id and status in ASSIGNED/IN_PROGRESS/WAITING/RETURNED/OVERDUE
```

Kelebihan:

- tidak perlu migration;
- cepat dipatch;
- risiko rendah.

Kekurangan:

- belum ada bobot per jenis layanan;
- belum bisa mengecualikan PPPK Paruh Waktu kecuali lewat role/konfigurasi user.

### Opsi B - Tambah model pool assignment

Model konseptual:

```prisma
model SiapAssignmentPoolMember {
  id        String
  userId    String
  poolCode  String
  isActive  Boolean
  weight    Int
  note      String?
}
```

Kelebihan:

- bisa mengatur `ANALIS_PERTAMA_POOL`;
- bisa mengecualikan PPPK Paruh Waktu;
- bisa memberi bobot kapasitas.

Kekurangan:

- perlu migration;
- perlu UI/seed pengelolaan.

### Rekomendasi

Mulai dari **Opsi A** untuk patch cepat, lalu naik ke **Opsi B** setelah dashboard pemerataan mulai dirancang.

---

## 6. Prioritas Data Model

| Prioritas | Area | Rekomendasi |
|---|---|---|
| P0 | SIAP Task | Gunakan status task aktif untuk menghitung workload |
| P0 | Role/pool | Jangan masukkan PPPK Paruh Waktu ke kandidat assignment digital |
| P1 | Pool member | Tambahkan model pool jika assignment sudah stabil |
| P1 | DMS evidence | Tegaskan relasi DMS ke case/task/worklog |
| P2 | OPD assignedTo | Putuskan apakah assignment OPD-level masih diperlukan setelah SIAP menjadi sumber task |
