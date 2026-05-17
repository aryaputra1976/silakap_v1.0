import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, CheckCircle2, Clock, AlertTriangle, ThumbsUp } from 'lucide-react';
import { LAYANAN_SOP_LIST } from '@/lib/layanan/layanan-data';

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  route: string;
  sopCode: string;
  rhkCodes: string[];
  colorClass: string;
  iconColorClass: string;
}

const CARD_DATA: SummaryCardProps[] = [
  {
    icon: ClipboardList,
    label: 'Permohonan Masuk',
    description: LAYANAN_SOP_LIST[0].description,
    route: '/layanan',
    sopCode: LAYANAN_SOP_LIST[0].code,
    rhkCodes: LAYANAN_SOP_LIST[0].rhkCodes,
    colorClass: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    iconColorClass: 'text-blue-600 bg-blue-100',
  },
  {
    icon: CheckCircle2,
    label: 'Verifikasi Berkas',
    description: LAYANAN_SOP_LIST[1].description,
    route: '/layanan/verifikasi',
    sopCode: LAYANAN_SOP_LIST[1].code,
    rhkCodes: LAYANAN_SOP_LIST[1].rhkCodes,
    colorClass: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400',
    iconColorClass: 'text-emerald-600 bg-emerald-100',
  },
  {
    icon: Clock,
    label: 'Monitoring SLA',
    description: LAYANAN_SOP_LIST[2].description,
    route: '/layanan/sla',
    sopCode: LAYANAN_SOP_LIST[2].code,
    rhkCodes: LAYANAN_SOP_LIST[2].rhkCodes,
    colorClass: 'border-amber-200 bg-amber-50 hover:border-amber-400',
    iconColorClass: 'text-amber-600 bg-amber-100',
  },
  {
    icon: AlertTriangle,
    label: 'Keterlambatan',
    description: LAYANAN_SOP_LIST[3].description,
    route: '/layanan/keterlambatan',
    sopCode: LAYANAN_SOP_LIST[3].code,
    rhkCodes: LAYANAN_SOP_LIST[3].rhkCodes,
    colorClass: 'border-red-200 bg-red-50 hover:border-red-400',
    iconColorClass: 'text-red-600 bg-red-100',
  },
  {
    icon: ThumbsUp,
    label: 'Kepuasan Layanan',
    description: LAYANAN_SOP_LIST[4].description,
    route: '/layanan/kepuasan',
    sopCode: LAYANAN_SOP_LIST[4].code,
    rhkCodes: LAYANAN_SOP_LIST[4].rhkCodes,
    colorClass: 'border-purple-200 bg-purple-50 hover:border-purple-400',
    iconColorClass: 'text-purple-600 bg-purple-100',
  },
];

export function LayananSummaryCards() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CARD_DATA.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.route}
            type="button"
            onClick={() => navigate(card.route)}
            className={`group flex cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-colors ${card.colorClass}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`inline-flex items-center justify-center rounded-md p-1.5 ${card.iconColorClass}`}>
                <Icon className="h-4 w-4" />
              </span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{card.label}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">{card.description}</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-xs text-zinc-500">
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-zinc-600">{card.sopCode}</span>
              <span>{card.rhkCodes.slice(0, 2).join(', ')}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
