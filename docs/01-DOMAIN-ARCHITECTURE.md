# 01-DOMAIN-ARCHITECTURE.md

# Domain Architecture

## 1. Vision

SILAKAP adalah platform digital terpadu untuk pengelolaan ASN dan operasional BKPSDM.

Tujuan utama:

- digitalisasi birokrasi ASN
- standardisasi workflow
- pengendalian layanan
- analytics pemerintahan
- institutional knowledge

---

## 2. Domain Classification

### Core Platform Domain

| Domain | Fungsi |
|---|---|
| SIAP | workflow orchestration |
| SIDATA | master ASN |
| SIARSIP | arsip & DMS |
| SISURAT | surat & disposisi |
| SIANALITIK | dashboard & KPI |
| SIAUTH | identity & access |

---

### Business Service Domain

| Domain | Fungsi |
|---|---|
| SIPENSIUN | pensiun ASN |
| SIMUTASI | mutasi ASN |
| SIUNDUR | pengunduran diri |
| SIFORMASI | formasi ASN |
| SIPROMOSI | promosi jabatan |
| SIKGB | kenaikan gaji berkala |

---

## 3. Core Principles

### Core First

Semua layanan bisnis wajib menggunakan core platform.

### No Duplicate ASN Data

Data ASN hanya berasal dari SIDATA.

### Workflow Driven

Semua layanan wajib memiliki workflow.

### Task Oriented

Semua pekerjaan direpresentasikan sebagai task.

---

## 4. Domain Relationship

```text
                  SIANALITIK
                       ↑
                       |
SIDATA  ←→  SIAP  ←→  SIPENSIUN / SIMUTASI / SIUNDUR
  ↑           ↑              ↓
  |           |           SIARSIP
  |           |
SIFORMASI   SISURAT
```

---

## 5. SIAP Position

SIAP adalah orchestration layer.

Fungsi:

- workflow
- task
- assignment
- SLA
- escalation
- timeline
- audit

---

## 6. SIDATA Position

SIDATA adalah single source of truth untuk:

- ASN
- unit organisasi
- jabatan
- golongan
- riwayat
- status ASN

---

## 7. SIARSIP Position

SIARSIP adalah institutional memory.

Menyimpan:

- dokumen layanan
- regulasi
- SOP
- telaahan
- template
- arsip final

---

## 8. SIANALITIK Position

SIANALITIK adalah decision support system.

Fungsi:

- SLA monitoring
- workload monitoring
- bottleneck detection
- forecasting ASN
- KPI bidang

---

## 9. Dependency Rules

| Domain | Dependency |
|---|---|
| SIPENSIUN | SIAP, SIDATA, SIARSIP |
| SIMUTASI | SIAP, SIDATA |
| SIUNDUR | SIAP, SIDATA |
| SIFORMASI | SIDATA, SIANALITIK |
| SIAP | SIDATA, SIAUTH |

---

## 10. Conclusion

SILAKAP menggunakan pendekatan:

- modular monolith
- domain-oriented architecture
- workflow-driven system
- centralized governance

---