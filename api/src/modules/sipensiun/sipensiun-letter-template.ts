import { SIPENSIUN_REQUIREMENTS } from './sipensiun-requirements';

export type SipensiunJenis = keyof typeof SIPENSIUN_REQUIREMENTS;

export type RecipientCategory = 'BKN_PUSAT' | 'BKN_REGIONAL';

export type TemplateRecipient = {
  recipientName: string;
  recipientCity: string;
  note: string;
};

export type TemplateContext = {
  jenisPensiun: SipensiunJenis;
  recipientCategory: RecipientCategory;
  defaultRecipientName: string;
  defaultRecipientCity: string;
  applicantName: string;
  applicantNip: string;
  nomorKarpeg: string;
  golonganNama: string;
  unitKerjaNama: string;
  alamatSekarang: string;
  alamatSesudahPensiun: string;
  noHp: string;
  tmtPensiun: string;
  namaPenerimaManfaat: string;
  tanggalMeninggal: string;
};

export type SipensiunLetterTemplate = {
  subject: string;
  recipient: TemplateRecipient;
  identityNumber: string;
  openingLines: string[];
  attachmentLines: string[];
  additionalStatementLines: string[];
  closingNumber: string;
};

const BLANK = '. . . . . . . . . . . . . . . .';
const SHORT_BLANK = '. . . . . . . . . . . .';
const LONG_BLANK =
  '. . . . . . . . . . . . . . . . . . . . . . . . . . .';

export function buildSipensiunTemplate(
  context: TemplateContext,
): SipensiunLetterTemplate {
  switch (context.jenisPensiun) {
    case 'BUP':
      return buildBupTemplate(context);

    case 'APS':
      return buildApsTemplate(context);

    case 'JDU':
      return buildJduTemplate(context);

    case 'YATIM_PIATU':
      return buildYatimPiatuTemplate(context);

    case 'TWS':
      return buildTwsTemplate(context);

    case 'SAK':
      return buildSakTemplate(context);

    case 'HLG':
      return buildHlgTemplate(context);

    case 'PTDH':
      return buildPtdhTemplate(context);

    default:
      return buildFallbackTemplate(context);
  }
}

function buildBupTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun Batas Usia Pensiun',
    recipient: resolveBknRecipient(context),
    identityNumber: '1',
    openingLines: [
      '   Dengan ini mengajukan permintaan berhenti dengan hormat sebagai Pegawai Negeri',
      `   Sipil dengan hak pensiun terhitung mulai tanggal ${context.tmtPensiun} karena telah mencapai batas`,
      '   usia pensiun.',
    ],
    attachmentLines:
      context.recipientCategory === 'BKN_PUSAT'
        ? [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi Surat Keputusan Pengangkatan CPNS dilegalisir',
            'Fotokopi Surat Keputusan Pengangkatan PNS dilegalisir',
            'Fotokopi Surat Keputusan pangkat terakhir 2 rangkap dilegalisir',
            'Fotokopi Akta Nikah dan Cerai/Akta Kematian pasangan dilegalisir',
            'Fotokopi Akta Kelahiran anak yang tertanggung dibawah usia 25 tahun dan belum menikah',
            'Daftar Susunan Keluarga yang disahkan oleh Camat/Lurah/Kepala Desa',
            'Asli SKP 1 tahun terakhir',
            'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
            'Asli Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara Berdasarkan Putusan Pengadilan',
            'Daftar Riwayat Hidup PNS',
            'Fotokopi SK CPNS pasangan atau SK Pensiun bagi suami/istri untuk PNS yang telah pensiun',
            'Fotokopi Kartu Keluarga (KK) dilegalisir masing-masing dibuat dalam 1 rangkap',
            'Pas foto terbaru ukuran 3x4 cm sebanyak 4 lembar',
            'Map Snelhekter Plastik 1 Lembar',
          ]
        : [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi Surat Keputusan Pengangkatan CPNS dilegalisir',
            'Fotokopi Surat Keputusan Pengangkatan PNS dilegalisir',
            'Fotokopi Surat Keputusan pangkat terakhir dilegalisir 2 rangkap',
            'Fotokopi Akta Nikah/Cerai/Akta Kematian dilegalisir',
            'Fotokopi Akta Kelahiran anak yang tertanggung dibawah usia 25 tahun dilegalisir',
            'Daftar Susunan Keluarga yang disahkan oleh Camat/Lurah/Kepala Desa',
            'Asli SKP 1 tahun terakhir',
            'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
            'Asli Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara Berdasarkan Putusan Pengadilan',
            'Fotokopi SK CPNS pasangan atau SK Pensiun suami/istri untuk PNS yang telah pensiun',
            'Fotokopi Kartu Keluarga (KK) dilegalisir masing-masing dibuat dalam 1 rangkap',
            'Pas foto terbaru ukuran 3x4 cm sebanyak 5 lembar',
            'Map Snelhekter Plastik 1 Lembar',
          ],
    additionalStatementLines: [],
    closingNumber: '3',
  };
}

function buildApsTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun Atas Permintaan Sendiri',
    recipient: {
      recipientName: 'BUPATI TOLITOLI',
      recipientCity: 'TOLITOLI',
      note: '',
    },
    identityNumber: '1',
    openingLines: [
      '   Dengan ini mengajukan permintaan berhenti dengan hormat sebagai Pegawai Negeri',
      `   Sipil dengan hak pensiun terhitung mulai tanggal ${context.tmtPensiun} karena atas permintaan sendiri.`,
    ],
    attachmentLines:
      context.recipientCategory === 'BKN_PUSAT'
        ? [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi surat keputusan pengangkatan CPNS dilegalisir',
            'Fotokopi surat keputusan pengangkatan PNS dilegalisir',
            'Fotokopi surat keputusan pangkat terakhir 2 rangkap',
            'Fotokopi akta nikah/cerai dilegalisir',
            'Fotokopi akte kelahiran anak yang tertanggung dibawah usia 25 tahun dilegalisir',
            'Daftar susunan keluarga yang disahkan oleh Camat/Lurah',
            'Pas foto terbaru ukuran 3x4 cm sebanyak 5 lembar',
            'Asli SKP 1 tahun terakhir',
            'Asli surat pernyataan tidak pernah dijatuhi hukuman disiplin',
            'Asli surat pernyataan tidak sedang menjalani proses pidana atau pernah dipidana penjara berdasarkan putusan pengadilan',
            'Fotokopi SK CPNS pasangan atau SK Pensiun suami/istri untuk PNS yang telah pensiun',
            'Fotokopi Kartu Keluarga (KK) dilegalisir',
            'Dibuat dalam 1 rangkap',
            'Map Plastik 1 Lembar',
            'No. HP',
          ]
        : [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi surat keputusan pengangkatan CPNS dilegalisir',
            'Fotokopi surat keputusan pengangkatan PNS dilegalisir',
            'Fotokopi surat keputusan pangkat terakhir',
            'Fotokopi akta nikah/cerai dilegalisir',
            'Fotokopi akte kelahiran anak yang tertanggung dilegalisir',
            'Daftar susunan keluarga yang disahkan oleh Camat/Lurah',
            'Pas foto ukuran 3x4 cm sebanyak 5 lembar',
            'Asli SKP 1 tahun terakhir',
            'Asli surat pernyataan tidak pernah dijatuhi hukuman disiplin',
            'Asli surat pernyataan tidak sedang menjalani proses pidana atau pernah dipidana penjara berdasarkan putusan pengadilan',
            'Fotokopi surat keputusan CPNS/Pensiun pasangan suami/istri untuk PNS',
          ],
    additionalStatementLines: [
      '3. Dengan ini saya nyatakan bahwa saya tidak akan menjalankan beban tugas.',
      '',
    ],
    closingNumber: '4',
  };
}

function buildJduTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun Janda/Duda',
    recipient: resolveBknRecipient(context),
    identityNumber: context.recipientCategory === 'BKN_REGIONAL' ? '3' : '',
    openingLines: [
      `   Dengan ini mengajukan permohonan Pensiun Janda/Duda a.n. ${context.namaPenerimaManfaat} sebagai`,
      `   Pegawai Negeri Sipil pada ${context.unitKerjaNama} Kabupaten Tolitoli meninggal pada`,
      `   tanggal ${context.tanggalMeninggal}.`,
    ],
    attachmentLines:
      context.recipientCategory === 'BKN_PUSAT'
        ? [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi Surat Keputusan pengangkatan CPNS',
            'Fotokopi Surat Keputusan pengangkatan PNS',
            'Fotokopi Surat Keputusan pangkat terakhir',
            'Fotokopi Akta Nikah/Cerai/Akta Kematian',
            'Fotokopi Akte Kelahiran anak yang tertanggung dibawah usia 25 tahun dilegalisir',
            'Fotokopi Akta kematian',
            'Surat Keterangan Janda/Duda dari kelurahan/desa setempat',
            'Fotokopi Susunan Keluarga yang disahkan oleh Camat/Lurah/Kepala Desa',
            'Asli SKP 1 tahun terakhir',
            'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
            'Asli Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara Berdasarkan Putusan Pengadilan',
            'Fotokopi SK CPNS pasangan atau SK Pensiun suami/istri untuk PNS yang telah pensiun',
            'Fotokopi Kartu Keluarga (KK) masing-masing dibuat dalam 1 rangkap',
            'Pas foto ahli waris terbaru ukuran 3x4 sebanyak 4 lembar',
            'Map Plastik 1 Lembar',
            'No. HP',
          ]
        : [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi Surat Keputusan pengangkatan CPNS dilegalisir',
            'Fotokopi Surat Keputusan pengangkatan PNS dilegalisir',
            'Fotokopi Surat Keputusan pangkat terakhir 2 rangkap',
            'Fotokopi Akta Nikah/Cerai/Akta Kematian dilegalisir',
            'Fotokopi Akte Kelahiran anak yang tertanggung dibawah usia 25 tahun dilegalisir',
            'Fotokopi Akta kematian',
            'Surat Keterangan Janda/Duda dari kelurahan/desa setempat',
            'Fotokopi Susunan Keluarga yang disahkan oleh Camat/Lurah/Kepala Desa',
            'Asli SKP 1 tahun terakhir',
            'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
            'Asli Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara Berdasarkan Putusan Pengadilan',
            'Fotokopi SK CPNS pasangan atau SK Pensiun suami/istri untuk PNS yang telah pensiun',
            'Daftar Riwayat Hidup',
            'Fotokopi Kartu Keluarga (KK) masing-masing dibuat dalam 1 rangkap',
            'Pas foto ahli waris terbaru ukuran 3x4 sebanyak 5 lembar',
            'Map Snelhekter Plastik 2 Lembar',
          ],
    additionalStatementLines: [],
    closingNumber: context.recipientCategory === 'BKN_REGIONAL' ? '5' : '2',
  };
}

function buildYatimPiatuTemplate(
  context: TemplateContext,
): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun Yatim Piatu',
    recipient: resolveBknRecipient(context),
    identityNumber: '1',
    openingLines: [
      `   Dengan ini mengajukan permohonan Pensiun Yatim Piatu a.n. ${context.namaPenerimaManfaat} sebagai`,
      `   Pegawai Negeri Sipil pada ${context.unitKerjaNama} Kabupaten Tolitoli meninggal pada`,
      `   tanggal ${context.tanggalMeninggal}.`,
    ],
    attachmentLines:
      context.recipientCategory === 'BKN_PUSAT'
        ? [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi surat keputusan pengangkatan CPNS',
            'Fotokopi surat keputusan pengangkatan PNS',
            'Fotokopi surat keputusan pangkat terakhir',
            'Fotokopi Akta Nikah/Cerai dilegalisir',
            'Fotokopi Akte Kelahiran Anak yang masih berusia dibawah 25 tahun dan belum menikah',
            'Fotokopi Akta kematian Ibu dan Bapak',
            'Daftar Susunan Keluarga yang disahkan oleh Kepala Desa/Lurah/Camat',
            'Asli SKP 1 tahun terakhir',
            'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
            'Asli Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara Berdasarkan Putusan Pengadilan',
            'Fotokopi SK CPNS pasangan atau SK Pensiun Janda/Duda bagi suami/istri untuk PNS yang telah pensiun/meninggal',
            'Daftar Riwayat Hidup PNS',
            'Pas foto ahli waris terbaru ukuran 3x4 sebanyak 4 Lembar',
            'Fotokopi Kartu Keluarga (KK) dilegalisir masing-masing dibuat dalam 1 rangkap',
            'Map Snelhekter Plastik 1 Lembar',
          ]
        : [
            'Data Perorangan Calon Penerima Pensiun (DPCP)',
            'Fotokopi surat keputusan pengangkatan CPNS',
            'Fotokopi surat keputusan pengangkatan PNS',
            'Fotokopi surat keputusan pangkat terakhir',
            'Fotokopi Akta Nikah/Cerai dilegalisir',
            'Fotokopi Akte Kelahiran Anak yang masih berusia dibawah 25 tahun dan belum menikah',
            'Fotokopi Akta kematian Ibu dan Bapak',
            'Daftar Susunan Keluarga yang disahkan oleh Kepala Desa/Lurah/Camat',
            'Asli SKP 1 tahun terakhir',
            'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
            'Asli Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara Berdasarkan Putusan Pengadilan',
            'Fotokopi SK CPNS pasangan atau SK Pensiun Janda/Duda bagi suami/istri untuk PNS yang telah pensiun/meninggal',
            'Daftar Riwayat Hidup PNS',
            'Pas foto ahli waris terbaru ukuran 3x4 sebanyak 4 Lembar',
            'Fotokopi Kartu Keluarga (KK) 1 masing-masing dibuat dalam 1 rangkap',
            'Map Snelhekter Plastik 1 Lembar',
          ],
    additionalStatementLines: [],
    closingNumber: '3',
  };
}

function buildTwsTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun Tewas',
    recipient: resolveBknRecipient(context),
    identityNumber: '1',
    openingLines: [
      `   Dengan ini mengajukan permohonan pensiun karena Pegawai Negeri Sipil a.n. ${context.applicantName}`,
      `   dinyatakan tewas dan meninggal pada tanggal ${context.tanggalMeninggal}.`,
    ],
    attachmentLines: [
      'Data Perorangan Calon Penerima Pensiun (DPCP)',
      'Fotokopi Surat Keputusan pengangkatan CPNS',
      'Fotokopi Surat Keputusan pengangkatan PNS',
      'Fotokopi Surat Keputusan pangkat terakhir',
      'Fotokopi Akta Nikah/Cerai/Akta Kematian',
      'Surat keterangan tewas dari pejabat yang berwenang',
      'Daftar Susunan Keluarga yang disahkan oleh Camat/Lurah/Kepala Desa',
      'Asli SKP 1 tahun terakhir',
      'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
      'Fotokopi Kartu Keluarga (KK)',
      'Pas foto terbaru ukuran 3x4 cm',
      'Map Snelhekter Plastik',
    ],
    additionalStatementLines: [],
    closingNumber: '3',
  };
}

function buildSakTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun Karena Sakit',
    recipient: resolveBknRecipient(context),
    identityNumber: '1',
    openingLines: [
      '   Dengan ini mengajukan permohonan pensiun karena sakit berdasarkan dokumen keterangan',
      '   dokter/pejabat yang berwenang sesuai ketentuan peraturan perundang-undangan.',
    ],
    attachmentLines: [
      'Data Perorangan Calon Penerima Pensiun (DPCP)',
      'Fotokopi Surat Keputusan pengangkatan CPNS',
      'Fotokopi Surat Keputusan pengangkatan PNS',
      'Fotokopi Surat Keputusan pangkat terakhir',
      'Surat keterangan dokter/tim penguji kesehatan',
      'Daftar Susunan Keluarga yang disahkan oleh Camat/Lurah/Kepala Desa',
      'Asli SKP 1 tahun terakhir',
      'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
      'Fotokopi Kartu Keluarga (KK)',
      'Pas foto terbaru ukuran 3x4 cm',
      'Map Snelhekter Plastik',
    ],
    additionalStatementLines: [],
    closingNumber: '3',
  };
}

function buildHlgTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun Karena Hilang',
    recipient: resolveBknRecipient(context),
    identityNumber: '1',
    openingLines: [
      '   Dengan ini mengajukan permohonan pensiun karena Pegawai Negeri Sipil yang bersangkutan',
      '   dinyatakan hilang berdasarkan surat keterangan pejabat yang berwenang.',
    ],
    attachmentLines: [
      'Data Perorangan Calon Penerima Pensiun (DPCP)',
      'Fotokopi Surat Keputusan pengangkatan CPNS',
      'Fotokopi Surat Keputusan pengangkatan PNS',
      'Fotokopi Surat Keputusan pangkat terakhir',
      'Surat keterangan hilang dari pejabat yang berwenang',
      'Daftar Susunan Keluarga yang disahkan oleh Camat/Lurah/Kepala Desa',
      'Asli SKP 1 tahun terakhir',
      'Asli Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin',
      'Fotokopi Kartu Keluarga (KK)',
      'Pas foto terbaru ukuran 3x4 cm',
      'Map Snelhekter Plastik',
    ],
    additionalStatementLines: [],
    closingNumber: '3',
  };
}

function buildPtdhTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pemberhentian Tidak Dengan Hormat',
    recipient: resolveBknRecipient(context),
    identityNumber: '1',
    openingLines: [
      '   Dengan ini mengajukan permohonan penyelesaian pemberhentian tidak dengan hormat',
      '   Pegawai Negeri Sipil sesuai ketentuan peraturan perundang-undangan.',
    ],
    attachmentLines: [
      'Fotokopi Surat Keputusan pengangkatan CPNS',
      'Fotokopi Surat Keputusan pengangkatan PNS',
      'Fotokopi Surat Keputusan pangkat terakhir',
      'Dokumen dasar pemberhentian tidak dengan hormat',
      'Berita acara/petikan putusan sesuai kebutuhan',
      'Data pendukung kepegawaian lainnya',
    ],
    additionalStatementLines: [],
    closingNumber: '3',
  };
}

function buildFallbackTemplate(context: TemplateContext): SipensiunLetterTemplate {
  return {
    subject: 'Permohonan Pensiun',
    recipient: resolveBknRecipient(context),
    identityNumber: '1',
    openingLines: [
      '   Dengan ini mengajukan permohonan pensiun sesuai ketentuan yang berlaku.',
    ],
    attachmentLines: [
      'Data Perorangan Calon Penerima Pensiun (DPCP)',
      'Fotokopi Surat Keputusan pengangkatan CPNS',
      'Fotokopi Surat Keputusan pengangkatan PNS',
      'Fotokopi Surat Keputusan pangkat terakhir',
      'Dokumen pendukung lainnya',
    ],
    additionalStatementLines: [],
    closingNumber: '3',
  };
}

function resolveBknRecipient(context: TemplateContext): TemplateRecipient {
  if (context.recipientCategory === 'BKN_PUSAT') {
    return {
      recipientName: 'Kepala BKN',
      recipientCity: 'Jakarta',
      note: 'Nb : Khusus Gol IV/b s/d keatas',
    };
  }

  return {
    recipientName: context.defaultRecipientName,
    recipientCity: context.defaultRecipientCity,
    note: 'Nb : Khusus Gol IV/a s/d kebawah',
  };
}