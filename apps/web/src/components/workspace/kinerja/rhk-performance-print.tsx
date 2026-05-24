import type { KinerjaRhkPrintSummary } from '@/lib/kinerja-rhk-realizations/types';

export function RhkPerformancePrint({ summary }: { summary: KinerjaRhkPrintSummary }) {
  return (
    <div className="rounded-lg border border-[#cfe1da] bg-white p-5 text-sm text-[#18343a]">
      <div className="text-lg font-semibold">{summary.title}</div>
      <div className="mt-1 text-[#6d7e68]">{summary.periodLabel}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>Total RHK: {summary.totalRhk}</div>
        <div>Total Realisasi: {summary.totalRealizations}</div>
        <div>Skor Rata-rata: {summary.averageFinalScore}%</div>
      </div>
      <p className="mt-4 leading-6">{summary.narrativeSummary}</p>
      {summary.recommendedFollowUp.length > 0 ? (
        <div className="mt-4">
          <div className="font-semibold">Rekomendasi</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {summary.recommendedFollowUp.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
