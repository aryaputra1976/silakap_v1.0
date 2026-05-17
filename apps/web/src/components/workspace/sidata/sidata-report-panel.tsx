import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink, FileText, TargetIcon } from 'lucide-react';
import { SIDATA_SOP_LIST, getSopsByRhk } from '@/lib/sidata/sidata-sop-data';

interface RhkSectionProps {
  rhkCode: string;
  label: string;
  description: string;
}

function RhkSection({ rhkCode, label, description }: RhkSectionProps) {
  const navigate = useNavigate();
  const sops = getSopsByRhk(rhkCode);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
          <TargetIcon className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {sops.map((sop) => (
          <div key={sop.code} className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <div className="min-w-0 flex-1">
              <span className="font-mono text-xs text-zinc-500">{sop.code}</span>
              <span className="mx-1.5 text-zinc-400">·</span>
              <span className="text-xs text-zinc-700">{sop.shortLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/dms/documents?${sop.dmsQuery}`)}
              className="shrink-0 text-xs text-blue-600 hover:underline"
            >
              DMS
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/kinerja-bidang/realizations"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Input Realisasi {rhkCode}
        </Link>
        <Link
          to="/dms/documents?category=BUKTI_DUKUNG"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Bukti Dukung DMS
        </Link>
      </div>
    </div>
  );
}

export function SidataReportPanel() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900">Laporan RHK Terkait SIDATA</p>
        <p className="mt-1 text-xs text-zinc-500">
          Kaitkan hasil pemutakhiran dan sinkronisasi dengan realisasi RHK 5 dan RHK 6 di Kinerja Bidang.
        </p>
      </div>

      <RhkSection
        rhkCode="RHK 5"
        label="RHK 5 — Pengelolaan Sistem Informasi Kepegawaian"
        description="Laporan bulanan monitoring operasional SIDATA dan sinkronisasi SIASN/MySAPK."
      />

      <RhkSection
        rhkCode="RHK 6"
        label="RHK 6 — Pengendalian Pengelolaan Data ASN"
        description="Laporan bulanan pemutakhiran data ASN — kelengkapan, konsistensi, dan audit trail."
      />

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-700">SOP Referensi Lengkap</p>
        <div className="mt-2 space-y-1.5">
          {SIDATA_SOP_LIST.map((sop) => (
            <div key={sop.code} className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="font-mono text-zinc-400">{sop.code}</span>
              <span>·</span>
              <span>{sop.title}</span>
              <span className="ml-auto font-semibold text-blue-600">{sop.rhkCodes.join(', ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
