import type { KinerjaRhkPrintSummary } from '@/lib/kinerja-executive-report/types';

function scoreColor(score: number): string {
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#d97706';
  if (score >= 50) return '#ea580c';
  return '#dc2626';
}

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

export function KinerjaExecutiveReportPrint({ summary }: { summary: KinerjaRhkPrintSummary }) {
  const genDate = new Date(summary.generatedAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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
      <div
        style={{
          textAlign: 'center',
          borderBottom: '3px double #000',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
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
        <p
          style={{
            fontWeight: 'bold',
            fontSize: '14pt',
            textDecoration: 'underline',
            margin: '4px 0',
          }}
        >
          {summary.title}
        </p>
        <p style={{ fontSize: '11pt', margin: '4px 0' }}>Periode: {summary.periodLabel}</p>
        <p style={{ fontSize: '10pt', color: '#555', margin: '2px 0' }}>Dibuat: {genDate}</p>
      </div>

      {/* I. RINGKASAN EKSEKUTIF */}
      <Section num="I" title="RINGKASAN EKSEKUTIF">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <tbody>
            {[
              ['Total RHK', String(summary.totalRhk)],
              ['Total Realisasi', String(summary.totalRealizations)],
              [
                'Rata-rata Skor Akhir',
                <span key="score" style={{ fontWeight: 'bold', color: scoreColor(summary.averageFinalScore) }}>
                  {summary.averageFinalScore}%
                </span>,
              ],
            ].map(([label, value]) => (
              <tr key={String(label)}>
                <td style={{ padding: '4px 8px', width: '55%' }}>{label}</td>
                <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>: {value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: '8px', fontSize: '11pt', lineHeight: 1.6 }}>
          {summary.narrativeSummary}
        </p>
      </Section>

      {/* II. TABEL CAPAIAN RHK */}
      <Section num="II" title="TABEL CAPAIAN REALISASI RHK">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              {['No.', 'Kode RHK', 'Judul Realisasi', 'Modul', 'Skor', 'Bukti'].map((h) => (
                <th
                  key={h}
                  style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.achievements.map((a, idx) => (
              <tr key={a.id}>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>
                  {idx + 1}
                </td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '3px 6px',
                    fontFamily: 'monospace',
                    fontSize: '9pt',
                  }}
                >
                  {a.rhkCode}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{a.title}</td>
                <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{a.moduleKey}</td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '3px 6px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: scoreColor(a.finalScore),
                  }}
                >
                  {a.finalScore}%
                </td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '3px 6px',
                    textAlign: 'center',
                    color: scoreColor(a.evidenceScore),
                  }}
                >
                  {a.evidenceScore}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* III. TEMUAN & MASALAH */}
      {summary.issues.length > 0 ? (
        <Section num="III" title="CATATAN MASALAH">
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            {summary.issues.map((issue) => (
              <li key={issue.realizationId} style={{ marginBottom: '4px', fontSize: '11pt' }}>
                <strong>{issue.title}</strong>: {issue.note}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* IV. REKOMENDASI */}
      <Section num={summary.issues.length > 0 ? 'IV' : 'III'} title="REKOMENDASI TINDAK LANJUT">
        <ol style={{ paddingLeft: '20px', margin: 0 }}>
          {summary.recommendedFollowUp.map((rec, i) => (
            <li key={i} style={{ marginBottom: '4px', fontSize: '11pt' }}>
              {rec}
            </li>
          ))}
        </ol>
      </Section>

      {/* TANDA TANGAN */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <SignatureBlock role="Kepala Bidang PPIK" />
        <SignatureBlock role="Kepala Badan BKPSDM" />
      </div>
    </div>
  );
}
