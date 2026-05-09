# SIPENSIUN Pilot Blueprint

## 1. Objective

SIPENSIUN menjadi domain pilot pertama untuk menguji:

- workflow engine
- task engine
- SLA
- approval
- arsip
- analytics
- event automation

---

## 2. Jenis Pensiun

| Kode | Jenis |
|---|---|
| BUP | Batas Usia Pensiun |
| APS | Atas Permintaan Sendiri |
| JDU | Janda / Duda |
| TWS | Tewas |
| SAK | Sakit |
| HLG | Hilang |
| PTDH | Pemberhentian Tidak Hormat |

---

## 3. Workflow SIPENSIUN

```text
ASN Submit
↓
OPD Verifikasi
↓
Checklist Admin
↓
Validasi Pertama
↓
Telaah Muda
↓
QC Madya
↓
Approval Kabid
↓
Generate Dokumen
↓
Arsip
↓
Completed
```

---

## 4. Required Document Example

| Jenis | Dokumen |
|---|---|
| BUP | SK terakhir |
| BUP | KP terakhir |
| BUP | Kartu Pegawai / Identitas |
| APS | surat permohonan |
| APS | SK CPNS/PNS |
| JDU | akta kematian |
| JDU | kartu keluarga |
| JDU | surat nikah |

---

## 5. Task Automation

| State | Task |
|---|---|
| SUBMITTED | Verifikasi OPD |
| VERIFIED_ADMIN | Validasi Pertama |
| VERIFIED_SUBSTANCE | QC Madya |
| QC | Approval Kabid |
| APPROVED | Generate Dokumen |
| COMPLETED | Arsip Final |

---

## 6. Role Mapping

| Tahap | Role |
|---|---|
| Submit | ASN / OPD |
| Verifikasi OPD | OPD_OPERATOR |
| Validasi awal | ANALIS_PERTAMA |
| Telaah substansi | ANALIS_MUDA |
| QC | ANALIS_MADYA |
| Approval | KABID |
| Arsip | PPPK / PENELAAH / System |

---

## 7. KPI SIPENSIUN

- SLA compliance
- average processing time
- return rate
- backlog pensiun
- pending per OPD
- pensiun selesai per bulan
- pensiun approaching BUP

---

## 8. Minimum Feature v1

- create usulan pensiun
- upload dokumen syarat
- checklist dokumen
- workflow action
- task per role
- SLA tracking
- approval Kabid
- arsip final
- dashboard basic
