# AUDIT-01 - Arsitektur SILAKAP v1.0

Tanggal audit: 2026-05-28

---

## 1. Struktur Umum

SILAKAP v1.0 adalah aplikasi fullstack dengan struktur utama:

```text
silakap_v1.0/
  api/       # Backend NestJS/TypeScript/Prisma/MySQL
  apps/web/  # Frontend React/Vite/TypeScript/Tailwind
```

Root project memiliki script build gabungan:

```json
{
  "build:api": "npm --prefix api run build",
  "build:web": "npm --workspace apps/web run build",
  "build": "npm run build:api && npm run build:web"
}
```

Backend memakai module-based architecture. `AppModule` menggabungkan modul-modul besar: Auth, Events, Notifications, Sidata, SIAP, SIAP Worklog, Sipensiun, Siarsip, SLA, DMS, Kinerja, SOP, OPD Submission, Working Calendar, SIFORMEN, Pemberhentian, dan Layanan Kepegawaian.

---

## 2. Kekuatan Arsitektur

### 2.1 Modularitas backend sudah baik

Modul utama sudah dipisahkan, antara lain:

- `auth`
- `siap`
- `opd-submission`
- `layanan-kepegawaian`
- `dms`
- `sidata`
- `siformen`
- `kinerja-*`
- `working-calendar`
- `sla`
- `notifications`
- `audit`

Ini memudahkan audit lintas domain.

### 2.2 Bootstrap backend cukup production-aware

`main.ts` sudah memuat:

- validasi environment;
- CORS berbasis origin whitelist;
- security headers optional;
- request ID middleware;
- body limit;
- global validation pipe;
- global exception filter;
- Swagger hanya non-production.

### 2.3 Integrasi OPD -> SIAP sudah transactional

Pada `OpdSubmissionService.submitMine`, pembuatan SIAP Case, submit SIAP, update OPD, dan timeline dijalankan dalam transaction boundary. Ini penting karena mencegah orphan SIAP Case ketika update OPD gagal.

---

## 3. Risiko Arsitektur

| Prioritas | Risiko | Penjelasan |
|---|---|---|
| P0 | Role teknis bercampur dengan role bisnis | `ADMIN_BKPSDM` masih muncul dalam alur bisnis SIAP dan OPD |
| P0 | Assignment belum berbasis workload | SIAP belum benar-benar menjadi engine pemerataan pekerjaan |
| P1 | SIFORMEN belum menjadi sumber kapasitas kerja | SIFORMEN ada, tetapi belum terlihat dipakai sebagai basis pool assignment |
| P1 | Frontend berpotensi menampilkan aksi berbasis role statis | UX perlu mengikuti hak aksi backend |
| P2 | Dashboard lintas modul belum menjadi executive cockpit | Dashboard perlu menarik data SIAP, OPD, DMS, SIDATA, dan Kinerja |

---

## 4. Rekomendasi Arsitektur Target

### 4.1 Prinsip hubungan SIFORMEN dan SIAP

```text
SIFORMEN
  -> struktur organisasi
  -> jabatan
  -> kapasitas SDM
  -> peta kebutuhan pegawai
  -> kelayakan masuk pool digital

SIAP
  -> case
  -> task
  -> workflow
  -> assignment
  -> SLA
  -> pemerataan beban
```

### 4.2 Prinsip workflow layanan

- OPD mengirim pengajuan.
- SIAP membuat case dan task.
- Task awal langsung auto-assign ke pool teknis.
- Kabid hanya masuk pada pekerjaan penting, eskalasi, reassign, atau approval.
- Admin teknis tidak menjadi aktor bisnis.
- Backend menjadi sumber kebenaran workflow dan RBAC.

---

## 5. Rekomendasi Patch Kecil

1. Buat konstanta role SIAP yang eksplisit:
   - `SIAP_REASSIGN_ROLES`
   - `SIAP_WORKLOAD_POOL_ROLES`
   - `SIAP_SUPERVISOR_ROLES`
   - `SIAP_TECHNICAL_ADMIN_ROLES`
2. Pisahkan `ADMIN_BKPSDM` dari business action.
3. Buat service assignment kecil di modul SIAP, misalnya `SiapAssignmentService`.
4. Jangan ubah seluruh modul sekaligus.
5. Tambah dashboard pemerataan setelah assignment engine stabil.
