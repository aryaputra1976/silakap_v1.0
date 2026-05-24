import { FormEvent, useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ActionButton,
  ErrorAlert,
  Field,
  inputClass,
  LoadingState,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdRequestTable } from '@/components/workspace/opd/opd-request-table';
import { OpdStatusTimeline } from '@/components/workspace/opd/opd-status-timeline';
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';
import { opdTimeline } from '@/lib/opd/opd-portal-data';
import type { OpdSubmission } from '@/lib/opd-submissions/types';

type OpdSidataMode = 'create' | 'status' | 'documents';

const pageCopy: Record<OpdSidataMode, { title: string; description: string }> = {
  create: {
    title: 'Usul Pemutakhiran Data',
    description: 'Ajukan perubahan data ASN dari OPD dengan alasan dan bukti dukung.',
  },
  status: {
    title: 'Status Pemutakhiran',
    description: 'Pantau status usulan pemutakhiran data ASN dari OPD.',
  },
  documents: {
    title: 'Dokumen ASN',
    description: 'Ruang dokumen pendukung ASN yang diajukan melalui portal OPD.',
  },
};

export function OpdSidataPemutakhiranPage({
  mode = 'create',
}: {
  mode?: OpdSidataMode;
}) {
  const navigate = useNavigate();
  const [subjectName, setSubjectName] = useState('');
  const [subjectNip, setSubjectNip] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<OpdSubmission[]>([]);
  const [loading, setLoading] = useState(mode !== 'create');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const copy = pageCopy[mode];

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    let active = true;

    setLoading(true);
    setError('');

    opdSubmissionsApi
      .fetchMyOpdSubmissions({
        moduleKey: 'SIDATA',
        status: mode === 'status' ? undefined : undefined,
        limit: 30,
      })
      .then((result) => {
        if (active) {
          setItems(result.items);
        }
      })
      .catch((caught) => {
        if (active) {
          setItems([]);
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat data SIDATA OPD',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mode]);

  async function handleSave(submitAfterCreate: boolean) {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const created = await opdSubmissionsApi.createOpdSubmission({
        moduleKey: 'SIDATA',
        serviceType,
        title: serviceType
          ? `Usul Pemutakhiran ${serviceType}`
          : 'Usul Pemutakhiran Data ASN',
        subjectName,
        subjectNip,
        description,
      });

      const finalSubmission = submitAfterCreate
        ? await opdSubmissionsApi.submitOpdSubmission(created.id)
        : created;

      setSuccess(
        submitAfterCreate
          ? 'Usulan pemutakhiran berhasil dikirim ke antrian PPIK.'
          : 'Draft usulan pemutakhiran berhasil disimpan.',
      );
      navigate(`/opd/layanan/${finalSubmission.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menyimpan usulan pemutakhiran',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSave(false);
  }

  if (mode !== 'create') {
    return (
      <div className="space-y-5">
        <OpdPageHeader title={copy.title} description={copy.description} />
        {error ? <ErrorAlert message={error} /> : null}
        <SectionCard
          title={copy.title}
          description="Data pemutakhiran SIDATA dibatasi untuk OPD yang sedang login."
          actions={<StatusBadge value="OPD only" tone="info" />}
        >
          {mode === 'status' ? (
            <OpdStatusTimeline items={opdTimeline} />
          ) : loading ? (
            <LoadingState label="Memuat dokumen SIDATA OPD" />
          ) : (
            <OpdRequestTable
              items={items}
              empty="Belum ada dokumen atau usulan SIDATA OPD"
            />
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OpdPageHeader title={copy.title} description={copy.description} />

      {success ? (
        <div className="rounded-lg border border-[#91d9bf] bg-[#e4f8ef] p-4 text-sm font-medium text-[#12815f]">
          {success}
        </div>
      ) : null}

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Draft Pemutakhiran Data"
        description="Usulan ini tidak mengubah master SIDATA sampai diverifikasi dan diproses PPIK."
        actions={<StatusBadge value="API mode" tone="success" />}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Nama ASN Terkait">
              <input
                className={inputClass}
                placeholder="Nama ASN"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
              />
            </Field>
            <Field label="NIP ASN Terkait">
              <input
                className={inputClass}
                placeholder="NIP ASN"
                value={subjectNip}
                onChange={(event) => setSubjectNip(event.target.value)}
              />
            </Field>
            <Field label="Data yang Diusulkan Berubah">
              <select
                className={inputClass}
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
              >
                <option value="" disabled>
                  Pilih jenis data
                </option>
                <option value="UNIT_KERJA">Unit Kerja</option>
                <option value="JABATAN">Jabatan</option>
                <option value="PENDIDIKAN">Pendidikan</option>
                <option value="DATA_KELUARGA">Data Keluarga</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Upload Bukti Dukung">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                disabled
                type="file"
              />
            </Field>
            <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Upload file langsung belum diaktifkan di endpoint OPD. Metadata
              bukti dukung dapat ditambahkan setelah draft dibuat.
            </div>
          </div>

          <Field label="Alasan Perubahan">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Jelaskan dasar atau alasan perubahan data"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Save} disabled={saving} type="submit">
              Simpan Draft
            </ActionButton>
            <ActionButton
              icon={Send}
              disabled={saving}
              onClick={() => void handleSave(true)}
            >
              Kirim Usulan
            </ActionButton>
          </div>
        </form>
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}
