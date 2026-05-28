# Codex Task — Integrasi SIAP dengan Layanan Kepegawaian

## Tujuan

Integrasikan modul **OPD Submission / Layanan Kepegawaian** dengan modul **SIAP Case** secara minimal dan aman.

Saat OPD melakukan submit pengajuan layanan kepegawaian, sistem harus otomatis:

1. Membuat **SIAP Case**.
2. Submit SIAP Case agar workflow dan task pertama terbentuk.
3. Menyimpan `siapCaseId` di `OpdSubmission`.
4. Menulis timeline OPD bahwa SIAP Case dibuat.

## Batasan Penting

* Jangan bongkar struktur besar controller.
* Jangan hapus alur status lama `OpdSubmission`.
* Jangan ubah alur DMS / upload dokumen.
* Jangan gunakan dummy data.
* Jangan gunakan `any`.
* Jaga TypeScript strict.
* Service layer tetap sebagai orchestrator.
* Repository tetap untuk akses database.
* Patch harus minimal, aman, dan mudah direview.

---

# File yang Diubah

## 1. `api/prisma/schema.prisma`

Tambahkan relasi antara `OpdSubmission` dan `SiapCase`.

### Pada model `OpdSubmission`

Tambahkan field:

```prisma
siapCaseId String?   @unique @map("siap_case_id") @db.VarChar(36)
siapCase   SiapCase? @relation(fields: [siapCaseId], references: [id], onDelete: SetNull)
```

Tambahkan index:

```prisma
@@index([siapCaseId])
```

### Pada model `SiapCase`

Tambahkan relasi:

```prisma
opdSubmission OpdSubmission?
```

---

## 2. Buat migration baru

Buat folder dan file:

```text
api/prisma/migrations/20260528_link_opd_submission_siap_case/migration.sql
```

Isi migration:

```sql
ALTER TABLE `opd_submissions`
  ADD COLUMN `siap_case_id` VARCHAR(36) NULL;

CREATE UNIQUE INDEX `opd_submissions_siap_case_id_key`
  ON `opd_submissions`(`siap_case_id`);

CREATE INDEX `opd_submissions_siap_case_id_idx`
  ON `opd_submissions`(`siap_case_id`);

ALTER TABLE `opd_submissions`
  ADD CONSTRAINT `opd_submissions_siap_case_id_fkey`
  FOREIGN KEY (`siap_case_id`)
  REFERENCES `siap_cases`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
```

---

## 3. `api/src/modules/siap/siap.service.ts`

Tambahkan type:

```ts
type CreateSubmittedSiapCaseInput = {
  serviceType: string;
  title: string;
  description?: string;
  asnId?: string;
  priority?: CasePriority;
};
```

Tambahkan method public di dalam `SiapService`:

```ts
async createAndSubmitCase(
  input: CreateSubmittedSiapCaseInput,
  user: AuthUser,
  context?: AuditContext,
) {
  const created = await this.createCaseRecord(
    {
      serviceType: input.serviceType,
      title: input.title,
      description: input.description,
      asnId: input.asnId,
      priority: input.priority,
    },
    user,
  );

  return this.submitCase(created.id, user, context);
}
```

---

## 4. `api/src/modules/opd-submission/opd-submission.module.ts`

Import `SiapModule`:

```ts
import { SiapModule } from '../siap/siap.module';
```

Tambahkan ke array `imports`:

```ts
imports: [
  AuthModule,
  PrismaModule,
  AuditModule,
  DmsModule,
  KinerjaRhkCandidateModule,
  WorkingCalendarModule,
  SiapModule,
],
```

---

## 5. `api/src/modules/opd-submission/opd-submission.service.ts`

### Ubah import Prisma

Dari:

```ts
import { DmsDocumentCategory, Prisma } from '@prisma/client';
```

Menjadi:

```ts
import { CasePriority, DmsDocumentCategory, Prisma } from '@prisma/client';
```

Tambahkan import:

```ts
import { SiapService } from '../siap/siap.service';
```

### Inject `SiapService`

Tambahkan di constructor:

```ts
@Inject(SiapService) private readonly siapService: SiapService,
```

### Ubah method `submitMine()`

Di dalam `submitMine()`:

* Setelah `submissionNumber` dibuat.
* Sebelum update status menjadi `SUBMITTED`.
* Jika `before.siapCaseId` masih kosong, panggil:

```ts
const siapCase =
  before.siapCaseId
    ? null
    : await this.siapService.createAndSubmitCase(
        {
          serviceType: before.serviceType,
          title: this.buildSiapCaseTitle(before, submissionNumber),
          description: this.buildSiapCaseDescription(before, submissionNumber),
          asnId: before.subjectNip ?? undefined,
          priority: CasePriority.NORMAL,
        },
        user,
        context,
      );
```

Saat update `OpdSubmission`, simpan `siapCaseId` jika case baru dibuat:

```ts
...(siapCase ? { siapCaseId: siapCase.id } : {}),
```

Tambahkan timeline jika SIAP Case dibuat:

```ts
if (siapCase) {
  await this.writeTimeline(
    updated,
    'SUBMITTED',
    'SUBMITTED',
    'SIAP_CASE_CREATED',
    user,
    `SIAP Case ${siapCase.caseNumber} otomatis dibuat dari pengajuan OPD`,
    `SIAP Case ${siapCase.caseNumber} dibuat untuk proses internal BKPSDM`,
  );
}
```

### Tambahkan helper private

Tambahkan di bagian private methods:

```ts
private buildSiapCaseTitle(record: OpdSubmissionRecord, submissionNumber: string) {
  return `[${submissionNumber}] ${record.title}`;
}

private buildSiapCaseDescription(record: OpdSubmissionRecord, submissionNumber: string) {
  const lines = [
    'Pengajuan layanan kepegawaian dari OPD.',
    `Nomor pengajuan: ${submissionNumber}`,
    `Module: ${record.moduleKey}`,
    `Jenis layanan: ${record.serviceType}`,
    record.opdName ? `OPD: ${record.opdName}` : undefined,
    record.subjectName ? `Nama ASN/subjek: ${record.subjectName}` : undefined,
    record.subjectNip ? `NIP ASN/subjek: ${record.subjectNip}` : undefined,
    record.description ? `Uraian: ${record.description}` : undefined,
  ];

  return lines.filter(Boolean).join('\n');
}
```

---

# Validasi Wajib

Jalankan:

```bash
cd api
npx prisma generate
npm run build
```

Jika project memakai script typecheck:

```bash
npm run typecheck
```

Pastikan:

* Prisma generate sukses.
* TypeScript build sukses.
* Tidak ada `any`.
* Tidak ada perubahan besar di controller.
* Alur lama OPD submission tetap berjalan.
* DMS/upload dokumen tidak berubah.

---

# Expected Flow

Setelah patch:

```text
OPD buat draft
  ↓
OPD upload dokumen
  ↓
OPD submit pengajuan
  ↓
OpdSubmission status = SUBMITTED
  ↓
SIAP Case otomatis dibuat
  ↓
SIAP Case otomatis disubmit
  ↓
Workflow SIAP membuat task pertama
  ↓
PPIK bekerja lewat SIAP Task
```

---

# Output yang Harus Dilaporkan Codex

Setelah selesai, berikan ringkasan:

1. File yang berubah.
2. Migration yang dibuat.
3. Alur submit yang berubah.
4. Hasil `npx prisma generate`.
5. Hasil `npm run build` atau `npm run typecheck`.
6. Jika ada error, jelaskan file dan baris penyebabnya.
