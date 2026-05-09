# RBAC Matrix

## 1. Role Standard

| Role | Fungsi |
|---|---|
| SUPER_ADMIN | administrasi sistem |
| ADMIN_BKPSDM | konfigurasi |
| KEPALA_BADAN | strategic monitoring |
| KABID | operational control |
| ANALIS_MADYA | QC |
| ANALIS_MUDA | validator |
| ANALIS_PERTAMA | verifikasi |
| PENELAAH | support |
| PPPK | support |
| OPD_OPERATOR | submit layanan |
| ASN | self-service |

---

## 2. Permission Action

| Action | Fungsi |
|---|---|
| VIEW | melihat |
| CREATE | membuat |
| UPDATE | mengubah |
| APPROVE | menyetujui |
| ASSIGN | membagi task |
| RETURN | mengembalikan/revisi |
| REJECT | menolak |
| EXPORT | export data |
| ARCHIVE | arsip |
| CONFIGURE | konfigurasi |

---

## 3. Role Matrix

| Role | View | Create | Update | Approve | Assign | Export | Configure |
|---|---|---|---|---|---|---|---|
| ASN | ✓ | ✓ | ✓ | - | - | - | - |
| OPD_OPERATOR | ✓ | ✓ | ✓ | - | - | ✓ | - |
| ANALIS_PERTAMA | ✓ | - | ✓ | - | - | ✓ | - |
| ANALIS_MUDA | ✓ | - | ✓ | ✓ | ✓ | ✓ | - |
| ANALIS_MADYA | ✓ | - | ✓ | ✓ | ✓ | ✓ | - |
| KABID | ✓ | - | ✓ | ✓ | ✓ | ✓ | - |
| KEPALA_BADAN | ✓ | - | - | ✓ | - | ✓ | - |
| ADMIN_BKPSDM | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 4. Scope Rule

Akses data wajib dibatasi berdasarkan:

- role
- unit organisasi
- ownership task
- service type
- authority level

---

## 5. Special Rule

- ASN hanya melihat layanan miliknya.
- OPD hanya melihat ASN dalam unitnya.
- Kabid melihat seluruh layanan bidang.
- Kepala Badan melihat dashboard strategis lintas bidang.
- Admin tidak otomatis boleh approve layanan bisnis.
