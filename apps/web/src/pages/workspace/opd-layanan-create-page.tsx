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
import { OpdUploadGuidanceCard } from '@/components/workspace/opd/opd-upload-guidance-card';

export function OpdLayananCreatePage() {
  const [draftSaved, setDraftSaved] = useState(false);

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Ajukan Layanan"
        description="Form awal untuk menyiapkan permohonan layanan kepegawaian dari OPD."
      />

      {draftSaved ? (
        <div className="rounded-lg border border-[#9ed9c4] bg-[#e6f6ee] p-4 text-sm font-medium text-[#087052]">
          Draft tercatat di layar ini. Pengiriman ke server belum diaktifkan
          sampai endpoint submit OPD tersedia.
        </div>
      ) : null}

      <SectionCard
        title="Draft Permohonan"
        description="Lengkapi informasi awal. Tombol kirim sengaja nonaktif karena endpoint submit OPD belum tersedia."
        actions={<StatusBadge value="Draft lokal" tone="warning" />}
      >
        <form className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Jenis Layanan">
              <select className={inputClass} defaultValue="">
                <option value="" disabled>
                  Pilih jenis layanan
                </option>
                <option>Kenaikan Pangkat</option>
                <option>Mutasi Pegawai</option>
                <option>Cuti ASN</option>
                <option>Data Kepegawaian</option>
              </select>
            </Field>
            <Field label="ASN Terkait">
              <input
                className={inputClass}
                placeholder="Nama atau NIP ASN"
                type="text"
              />
            </Field>
            <Field label="Dokumen Awal">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                type="file"
              />
            </Field>
          </div>

          <Field label="Keterangan">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Tuliskan ringkasan kebutuhan layanan"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Save} onClick={() => setDraftSaved(true)}>
              Simpan Draft
            </ActionButton>
            <ActionButton icon={Send} disabled>
              Kirim Permohonan
            </ActionButton>
          </div>
        </form>
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}
