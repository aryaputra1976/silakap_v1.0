Target Phase 8.4:
SIPENSIUN case
+ data ASN
+ data pemohon/ahli waris
+ data alamat/karpeg/HP
+ tanggal meninggal
↓
preview surat
↓
generate PDF lebih lengkap

Saya sarankan jalankan Phase 8.4A Backend dulu, baru setelah build sukses lanjut 8.4B Frontend Form.

Phase 8.4A — Backend Data Surat SIPENSIUN
File yang dibuat/diubah
api/prisma/schema.prisma
api/src/modules/sipensiun/dto/update-sipensiun-letter-data.dto.ts
api/src/modules/sipensiun/sipensiun.repository.ts
api/src/modules/sipensiun/sipensiun.service.ts
api/src/modules/sipensiun/sipensiun.controller.ts
api/src/modules/sipensiun/sipensiun-letter-preview.ts
1. Update schema.prisma

Cari model:

model SipensiunCase {

Tambahkan field berikut di dalam model SipensiunCase:

  nomorKarpeg           String?   @map("nomor_karpeg") @db.VarChar(80)
  alamatSekarang        String?   @map("alamat_sekarang") @db.Text
  alamatSesudahPensiun  String?   @map("alamat_sesudah_pensiun") @db.Text
  noHp                  String?   @map("no_hp") @db.VarChar(40)

  namaPemohon           String?   @map("nama_pemohon") @db.VarChar(150)
  nikPemohon            String?   @map("nik_pemohon") @db.VarChar(40)
  hubunganPemohon       String?   @map("hubungan_pemohon") @db.VarChar(80)
  alamatPemohon         String?   @map("alamat_pemohon") @db.Text
  noHpPemohon           String?   @map("no_hp_pemohon") @db.VarChar(40)

  namaPenerimaManfaat   String?   @map("nama_penerima_manfaat") @db.VarChar(150)
  tanggalMeninggal      DateTime? @map("tanggal_meninggal")

Contoh posisi final di model:

model SipensiunCase {
  id           String       @id @default(uuid()) @db.VarChar(36)
  siapCaseId   String       @unique @map("siap_case_id") @db.VarChar(36)
  asnId        String       @map("asn_id") @db.VarChar(36)
  jenisPensiun JenisPensiun @map("jenis_pensiun")
  tmtPensiun   DateTime?    @map("tmt_pensiun")
  catatan      String?      @db.Text

  nomorKarpeg           String?   @map("nomor_karpeg") @db.VarChar(80)
  alamatSekarang        String?   @map("alamat_sekarang") @db.Text
  alamatSesudahPensiun  String?   @map("alamat_sesudah_pensiun") @db.Text
  noHp                  String?   @map("no_hp") @db.VarChar(40)

  namaPemohon           String?   @map("nama_pemohon") @db.VarChar(150)
  nikPemohon            String?   @map("nik_pemohon") @db.VarChar(40)
  hubunganPemohon       String?   @map("hubungan_pemohon") @db.VarChar(80)
  alamatPemohon         String?   @map("alamat_pemohon") @db.Text
  noHpPemohon           String?   @map("no_hp_pemohon") @db.VarChar(40)

  namaPenerimaManfaat   String?   @map("nama_penerima_manfaat") @db.VarChar(150)
  tanggalMeninggal      DateTime? @map("tanggal_meninggal")

  createdAt DateTime  @default(now()) @map("created_at")
  createdBy String?   @map("created_by") @db.VarChar(36)
  updatedAt DateTime  @updatedAt @map("updated_at")
  updatedBy String?   @map("updated_by") @db.VarChar(36)
  deletedAt DateTime? @map("deleted_at")

  siapCase SiapCase @relation(fields: [siapCaseId], references: [id], onDelete: Cascade)
  asn      Asn      @relation(fields: [asnId], references: [id], onDelete: Cascade)

  @@index([asnId])
  @@index([jenisPensiun])
  @@index([tmtPensiun])
  @@map("sipensiun_cases")
}

Lalu nanti jalankan:

cd D:\Silakap_V1.0\api

npx prisma generate
npx prisma db push
2. Buat file baru
api/src/modules/sipensiun/dto/update-sipensiun-letter-data.dto.ts
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSipensiunLetterDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nomorKarpeg?: string;

  @IsOptional()
  @IsString()
  alamatSekarang?: string;

  @IsOptional()
  @IsString()
  alamatSesudahPensiun?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  noHp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  namaPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nikPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  hubunganPemohon?: string;

  @IsOptional()
  @IsString()
  alamatPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  noHpPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  namaPenerimaManfaat?: string;

  @IsOptional()
  @IsDateString()
  tanggalMeninggal?: string;
}
3. Update sipensiun-letter-preview.ts

Ganti penuh file ini.

api/src/modules/sipensiun/sipensiun-letter-preview.ts
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
    `   a. N a m a                 : ${resolveApplicantName(source)}`,
    `   b. N i p                   : ${resolveApplicantNip(source)}`,
    `   c. Nomor Seri Karpeg       : ${source.nomorKarpeg ?? SHORT_BLANK}`,
    `   d. Pangkat/Gol.Ruang       : ${source.asn.golonganNama ?? SHORT_BLANK}`,
    `   e. Unit Organisasi         : ${source.asn.unitKerjaNama ?? SHORT_BLANK}`,
    `   f. Alamat Sekarang         : ${source.alamatSekarang ?? source.alamatPemohon ?? BLANK}`,
    `   g. Alamat sesudah pensiun  : ${source.alamatSesudahPensiun ?? BLANK}`,
    `   h. No. HP                  : ${source.noHp ?? source.noHpPemohon ?? SHORT_BLANK}`,
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
        `   Dengan ini mengajukan permohonan Pensiun Janda/Duda a.n. ${source.namaPenerimaManfaat ?? LONG_BLANK} sebagai`,
        `   Pegawai Negeri Sipil pada ${source.asn.unitKerjaNama ?? LONG_BLANK} Kabupaten Tolitoli meninggal pada`,
        `   tanggal ${source.tanggalMeninggal ? formatDateIndonesia(source.tanggalMeninggal) : SHORT_BLANK}.`,
      ];

    case 'YATIM_PIATU':
      return [
        `   Dengan ini mengajukan permohonan Pensiun Yatim Piatu a.n. ${source.namaPenerimaManfaat ?? LONG_BLANK} sebagai`,
        `   Pegawai Negeri Sipil pada ${source.asn.unitKerjaNama ?? LONG_BLANK} Kabupaten Tolitoli meninggal pada`,
        `   tanggal ${source.tanggalMeninggal ? formatDateIndonesia(source.tanggalMeninggal) : SHORT_BLANK}.`,
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
4. Update backend service/repository/controller

Karena file ini lebih panjang dan sensitif, lakukan perubahan dengan arahan berikut.

api/src/modules/sipensiun/sipensiun.repository.ts

Tambahkan method di dalam class:

async updateLetterData(
  id: string,
  data: Prisma.SipensiunCaseUncheckedUpdateInput,
): Promise<SipensiunCaseDetailRecord | null> {
  const existing = await this.prisma.sipensiunCase.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  return this.prisma.sipensiunCase.update({
    where: {
      id,
    },
    data,
    include: sipensiunDetailInclude,
  });
}
api/src/modules/sipensiun/sipensiun.service.ts

Tambahkan import:

import { UpdateSipensiunLetterDataDto } from './dto/update-sipensiun-letter-data.dto';

Tambahkan method:

async updateLetterData(
  id: string,
  dto: UpdateSipensiunLetterDataDto,
  user: AuthUser,
) {
  const updated = await this.sipensiunRepository.updateLetterData(id.trim(), {
    nomorKarpeg: this.normalizeNullableText(dto.nomorKarpeg),
    alamatSekarang: this.normalizeNullableText(dto.alamatSekarang),
    alamatSesudahPensiun: this.normalizeNullableText(dto.alamatSesudahPensiun),
    noHp: this.normalizeNullableText(dto.noHp),

    namaPemohon: this.normalizeNullableText(dto.namaPemohon),
    nikPemohon: this.normalizeNullableText(dto.nikPemohon),
    hubunganPemohon: this.normalizeNullableText(dto.hubunganPemohon),
    alamatPemohon: this.normalizeNullableText(dto.alamatPemohon),
    noHpPemohon: this.normalizeNullableText(dto.noHpPemohon),

    namaPenerimaManfaat: this.normalizeNullableText(dto.namaPenerimaManfaat),
    tanggalMeninggal: this.parseNullableDate(dto.tanggalMeninggal),
    updatedBy: user.id,
  });

  if (!updated) {
    throw new NotFoundException('Data SIPENSIUN tidak ditemukan');
  }

  return this.toDetailResponse(updated);
}

Tambahkan helper:

private normalizeNullableText(value: string | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

private parseNullableDate(value: string | undefined) {
  const normalized = this.normalizeNullableText(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Tanggal tidak valid');
  }

  return parsed;
}

Di method buildLetterPreviewSource(), tambahkan field ini ke return object:

nomorKarpeg: record.nomorKarpeg,
alamatSekarang: record.alamatSekarang,
alamatSesudahPensiun: record.alamatSesudahPensiun,
noHp: record.noHp,

namaPemohon: record.namaPemohon,
nikPemohon: record.nikPemohon,
hubunganPemohon: record.hubunganPemohon,
alamatPemohon: record.alamatPemohon,
noHpPemohon: record.noHpPemohon,

namaPenerimaManfaat: record.namaPenerimaManfaat,
tanggalMeninggal: record.tanggalMeninggal,
api/src/modules/sipensiun/sipensiun.controller.ts

Tambahkan import:

import { Patch } from '@nestjs/common';
import { UpdateSipensiunLetterDataDto } from './dto/update-sipensiun-letter-data.dto';

Kalau import NestJS sudah bentuk multiline, tambahkan Patch.

Tambahkan endpoint:

@Patch('cases/:id/letter-data')
async updateLetterData(
  @Param('id') id: string,
  @Body() dto: UpdateSipensiunLetterDataDto,
  @CurrentUser() user: AuthUser,
) {
  const result = await this.sipensiunService.updateLetterData(id, dto, user);

  return ok(result, 'Data surat SIPENSIUN berhasil diperbarui');
}

Letakkan sebelum:

@Get('cases/:id')
5. Jalankan migrasi/dev push
cd D:\Silakap_V1.0\api

npx prisma generate
npx prisma db push
npm run build
6. Smoke test backend

Login:

$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/v1/auth/login `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'

$token = $login.data.accessToken

Ambil case:

$sipensiun = Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/sipensiun/cases `
  -Headers @{ Authorization = "Bearer $token" }

$id = $sipensiun.data.items[0].id

Update data surat:

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3000/api/v1/sipensiun/cases/$id/letter-data" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "nomorKarpeg": "N 147476",
    "alamatSekarang": "Desa Salumbia Kec. Dondo",
    "alamatSesudahPensiun": "Desa Salumbia Kec. Dondo",
    "noHp": "081234567890",
    "namaPemohon": "SURIATI, SH",
    "nikPemohon": "7200000000000001",
    "hubunganPemohon": "Istri",
    "alamatPemohon": "JL. SOSIAL NO. 14, KEL. BARU, KEC. BAOLAN",
    "noHpPemohon": "082233445566",
    "namaPenerimaManfaat": "Andi Pratama",
    "tanggalMeninggal": "2026-05-01"
  }'

Cek preview:

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/v1/sipensiun/cases/$id/letter-preview" `
  -Headers @{ Authorization = "Bearer $token" }

Target:

Nomor Seri Karpeg tidak kosong
Alamat Sekarang tidak kosong
No. HP tidak kosong
a.n. tidak kosong
meninggal pada tidak kosong
7. Setelah Backend Sukses

Baru lanjut Phase 8.4B Frontend:

Tambah card/form "Data Surat"
Simpan ke PATCH /sipensiun/cases/:id/letter-data
Refresh preview otomatis
Generate PDF pakai data baru

Jalankan backend dulu sampai build sukses. Setelah itu saya lanjutkan file frontend lengkap.