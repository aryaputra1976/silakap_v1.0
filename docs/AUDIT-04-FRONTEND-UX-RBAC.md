
# AUDIT-04 - Frontend UX dan RBAC SILAKAP v1.0

Tanggal audit: 2026-05-28

---

## 1. Kondisi Aktual Frontend

Frontend memakai React + Vite + TypeScript + Tailwind. Build script menjalankan:

```text
tsc && vite build
```

Halaman OPD Submission detail sudah menampilkan aksi yang benar untuk OPD:

- `DRAFT` -> `Kirim Permohonan`
- `NEEDS_CORRECTION` -> `Kirim Perbaikan`
- status `SUBMITTED` ke atas tidak menampilkan tombol submit.

Halaman SIAP Tasks sudah menyediakan:

- daftar tugas;
- filter status;
- filter jenis tugas;
- tombol mulai;
- tombol selesai;
- summary keterlambatan;
- tombol cek keterlambatan untuk role tertentu.

---

## 2. Temuan UX/RBAC

### P0 - UI harus mengikuti backend, bukan menentukan kewenangan sendiri

Frontend boleh menyembunyikan tombol, tetapi backend tetap harus menjadi sumber kebenaran. Karena role assignment backend masih terlalu luas, frontend juga berisiko mengikuti pola kewenangan yang salah.

### P1 - Halaman SIAP Tasks belum membedakan mode kerja

Disarankan dipisahkan secara UX:

1. **Tugas Saya**  
   Untuk pelaksana teknis. Default page untuk Analis Pertama Pool.

2. **Supervisi Tim**  
   Untuk Kabid/Analis Madya melihat beban, progress, SLA, dan reassign jika perlu.

3. **Dashboard Pemerataan**  
   Untuk melihat distribusi beban dan jenis layanan.

4. **Administrasi Teknis**  
   Untuk Super Admin/Admin teknis, tetapi bukan untuk aksi bisnis rutin.

### P1 - Tombol `Tugaskan` harus sangat terbatas

Tombol `Tugaskan` tidak boleh tampil untuk:

- `ADMIN_BKPSDM`;
- `ANALIS_MUDA`;
- `ANALIS_PERTAMA`;
- `PENELAAH`;
- `PPPK`;
- `OPD`.

Tombol hanya boleh tampil untuk:

- `KABID` dalam mode reassign/escalation;
- `ANALIS_MADYA` jika ada delegasi;
- `SUPER_ADMIN` untuk emergency teknis.

---

## 3. Rekomendasi UX

### 3.1 OPD Submission Detail

Pertahankan pola tombol yang sudah benar:

- `Kirim Permohonan` untuk draft;
- `Kirim Perbaikan` untuk perbaikan;
- tidak ada submit ulang setelah status berjalan.

Tambahkan jika perlu:

- badge “Sudah masuk SIAP”;
- nama/tahap petugas teknis jika boleh ditampilkan;
- status SLA internal secara ringkas.

### 3.2 SIAP Tasks

Tambahkan tab:

```text
[Tugas Saya] [Supervisi] [Pemerataan] [Terlambat]
```

Default:

- Analis Pertama/Penelaah/PPPK Analis Pertama -> `Tugas Saya`;
- Analis Muda -> `Tugas Saya` atau review sesuai workflow;
- Analis Madya -> `Supervisi`;
- Kabid -> `Supervisi` dan `Pemerataan`;
- Admin BKPSDM -> tidak diarahkan ke penugasan bisnis;
- Super Admin -> administrasi dan emergency.

### 3.3 Dashboard Pemerataan

Komponen minimal:

| Komponen | Isi |
|---|---|
| Kartu ringkasan | total aktif, terlambat, selesai bulan ini |
| Tabel beban pegawai | nama, role, aktif, selesai, terlambat, skor |
| Grafik distribusi layanan | jenis layanan per pegawai |
| Alert imbalance | pegawai overload/underload |
| Rekomendasi sistem | kandidat reassign jika overload |

---

## 4. Kontrak Backend yang Dibutuhkan Frontend

Endpoint yang disarankan:

```text
GET /api/v1/siap/workload
GET /api/v1/siap/tasks/my
GET /api/v1/siap/tasks/team
POST /api/v1/siap/tasks/:id/assign
```

Tambahan response action rights:

```ts
{
  canStart: boolean;
  canComplete: boolean;
  canReturn: boolean;
  canReassign: boolean;
  canEscalate: boolean;
}
```

Dengan ini frontend tidak perlu menebak role.

---

## 5. Prioritas Frontend

| Prioritas | Patch | Catatan |
|---|---|---|
| P0 | Sembunyikan tombol assign dari role yang tidak boleh | Setelah backend RBAC dipatch |
| P1 | Buat tab Tugas Saya/Supervisi/Pemerataan | Setelah endpoint workload tersedia |
| P1 | Tambah status auto-assigned pada detail SIAP/OPD | Agar OPD dan internal memahami progress |
| P2 | Tambah visual distribusi jenis layanan | Untuk pembelajaran merata staf |
| P3 | Rapikan label state `VERIFIKASI_ADMIN` jika diganti menjadi `VERIFIKASI_AWAL` | Bisa bertahap untuk kompatibilitas |
