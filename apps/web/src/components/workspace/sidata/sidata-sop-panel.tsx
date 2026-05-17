import { useNavigate } from 'react-router-dom';
import { ExternalLink, FileText } from 'lucide-react';
import type { SidataSopConfig } from '@/lib/sidata/sidata-sop-data';

interface SidataSopPanelProps {
  sops: SidataSopConfig[];
  title?: string;
  compact?: boolean;
}

export function SidataSopPanel({ sops, title = 'SOP Terkait', compact = false }: SidataSopPanelProps) {
  const navigate = useNavigate();

  if (sops.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
        <FileText className="h-4 w-4 text-zinc-500" />
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <span className="ml-auto rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600">
          {sops.length} SOP
        </span>
      </div>

      <div className="divide-y divide-zinc-100">
        {sops.map((sop) => (
          <div key={sop.code} className={`flex items-start gap-3 px-4 ${compact ? 'py-2' : 'py-3'}`}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-zinc-500">{sop.code}</span>
                {sop.rhkCodes.map((rhk) => (
                  <span key={rhk} className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                    {rhk}
                  </span>
                ))}
              </div>
              {!compact && (
                <p className="mt-0.5 text-sm font-medium text-zinc-800">{sop.title}</p>
              )}
              {compact && (
                <p className="mt-0.5 text-xs font-medium text-zinc-700">{sop.shortLabel}</p>
              )}
              {!compact && (
                <p className="mt-0.5 text-xs text-zinc-500">{sop.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/dms/documents?${sop.dmsQuery}`)}
              className="flex shrink-0 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-800"
            >
              <ExternalLink className="h-3 w-3" />
              DMS
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
