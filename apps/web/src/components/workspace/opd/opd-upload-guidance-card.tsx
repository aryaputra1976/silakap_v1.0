import { FileCheck2, Info } from 'lucide-react';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';

export function OpdUploadGuidanceCard() {
  return (
    <SectionCard
      title="Panduan Bukti Dukung"
      description="Dokumen OPD akan diverifikasi PPIK sebelum dipakai sebagai bukti final."
      actions={<StatusBadge value="Tidak otomatis jadi realisasi" tone="warning" />}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-[#d8e5d3] bg-white p-4">
          <FileCheck2 className="mt-0.5 size-5 shrink-0 text-[#0f766e]" />
          <div>
            <div className="text-sm font-semibold text-[#173c36]">
              Format yang disarankan
            </div>
            <p className="mt-1 text-sm leading-6 text-[#687967]">
              Gunakan PDF, JPG, atau PNG yang jelas dibaca. Beri nama file yang
              memuat jenis layanan dan nama ASN terkait.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-[#d8e5d3] bg-white p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-[#096672]" />
          <div>
            <div className="text-sm font-semibold text-[#173c36]">
              Status dokumen
            </div>
            <p className="mt-1 text-sm leading-6 text-[#687967]">
              Dokumen dapat berstatus Terunggah, Perlu Perbaikan, atau
              Diverifikasi setelah petugas internal memeriksa kelengkapan.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
