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

export function OpdSipensiunCreatePage() {
  const navigate = useNavigate();
  const [jenisPensiun, setJenisPensiun] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectNip, setSubjectNip] = useState('');
  const [tmtPensiun, setTmtPensiun] = useState('');
  const [contact, setContact] = useState('');
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
        moduleKey: 'SIPENSIUN',
        serviceType: jenisPensiun,
        title: jenisPensiun
          ? `Usulan Pensiun ${jenisPensiun}`
          : 'Usulan Pensiun OPD',
        subjectName,
        subjectNip,
        description: [
          description,
          tmtPensiun ? `TMT Pensiun: ${tmtPensiun}` : '',
          contact ? `Kontak OPD: ${contact}` : '',
        ].filter(Boolean).join('\n'),
      });

      const finalSubmission = submitAfterCreate
        ? await opdSubmissionsApi.submitOpdSubmission(created.id)
        : created;

      setSuccess(
        submitAfterCreate
          ? 'Usulan pensiun berhasil dikirim ke antrian PPIK.'
          : 'Draft usulan pensiun berhasil disimpan.',
      );
      navigate(`/opd/sipensiun/${finalSubmission.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menyimpan usulan pensiun OPD',
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
        title="Ajukan Usulan Pensiun"
        description="Siapkan usulan pensiun ASN dari OPD sebelum diverifikasi oleh PPIK."
      />

      {success ? (
        <div className="rounded-lg border border-[#91d9bf] bg-[#e4f8ef] p-4 text-sm font-medium text-[#12815f]">
          {success}
        </div>
      ) : null}

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Draft Usulan Pensiun"
        description="Data usulan pensiun disimpan sebagai pengajuan OPD dan belum menjadi proses final sampai diverifikasi PPIK."
        actions={<StatusBadge value="API mode" tone="success" />}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Jenis Pensiun">
              <select
                className={inputClass}
                value={jenisPensiun}
                onChange={(event) => setJenisPensiun(event.target.value)}
              >
                <option value="" disabled>
                  Pilih jenis pensiun
                </option>
                <option value="BUP">Batas Usia Pensiun</option>
                <option value="AHLI_WARIS">Ahli Waris</option>
                <option value="APS">Atas Permintaan Sendiri</option>
              </select>
            </Field>
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
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="TMT Pensiun">
              <input
                className={inputClass}
                type="date"
                value={tmtPensiun}
                onChange={(event) => setTmtPensiun(event.target.value)}
              />
            </Field>
            <Field label="Upload Dokumen Pendukung">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                disabled
                type="file"
              />
            </Field>
            <Field label="Nomor Kontak OPD">
              <input
                className={inputClass}
                placeholder="Nomor HP/WA PIC OPD"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
              />
            </Field>
          </div>

          <Field label="Catatan Usulan">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Tuliskan catatan awal usulan pensiun"
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
