import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { SOP_STAGE_GROUPS, type SopItem } from '@/lib/sop/sop-data';

function getDetailPath(item: SopItem): string {
  if (item.code.startsWith('SOP-BKPSDM-MAN') || item.code.startsWith('SOP-BKPSDM-LAY')) {
    return '/kinerja-bidang/sop';
  }

  return `/kinerja-bidang/sop/${item.id}`;
}

export function SopStageMap() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {SOP_STAGE_GROUPS.map((stage) => (
        <section key={stage.stage} className={`rounded-xl border p-5 shadow-sm ${stage.toneClass}`}>
          <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-normal opacity-70">Tahap {stage.stage}</div>
              <h2 className="text-lg font-semibold">{stage.title}</h2>
              <p className="mt-1 max-w-4xl text-sm leading-6 opacity-80">{stage.description}</p>
            </div>
            <div className="text-sm font-semibold opacity-70">{stage.items.length} SOP</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {stage.items.map((item) => (
              <button
                key={item.id}
                className="group rounded-lg border border-current/20 bg-white/65 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                onClick={() => navigate(getDetailPath(item))}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-semibold leading-5">{item.title}</div>
                    <div className="mt-2 text-xs opacity-75">{item.rhkCodes.join(', ')}</div>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      <div className="rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4 text-sm leading-6 text-[#51614c] shadow-sm">
        <strong className="text-[#173c36]">Pola hubungan:</strong> Tahap 1 mengatur cara kerja bidang,
        Tahap 2 mengatur alur layanan, dan Tahap 3 mengeksekusi fungsi teknis yang langsung mendukung
        capaian RHK.
      </div>
    </div>
  );
}
