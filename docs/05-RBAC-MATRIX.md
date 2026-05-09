# 05-RBAC-MATRIX.md

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
| EXPORT | export data |
| ARCHIVE | arsip |

---

## 3. Role Matrix

| Role | View | Create | Update | Approve |
|---|---|---|---|---|
| ASN | ✓ | ✓ | ✓ | - |
| OPD | ✓ | ✓ | ✓ | - |
| Pertama | ✓ | - | ✓ | - |
| Muda | ✓ | - | ✓ | ✓ |
| Madya | ✓ | - | ✓ | ✓ |
| Kabid | ✓ | - | ✓ | ✓ |

---