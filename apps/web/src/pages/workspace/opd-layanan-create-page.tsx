import { FormEvent, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ActionButton,
  ErrorAlert,
  Field,
  inputClass,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';

export function OpdLayananCreatePage() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectNip, setSubjectNip] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSave(submitAfterCreate: boolean) {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const created = await opdSubmissionsApi.createOpdSubmission({
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        serviceType,
        title: serviceType || 'Permohonan Layanan OPD',
        subjectName,
        subjectNip,
        description,
      });

      const finalSubmission = submitAfterCreate
        ? await opdSubmissionsApi.submitOpdSubmission(created.id)
        : created;

      setSuccess(
        submitAfterCreate
          ? 'Pengajuan berhasil dikirim ke antrian PPIK.'
          : 'Draft pengajuan berhasil disimpan.',
      );
      navigate(`/opd/layanan/${finalSubmission.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menyimpan pengajuan OPD',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSave(false);
  }

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Ajukan Layanan"
        description="Form awal untuk menyiapkan permohonan layanan kepegawaian dari OPD."
      />

      {success ? (
        <div className="rounded-lg border border-[#91d9bf] bg-[#e4f8ef] p-4 text-sm font-medium text-[#12815f]">
          {success}
        </div>
      ) : null}

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Draft Permohonan"
        description="Lengkapi informasi awal lalu simpan draft atau kirim ke antrian PPIK."
        actions={<StatusBadge value="API mode" tone="success" />}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Jenis Layanan">
              <select
                className={inputClass}
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
              >
                <option value="" disabled>
                  Pilih jenis layanan
                </option>
                <option value="KENAIKAN_PANGKAT">Kenaikan Pangkat</option>
                <option value="MUTASI_PEGAWAI">Mutasi Pegawai</option>
                <option value="CUTI_ASN">Cuti ASN</option>
                <option value="DATA_KEPEGAWAIAN">Data Kepegawaian</option>
              </select>
            </Field>
            <Field label="Nama ASN Terkait">
              <input
                className={inputClass}
                placeholder="Nama ASN"
                type="text"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
              />
            </Field>
            <Field label="NIP ASN Terkait">
              <input
                className={inputClass}
                placeholder="NIP ASN"
                type="text"
                value={subjectNip}
                onChange={(event) => setSubjectNip(event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Dokumen Awal">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                disabled
                type="file"
              />
            </Field>
            <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Upload file langsung belum diaktifkan di endpoint OPD. Simpan
              metadata dokumen dari menu Upload Bukti Dukung setelah draft
              dibuat.
            </div>
          </div>

          <Field label="Keterangan">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Tuliskan ringkasan kebutuhan layanan"
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
              Kirim Permohonan
            </ActionButton>
          </div>
        </form>
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}
