import { RefreshCcw, Loader2, Users } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/workspace/ui';
import { useRekapPegawai } from '@/lib/siformen/hooks';

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-medium text-muted-foreground">{pct}%</span>
    </div>
  );
}

const TIPE_COLORS: Record<string, string> = {
  PNS: 'bg-blue-500',
  PPPK: 'bg-purple-500',
};

export function SiformenRekapPegawaiPage() {
  const { data, isLoading, error, refetch } = useRekapPegawai();

  const errMsg = (error as Error)?.message ?? '';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rekap Pegawai"
        description="Kondisi eksisting pegawai aktif berdasarkan tipe kepegawaian dan jenis jabatan"
        actions={
          <ActionButton
            icon={isLoading ? Loader2 : RefreshCcw}
            variant="secondary"
            disabled={isLoading}
            onClick={() => refetch()}
          />
        }
      />

      {errMsg ? <ErrorAlert message={errMsg} /> : null}

      {isLoading ? (
        <LoadingState label="Memuat data rekap pegawai" />
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Total Pegawai Aktif"
              value={data.totalAktif.toLocaleString('id')}
              tone="info"
              icon={Users}
              description="PNS + PPPK aktif"
            />
            {data.byTipePegawai.slice(0, 2).map((t) => (
              <StatCard
                key={t.tipe}
                label={t.tipe}
                value={t.count.toLocaleString('id')}
                tone={t.tipe === 'PNS' ? 'neutral' : 'warning'}
                icon={Users}
                description={`${data.totalAktif > 0 ? Math.round((t.count / data.totalAktif) * 100) : 0}% dari total`}
              />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard
              title="Distribusi per Tipe Pegawai"
              description={`Total ${data.totalAktif.toLocaleString('id')} pegawai aktif`}
            >
              <div className="space-y-3">
                {data.byTipePegawai.map((t) => (
                  <div key={t.tipe}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">{t.tipe || 'Tidak Diketahui'}</span>
                      <span className="font-medium text-foreground">{t.count.toLocaleString('id')}</span>
                    </div>
                    <ProgressBar value={t.count} max={data.totalAktif} color={TIPE_COLORS[t.tipe] ?? 'bg-slate-400'} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Distribusi per Jenis Jabatan"
              description="Berdasarkan data SIASN"
            >
              <div className="space-y-3">
                {data.byJenisJabatan.slice(0, 10).map((j) => (
                  <div key={j.jenis}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground text-xs">{j.jenis || 'Tidak Diketahui'}</span>
                      <span className="font-medium text-foreground">{j.count.toLocaleString('id')}</span>
                    </div>
                    <ProgressBar value={j.count} max={data.totalAktif} color="bg-indigo-400" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Detail per Jenis Jabatan" description="Semua jenis jabatan">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase w-10">No</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase">Jenis Jabatan</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase text-right">Jumlah</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byJenisJabatan.map((j, i) => (
                    <tr key={j.jenis} className={`border-b border-border/50 ${i % 2 !== 0 ? 'bg-muted/20' : ''}`}>
                      <td className="py-1.5 px-3 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-1.5 px-3 text-sm text-foreground">{j.jenis || 'Tidak Diketahui'}</td>
                      <td className="py-1.5 px-3 text-sm font-medium text-right text-foreground">{j.count.toLocaleString('id')}</td>
                      <td className="py-1.5 px-3 text-xs text-right text-muted-foreground">
                        {data.totalAktif > 0 ? `${Math.round((j.count / data.totalAktif) * 100)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                    <td colSpan={2} className="py-2 px-3 text-sm text-foreground">Total</td>
                    <td className="py-2 px-3 text-sm text-right text-foreground">{data.totalAktif.toLocaleString('id')}</td>
                    <td className="py-2 px-3 text-xs text-right text-muted-foreground">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
