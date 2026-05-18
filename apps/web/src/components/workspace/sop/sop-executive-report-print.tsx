import type { SopExecutiveReport } from '@/lib/sop-reports/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopExecutiveReportPrintProps {
  report: SopExecutiveReport;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskLabel(level: string): string {
  const m: Record<string, string> = { LOW: 'Rendah', MEDIUM: 'Sedang', HIGH: 'Tinggi', CRITICAL: 'Kritis' };
  return m[level] ?? level;
}

function scoreCell(score: number): string {
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#d97706';
  if (score >= 50) return '#ea580c';
  return '#dc2626';
}

// ─── Print component (formal government layout) ────────────────────────────────

export function SopExecutiveReportPrint({ report }: SopExecutiveReportPrintProps) {
  const genDate = new Date(report.generatedAt).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div
      style={{
        fontFamily: 'Times New Roman, serif',
        fontSize: '12pt',
        color: '#000',
        padding: '20mm 25mm',
        maxWidth: '210mm',
        margin: '0 auto',
        lineHeight: 1.5,
      }}
    >
      {/* KOP SURAT */}
      <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '8px', marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '14pt', margin: 0 }}>PEMERINTAH DAERAH</p>
        <p style={{ fontWeight: 'bold', fontSize: '13pt', margin: '2px 0' }}>
          BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA
        </p>
        <p style={{ fontSize: '10pt', margin: '2px 0', color: '#555' }}>
          Bidang Pengembangan, Penilaian dan Informasi Kepegawaian (PPIK)
        </p>
      </div>

      {/* JUDUL */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '14pt', textDecoration: 'underline', margin: '4px 0' }}>
          LAPORAN KEPATUHAN SOP BIDANG PPIK
        </p>
        <p style={{ fontSize: '11pt', margin: '4px 0' }}>Periode: {report.periodLabel}</p>
        <p style={{ fontSize: '10pt', color: '#555', margin: '2px 0' }}>Dibuat: {genDate}</p>
      </div>

      {/* I. RINGKASAN EKSEKUTIF */}
      <Section num="I" title="RINGKASAN EKSEKUTIF">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <tbody>
            {[
              ['Skor Kepatuhan Keseluruhan', `${report.overallScore} / 100`],
              ['Total SOP Dipantau', String(report.totalSops)],
              ['SOP Risiko Rendah (≥85)', String(report.complianceSummary.lowRisk)],
              ['SOP Risiko Sedang (70–84)', String(report.complianceSummary.mediumRisk)],
              ['SOP Risiko Tinggi (50–69)', String(report.complianceSummary.highRisk)],
              ['SOP Kritis (<50)', String(report.complianceSummary.criticalRisk)],
              ['SOP Fully Approved', String(report.complianceSummary.fullyApproved)],
              ['Governance Aktif', `${report.governanceSummary.active} / ${report.governanceSummary.total}`],
              ['Review Overdue', String(report.reviewSummary.overdue)],
              ['Reminder Terbuka', String(report.reviewSummary.openReminders)],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ padding: '4px 8px', width: '55%' }}>{label}</td>
                <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>: {value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* II. TABEL COMPLIANCE PER SOP */}
      <Section num="II" title="TABEL KEPATUHAN PER SOP">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              {['No.', 'Kode SOP', 'Modul', 'Skor', 'Risiko', 'CL', 'APP', 'EVD', 'GOV', 'TMT'].map((h) => (
                <th key={h} style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...report.bySop].sort((a, b) => a.score - b.score).map((r, idx) => (
              <tr key={r.sopCode}>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9pt' }}>{r.sopCode}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{r.moduleKey}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', color: scoreCell(r.score) }}>{r.score}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{riskLabel(r.riskLevel)}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{r.checklistScore}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{r.approvalScore}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{r.evidenceScore}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{r.governanceScore}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{r.timelinessScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: '9pt', marginTop: '4px', color: '#555' }}>
          CL=Checklist(40) | APP=Approval(20) | EVD=Evidence(20) | GOV=Governance(10) | TMT=Timeliness(10)
        </p>
      </Section>

      {/* III. REKOMENDASI */}
      <Section num="III" title="REKOMENDASI TINDAKAN">
        <ol style={{ paddingLeft: '20px', margin: 0 }}>
          {report.recommendedActions.map((action, i) => (
            <li key={i} style={{ marginBottom: '4px', fontSize: '11pt' }}>{action}</li>
          ))}
        </ol>
      </Section>

      {/* IV. KESIMPULAN */}
      <Section num="IV" title="KESIMPULAN">
        <p style={{ fontSize: '11pt', margin: 0 }}>{report.conclusion}</p>
      </Section>

      {/* TANDA TANGAN */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <SignatureBlock role="Kepala Bidang PPIK" />
        <SignatureBlock role="Kepala Badan BKPSDM" />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontWeight: 'bold', fontSize: '12pt', margin: '0 0 8px' }}>
        {num}. {title}
      </p>
      {children}
    </div>
  );
}

function SignatureBlock({ role }: { role: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '160px' }}>
      <p style={{ fontSize: '11pt', margin: 0 }}>{role}</p>
      <div style={{ height: '60px' }} />
      <p style={{ fontSize: '11pt', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '4px', margin: 0 }}>
        ( ............................................................... )
      </p>
      <p style={{ fontSize: '10pt', margin: '2px 0 0', color: '#555' }}>NIP. ........................</p>
    </div>
  );
}
