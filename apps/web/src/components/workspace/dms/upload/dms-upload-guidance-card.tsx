import { SectionCard } from '@/components/workspace/ui';

export function DmsUploadGuidanceCard() {
  return (
    <SectionCard
      title="Panduan Upload"
      description="Ketentuan dan tips sebelum mengunggah dokumen ke DMS."
    >
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-xs font-bold text-zinc-500">01</span>
          <span>
            <span className="font-semibold text-zinc-700">Format file</span> yang
            diterima: PDF, JPG, PNG, DOCX, XLSX. File lain akan ditolak otomatis.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-xs font-bold text-zinc-500">02</span>
          <span>
            <span className="font-semibold text-zinc-700">Ukuran maksimal</span>{' '}
            per file adalah <span className="font-semibold text-zinc-700">10 MB</span>.
            Kompres file bila ukurannya melebihi batas.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-xs font-bold text-zinc-500">03</span>
          <span>
            <span className="font-semibold text-zinc-700">File opsional</span> —
            dokumen dapat disimpan dulu tanpa file, lalu file diunggah dari halaman
            detail kapan saja.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-xs font-bold text-zinc-500">04</span>
          <span>
            <span className="font-semibold text-zinc-700">Metadata wajib</span>:
            judul dan kategori harus diisi agar dokumen mudah ditemukan dan
            diklasifikasikan.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-xs font-bold text-zinc-500">05</span>
          <span>
            Dokumen yang disimpan berstatus{' '}
            <span className="font-semibold text-zinc-700">DRAFT</span> atau{' '}
            <span className="font-semibold text-zinc-700">UPLOADED</span> dan
            dapat diedit sebelum disubmit ke verifikasi.
          </span>
        </li>
      </ul>
    </SectionCard>
  );
}
