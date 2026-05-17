import { Info } from 'lucide-react';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';

export function SopContextNote() {
  return (
    <SectionCard
      title="Konteks Modul Kinerja Bidang"
      description="Pembagian fungsi dibuat agar SOP/RHK, SIDATA, dan DMS tidak tercampur."
      className="no-print"
    >
      <div className="grid gap-4 text-sm leading-6 text-[#51614c] xl:grid-cols-3">
        <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[#173c36]">
            <Info className="size-4 text-[#0f766e]" />
            Kinerja Bidang
          </div>
          <p>
            Berisi SOP Bidang PPIK, RHK, target, monitoring realisasi, bukti
            dukung, dan laporan kinerja bidang.
          </p>
          <div className="mt-3">
            <StatusBadge value="SOP & RHK" tone="dark" />
          </div>
        </div>

        <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[#173c36]">
            <Info className="size-4 text-[#0f766e]" />
            SIDATA ASN
          </div>
          <p>
            Berisi data ASN, pemutakhiran, rekonsiliasi, dan kegiatan
            Pengelolaan DMS & Data Kepegawaian.
          </p>
          <div className="mt-3">
            <StatusBadge value="Data ASN" tone="info" />
          </div>
        </div>

        <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[#173c36]">
            <Info className="size-4 text-[#0f766e]" />
            DMS Bukti Dukung
          </div>
          <p>
            Berfungsi sebagai repository bukti dukung, laporan, nota dinas,
            dan dokumen pendukung kegiatan bidang.
          </p>
          <div className="mt-3">
            <StatusBadge value="Bukti Dukung" tone="success" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
