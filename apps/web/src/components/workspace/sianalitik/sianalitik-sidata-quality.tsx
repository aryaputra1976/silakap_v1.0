import { Link } from 'react-router-dom';
import { SectionCard } from '@/components/workspace/ui';
import type { SidataAsnQualityDashboard } from '@/lib/api/sidata';

interface Props {
  quality: SidataAsnQualityDashboard;
}

function QualityGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-[#087052]' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
  const bg =
    score >= 80
      ? 'bg-[#087052]'
      : score >= 60
        ? 'bg-amber-500'
        : 'bg-rose-500';

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className={`text-4xl font-bold ${color}`}>{score}%</div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${bg}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">Skor Kualitas Data ASN</p>
    </div>
  );
}

export function SianalitikSidataQuality({ quality }: Props) {
  const { totals, quality: q, retirement, completeness } = quality;
  const issueItems = [
    { label: 'Tanpa Unit Kerja', count: completeness.withoutUnitKerja },
    { label: 'Tanpa Jabatan', count: completeness.withoutJabatan },
    { label: 'Tanpa Golongan', count: completeness.withoutGolongan },
    { label: 'Tanpa NIK', count: completeness.withoutNik },
    { label: 'Tanpa Tgl Lahir', count: completeness.withoutTanggalLahir },
    { label: 'Tanpa TMT Pensiun', count: completeness.withoutTmtPensiun },
  ].filter((item) => item.count > 0);

  return (
    <SectionCard title="Kualitas Data SIDATA" className="flex flex-col gap-4">
      <QualityGauge score={q.qualityScore} />

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded border border-slate-100 bg-slate-50 p-2">
          <p className="font-bold text-slate-700">{totals.totalAsn}</p>
          <p className="text-xs text-slate-400">Total ASN</p>
        </div>
        <div className="rounded border border-[#d6e2d1] bg-[#f4f8ef] p-2">
          <p className="font-bold text-[#1e4620]">{q.completeCoreRows}</p>
          <p className="text-xs text-[#51614c]">Data Lengkap</p>
        </div>
        <div className="rounded border border-rose-100 bg-rose-50 p-2">
          <p className="font-bold text-rose-700">{q.issueRows}</p>
          <p className="text-xs text-rose-500">Ada Masalah</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="mb-1.5 text-xs font-semibold text-amber-800">Pensiun BUP Mendatang</p>
        <div className="flex justify-between text-sm">
          <span className="text-amber-700">12 bulan ke depan</span>
          <span className="font-bold text-amber-800">{retirement.bupNext12Months} orang</span>
        </div>
        {retirement.bupOverdueActive > 0 && (
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-rose-700">Melewati BUP (masih aktif)</span>
            <span className="font-bold text-rose-700">{retirement.bupOverdueActive} orang</span>
          </div>
        )}
      </div>

      {issueItems.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
          <p className="text-xs font-medium text-slate-500">Isu Kelengkapan Data</p>
          {issueItems.slice(0, 4).map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-medium text-rose-600">{item.count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 pt-2">
        <Link to="/sidata" className="text-xs font-medium text-[#087052] hover:underline">
          Kelola data SIDATA →
        </Link>
      </div>
    </SectionCard>
  );
}
