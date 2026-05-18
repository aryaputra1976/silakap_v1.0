import { useState } from 'react';
import { Save, Send } from 'lucide-react';
import {
  ActionButton,
  Field,
  inputClass,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdStatusTimeline } from '@/components/workspace/opd/opd-status-timeline';
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';
import { opdTimeline } from '@/lib/opd/opd-portal-data';

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
  const [draftSaved, setDraftSaved] = useState(false);
  const copy = pageCopy[mode];

  if (mode !== 'create') {
    return (
      <div className="space-y-5">
        <OpdPageHeader title={copy.title} description={copy.description} />
        <SectionCard
          title={copy.title}
          description="Data akan tampil setelah endpoint SIDATA OPD tersedia."
          actions={<StatusBadge value="OPD only" tone="info" />}
        >
          <OpdStatusTimeline items={opdTimeline} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OpdPageHeader title={copy.title} description={copy.description} />

      {draftSaved ? (
        <div className="rounded-lg border border-[#9ed9c4] bg-[#e6f6ee] p-4 text-sm font-medium text-[#087052]">
          Draft usulan pemutakhiran tercatat di layar ini. Pengiriman final
          menunggu endpoint submit OPD.
        </div>
      ) : null}

      <SectionCard
        title="Draft Pemutakhiran Data"
        description="Usulan ini tidak mengubah master SIDATA sampai diverifikasi dan diproses PPIK."
        actions={<StatusBadge value="Draft lokal" tone="warning" />}
      >
        <form className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="ASN Terkait">
              <input className={inputClass} placeholder="Nama atau NIP ASN" />
            </Field>
            <Field label="Data yang Diusulkan Berubah">
              <select className={inputClass} defaultValue="">
                <option value="" disabled>
                  Pilih jenis data
                </option>
                <option>Unit Kerja</option>
                <option>Jabatan</option>
                <option>Pendidikan</option>
                <option>Data Keluarga</option>
              </select>
            </Field>
            <Field label="Upload Bukti Dukung">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                type="file"
              />
            </Field>
          </div>

          <Field label="Alasan Perubahan">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Jelaskan dasar atau alasan perubahan data"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Save} onClick={() => setDraftSaved(true)}>
              Simpan Draft
            </ActionButton>
            <ActionButton icon={Send} disabled>
              Kirim Usulan
            </ActionButton>
          </div>
        </form>
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}
