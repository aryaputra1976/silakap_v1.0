import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, CheckCircle2, Clock, AlertTriangle, ThumbsUp } from 'lucide-react';
import { useLayananSopConfigs } from '@/lib/layanan/use-layanan-sop-configs';

const CARD_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; colorClass: string; iconColorClass: string }> = {
  'LAY-001': { icon: ClipboardList, colorClass: 'border-blue-200 bg-blue-50 hover:border-blue-400',     iconColorClass: 'text-blue-600 bg-blue-100' },
  'LAY-002': { icon: CheckCircle2,  colorClass: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400', iconColorClass: 'text-emerald-600 bg-emerald-100' },
  'LAY-003': { icon: Clock,         colorClass: 'border-amber-200 bg-amber-50 hover:border-amber-400',   iconColorClass: 'text-amber-600 bg-amber-100' },
  'LAY-004': { icon: AlertTriangle, colorClass: 'border-red-200 bg-red-50 hover:border-red-400',         iconColorClass: 'text-red-600 bg-red-100' },
  'LAY-005': { icon: ThumbsUp,      colorClass: 'border-purple-200 bg-purple-50 hover:border-purple-400', iconColorClass: 'text-purple-600 bg-purple-100' },
};

export function LayananSummaryCards() {
  const navigate = useNavigate();
  const { sops } = useLayananSopConfigs();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sops.map((sop) => {
        const style = CARD_STYLE[sop.key];
        if (!style) return null;
        const Icon = style.icon;
        return (
          <button
            key={sop.key}
            type="button"
            onClick={() => navigate(sop.pageRoute)}
            className={`group flex cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-colors ${style.colorClass}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`inline-flex items-center justify-center rounded-md p-1.5 ${style.iconColorClass}`}>
                <Icon className="h-4 w-4" />
              </span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{sop.shortLabel}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">{sop.description}</p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-xs text-zinc-500">
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-zinc-600">{sop.code}</span>
              <span>{sop.rhkCodes.slice(0, 2).join(', ')}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
