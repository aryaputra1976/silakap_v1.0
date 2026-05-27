import { MapPin, Users, Building2, Heart, BookOpen } from 'lucide-react';
import { PageHeader, SectionCard, StatCard } from '@/components/workspace/ui';

const PROFIL = {
  kabupaten: 'Kabupaten Tolitoli',
  provinsi: 'Sulawesi Tengah',
  luasWilayah: '4.097 km²',
  jumlahKecamatan: 10,
  jumlahDesaKel: 104,
  jumlahPenduduk: '226.794 jiwa',
  dasarHukum: 'PermenPANRB No. 1 Tahun 2020',
};

const KEPEGAWAIAN = [
  { label: 'PNS Aktif', value: '4.923', satuan: 'orang', desc: 'Per Desember 2023' },
  { label: 'PPPK Aktif', value: '92', satuan: 'orang', desc: 'Per Desember 2021' },
];

const FASILITAS_KESEHATAN = [
  { nama: 'RSUD Tipe B', keterangan: '1 unit' },
  { nama: 'RSUD Tipe C', keterangan: '1 unit' },
  { nama: 'Puskesmas Perawatan', keterangan: '13 unit' },
  { nama: 'Puskesmas Non-Perawatan', keterangan: '2 unit' },
];

const TENAGA_PENDIDIKAN = [
  { jenjang: 'TK Negeri', jumlahSekolah: 3 },
  { jenjang: 'SD Negeri', jumlahSekolah: 220 },
  { jenjang: 'SMP Negeri', jumlahSekolah: 59 },
];

const KELOMPOK_JABATAN = [
  { kode: 'JPT', nama: 'Jabatan Pimpinan Tinggi', deskripsi: 'JPT Madya & JPT Pratama — eselon I & II' },
  { kode: 'JA', nama: 'Jabatan Administrasi', deskripsi: 'Administrator, Pengawas, Pelaksana — eselon III, IV, V' },
  { kode: 'JF', nama: 'Jabatan Fungsional', deskripsi: 'Fungsional Keahlian & Keterampilan sesuai perpres tunjangan' },
  { kode: 'JFU', nama: 'Jabatan Fungsional Umum', deskripsi: 'Pelaksana tanpa jabatan fungsional khusus' },
];

export function SiformenProfilDaerahPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Profil Daerah"
        description="Data profil Kabupaten Tolitoli sebagai konteks dasar analisis kebutuhan pegawai"
      />

      {/* Profil Umum */}
      <SectionCard
        title="Identitas Daerah"
        description={`Berdasarkan ${PROFIL.dasarHukum} tentang Pedoman Penyusunan Kebutuhan Pegawai ASN`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: MapPin, label: 'Kabupaten', value: PROFIL.kabupaten },
            { icon: MapPin, label: 'Provinsi', value: PROFIL.provinsi },
            { icon: MapPin, label: 'Luas Wilayah', value: PROFIL.luasWilayah },
            { icon: Building2, label: 'Kecamatan', value: String(PROFIL.jumlahKecamatan) },
            { icon: Building2, label: 'Desa / Kelurahan', value: String(PROFIL.jumlahDesaKel) },
            { icon: Users, label: 'Jumlah Penduduk', value: PROFIL.jumlahPenduduk },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <item.icon className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-sm font-medium text-foreground">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Rekap Kepegawaian */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard title="Rekap Pegawai (Data Awal)" description="Kondisi eksisting saat entry point analisis">
          <div className="space-y-3">
            {KEPEGAWAIAN.map((k) => (
              <div key={k.label} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{k.label}</div>
                  <div className="text-xs text-muted-foreground">{k.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-foreground">{k.value}</div>
                  <div className="text-xs text-muted-foreground">{k.satuan}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Fasilitas Kesehatan */}
        <SectionCard title="Fasilitas Kesehatan" description="Unit fasilitas pelayanan kesehatan">
          <div className="space-y-2">
            {FASILITAS_KESEHATAN.map((f) => (
              <div key={f.nama} className="flex items-center justify-between rounded border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <Heart className="size-3.5 text-rose-400" />
                  <span className="text-sm text-foreground">{f.nama}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{f.keterangan}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Tenaga Pendidikan */}
      <SectionCard title="Tenaga Pendidikan" description="Distribusi sekolah negeri per jenjang">
        <div className="grid gap-3 sm:grid-cols-3">
          {TENAGA_PENDIDIKAN.map((t) => (
            <div key={t.jenjang} className="rounded-lg border border-border p-4 text-center">
              <BookOpen className="mx-auto size-5 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold text-foreground">{t.jumlahSekolah}</div>
              <div className="text-xs text-muted-foreground">{t.jenjang}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Struktur Kelompok Jabatan */}
      <SectionCard
        title="Kelompok Jabatan ASN"
        description="Sesuai UU No. 5 Tahun 2014 tentang ASN dan PermenPANRB No. 1 Tahun 2020"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {KELOMPOK_JABATAN.map((k) => (
            <div key={k.kode} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{k.kode}</span>
                <span className="text-sm font-medium text-foreground">{k.nama}</span>
              </div>
              <p className="text-xs text-muted-foreground">{k.deskripsi}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-muted/50 border border-border p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Formula Proyeksi: </span>
            Kebutuhan = ABK − Bezetting + BUP per tahun · Periode proyeksi: 2024 – 2028
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
