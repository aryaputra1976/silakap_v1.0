import { useEffect, useMemo, useState } from 'react';
import { Save, Send } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  Field,
  LoadingState,
  SectionCard,
  inputClass,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import {
  kinerjaBidangApi,
  kinerjaTargetUnitLabel,
  type CreateSopRealizationPayload,
  type KinerjaBidangTargetForInput,
} from '@/lib/api/kinerja-bidang';
import {
  SopRealizationEvidencePicker,
  type SopEvidenceFormValue,
} from './sop-realization-evidence-picker';

interface FormValue {
  targetId: string;
  month: string;
  quarter: string;
  realizationQuantity: string;
  qualityPercent: string;
  timeStatus: string;
  title: string;
  description: string;
  constraint: string;
  followUp: string;
  evidence: SopEvidenceFormValue[];
}

const initialForm: FormValue = {
  targetId: '',
  month: '',
  quarter: '',
  realizationQuantity: '1',
  qualityPercent: '',
  timeStatus: 'TEPAT_WAKTU',
  title: '',
  description: '',
  constraint: '',
  followUp: '',
  evidence: [],
};

export function SopRealizationForm({
  year,
  initialTargetId,
  onCreated,
}: {
  year: string;
  initialTargetId?: string;
  onCreated: (id: string) => void;
}) {
  const [targets, setTargets] = useState<KinerjaBidangTargetForInput[]>([]);
  const [form, setForm] = useState<FormValue>(initialForm);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === form.targetId),
    [targets, form.targetId],
  );

  function update<K extends keyof FormValue>(key: K, value: FormValue[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function loadTargets() {
    setLoadingTargets(true);
    setError('');

    try {
      const result = await kinerjaBidangApi.listTargets({
        year,
        isRhkPrimary: true,
      });

      setTargets(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat target SOP/RHK',
      );
    } finally {
      setLoadingTargets(false);
    }
  }

  function buildPayload(): CreateSopRealizationPayload {
    if (!form.targetId) {
      throw new Error('Target SOP/RHK wajib dipilih.');
    }

    if (form.month && form.quarter) {
      throw new Error('Pilih salah satu: bulan atau triwulan.');
    }

    const realizationQuantity = Number(form.realizationQuantity);

    if (!Number.isFinite(realizationQuantity) || realizationQuantity < 0) {
      throw new Error('Realisasi kuantitas tidak valid.');
    }

    return {
      targetId: form.targetId,
      month: form.month ? Number(form.month) : undefined,
      quarter: form.quarter ? Number(form.quarter) : undefined,
      realizationQuantity,
      qualityPercent: form.qualityPercent
        ? Number(form.qualityPercent)
        : undefined,
      timeStatus: form.timeStatus || undefined,
      title: form.title,
      description: form.description || undefined,
      constraint: form.constraint || undefined,
      followUp: form.followUp || undefined,
      evidence: form.evidence.map((item) => ({
        dmsDocumentId: item.dmsDocumentId,
        label: item.label,
        description: item.description,
        isPrimary: item.isPrimary,
      })),
    };
  }

  async function submitDraft() {
    setSaving(true);
    setError('');

    try {
      const payload = buildPayload();

      if (!payload.title.trim()) {
        throw new Error('Judul realisasi wajib diisi.');
      }

      const result = await kinerjaBidangApi.createRealization(payload);
      onCreated(result.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal menyimpan realisasi');
    } finally {
      setSaving(false);
    }
  }

  async function submitAndSend() {
    setSaving(true);
    setError('');

    try {
      const payload = buildPayload();

      if (!payload.title.trim()) {
        throw new Error('Judul realisasi wajib diisi.');
      }

      if (!payload.evidence || payload.evidence.length === 0) {
        throw new Error(
          'Bukti dukung DMS wajib dipilih sebelum realisasi disubmit.',
        );
      }

      const result = await kinerjaBidangApi.createRealization(payload);
      await kinerjaBidangApi.submitRealization(result.id);
      onCreated(result.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Gagal submit realisasi',
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    if (!initialTargetId || targets.length === 0) {
      return;
    }

    const exists = targets.some((target) => target.id === initialTargetId);

    if (!exists) {
      return;
    }

    setForm((current) => ({
      ...current,
      targetId: current.targetId || initialTargetId,
    }));
  }, [initialTargetId, targets]);

  useEffect(() => {
    if (!selectedTarget || form.title) {
      return;
    }

    setForm((current) => ({
      ...current,
      title: `Realisasi ${selectedTarget.sop.title} Tahun ${year}`,
    }));
  }, [selectedTarget, year, form.title]);

  if (loadingTargets) {
    return <LoadingState label="Memuat target SOP/RHK" />;
  }

  return (
    <div className="space-y-5">
      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Form Realisasi SOP/RHK"
        description="Input realisasi resmi berdasarkan target SOP/RHK tahun berjalan."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={Save}
              disabled={saving}
              onClick={() => void submitDraft()}
            >
              Simpan Draft
            </ActionButton>
            <ActionButton
              icon={Send}
              disabled={saving}
              onClick={() => void submitAndSend()}
            >
              Simpan & Submit
            </ActionButton>
          </>
        }
      >
        <div className="mb-4 rounded-lg border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
          <strong className="text-[#173c36]">Catatan:</strong> Simpan Draft boleh tanpa bukti
          dukung. Untuk <strong>Simpan & Submit</strong>, bukti dukung DMS wajib dipilih.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Target SOP/RHK">
            <select
              className={inputClass}
              disabled={saving}
              value={form.targetId}
              onChange={(event) => update('targetId', event.target.value)}
            >
              <option value="">Pilih target SOP/RHK</option>
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.rhkCode} — {target.sop.title} ({target.targetQuantity}{' '}
                  {kinerjaTargetUnitLabel(target.targetUnit)})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Judul Realisasi">
            <input
              className={inputClass}
              disabled={saving}
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="Contoh: Laporan Pengendalian Pemberhentian ASN Bulan Mei 2026"
            />
          </Field>

          <Field label="Bulan">
            <select
              className={inputClass}
              disabled={saving || Boolean(form.quarter)}
              value={form.month}
              onChange={(event) => update('month', event.target.value)}
            >
              <option value="">Tidak memilih bulan</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={String(month)}>
                  Bulan {month}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Triwulan">
            <select
              className={inputClass}
              disabled={saving || Boolean(form.month)}
              value={form.quarter}
              onChange={(event) => update('quarter', event.target.value)}
            >
              <option value="">Tidak memilih triwulan</option>
              {[1, 2, 3, 4].map((quarter) => (
                <option key={quarter} value={String(quarter)}>
                  Triwulan {quarter}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kuantitas Realisasi">
            <input
              className={inputClass}
              disabled={saving}
              inputMode="numeric"
              value={form.realizationQuantity}
              onChange={(event) =>
                update('realizationQuantity', event.target.value)
              }
            />
          </Field>

          <Field label="Kualitas (%)">
            <input
              className={inputClass}
              disabled={saving}
              inputMode="decimal"
              placeholder="Contoh: 95"
              value={form.qualityPercent}
              onChange={(event) => update('qualityPercent', event.target.value)}
            />
          </Field>

          <Field label="Status Waktu">
            <select
              className={inputClass}
              disabled={saving}
              value={form.timeStatus}
              onChange={(event) => update('timeStatus', event.target.value)}
            >
              <option value="TEPAT_WAKTU">Tepat Waktu</option>
              <option value="PERLU_PEMANTAUAN">Perlu Pemantauan</option>
              <option value="TERLAMBAT">Terlambat</option>
            </select>
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Uraian Realisasi">
            <textarea
              className={inputClass}
              disabled={saving}
              rows={4}
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </Field>

          <Field label="Kendala">
            <textarea
              className={inputClass}
              disabled={saving}
              rows={3}
              value={form.constraint}
              onChange={(event) => update('constraint', event.target.value)}
            />
          </Field>

          <Field label="Tindak Lanjut">
            <textarea
              className={inputClass}
              disabled={saving}
              rows={3}
              value={form.followUp}
              onChange={(event) => update('followUp', event.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SopRealizationEvidencePicker
        value={form.evidence}
        disabled={saving}
        onChange={(evidence) => update('evidence', evidence)}
      />
    </div>
  );
}
