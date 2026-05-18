# Sprint 29 — Calendar Hari Kerja & SLA Accuracy

**Tanggal:** 2026-05-19  
**Sprint:** 29  
**Status:** Selesai

---

## Tujuan Sprint

Mengganti perhitungan SLA dari jam kalender ke **jam kerja** menggunakan konfigurasi `WorkingCalendar` yang disimpan di database. DUE_SOON threshold diubah dari 24 jam kalender menjadi **8 jam kerja**. Jeda perbaikan OPD (NEEDS_CORRECTION) diperpanjang sesuai jam kerja yang terpakai, bukan jam kalender.

---

## Batasan (JANGAN)

- **Jangan** membuka akses internal ke OPD.
- **Jangan** ubah ulang RBAC besar.
- **Jangan** merusak flow OPD submission.
- **Jangan** menghapus field SLA lama — `slaPausedHours` tetap disimpan dalam jam kalender.
- **Jangan** hapus route existing.
- **Jangan** membuat route mati.
- **Jangan** pakai `any`.
- **Jangan** klaim akurat libur nasional — seed hari libur belum tersedia; data libur dikelola manual via UI.
- **Jangan** memakai package berat — implementasi `business-time.util.ts` murni TypeScript tanpa dependensi eksternal.

---

## Perubahan Backend

### A. Schema Prisma — Model Baru

**`api/prisma/schema.prisma`** — ditambahkan:

```prisma
model WorkingCalendar {
  id         String    @id @default(cuid()) @db.VarChar(36)
  name       String    @unique @db.VarChar(100)
  timezone   String    @default("Asia/Makassar") @db.VarChar(50)
  workDays   Json      @map("work_days")           // [1,2,3,4,5] = Senin–Jumat
  workStart  String    @default("08:00") @map("work_start") @db.VarChar(5)
  workEnd    String    @default("16:00") @map("work_end") @db.VarChar(5)
  breakStart String?   @default("12:00") @map("break_start") @db.VarChar(5)
  breakEnd   String?   @default("13:00") @map("break_end") @db.VarChar(5)
  isDefault  Boolean   @default(false) @map("is_default")
  isActive   Boolean   @default(true) @map("is_active")
  ...
  holidays   HolidayCalendar[]
}

model HolidayCalendar {
  id                String   @id @default(cuid()) @db.VarChar(36)
  workingCalendarId String   @map("working_calendar_id") @db.VarChar(36)
  date              DateTime @db.Date
  name              String   @db.VarChar(200)
  isRecurringYearly Boolean  @default(false) @map("is_recurring_yearly")
  ...
}
```

### B. Migration

`api/prisma/migrations/20260519001000_add_working_calendar_sla_accuracy/migration.sql`  
Diterapkan via `prisma db push` (shadow DB memiliki pre-existing migration failure di Sprint sebelumnya).

### C. Seed Default Calendar

`api/prisma/seed.ts` — ditambahkan upsert:

```typescript
await prisma.workingCalendar.upsert({
  where: { name: 'Kalender Kerja BKPSDM' },
  ...
  // Senin–Jumat, 08:00–16:00, break 12:00–13:00, Asia/Makassar, isDefault=true
});
```

### D. Modul Baru: `api/src/modules/working-calendar/`

| File | Keterangan |
|------|------------|
| `business-time.util.ts` | 7 fungsi utilitas jam kerja murni TypeScript |
| `working-calendar.repository.ts` | Query Prisma untuk calendar & holidays |
| `working-calendar.service.ts` | Logika bisnis + `getEffectiveCalendar()` |
| `working-calendar.controller.ts` | HTTP controller |
| `working-calendar.module.ts` | NestJS module, exports WorkingCalendarService |
| `dto/create-working-calendar.dto.ts` | DTO pembuatan kalender |
| `dto/update-working-calendar.dto.ts` | DTO update kalender (semua field optional) |
| `dto/create-holiday.dto.ts` | DTO tambah hari libur |
| `dto/query-holiday.dto.ts` | DTO filter hari libur per tahun |

**Endpoint prefix:** `GET|POST|PATCH|DELETE /api/v1/working-calendar/...`

| Method | Path | Roles |
|--------|------|-------|
| GET | `/` | VIEW_ROLES |
| GET | `/effective` | VIEW_ROLES |
| GET | `/:id` | VIEW_ROLES |
| POST | `/` | MANAGE_ROLES |
| PATCH | `/:id` | MANAGE_ROLES |
| GET | `/:id/holidays` | VIEW_ROLES |
| POST | `/:id/holidays` | MANAGE_ROLES |
| DELETE | `/:id/holidays/:holidayId` | MANAGE_ROLES |

**VIEW_ROLES:** SUPER_ADMIN, ADMIN_BKPSDM, KEPALA_BADAN, KABID  
**MANAGE_ROLES:** SUPER_ADMIN, ADMIN_BKPSDM

### E. `business-time.util.ts` — 7 Fungsi

| Fungsi | Keterangan |
|--------|------------|
| `isWeekend(date, workDays)` | Cek apakah hari adalah hari libur mingguan |
| `isHoliday(date, holidays)` | Cek apakah tanggal ada di daftar libur |
| `isWorkingDay(date, cal)` | Gabungan: bukan weekend & bukan libur |
| `calculateBusinessElapsedHours(start, end, cal)` | Jam kerja antara dua tanggal |
| `calculateBusinessRemainingHours(now, due, cal)` | Jam kerja tersisa hingga due date |
| `normalizeToWorkingTime(date, cal)` | Snap ke momen kerja berikutnya |
| `addBusinessHours(start, hours, cal)` | Tambah N jam kerja ke tanggal |

**Default fallback:** Senin–Jumat 08:00–16:00, break 12:00–13:00, Asia/Makassar (jika DB tidak ada record).

### F. `opd-sla.policy.ts` — Fungsi Baru

Ditambahkan (tidak menghapus fungsi lama):

- `calculateSlaStatusBusiness(submission, cal, now)` — DUE_SOON menggunakan threshold 8 jam kerja
- `calculateSlaDueAtBusiness(startDate, targetHours, cal)` — Due date berbasis jam kerja
- Re-export: `addBusinessHours`, `calculateBusinessElapsedHours`

### G. `opd-submission.service.ts` — Perubahan

- `submitMine()`: `slaDueAt` sekarang menggunakan `calculateSlaDueAtBusiness(now, targetHours, cal)`
- `submitCorrectionMine()`: perpanjangan `slaDueAt` menggunakan `addBusinessHours(slaDueAt, pausedBusinessHours, cal)`; `slaPausedHours` tetap dicatat dalam jam kalender untuk backward compatibility

### H. Module Registration

- `OpdSubmissionModule` imports `WorkingCalendarModule`
- `AppModule` imports `WorkingCalendarModule`

---

## Perubahan Frontend

| File | Perubahan |
|------|-----------|
| `lib/working-calendar/types.ts` | NEW — WorkingCalendar, HolidayCalendar, WorkingCalendarConfig types |
| `lib/api/working-calendar.ts` | NEW — workingCalendarApi client |
| `components/workspace/working-calendar/working-calendar-summary-card.tsx` | NEW — Panel ringkasan kalender aktif |
| `components/workspace/working-calendar/holiday-calendar-panel.tsx` | NEW — Panel CRUD hari libur |
| `pages/workspace/working-calendar-page.tsx` | NEW — Halaman Kalender Kerja |
| `routing/app-routing-setup.tsx` | Ditambah route `/working-calendar` |
| `config/layout-1.config.tsx` | Ditambah entry "Kalender Kerja" di section Control |
| `components/workspace/service-workbench/service-sla-card.tsx` | Deskripsi: "SLA dihitung berdasarkan jam kerja." |
| `components/workspace/service-workbench/service-sla-summary-panel.tsx` | DUE_SOON: "Due soon dihitung dari sisa ≤ 8 jam kerja." |

---

## Arsitektur & Keputusan Desain

### Jam Kalender vs Jam Kerja

`slaPausedHours` tetap dicatat dalam jam kalender (backward compatibility). Hanya `slaDueAt` yang dihitung ulang dalam jam kerja. Ini memastikan laporan historis tidak berubah tetapi tenggat waktu aktif adalah jam kerja.

### Fallback Jika Tidak Ada Kalender

`getEffectiveCalendar()` mengembalikan `DEFAULT_CALENDAR` (Senin–Jumat 08:00–16:00, Asia/Makassar) jika tidak ada record di database. Seed menyediakan satu record default otomatis.

### Libur Nasional

Belum ada seed hari libur nasional. Admin perlu menambahkan secara manual via halaman Kalender Kerja. Jangan mengklaim akurasi libur nasional selama seed belum tersedia.

### DUE_SOON Threshold

Diubah dari 24 jam kalender → **8 jam kerja**. Untuk hari kerja Senin–Jumat 08:00–16:00 (7 jam efektif per hari setelah break), 8 jam kerja ≈ 1 hari kerja penuh.

---

## Validasi

| Check | Hasil |
|-------|-------|
| `prisma db push` | Schema synced, Prisma Client regenerated |
| Backend `tsc --noEmit` | Bersih (errors di seed.ts/scripts/* adalah pre-existing) |
| Frontend `tsc` | 0 errors |
| Frontend ESLint | 0 warnings |
| Frontend `npm run build` | 2112 modules, sukses |
