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

export function OpdSipensiunCreatePage() {
  const [draftSaved, setDraftSaved] = useState(false);

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Ajukan Usulan Pensiun"
        description="Siapkan usulan pensiun ASN dari OPD sebelum diverifikasi oleh PPIK."
      />

      {draftSaved ? (
        <div className="rounded-lg border border-[#9ed9c4] bg-[#e6f6ee] p-4 text-sm font-medium text-[#087052]">
          Draft usulan pensiun tercatat di layar ini. Pengiriman final menunggu
          endpoint submit OPD.
        </div>
      ) : null}

      <SectionCard
        title="Draft Usulan Pensiun"
        description="Data ini belum dikirim ke backend sampai integrasi submit OPD tersedia."
        actions={<StatusBadge value="Draft lokal" tone="warning" />}
      >
        <form className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Jenis Pensiun">
              <select className={inputClass} defaultValue="">
                <option value="" disabled>
                  Pilih jenis pensiun
                </option>
                <option>Batas Usia Pensiun</option>
                <option>Ahli Waris</option>
                <option>Atas Permintaan Sendiri</option>
              </select>
            </Field>
            <Field label="ASN Terkait">
              <input className={inputClass} placeholder="Nama atau NIP ASN" />
            </Field>
            <Field label="TMT Pensiun">
              <input className={inputClass} type="date" />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Upload Dokumen Pendukung">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                type="file"
              />
            </Field>
            <Field label="Nomor Kontak OPD">
              <input className={inputClass} placeholder="Nomor HP/WA PIC OPD" />
            </Field>
          </div>

          <Field label="Catatan Usulan">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Tuliskan catatan awal usulan pensiun"
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
