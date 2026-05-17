import {
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { LayananSatisfactionPanel } from '@/components/workspace/layanan/layanan-satisfaction-panel';
import { LayananSopPanel } from '@/components/workspace/layanan/layanan-sop-panel';
import { getLayananSopConfig } from '@/lib/layanan/layanan-data';

const sopConfig = getLayananSopConfig('LAY-005');

export function LayananSatisfactionPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Evaluasi Kepuasan Layanan"
        description={sopConfig?.description ?? 'Evaluasi kepuasan pengguna layanan dan rekomendasi perbaikan.'}
        meta={
          <>
            <StatusBadge value="LAY-005" tone="info" />
            <StatusBadge value="Semesteran" tone="neutral" />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <SectionCard
            title="Indeks Kepuasan Masyarakat (IKM)"
            description="Data evaluasi kepuasan layanan kepegawaian periode berjalan."
          >
            <LayananSatisfactionPanel />
          </SectionCard>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-semibold text-zinc-900">Alur Evaluasi Kepuasan (LAY-005)</p>
            <ol className="mt-4 space-y-3">
              {sopConfig?.lifecycle.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 text-xs font-semibold text-zinc-500">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{step.label}</p>
                    <p className="text-xs text-zinc-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          {sopConfig && <LayananSopPanel sops={[sopConfig]} title="SOP Evaluasi Kepuasan" />}
        </div>
      </div>
    </div>
  );
}
