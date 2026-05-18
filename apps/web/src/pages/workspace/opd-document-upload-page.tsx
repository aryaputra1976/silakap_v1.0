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

export function OpdDocumentUploadPage() {
  const [draftSaved, setDraftSaved] = useState(false);

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Upload Bukti Dukung"
        description="Unggah bukti dukung OPD untuk layanan, SIPENSIUN, atau pemutakhiran SIDATA."
      />

      {draftSaved ? (
        <div className="rounded-lg border border-[#9ed9c4] bg-[#e6f6ee] p-4 text-sm font-medium text-[#087052]">
          Metadata dokumen tercatat di layar ini. Upload final menunggu endpoint
          dokumen OPD.
        </div>
      ) : null}

      <SectionCard
        title="Draft Upload Dokumen"
        description="Form ini aman untuk staging frontend dan belum mengklaim dokumen terkirim."
        actions={<StatusBadge value="Upload belum aktif" tone="warning" />}
      >
        <form className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Kategori Dokumen">
              <select className={inputClass} defaultValue="">
                <option value="" disabled>
                  Pilih kategori
                </option>
                <option>Layanan Kepegawaian</option>
                <option>SIPENSIUN</option>
                <option>SIDATA ASN</option>
              </select>
            </Field>
            <Field label="Nomor Permohonan">
              <input
                className={inputClass}
                placeholder="Opsional, jika sudah ada"
                type="text"
              />
            </Field>
            <Field label="File Bukti Dukung">
              <input
                accept="application/pdf,image/jpeg,image/png"
                className={inputClass}
                type="file"
              />
            </Field>
          </div>

          <Field label="Keterangan Dokumen">
            <textarea
              className={`${inputClass} h-auto min-h-28 py-2`}
              placeholder="Jelaskan isi dokumen dan kaitannya dengan permohonan"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Save} onClick={() => setDraftSaved(true)}>
              Simpan Draft
            </ActionButton>
            <ActionButton icon={Send} disabled>
              Upload Dokumen
            </ActionButton>
          </div>
        </form>
      </SectionCard>

      <OpdUploadGuidanceCard />
    </div>
  );
}
