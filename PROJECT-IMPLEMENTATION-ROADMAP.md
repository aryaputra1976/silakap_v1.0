# PROJECT IMPLEMENTATION ROADMAP
## SILAKAP Government Workforce Operating System

## 1. Tujuan

Roadmap ini menjadi panduan implementasi teknis SILAKAP dari nol sampai modul pertama berjalan.

---

## 2. Prinsip Implementasi

- Core engine dibuat dulu
- Jangan langsung membuat semua modul
- SIPENSIUN menjadi pilot pertama
- Semua modul wajib memakai SIAP
- SIDATA menjadi sumber data ASN
- SIARSIP menjadi pusat dokumen
- SIANALITIK membaca data dari workflow, task, SLA, dan case

---

## 3. Phase 0 — Project Foundation

### Target

Menyiapkan fondasi project.

### Output

- monorepo/backend/frontend siap
- database siap
- environment siap
- auth dasar siap
- struktur folder enterprise siap

### Komponen

- Node.js / NestJS atau Express TypeScript
- Prisma ORM
- MySQL
- React / Next.js
- Tailwind
- RBAC dasar
- JWT auth
- audit field standar

---

## 4. Phase 1 — SIAP Core Engine

### Target

Membangun mesin utama sistem.

### Modul

- Case Management
- Workflow Engine
- Task Engine
- SLA Engine
- Assignment Engine
- Timeline Engine
- Audit Engine
- Notification dasar

### Output Minimal

- user bisa membuat case
- case bisa memiliki workflow
- workflow bisa berpindah status
- task otomatis terbentuk
- task bisa di-assign
- SLA bisa dihitung
- timeline tampil
- audit log tersimpan

---

## 5. Phase 2 — SIDATA Minimal

### Target

Menyediakan master data ASN.

### Modul

- ASN
- Unit Organisasi
- Jabatan
- Golongan
- Status ASN
- Riwayat dasar

### Output Minimal

- data ASN bisa dicari
- data ASN bisa dipakai oleh case
- layanan tidak menyimpan ulang data ASN

---

## 6. Phase 3 — SIPENSIUN Pilot

### Target

Menguji SIAP dengan domain nyata.

### Workflow

ASN / OPD submit  
↓  
OPD verifikasi  
↓  
BKPSDM validasi awal  
↓  
Validasi substansi  
↓  
QC  
↓  
Approval Kabid  
↓  
Generate dokumen  
↓  
Arsip  
↓  
Selesai  

### Output Minimal

- usulan pensiun dibuat
- dokumen syarat diupload
- workflow berjalan
- task muncul per role
- SLA berjalan
- approval berjalan
- arsip final tersimpan

---

## 7. Phase 4 — SIARSIP Basic

### Target

Menyediakan pengelolaan dokumen.

### Modul

- upload dokumen
- versioning
- klasifikasi dokumen
- preview dokumen
- arsip final case
- metadata dokumen

---

## 8. Phase 5 — Dashboard & Analytics Basic

### Target

Membuat control room awal.

### Dashboard

#### Kabid

- approval pending
- SLA merah
- backlog
- workload staf

#### Analis

- task pending
- task overdue
- revisi

#### OPD

- usulan aktif
- revisi
- status layanan

---

## 9. Phase 6 — SISURAT Integration

### Target

Menghubungkan output layanan dengan surat resmi.

### Fitur

- generate surat
- nomor surat
- disposisi
- TTE
- arsip surat final

---

## 10. Phase 7 — Automation & Event

### Target

Membuat sistem mulai proaktif.

### Event Awal

- ASN mendekati BUP
- SLA hampir habis
- task overdue
- approval selesai
- dokumen tidak lengkap

---

## 11. Phase 8 — Expansion Module

Setelah SIPENSIUN stabil, lanjut ke:

- SIUNDUR
- SIMUTASI
- SIKGB
- SIPROMOSI
- SIFORMASI

Semua memakai pola yang sama:

Case  
↓  
Workflow  
↓  
Task  
↓  
SLA  
↓  
Audit  
↓  
Arsip  
↓  
Analytics  

---

## 12. Prioritas Final

Urutan pengerjaan paling aman:

1. Project foundation
2. Auth + RBAC
3. SIDATA minimal
4. SIAP Case Engine
5. SIAP Workflow Engine
6. SIAP Task Engine
7. SLA + Audit + Timeline
8. SIPENSIUN pilot
9. SIARSIP
10. Dashboard Kabid
11. Automation
12. Modul lain

---

## 13. Kesimpulan

SILAKAP harus dibangun dari core engine, bukan dari fitur terpisah.

Fondasi utama:

- SIAP sebagai mesin kerja
- SIDATA sebagai sumber data
- SIARSIP sebagai memori dokumen
- SIPENSIUN sebagai pilot pertama
- SIANALITIK sebagai control room