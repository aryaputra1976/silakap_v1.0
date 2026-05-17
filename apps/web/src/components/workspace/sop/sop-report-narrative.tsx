import { FileText } from 'lucide-react';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';
import type { SopReportNarrative as SopReportNarrativeValue } from '@/lib/sop/sop-report-data';

export function SopReportNarrative({
  narrative,
}: {
  narrative: SopReportNarrativeValue;
}) {
  return (
    <SectionCard
      className="min-w-0"
      title="Draft Narasi Laporan"
      description="Narasi awal yang dapat digunakan sebagai bahan laporan Kabid kepada Kepala Badan."
      actions={<StatusBadge value="Draft Otomatis" tone="info" />}
    >
      <article className="min-w-0 space-y-5 overflow-hidden rounded-lg border border-[#d8e5d3] bg-white p-5 text-sm leading-7 text-[#40533c]">
        <header className="border-b border-[#d8e5d3] pb-4">
          <div className="mb-2 flex min-w-0 items-center gap-2 text-[#173c36]">
            <FileText className="size-5" />
            <h2 className="min-w-0 break-words text-lg font-semibold">{narrative.title}</h2>
          </div>
          <p className="break-words">{narrative.opening}</p>
        </header>

        <section>
          <h3 className="mb-1 font-semibold text-[#173c36]">A. Capaian Pelaksanaan</h3>
          <p className="break-words">{narrative.achievement}</p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-[#173c36]">B. Kendala dan Permasalahan</h3>
          <p className="break-words">{narrative.constraints}</p>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-[#173c36]">C. Tindak Lanjut</h3>
          <p className="break-words">{narrative.followUp}</p>
        </section>

        <section>
          <h3 className="mb-2 font-semibold text-[#173c36]">D. Rekomendasi</h3>
          <ol className="list-decimal space-y-1 ps-5">
            {narrative.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-1 font-semibold text-[#173c36]">E. Penutup</h3>
          <p className="break-words">{narrative.closing}</p>
        </section>
      </article>
    </SectionCard>
  );
}
