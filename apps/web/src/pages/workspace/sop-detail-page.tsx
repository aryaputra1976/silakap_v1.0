import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BarChart3,
  FileCheck2,
  FileText,
  GitBranch,
  Printer,
  UploadCloud,
} from 'lucide-react';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  getSopDetail,
  type SopDetail,
  type SopProcedureStep,
  type SopSignature,
} from '@/lib/sop/sop-data';
import { getSopStageLabel, getSopStageTone } from '@/lib/sop/sop-ui';
import { SopEvidencePanel } from '@/components/workspace/sop/sop-evidence-panel';
import {
  SopDataSourceBadge,
  type SopDataSource,
} from '@/components/workspace/sop/sop-data-source-badge';
import { kinerjaBidangApi } from '@/lib/api/kinerja-bidang';
import { backendSopToSopDetail } from '@/lib/sop/sop-backend-adapter';

type DetailTab =
  | 'ringkasan'
  | 'target'
  | 'prosedur'
  | 'bukti'
  | 'tanda-tangan'
  | 'format-cetak';

const tabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'target', label: 'Target RHK' },
  { key: 'prosedur', label: 'Langkah Prosedur' },
  { key: 'bukti', label: 'Bukti Dukung' },
  { key: 'tanda-tangan', label: 'Tanda Tangan' },
  { key: 'format-cetak', label: 'Format Cetak' },
];

export function SopDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState<DetailTab>('ringkasan');
  const [backendSop, setBackendSop] = useState<SopDetail | null>(null);
  const [source, setSource] = useState<SopDataSource>('static');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const staticSop = useMemo(() => getSopDetail(id), [id]);
  const sop = backendSop ?? staticSop;

  const currentYear = String(new Date().getFullYear());

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        let result;

        try {
          result = await kinerjaBidangApi.getSop(id);
        } catch (initialError) {
          if (!staticSop?.code || staticSop.code === id) {
            throw initialError;
          }

          result = await kinerjaBidangApi.getSop(staticSop.code);
        }

        if (!mounted) {
          return;
        }

        setBackendSop(backendSopToSopDetail(result));
        setSource('backend');
      } catch (caught) {
        if (!mounted) {
          return;
        }

        setBackendSop(null);
        setSource('static');
        setError(
          caught instanceof Error
            ? caught.message
            : 'Detail backend belum tersedia untuk SOP ini.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [id, staticSop?.code]);

  if (loading && !sop) {
    return <LoadingState label="Memuat detail SOP" />;
  }

  if (!sop) {
    return <Navigate to="/kinerja-bidang/sop" replace />;
  }

  function handlePrint() {
    setActiveTab('format-cetak');

    window.setTimeout(() => {
      window.print();
    }, 150);
  }

  function openEvidenceUpload() {
    const primaryRhkCode = sop.rhkCodes[0] ?? '';
    const params = new URLSearchParams({
      source: 'sop-rhk',
      sopCode: sop.code,
      sopTitle: sop.title,
      year: currentYear,
    });

    if (primaryRhkCode) {
      params.set('rhkCode', primaryRhkCode);
    }

    navigate(`/dms/upload?${params.toString()}`);
  }

  return (
    <div className="print-page space-y-5">
      <div className="no-print">
        <PageHeader
          title={sop.title}
          description={sop.shortDescription}
          meta={
            <>
              <StatusBadge value={sop.code} tone="dark" />
              <StatusBadge
                value={getSopStageLabel(sop.stage)}
                tone={getSopStageTone(sop.stage)}
              />
              {sop.rhkCodes.map((rhk) => (
                <StatusBadge key={rhk} value={rhk} tone="info" />
              ))}
              <StatusBadge
                value={sop.isRhkPrimary ? 'SOP Utama RHK' : 'SOP Pendukung'}
                tone={sop.isRhkPrimary ? 'success' : 'neutral'}
              />
              <SopDataSourceBadge source={source} error={error} />
            </>
          }
          actions={
            <>
              <ActionButton
                variant="secondary"
                icon={ArrowLeft}
                onClick={() => navigate('/kinerja-bidang/sop')}
              >
                Kembali
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon={UploadCloud}
                onClick={openEvidenceUpload}
              >
                Upload Bukti
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon={GitBranch}
                onClick={() => navigate('/kinerja-bidang/sop/map')}
              >
                Peta SOP
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon={BarChart3}
                onClick={() => navigate('/kinerja-bidang/monitoring')}
              >
                Monitoring
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon={FileText}
                onClick={() => navigate('/kinerja-bidang/laporan')}
              >
                Laporan
              </ActionButton>
              <ActionButton icon={Printer} onClick={handlePrint}>
                Cetak SOP
              </ActionButton>
            </>
          }
        />
      </div>

      {error && !backendSop ? (
        <div className="no-print">
          <ErrorAlert
            message={`${error} Halaman memakai detail statis sebagai cadangan agar pengguna tetap bisa membaca SOP.`}
          />
        </div>
      ) : null}

      <div className="no-print grid gap-4 md:grid-cols-3">
        <StatCard
          label="Target Kuantitas"
          value={`${sop.targetQuantity} ${sop.targetUnit}`}
          icon={FileCheck2}
        />
        <StatCard
          label="Target Kualitas"
          value={sop.qualityTarget}
          icon={FileCheck2}
          tone="success"
        />
        <StatCard
          label="Target Waktu"
          value={sop.timeTarget}
          icon={FileCheck2}
          tone="info"
        />
      </div>

      <div className="no-print">
        <SectionCard>
          <div className="mb-5 flex flex-wrap gap-2 border-b border-[#d8e5d3] pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'border-[#0f766e] bg-[#0f766e] text-white'
                    : 'border-[#c9d9c4] bg-white text-[#173c36] hover:bg-[#eef7ec]'
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'ringkasan' ? <SopSummaryTab sop={sop} /> : null}

          {activeTab === 'target' ? <SopTargetTab sop={sop} /> : null}

          {activeTab === 'prosedur' ? <SopProcedureTab sop={sop} /> : null}

          {activeTab === 'bukti' ? <SopEvidencePanel sop={sop} /> : null}

          {activeTab === 'tanda-tangan' ? <SopSignatureTab sop={sop} /> : null}

          {activeTab === 'format-cetak' ? (
            <SopOfficialPrintView sop={sop} />
          ) : null}

          {!activeTab ? <EmptyState title="Tab tidak tersedia" /> : null}
        </SectionCard>
      </div>

      <div className="hidden print:block">
        <SopOfficialPrintView sop={sop} />
      </div>
    </div>
  );
}

function SopSummaryTab({ sop }: { sop: SopDetail }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase text-[#173c36]">
          Dasar Hukum
        </h3>
        <ul className="space-y-2 text-sm leading-6 text-[#51614c]">
          {sop.legalBasis.map((item) => (
            <li
              key={item}
              className="rounded-md border border-[#d8e5d3] bg-white px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-[#173c36]">
            Tujuan
          </h3>
          <p className="rounded-md border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
            {sop.objective}
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-[#173c36]">
            Ruang Lingkup
          </h3>
          <p className="rounded-md border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
            {sop.scope}
          </p>
        </div>
      </div>
    </div>
  );
}

function SopTargetTab({ sop }: { sop: SopDetail }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="RHK Terkait" value={sop.rhkCodes.join(', ')} />
      <StatCard
        label="Kuantitas"
        value={`${sop.targetQuantity} ${sop.targetUnit}`}
      />
      <StatCard label="Kualitas" value={sop.qualityTarget} />
      <StatCard label="Waktu" value={sop.timeTarget} />
      <StatCard label="Tahap SOP" value={getSopStageLabel(sop.stage)} />
      <StatCard
        label="Jenis SOP"
        value={sop.isRhkPrimary ? 'SOP Utama RHK' : 'SOP Pendukung'}
      />
    </div>
  );
}

function SopProcedureTab({ sop }: { sop: SopDetail }) {
  return (
    <DataTable<SopProcedureStep>
      items={sop.procedureSteps}
      empty="Belum ada langkah prosedur"
      rowKey={(item) => String(item.no)}
      columns={[
        { key: 'no', header: 'No', render: (item) => item.no },
        { key: 'activity', header: 'Tahapan', render: (item) => item.activity },
        { key: 'actor', header: 'Pelaksana', render: (item) => item.actor },
        { key: 'input', header: 'Input', render: (item) => item.input },
        { key: 'process', header: 'Proses', render: (item) => item.process },
        { key: 'output', header: 'Output', render: (item) => item.output },
        { key: 'duration', header: 'Waktu', render: (item) => item.duration },
      ]}
    />
  );
}

function SopSignatureTab({ sop }: { sop: SopDetail }) {
  return (
    <DataTable<SopSignature>
      items={sop.signatures}
      empty="Belum ada data tanda tangan"
      rowKey={(item) => item.role}
      columns={[
        { key: 'role', header: 'Posisi', render: (item) => item.role },
        {
          key: 'name',
          header: 'Nama/Jabatan',
          render: (item) => item.namePlaceholder,
        },
        {
          key: 'signature',
          header: 'Tanda Tangan',
          render: () => (
            <div className="h-16 rounded-md border border-dashed border-[#b7c9b1] bg-white" />
          ),
        },
      ]}
    />
  );
}

function SopOfficialPrintView({ sop }: { sop: SopDetail }) {
  return (
    <article className="mx-auto max-w-[980px] bg-white p-6 text-[#111827] print:max-w-none print:p-0">
      <header className="border border-[#111827]">
        <div className="grid grid-cols-[160px_1fr] border-b border-[#111827]">
          <div className="flex items-center justify-center border-r border-[#111827] p-4 text-center text-sm font-bold">
            BKPSDM
          </div>
          <div className="p-4 text-center">
            <div className="text-sm font-semibold uppercase">
              Pemerintah Daerah
            </div>
            <div className="text-base font-bold uppercase">
              Badan Kepegawaian dan Pengembangan Sumber Daya Manusia
            </div>
            <div className="mt-1 text-xs">
              Standar Operasional Prosedur Bidang PPIK
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 text-xs">
          <PrintInfo label="Nomor SOP" value={sop.code} />
          <PrintInfo label="Tanggal Pembuatan" value="................................" />
          <PrintInfo label="Tanggal Revisi" value="................................" />
          <PrintInfo label="Tanggal Efektif" value="................................" />
          <PrintInfo label="Disahkan oleh" value="Kepala BKPSDM" />
          <PrintInfo
            label="Nama SOP"
            value={sop.title}
            className="font-semibold"
          />
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 border border-[#111827] text-xs">
        <div className="border-r border-[#111827]">
          <PrintBlockTitle title="Dasar Hukum" />
          <ol className="list-decimal space-y-1 p-3 pl-7 leading-5">
            {sop.legalBasis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>

        <div>
          <PrintBlockTitle title="Kualifikasi Pelaksana" />
          <ol className="list-decimal space-y-1 p-3 pl-7 leading-5">
            <li>Memahami ketentuan pengelolaan kepegawaian.</li>
            <li>Memahami alur kerja Bidang PPIK.</li>
            <li>Mampu mengelola dokumen dan bukti dukung kegiatan.</li>
            <li>Mampu melakukan pencatatan, verifikasi, dan pelaporan.</li>
          </ol>
        </div>

        <div className="border-t border-r border-[#111827]">
          <PrintBlockTitle title="Keterkaitan" />
          <ol className="list-decimal space-y-1 p-3 pl-7 leading-5">
            <li>RHK terkait: {sop.rhkCodes.join(', ') || '-'}</li>
            <li>DMS Bukti Dukung.</li>
            <li>Laporan Kinerja Bidang.</li>
            <li>Monitoring dan evaluasi layanan kepegawaian.</li>
          </ol>
        </div>

        <div className="border-t border-[#111827]">
          <PrintBlockTitle title="Peralatan / Perlengkapan" />
          <ol className="list-decimal space-y-1 p-3 pl-7 leading-5">
            <li>Aplikasi SILAKAP.</li>
            <li>Data ASN dan dokumen pendukung.</li>
            <li>Komputer/laptop dan jaringan internet.</li>
            <li>Format laporan, nota dinas, dan dokumen kerja bidang.</li>
          </ol>
        </div>

        <div className="border-t border-r border-[#111827]">
          <PrintBlockTitle title="Peringatan" />
          <p className="p-3 leading-5">
            Apabila SOP ini tidak dilaksanakan secara tertib, maka proses kerja,
            pemenuhan target RHK, pengendalian bukti dukung, dan pelaporan
            kinerja bidang dapat terlambat atau tidak terdokumentasi dengan baik.
          </p>
        </div>

        <div className="border-t border-[#111827]">
          <PrintBlockTitle title="Pencatatan dan Pendataan" />
          <ol className="list-decimal space-y-1 p-3 pl-7 leading-5">
            <li>Seluruh output dicatat dalam aplikasi SILAKAP.</li>
            <li>Bukti dukung diunggah ke DMS sesuai kategori dan periode.</li>
            <li>Realisasi dicatat sebagai bahan laporan bulanan/triwulan.</li>
          </ol>
        </div>
      </section>

      <section className="mt-4 border border-[#111827] text-xs">
        <PrintBlockTitle title="Identitas dan Target RHK" />
        <div className="grid grid-cols-2">
          <PrintInfo label="Tahap SOP" value={getSopStageLabel(sop.stage)} />
          <PrintInfo
            label="Jenis SOP"
            value={sop.isRhkPrimary ? 'SOP Utama RHK' : 'SOP Pendukung'}
          />
          <PrintInfo
            label="Target Kuantitas"
            value={`${sop.targetQuantity} ${sop.targetUnit}`}
          />
          <PrintInfo label="Target Kualitas" value={sop.qualityTarget} />
          <PrintInfo label="Target Waktu" value={sop.timeTarget} />
          <PrintInfo label="Output" value={sop.outputs.join('; ')} />
        </div>
      </section>

      <section className="mt-4 border border-[#111827] text-xs">
        <PrintBlockTitle title="Tujuan" />
        <p className="p-3 leading-5">{sop.objective}</p>

        <PrintBlockTitle title="Ruang Lingkup" />
        <p className="p-3 leading-5">{sop.scope}</p>
      </section>

      <section className="mt-4 text-xs">
        <table className="w-full border-collapse border border-[#111827]">
          <thead>
            <tr className="bg-[#f3f4f6]">
              <PrintTh>No</PrintTh>
              <PrintTh>Kegiatan</PrintTh>
              <PrintTh>Pelaksana</PrintTh>
              <PrintTh>Input</PrintTh>
              <PrintTh>Proses</PrintTh>
              <PrintTh>Output</PrintTh>
              <PrintTh>Waktu</PrintTh>
            </tr>
          </thead>
          <tbody>
            {sop.procedureSteps.map((step) => (
              <tr key={step.no}>
                <PrintTd className="text-center">{step.no}</PrintTd>
                <PrintTd>{step.activity}</PrintTd>
                <PrintTd>{step.actor}</PrintTd>
                <PrintTd>{step.input}</PrintTd>
                <PrintTd>{step.process}</PrintTd>
                <PrintTd>{step.output}</PrintTd>
                <PrintTd>{step.duration}</PrintTd>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4 border border-[#111827] text-xs">
        <PrintBlockTitle title="Contoh Bukti Dukung" />
        <ol className="list-decimal space-y-1 p-3 pl-7 leading-5">
          {sop.evidenceExamples.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="mt-8 grid grid-cols-3 gap-4 text-center text-xs">
        {sop.signatures.map((signature) => (
          <div key={signature.role} className="min-h-[150px]">
            <div className="font-semibold">{signature.role}</div>
            <div className="mt-1">{signature.namePlaceholder}</div>
            <div className="mt-20 border-t border-[#111827] pt-2">
              Nama / NIP
            </div>
          </div>
        ))}
      </section>
    </article>
  );
}

function PrintInfo({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] border-b border-[#111827] last:border-b-0">
      <div className="border-r border-[#111827] bg-[#f9fafb] px-3 py-2 font-semibold">
        {label}
      </div>
      <div className={`px-3 py-2 ${className}`}>{value || '-'}</div>
    </div>
  );
}

function PrintBlockTitle({ title }: { title: string }) {
  return (
    <div className="border-b border-[#111827] bg-[#f3f4f6] px-3 py-2 text-xs font-bold uppercase">
      {title}
    </div>
  );
}

function PrintTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-[#111827] px-2 py-2 text-left align-top font-bold">
      {children}
    </th>
  );
}

function PrintTd({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border border-[#111827] px-2 py-2 align-top leading-5 ${className}`}>
      {children}
    </td>
  );
}
