import { SIPENSIUN_REQUIREMENTS } from './sipensiun-requirements';

export type SipensiunJenis = keyof typeof SIPENSIUN_REQUIREMENTS;

export type LetterRecipient = {
  recipientName: string;
  recipientCity: string;
  category: 'BKN_PUSAT' | 'BKN_REGIONAL';
  needsReview: boolean;
};

export type LetterRequirementItem = {
  documentType: string;
  label: string;
  category: string;
  required: boolean;
  digital: boolean;
  notes?: string;
  uploaded: boolean;
};

export type LetterPreviewSource = {
  caseId: string;
  caseNumber: string;
  serviceType: string;
  currentState: string;
  status: string;
  jenisPensiun: SipensiunJenis;
  tmtPensiun: Date | null;
  catatan: string | null;
  recipient: LetterRecipient;
  asn: {
    id: string;
    nip: string;
    nama: string;
    jabatanNama: string | null;
    golonganNama: string | null;
    unitKerjaNama: string | null;
    statusAsn: string | null;
  };
  uploadedDocumentTypes: string[];
};

export type LetterPreviewResponse = {
  caseId: string;
  caseNumber: string;
  jenisPensiun: SipensiunJenis;
  recipient: LetterRecipient;
  subject: string;
  metadata: {
    referenceTitle: string;
    referenceNumber: string;
    referenceDate: string;
    note: string;
  };
  fields: {
    nama: string;
    nip: string;
    nomorSeriKarpeg: string;
    jabatanNama: string | null;
    golonganNama: string | null;
    unitKerjaNama: string | null;
    alamatSekarang: string;
    alamatSesudahPensiun: string;
    noHp: string;
    statusAsn: string | null;
    tmtPensiun: string | null;
  };
  body: string;
  requirements: LetterRequirementItem[];
  missingDocuments: LetterRequirementItem[];
};

const BLANK = '. . . . . . . . . . . . . . . .';
const SHORT_BLANK = '. . . . . . . . . . . .';
const LONG_BLANK =
  '. . . . . . . . . . . . . . . . . . . . . . . . . . .';

export function buildSipensiunLetterPreview(
  source: LetterPreviewSource,
): LetterPreviewResponse {
  const requirements = getRequirementsWithUploadStatus(
    source.jenisPensiun,
    source.uploadedDocumentTypes,
  );

  const missingDocuments = requirements.filter(
    (item) => item.required && !item.uploaded,
  );

  const subject = buildSubject(source.jenisPensiun);

  return {
    caseId: source.caseId,
    caseNumber: source.caseNumber,
    jenisPensiun: source.jenisPensiun,
    recipient: source.recipient,
    subject,
    metadata: {
      referenceTitle: 'Surat Edaran Kepala BKN',
      referenceNumber: '04/SE/1980',
      referenceDate: '11 Pebruari 1980',
      note: buildRecipientNote(source),
    },
    fields: {
      nama: source.asn.nama,
      nip: source.asn.nip,
      nomorSeriKarpeg: '',
      jabatanNama: source.asn.jabatanNama,
      golonganNama: source.asn.golonganNama,
      unitKerjaNama: source.asn.unitKerjaNama,
      alamatSekarang: '',
      alamatSesudahPensiun: '',
      noHp: '',
      statusAsn: source.asn.statusAsn,
      tmtPensiun: source.tmtPensiun
        ? formatDateIndonesia(source.tmtPensiun)
        : null,
    },
    body: buildBlankoBody(source, requirements),
    requirements,
    missingDocuments,
  };
}

function getRequirementsWithUploadStatus(
  jenisPensiun: SipensiunJenis,
  uploadedDocumentTypes: string[],
): LetterRequirementItem[] {
  const uploadedSet = new Set(uploadedDocumentTypes);
  const requirements = SIPENSIUN_REQUIREMENTS[jenisPensiun] ?? [];

  return requirements.map((item) => ({
    documentType: item.documentType,
    label: item.label,
    category: item.category,
    required: item.required,
    digital: item.digital,
    notes: item.notes,
    uploaded: uploadedSet.has(item.documentType),
  }));
}

function buildSubject(jenisPensiun: SipensiunJenis): string {
  return toJenisPensiunLabel(jenisPensiun);
}

function buildBlankoBody(
  source: LetterPreviewSource,
  requirements: LetterRequirementItem[],
): string {
  const requiredAttachments = requirements.filter((item) => item.required);
  const tmtPensiun = source.tmtPensiun
    ? formatDateIndonesia(source.tmtPensiun)
    : SHORT_BLANK;

  const lines: string[] = [
    'Lampiran : Surat Edaran Kepala BKN',
    'Nomor    : 04/SE/1980',
    'Tanggal  : 11 Pebruari 1980',
    '',
    'Kepada',
    `Yth. ${source.recipient.recipientName}`,
    'Di -',
    `    ${source.recipient.recipientCity}`,
    '',
    '1. Yang bertanda tangan dibawah ini :',
    `   a. N a m a                 : ${source.asn.nama}`,
    `   b. N i p                   : ${source.asn.nip}`,
    `   c. Nomor Seri Karpeg       : ${SHORT_BLANK}`,
    `   d. Pangkat/Gol.Ruang       : ${source.asn.golonganNama ?? SHORT_BLANK}`,
    `   e. Unit Organisasi         : ${source.asn.unitKerjaNama ?? SHORT_BLANK}`,
    `   f. Alamat Sekarang         : ${BLANK}`,
    `   g. Alamat sesudah pensiun  : ${BLANK}`,
    `   h. No. HP                  : ${SHORT_BLANK}`,
    '',
    ...buildOpeningParagraph(source, tmtPensiun),
    '',
    '2. Sebagai bahan pertimbangan bersama ini saya lampirkan :',
    ...buildAttachmentLines(requiredAttachments),
    '',
    ...buildAdditionalStatement(source.jenisPensiun),
    `${source.jenisPensiun === 'APS' ? '4' : '3'}. Demikian surat ini saya buat untuk dapat dipergunakan sebagaimana mestinya.`,
    '',
    `                                            Tolitoli, ${SHORT_BLANK}`,
    '',
    '                                            Hormat Saya,',
    '',
    '',
    '',
    '                                            ---------------------------------',
    '                                            NIP.',
  ];

  const note = buildRecipientNote(source);
  if (note) {
    lines.push('', note);
  }

  return lines.join('\n');
}

function buildOpeningParagraph(
  source: LetterPreviewSource,
  tmtPensiun: string,
): string[] {
  switch (source.jenisPensiun) {
    case 'BUP':
      return [
        '   Dengan ini mengajukan permintaan berhenti dengan hormat sebagai Pegawai Negeri',
        `   Sipil dengan hak pensiun terhitung mulai tanggal ${tmtPensiun} karena telah mencapai batas`,
        '   usia pensiun.',
      ];

    case 'APS':
      return [
        '   Dengan ini mengajukan permintaan berhenti dengan hormat sebagai Pegawai Negeri',
        `   Sipil dengan hak pensiun terhitung mulai tanggal ${tmtPensiun} karena atas permintaan sendiri.`,
      ];

    case 'JDU':
      return [
        `   Dengan ini mengajukan permohonan Pensiun Janda/Duda a.n. ${LONG_BLANK} sebagai`,
        `   Pegawai Negeri Sipil pada ${LONG_BLANK} Kabupaten Tolitoli meninggal pada`,
        `   tanggal ${SHORT_BLANK}.`,
      ];

    case 'YATIM_PIATU':
      return [
        `   Dengan ini mengajukan permohonan Pensiun Yatim Piatu a.n. ${LONG_BLANK} sebagai`,
        `   Pegawai Negeri Sipil pada ${LONG_BLANK} Kabupaten Tolitoli meninggal pada`,
        `   tanggal ${SHORT_BLANK}.`,
      ];

    case 'TWS':
      return [
        '   Dengan ini mengajukan permohonan pensiun karena Pegawai Negeri Sipil yang bersangkutan',
        '   dinyatakan tewas berdasarkan dokumen keterangan pejabat yang berwenang.',
      ];

    case 'SAK':
      return [
        '   Dengan ini mengajukan permohonan pensiun karena sakit berdasarkan dokumen keterangan',
        '   dokter/pejabat yang berwenang sesuai ketentuan peraturan perundang-undangan.',
      ];

    case 'HLG':
      return [
        '   Dengan ini mengajukan permohonan pensiun karena Pegawai Negeri Sipil yang bersangkutan',
        '   dinyatakan hilang berdasarkan surat keterangan pejabat yang berwenang.',
      ];

    case 'PTDH':
      return [
        '   Dengan ini mengajukan permohonan penyelesaian pemberhentian tidak dengan hormat',
        '   Pegawai Negeri Sipil sesuai ketentuan peraturan perundang-undangan.',
      ];

    default:
      return [
        '   Dengan ini mengajukan permohonan pensiun sesuai ketentuan yang berlaku.',
      ];
  }
}

function buildAttachmentLines(requirements: LetterRequirementItem[]): string[] {
  if (requirements.length === 0) {
    return ['   a. -'];
  }

  return requirements.map((item, index) => {
    return `   ${toAlphabet(index)}. ${normalizeRequirementLabel(item.label)}`;
  });
}

function normalizeRequirementLabel(label: string): string {
  return label
    .replace(/^SK CPNS$/i, 'Fotokopi surat keputusan pengangkatan CPNS')
    .replace(/^SK PNS$/i, 'Fotokopi surat keputusan pengangkatan PNS')
    .replace(/^SK pangkat terakhir$/i, 'Fotokopi surat keputusan pangkat terakhir')
    .replace(/^Kartu keluarga$/i, 'Fotokopi Kartu Keluarga (KK)')
    .replace(/^Pas foto$/i, 'Pas foto terbaru ukuran 3x4 sebanyak 4 Lembar')
    .replace(/^DPCP$/i, 'Data Perorangan Calon Penerima Pensiun (DPCP)');
}

function buildAdditionalStatement(jenisPensiun: SipensiunJenis): string[] {
  if (jenisPensiun !== 'APS') {
    return [];
  }

  return [
    '3. Dengan ini saya nyatakan bahwa saya tidak akan menjalankan beban tugas.',
    '',
  ];
}

function buildRecipientNote(source: LetterPreviewSource): string {
  if (source.jenisPensiun === 'APS') {
    return '';
  }

  if (source.recipient.category === 'BKN_PUSAT') {
    return 'Nb : Khusus Gol IV/b s/d keatas';
  }

  return 'Nb : Khusus Gol IV/a s/d kebawah';
}

function toAlphabet(index: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  return alphabet[index] ?? `${index + 1}`;
}

function toJenisPensiunLabel(jenisPensiun: SipensiunJenis): string {
  const labels: Record<SipensiunJenis, string> = {
    BUP: 'Permohonan Pensiun Batas Usia Pensiun',
    APS: 'Permohonan Pensiun Atas Permintaan Sendiri',
    JDU: 'Permohonan Pensiun Janda/Duda',
    TWS: 'Permohonan Pensiun Tewas',
    SAK: 'Permohonan Pensiun Karena Sakit',
    HLG: 'Permohonan Pensiun Karena Hilang',
    PTDH: 'Permohonan Pemberhentian Tidak Dengan Hormat',
    YATIM_PIATU: 'Permohonan Pensiun Yatim Piatu',
  };

  return labels[jenisPensiun];
}

function formatDateIndonesia(value: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}