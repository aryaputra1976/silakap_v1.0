import { useEffect, useState } from 'react';
import { BarChart2, ThumbsUp, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ikmApi } from '@/lib/api/ikm';
import { IKM_UNSUR_LABELS, IkmSummary, IkmSurveyPeriod } from '@/lib/ikm/types';

function predikatTone(p: string): string {
  if (p === 'A') return 'text-emerald-600 bg-emerald-50';
  if (p === 'B') return 'text-blue-600 bg-blue-50';
  if (p === 'C') return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

export function LayananSatisfactionPanel() {
  const [periods, setPeriods] = useState<IkmSurveyPeriod[]>([]);
  const [summary, setSummary] = useState<IkmSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<IkmSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ikmApi.fetchPeriods().then(async (res) => {
      if (!res.success || res.data.length === 0) {
        setLoading(false);
        return;
      }
      const sorted = res.data.slice(); // already sorted desc by API
      setPeriods(sorted);

      const current = sorted[0];
      const prev = sorted[1] ?? null;

      try {
        const [curRes, prevRes] = await Promise.all([
          ikmApi.getSummary(current.id),
          prev ? ikmApi.getSummary(prev.id) : Promise.resolve(null),
        ]);
        if (curRes?.success) setSummary(curRes.data);
        if (prevRes?.success) setPrevSummary(prevRes.data);
      } catch {
        setError('Gagal memuat rekap IKM');
      } finally {
        setLoading(false);
      }
    }).catch(() => {
      setError('Gagal memuat periode IKM');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-zinc-400">
        Memuat data IKM...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!summary || summary.totalResponden === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
          <ThumbsUp className="mx-auto h-8 w-8 text-zinc-400" />
          <p className="mt-2 text-sm font-medium text-zinc-600">Belum Ada Data Survei</p>
          <p className="mt-1 text-xs text-zinc-500">
            {periods.length === 0
              ? 'Buat periode IKM terlebih dahulu di menu Manajemen Periode IKM.'
              : 'Belum ada responden yang mengisi survei untuk periode ini.'}
          </p>
          <Link
            to="/layanan/ikm/periode"
            className="mt-3 inline-block text-xs text-blue-600 underline"
          >
            Kelola Periode IKM →
          </Link>
        </div>
      </div>
    );
  }

  const trendDiff =
    prevSummary != null ? summary.avgIkmConvert - prevSummary.avgIkmConvert : null;

  const currentPeriod = periods[0];

  return (
    <div className="space-y-5">
      {/* 3 stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* IKM Score */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className={`inline-flex rounded-lg p-2 ${predikatTone(summary.predikat)}`}>
            <ThumbsUp className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">
            {summary.avgIkmConvert.toFixed(2)}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-700">Indeks Kepuasan (25–100)</p>
          <p className="mt-1 text-xs text-zinc-500">
            Predikat{' '}
            <span className="font-semibold text-zinc-700">{summary.predikat}</span> —{' '}
            {currentPeriod?.label}
          </p>
        </div>

        {/* Trend */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="inline-flex rounded-lg p-2 text-emerald-600 bg-emerald-50">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">
            {trendDiff != null
              ? `${trendDiff >= 0 ? '+' : ''}${trendDiff.toFixed(2)}`
              : '—'}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-700">Tren Kepuasan</p>
          <p className="mt-1 text-xs text-zinc-500">
            {trendDiff != null
              ? `Perbandingan vs periode sebelumnya`
              : 'Belum ada periode pembanding'}
          </p>
        </div>

        {/* Responden */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="inline-flex rounded-lg p-2 text-amber-600 bg-amber-50">
            <BarChart2 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">{summary.totalResponden}</p>
          <p className="mt-1 text-sm font-medium text-zinc-700">Jumlah Responden</p>
          <p className="mt-1 text-xs text-zinc-500">Total pengisian survei periode ini</p>
        </div>
      </div>

      {/* Avg per unsur bar chart (simple text bars) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800 mb-3">
          Rata-rata per Unsur (skala 1–4)
        </p>
        <div className="space-y-2">
          {Object.entries(IKM_UNSUR_LABELS).map(([key, label]) => {
            const val = summary.avgPerUnsur[key] ?? 0;
            const pct = ((val / 4) * 100).toFixed(0);
            return (
              <div key={key} className="grid grid-cols-[28px_1fr_40px] items-center gap-2">
                <span className="text-xs font-mono font-semibold text-zinc-500 uppercase">
                  {key}
                </span>
                <div className="h-2 w-full rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right text-xs text-zinc-700">{val.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Unsur terbaik:{' '}
          <span className="font-medium text-zinc-600">
            {Object.entries(summary.avgPerUnsur).reduce(
              (best, [k, v]) => (v > best[1] ? [k, v] : best),
              ['', 0],
            )[0].toUpperCase()}{' '}
            – {IKM_UNSUR_LABELS[Object.entries(summary.avgPerUnsur).reduce(
              (best, [k, v]) => (v > best[1] ? [k, v] : best),
              ['', 0],
            )[0]] ?? ''}
          </span>
        </p>
      </div>

      {/* Top OPD */}
      {summary.byOpd.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-800 mb-3">Top OPD per Nilai IKM</p>
          <div className="space-y-1">
            {summary.byOpd.slice(0, 5).map((o, i) => (
              <div key={o.opdName} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">
                  {i + 1}. {o.opdName}
                </span>
                <span className="font-semibold text-zinc-900">
                  {o.avgIkmConvert.toFixed(2)}
                  <span className="ml-1 text-xs text-zinc-400">({o.respondenCount})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-right">
        <Link
          to="/layanan/ikm/data"
          className="text-xs text-blue-600 underline"
        >
          Lihat semua data survei →
        </Link>
      </div>
    </div>
  );
}
