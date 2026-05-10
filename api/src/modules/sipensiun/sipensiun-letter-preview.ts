import type { JenisPensiun } from '@prisma/client';
import { SIPENSIUN_REQUIREMENTS } from './sipensiun-requirements';

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
  jenisPensiun: JenisPensiun;
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
  jenisPensiun: JenisPensiun;
  recipient: LetterRecipient;
  subject: string;
  fields: {
    nama: string;
    nip: string;
    jabatanNama: string | null;
    golonganNama: string | null;
    unitKerjaNama: string | null;
    statusAsn: string | null;
    tmtPensiun: string | null;
  };
  body: string;
  requirements: LetterRequirementItem[];
  missingDocuments: LetterRequirementItem[];
};

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

  return {
    caseId: source.caseId,
    caseNumber: source.caseNumber,
    jenisPensiun: source.jenisPensiun,
    recipient: source.recipient,
    subject: buildSubject(source.jenisPensiun),
    fields: {
      nama: source.asn.nama,
      nip: source.asn.nip,
      jabatanNama: source.asn.jabatanNama,
      golonganNama: source.asn.golonganNama,
      unitKerjaNama: source.asn.unitKerjaNama,
      statusAsn: source.asn.statusAsn,
      tmtPensiun: source.tmtPensiun
        ? formatDateIndonesia(source.tmtPensiun)
        : null,
    },
    body: buildBody(source, requirements),
    requirements,
    missingDocuments,
  };
}

function getRequirementsWithUploadStatus(
  jenisPensiun: JenisPensiun,
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

function buildSubject(jenisPensiun: JenisPensiun): string {
  return `Permohonan ${toJenisPensiunLabel(jenisPensiun)}`;
}

function buildBody(
  source: LetterPreviewSource,
  requirements: LetterRequirementItem[],
): string {
  const asn = source.asn;
  const tmtPensiun = source.tmtPensiun
    ? formatDateIndonesia(source.tmtPensiun)
    : '................................';

  const lampiranText = requirements
    .filter((item) => item.required)
    .map((item, index) => `${index + 1}. ${item.label}`)
    .join('\n');

  const catatanText = source.catatan
    ? [``, `Catatan:`, source.catatan, ``]
    : [];

  return [
    `Kepada`,
    `Yth. ${source.recipient.recipientName}`,
    `Di -`,
    `    ${source.recipient.recipientCity}`,
    ``,
    `Yang bertanda tangan di bawah ini:`,
    ``,
    `Nama                 : ${asn.nama}`,
    `NIP                  : ${asn.nip}`,
    `Pangkat/Gol. Ruang   : ${asn.golonganNama ?? '-'}`,
    `Jabatan              : ${asn.jabatanNama ?? '-'}`,
    `Unit Organisasi      : ${asn.unitKerjaNama ?? '-'}`,
    ``,
    buildOpeningParagraph(source.jenisPensiun, tmtPensiun),
    ...catatanText,
    ``,
    `Sebagai bahan pertimbangan, bersama ini saya lampirkan:`,
    ``,
    lampiranText || '-',
    ``,
    `Demikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,
    ``,
    `Tolitoli, ${formatDateIndonesia(new Date())}`,
    ``,
    `Hormat Saya,`,
    ``,
    ``,
    ``,
    `${asn.nama}`,
    `NIP. ${asn.nip}`,
  ].join('\n');
}

function buildOpeningParagraph(
  jenisPensiun: JenisPensiun,
  tmtPensiun: string,
): string {
  switch (jenisPensiun) {
    case 'BUP':
      return `Dengan ini mengajukan permintaan berhenti dengan hormat sebagai Pegawai Negeri Sipil dengan hak pensiun terhitung mulai tanggal ${tmtPensiun} karena telah mencapai batas usia pensiun.`;

    case 'APS':
      return `Dengan ini mengajukan permintaan berhenti dengan hormat sebagai Pegawai Negeri Sipil dengan hak pensiun terhitung mulai tanggal ${tmtPensiun} karena atas permintaan sendiri.`;

    case 'JDU':
      return `Dengan ini mengajukan permohonan Pensiun Janda/Duda sebagai penerima hak pensiun Pegawai Negeri Sipil sesuai ketentuan yang berlaku.`;

    case 'YATIM_PIATU':
      return `Dengan ini mengajukan permohonan Pensiun Yatim Piatu sebagai penerima hak pensiun Pegawai Negeri Sipil sesuai ketentuan yang berlaku.`;

    case 'TWS':
      return `Dengan ini mengajukan permohonan pensiun karena Pegawai Negeri Sipil dinyatakan tewas sesuai ketentuan yang berlaku.`;

    case 'SAK':
      return `Dengan ini mengajukan permohonan pensiun karena sakit sesuai ketentuan yang berlaku.`;

    case 'HLG':
      return `Dengan ini mengajukan permohonan pensiun karena hilang sesuai ketentuan yang berlaku.`;

    case 'PTDH':
      return `Dengan ini mengajukan permohonan penyelesaian pemberhentian tidak dengan hormat sesuai ketentuan yang berlaku.`;

    default:
      return `Dengan ini mengajukan permohonan pensiun sesuai ketentuan yang berlaku.`;
  }
}

function toJenisPensiunLabel(jenisPensiun: JenisPensiun): string {
  const labels: Record<JenisPensiun, string> = {
    BUP: 'Pensiun Batas Usia Pensiun',
    APS: 'Pensiun Atas Permintaan Sendiri',
    JDU: 'Pensiun Janda/Duda',
    TWS: 'Pensiun Tewas',
    SAK: 'Pensiun Karena Sakit',
    HLG: 'Pensiun Karena Hilang',
    PTDH: 'Pemberhentian Tidak Dengan Hormat',
    YATIM_PIATU: 'Pensiun Yatim Piatu',
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