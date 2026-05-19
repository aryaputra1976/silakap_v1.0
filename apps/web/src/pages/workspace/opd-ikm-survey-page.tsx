import { useEffect, useState } from 'react';
import { CheckCircle, ClipboardList } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  Field,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ikmApi } from '@/lib/api/ikm';
import {
  IKM_PREDIKAT_LABELS,
  IKM_SCALE_LABELS,
  IKM_UNSUR_LABELS,
  IkmSurveyPeriod,
  SubmitIkmSurveyPayload,
} from '@/lib/ikm/types';

const UNSUR_KEYS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'] as const;
type UnsurKey = typeof UNSUR_KEYS[number];

const defaultScores: Record<UnsurKey, number> = {
  u1: 0, u2: 0, u3: 0, u4: 0, u5: 0, u6: 0, u7: 0, u8: 0, u9: 0,
};

function ScoreRadio({
  unsurKey,
  value,
  onChange,
}: {
  unsurKey: UnsurKey;
  value: number;
  onChange: (k: UnsurKey, v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-zinc-800">
        {unsurKey.toUpperCase()}. {IKM_UNSUR_LABELS[unsurKey]}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([1, 2, 3, 4] as const).map((score) => (
          <label
            key={score}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs transition-colors ${
              value === score
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
            }`}
          >
            <input
              type="radio"
              name={`${unsurKey}`}
              value={score}
              checked={value === score}
              onChange={() => onChange(unsurKey, score)}
              className="mt-0.5 shrink-0 accent-blue-600"
            />
            <span>
              <span className="font-semibold">{score}</span> –{' '}
              {score === 1 ? 'Tidak Baik' : score === 2 ? 'Kurang Baik' : score === 3 ? 'Baik' : 'Sangat Baik'}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function OpdIkmSurveyPage() {
  const [periods, setPeriods] = useState<IkmSurveyPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [periodsError, setPeriodsError] = useState('');

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [opdName, setOpdName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [scores, setScores] = useState<Record<UnsurKey, number>>(defaultScores);
  const [comments, setComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState<{
    ikmConvert: number | null;
    predikat: string | null;
  } | null>(null);

  useEffect(() => {
    setLoadingPeriods(true);
    ikmApi
      .fetchPeriods()
      .then((res) => {
        if (res.success) {
          const open = res.data.filter((p) => p.status === 'OPEN');
          setPeriods(open);
          if (open.length > 0) setSelectedPeriodId(open[0].id);
        }
      })
      .catch(() => setPeriodsError('Gagal memuat daftar periode survei'))
      .finally(() => setLoadingPeriods(false));
  }, []);

  function setScore(k: UnsurKey, v: number) {
    setScores((prev) => ({ ...prev, [k]: v }));
  }

  const allFilled = UNSUR_KEYS.every((k) => scores[k] > 0);
  const hasOpenPeriod = periods.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled) {
      setSubmitError('Harap isi semua 9 unsur penilaian');
      return;
    }
    if (!opdName.trim()) {
      setSubmitError('Nama OPD wajib diisi');
      return;
    }

    const payload: SubmitIkmSurveyPayload = {
      periodId: selectedPeriodId,
      opdName: opdName.trim(),
      serviceType: serviceType.trim() || undefined,
      u1: scores.u1, u2: scores.u2, u3: scores.u3,
      u4: scores.u4, u5: scores.u5, u6: scores.u6,
      u7: scores.u7, u8: scores.u8, u9: scores.u9,
      comments: comments.trim() || undefined,
    };

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await ikmApi.submitSurvey(payload);
      if (res.success) {
        setSubmitResult({
          ikmConvert: res.data.ikmConvert,
          predikat: res.data.predikat,
        });
      } else {
        setSubmitError('Gagal menyimpan survei. Coba lagi.');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Terjadi kesalahan';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setScores(defaultScores);
    setComments('');
    setOpdName('');
    setServiceType('');
    setSubmitResult(null);
    setSubmitError('');
  }

  if (loadingPeriods) return <LoadingState message="Memuat periode survei..." />;
  if (periodsError) return <ErrorAlert message={periodsError} />;

  if (submitResult) {
    const predikat = submitResult.predikat ?? 'D';
    const convert = submitResult.ikmConvert ?? 0;
    return (
      <div className="space-y-5">
        <PageHeader
          title="Survei IKM Kepuasan Layanan"
          description="Terima kasih atas partisipasi Anda dalam survei kepuasan layanan."
        />
        <SectionCard title="Survei Berhasil Disimpan">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle className="h-14 w-14 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-zinc-900">{convert.toFixed(2)}</p>
              <p className="text-sm text-zinc-500">Nilai IKM (skala 25–100)</p>
            </div>
            <StatusBadge
              value={`Predikat ${predikat} — ${IKM_PREDIKAT_LABELS[predikat]}`}
              tone={predikat === 'A' ? 'success' : predikat === 'B' ? 'info' : predikat === 'C' ? 'warning' : 'danger'}
            />
            <p className="max-w-sm text-sm text-zinc-600">
              Hasil survei Anda telah dicatat dan akan digunakan untuk meningkatkan kualitas layanan kepegawaian.
            </p>
            <ActionButton variant="secondary" onClick={handleReset}>
              Isi Survei Lagi
            </ActionButton>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (!hasOpenPeriod) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Survei IKM Kepuasan Layanan"
          description="Survei kepuasan layanan kepegawaian BKPSDM Kabupaten Tolitoli."
        />
        <SectionCard title="Survei Tidak Tersedia">
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <ClipboardList className="h-12 w-12 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-600">Tidak ada periode survei yang sedang dibuka</p>
            <p className="text-xs text-zinc-400">Hubungi Admin BKPSDM untuk informasi lebih lanjut.</p>
          </div>
        </SectionCard>
      </div>
    );
  }

  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Survei IKM Kepuasan Layanan"
        description="Isi survei kepuasan layanan kepegawaian sesuai PermenPANRB No. 14 Tahun 2017."
        meta={
          <>
            <StatusBadge value="IKM" tone="info" />
            {activePeriod && <StatusBadge value={activePeriod.label} tone="success" />}
          </>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Period + OPD */}
        <SectionCard title="Informasi Responden">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Periode Survei">
              <select
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nama OPD / Instansi">
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Dinas Pendidikan"
                value={opdName}
                onChange={(e) => setOpdName(e.target.value)}
                required
              />
            </Field>

            <Field label="Jenis Layanan (opsional)">
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Kenaikan Pangkat, Pensiun"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        {/* 9 Unsur Penilaian */}
        <SectionCard
          title="Penilaian 9 Unsur Layanan"
          description="Berikan penilaian 1 (Tidak Baik) hingga 4 (Sangat Baik) untuk setiap unsur."
        >
          <div className="space-y-5">
            {UNSUR_KEYS.map((k) => (
              <ScoreRadio key={k} unsurKey={k} value={scores[k]} onChange={setScore} />
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500">
            <span className="font-semibold">Keterangan skala:</span>{' '}
            {Object.entries(IKM_SCALE_LABELS).map(([score, desc]) => (
              <span key={score} className="mr-3">
                <span className="font-semibold text-zinc-700">{score}</span> = {desc.split('/')[0].trim()}
              </span>
            ))}
          </div>
        </SectionCard>

        {/* Comments */}
        <SectionCard title="Saran & Masukan (Opsional)">
          <textarea
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Tuliskan saran atau masukan untuk perbaikan layanan..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </SectionCard>

        {submitError && <ErrorAlert message={submitError} />}

        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {allFilled ? (
              <span className="font-medium text-emerald-600">Semua unsur sudah diisi ✓</span>
            ) : (
              <span>
                {UNSUR_KEYS.filter((k) => scores[k] === 0).length} unsur belum diisi
              </span>
            )}
          </p>
          <ActionButton type="submit" variant="primary" disabled={submitting || !allFilled}>
            {submitting ? 'Menyimpan...' : 'Kirim Survei'}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
