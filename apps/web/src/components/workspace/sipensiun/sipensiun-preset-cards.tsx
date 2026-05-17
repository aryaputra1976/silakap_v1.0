import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SIPENSIUN_JENIS_LIST, type SipensiunJenisKey } from '@/lib/sipensiun/sipensiun-data';

const TONE_CLASSES: Record<string, { card: string; badge: string; arrow: string }> = {
  info: {
    card: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    badge: 'bg-blue-100 text-blue-800',
    arrow: 'text-blue-600',
  },
  success: {
    card: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800',
    arrow: 'text-emerald-600',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50 hover:border-amber-400',
    badge: 'bg-amber-100 text-amber-800',
    arrow: 'text-amber-600',
  },
  danger: {
    card: 'border-red-200 bg-red-50 hover:border-red-400',
    badge: 'bg-red-100 text-red-800',
    arrow: 'text-red-600',
  },
  neutral: {
    card: 'border-zinc-200 bg-zinc-50 hover:border-zinc-400',
    badge: 'bg-zinc-100 text-zinc-700',
    arrow: 'text-zinc-500',
  },
};

const JENIS_GROUPS: Array<{
  heading: string;
  keys: SipensiunJenisKey[];
}> = [
  {
    heading: 'Pensiun',
    keys: ['BUP', 'AHLI_WARIS'],
  },
  {
    heading: 'Pemberhentian ASN',
    keys: ['APS', 'TIDAK_CAKAP', 'MENINGGAL_TEWAS_HILANG', 'DISIPLIN_HUKUM', 'SEMENTARA', 'AKTIF_KEMBALI', 'PERAMPINGAN'],
  },
  {
    heading: 'Penyelesaian & Pemutakhiran',
    keys: ['PENYERAHAN', 'UPDATE_DATA'],
  },
];

export function SipensiunPresetCards() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {JENIS_GROUPS.map((group) => (
        <div key={group.heading}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {group.heading}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.keys.map((key) => {
              const config = SIPENSIUN_JENIS_LIST.find((item) => item.key === key);
              if (!config) return null;
              const cls = TONE_CLASSES[config.tone] ?? TONE_CLASSES.neutral;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => navigate(`/sipensiun?jenis=${key}`)}
                  className={`group flex cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-colors ${cls.card}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${cls.badge}`}>
                      {config.shortLabel}
                    </span>
                    <ArrowRight className={`mt-0.5 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${cls.arrow}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{config.label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">{config.description}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-zinc-600">
                      {config.rhkCode}
                    </span>
                    <span>{config.sops.length} SOP</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
