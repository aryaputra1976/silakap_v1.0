import {
  buildSipensiunTemplate,
  SipensiunJenis,
} from './sipensiun-letter-template';
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
  jenisPensiun: SipensiunJenis;
  tmtPensiun: Date | null;
  catatan: string | null;

  nomorKarpeg: string | null;
  alamatSekarang: string | null;
  alamatSesudahPensiun: string | null;
  noHp: string | null;

  namaPemohon: string | null;
  nikPemohon: string | null;
  hubunganPemohon: string | null;
  alamatPemohon: string | null;
  noHpPemohon: string | null;

  namaPenerimaManfaat: string | null;
  tanggalMeninggal: Date | null;

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
    namaPemohon: string | null;
    nikPemohon: string | null;
    hubunganPemohon: string | null;
    alamatPemohon: string | null;
    noHpPemohon: string | null;
    namaPenerimaManfaat: string | null;
    tanggalMeninggal: string | null;
  };
  body: string;
  requirements: LetterRequirementItem[];
  missingDocuments: LetterRequirementItem[];
};

const SHORT_BLANK = '. . . . . . . . . . . .';

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

  const tmtPensiun = source.tmtPensiun
    ? formatDateIndonesia(source.tmtPensiun)
    : SHORT_BLANK;

  const tanggalMeninggal = source.tanggalMeninggal
    ? formatDateIndonesia(source.tanggalMeninggal)
    : SHORT_BLANK;

  const applicantName = resolveApplicantName(source);
  const applicantNip = resolveApplicantNip(source);
  const template = buildSipensiunTemplate({
    jenisPensiun: source.jenisPensiun,
    recipientCategory: source.recipient.category,
    defaultRecipientName: source.recipient.recipientName,
    defaultRecipientCity: source.recipient.recipientCity,
    applicantName,
    applicantNip,
    nomorKarpeg: source.nomorKarpeg ?? SHORT_BLANK,
    golonganNama: source.asn.golonganNama ?? SHORT_BLANK,
    unitKerjaNama: source.asn.unitKerjaNama ?? SHORT_BLANK,
    alamatSekarang: source.alamatSekarang ?? source.alamatPemohon ?? SHORT_BLANK,
    alamatSesudahPensiun: source.alamatSesudahPensiun ?? SHORT_BLANK,
    noHp: source.noHp ?? source.noHpPemohon ?? SHORT_BLANK,
    tmtPensiun,
    namaPenerimaManfaat: source.namaPenerimaManfaat ?? SHORT_BLANK,
    tanggalMeninggal,
  });

  const effectiveRecipient: LetterRecipient = {
    ...source.recipient,
    recipientName: template.recipient.recipientName,
    recipientCity: template.recipient.recipientCity,
  };

  return {
    caseId: source.caseId,
    caseNumber: source.caseNumber,
    jenisPensiun: source.jenisPensiun,
    recipient: effectiveRecipient,
    subject: template.subject,
    metadata: {
      referenceTitle: 'Surat Edaran Kepala BKN',
      referenceNumber: '04/SE/1980',
      referenceDate: '11 Pebruari 1980',
      note: template.recipient.note,
    },
    fields: {
      nama: source.asn.nama,
      nip: source.asn.nip,
      nomorSeriKarpeg: source.nomorKarpeg ?? '',
      jabatanNama: source.asn.jabatanNama,
      golonganNama: source.asn.golonganNama,
      unitKerjaNama: source.asn.unitKerjaNama,
      alamatSekarang: source.alamatSekarang ?? '',
      alamatSesudahPensiun: source.alamatSesudahPensiun ?? '',
      noHp: source.noHp ?? '',
      statusAsn: source.asn.statusAsn,
      tmtPensiun: source.tmtPensiun
        ? formatDateIndonesia(source.tmtPensiun)
        : null,
      namaPemohon: source.namaPemohon,
      nikPemohon: source.nikPemohon,
      hubunganPemohon: source.hubunganPemohon,
      alamatPemohon: source.alamatPemohon,
      noHpPemohon: source.noHpPemohon,
      namaPenerimaManfaat: source.namaPenerimaManfaat,
      tanggalMeninggal: source.tanggalMeninggal
        ? formatDateIndonesia(source.tanggalMeninggal)
        : null,
    },
    body: buildBlankoBody(template, applicantName, applicantNip, source),
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

function buildBlankoBody(
  template: ReturnType<typeof buildSipensiunTemplate>,
  applicantName: string,
  applicantNip: string,
  source: LetterPreviewSource,
): string {
  const lines: string[] = [
    'Lampiran : Surat Edaran Kepala BKN',
    'Nomor    : 04/SE/1980',
    'Tanggal  : 11 Pebruari 1980',
    '',
    'Kepada',
    `Yth. ${template.recipient.recipientName}`,
    'Di -',
    `    ${template.recipient.recipientCity}`,
    '',
    `${template.identityNumber ? `${template.identityNumber}. ` : ''}Yang bertanda tangan dibawah ini :`,
    `   a. N a m a                 : ${applicantName}`,
    `   b. N i p                   : ${applicantNip}`,
    `   c. Nomor Seri Karpeg       : ${source.nomorKarpeg ?? SHORT_BLANK}`,
    `   d. Pangkat/Gol.Ruang       : ${source.asn.golonganNama ?? SHORT_BLANK}`,
    `   e. Unit Organisasi         : ${source.asn.unitKerjaNama ?? SHORT_BLANK}`,
    `   f. Alamat Sekarang         : ${source.alamatSekarang ?? source.alamatPemohon ?? SHORT_BLANK}`,
    `   g. Alamat sesudah pensiun  : ${source.alamatSesudahPensiun ?? SHORT_BLANK}`,
    `   h. No. HP                  : ${source.noHp ?? source.noHpPemohon ?? SHORT_BLANK}`,
    '',
    ...template.openingLines,
    '',
    `${Number(template.identityNumber || '1') + 1}. Sebagai bahan pertimbangan bersama ini saya lampirkan :`,
    ...template.attachmentLines.map((line, index) => {
      return `   ${toAlphabet(index)}. ${line}`;
    }),
    '',
    ...template.additionalStatementLines,
    `${template.closingNumber}. Demikian surat ini saya buat untuk dapat dipergunakan sebagaimana mestinya.`,
    '',
    '                                            Tolitoli, . . . . . . . . . . . .',
    '',
    '                                            Hormat Saya,',
    '',
    '',
    '',
    '                                            ---------------------------------',
    '                                            NIP.',
  ];

  if (template.recipient.note) {
    lines.push('', template.recipient.note);
  }

  return lines.join('\n');
}

function resolveApplicantName(source: LetterPreviewSource): string {
  if (source.jenisPensiun === 'JDU' || source.jenisPensiun === 'YATIM_PIATU') {
    return source.namaPemohon ?? SHORT_BLANK;
  }

  return source.asn.nama;
}

function resolveApplicantNip(source: LetterPreviewSource): string {
  if (source.jenisPensiun === 'JDU' || source.jenisPensiun === 'YATIM_PIATU') {
    return '-';
  }

  return source.asn.nip;
}

function toAlphabet(index: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';

  return alphabet[index] ?? `${index + 1}`;
}

function formatDateIndonesia(value: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}