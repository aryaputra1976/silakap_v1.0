import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LayananSopConfigRepository } from './layanan-sop-config.repository';
import { UpdateSopConfigDto } from './dto/update-sop-config.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OpdSubmissionQueryDto } from '../opd-submission/dto/opd-submission-query.dto';
import {
  CompleteOpdSubmissionDto,
  InternalActionNoteDto,
  RequestCorrectionDto,
} from '../opd-submission/dto/request-correction.dto';
import { SubmitOpdSubmissionDto } from '../opd-submission/dto/submit-opd-submission.dto';
import { UploadSubmissionDocumentDto } from '../opd-submission/dto/upload-submission-document.dto';
import {
  OpdSubmissionService,
  type UploadedOpdSubmissionFile,
} from '../opd-submission/opd-submission.service';
import { getAuditContext } from '../shared/request-context';
import { ok } from '../shared/respond';
import { CreateLayananSubmissionDto } from './dto/create-layanan-submission.dto';
import { UpdateLayananSubmissionDto } from './dto/update-layanan-submission.dto';

const MODULE_KEY = 'LAYANAN_KEPEGAWAIAN';

const INTERNAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

// ─── Public — SOP catalog (no auth required) ─────────────────────────────────

@ApiTags('Layanan Kepegawaian — SOP Catalog')
@Controller('api/v1/layanan-kepegawaian')
export class LayananSopConfigController {
  constructor(
    @Inject(LayananSopConfigRepository)
    private readonly sopRepo: LayananSopConfigRepository,
  ) {}

  @ApiOperation({ summary: 'Daftar konfigurasi SOP layanan kepegawaian (aktif, urut sortOrder)' })
  @ApiResponse({ status: 200, description: 'Array SopConfig' })
  @Get('sop-configs')
  async listSopConfigs() {
    const rows = await this.sopRepo.findAllActive();
    return {
      success: true,
      data: rows.map(toSopConfigResponse),
    };
  }
}

function toSopConfigResponse(r: { sopKey: string; code: string; title: string; shortLabel: string; description: string; rhkCodes: unknown; sortOrder: number; updatedAt: Date }) {
  return {
    key: r.sopKey,
    code: r.code,
    title: r.title,
    shortLabel: r.shortLabel,
    description: r.description,
    rhkCodes: r.rhkCodes as string[],
    sortOrder: r.sortOrder,
    updatedAt: r.updatedAt,
  };
}

// ─── Admin — SOP config management ───────────────────────────────────────────

@ApiTags('Layanan Kepegawaian — Admin SOP Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/internal/layanan-kepegawaian/sop-configs')
export class AdminLayananSopConfigController {
  constructor(
    @Inject(LayananSopConfigRepository)
    private readonly sopRepo: LayananSopConfigRepository,
  ) {}

  @ApiOperation({ summary: 'Daftar semua SOP config (termasuk tidak aktif)' })
  @Get()
  async listAll() {
    const rows = await this.sopRepo.findAll();
    return ok(rows.map(toSopConfigResponse));
  }

  @ApiOperation({ summary: 'Update title/shortLabel/description/rhkCodes/sortOrder/isActive satu SOP' })
  @ApiParam({ name: 'sopKey', example: 'LAY-001' })
  @ApiResponse({ status: 200, description: 'SOP config berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'SOP key tidak ditemukan' })
  @Patch(':sopKey')
  async updateOne(
    @Param('sopKey') sopKey: string,
    @Body() dto: UpdateSopConfigDto,
  ) {
    const existing = await this.sopRepo.findBySopKey(sopKey);
    if (!existing) throw new NotFoundException(`SOP config '${sopKey}' tidak ditemukan`);

    const updated = await this.sopRepo.partialUpdate(sopKey, dto);
    return ok(toSopConfigResponse(updated), 'SOP config berhasil diperbarui');
  }
}

// ─── OPD — portal OPD ───────────────────────────────────────────────────────

@ApiTags('Layanan Kepegawaian — Portal OPD')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/layanan-kepegawaian/submissions')
export class LayananKepegawaianController {
  constructor(
    @Inject(OpdSubmissionService)
    private readonly service: OpdSubmissionService,
  ) {}

  @ApiOperation({ summary: 'Daftar pengajuan layanan kepegawaian saya' })
  @Get()
  @Roles('OPD')
  async listMine(@Query() query: OpdSubmissionQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.listMine({ ...query, moduleKey: MODULE_KEY }, user));
  }

  @ApiOperation({ summary: 'Ringkasan status pengajuan layanan kepegawaian saya' })
  @Get('summary')
  @Roles('OPD')
  async summaryMine(@Query() query: OpdSubmissionQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMySummary({ ...query, moduleKey: MODULE_KEY }, user));
  }

  @ApiOperation({ summary: 'Timeline aktivitas pengajuan' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Get(':id/timeline')
  @Roles('OPD')
  async timelineMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMyTimeline(id, user));
  }

  @ApiOperation({ summary: 'Detail pengajuan layanan kepegawaian saya' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiResponse({ status: 200, description: 'Detail pengajuan' })
  @ApiResponse({ status: 404, description: 'Pengajuan tidak ditemukan' })
  @Get(':id')
  @Roles('OPD')
  async getMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMine(id, user));
  }

  @ApiOperation({ summary: 'Buat draft pengajuan layanan kepegawaian baru' })
  @ApiResponse({ status: 201, description: 'Draft berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'serviceType tidak valid untuk LAYANAN_KEPEGAWAIAN' })
  @Post()
  @Roles('OPD')
  async createDraft(
    @Body() dto: CreateLayananSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.createDraft(
        { ...dto, moduleKey: MODULE_KEY },
        user,
        getAuditContext(request),
      ),
      'Draft pengajuan layanan kepegawaian berhasil dibuat',
    );
  }

  @ApiOperation({ summary: 'Update draft pengajuan (status harus DRAFT)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Patch(':id')
  @Roles('OPD')
  async updateMine(
    @Param('id') id: string,
    @Body() dto: UpdateLayananSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.updateMine(id, dto, user, getAuditContext(request)),
      'Draft pengajuan layanan kepegawaian berhasil diperbarui',
    );
  }

  @ApiOperation({ summary: 'Kirim pengajuan ke PPIK (DRAFT → SUBMITTED)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/submit')
  @Roles('OPD')
  async submitMine(
    @Param('id') id: string,
    @Body() dto: SubmitOpdSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.submitMine(id, dto, user, getAuditContext(request)),
      'Pengajuan layanan kepegawaian berhasil dikirim',
    );
  }

  @ApiOperation({ summary: 'Batalkan pengajuan (sebelum diproses PPIK)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/cancel')
  @Roles('OPD')
  async cancelMine(
    @Param('id') id: string,
    @Body() dto: SubmitOpdSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.cancelMine(id, dto, user, getAuditContext(request)),
      'Pengajuan layanan kepegawaian berhasil dibatalkan',
    );
  }

  @ApiOperation({ summary: 'Tambah metadata dokumen (link ke DMS)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/documents')
  @Roles('OPD')
  async addDocumentMine(
    @Param('id') id: string,
    @Body() dto: UploadSubmissionDocumentDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.addDocumentMine(id, dto, user, getAuditContext(request)),
      'Metadata dokumen berhasil disimpan',
    );
  }

  @ApiOperation({ summary: 'Upload file dokumen (multipart/form-data, maks 10 MB)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiConsumes('multipart/form-data')
  @Post(':id/documents/upload')
  @Roles('OPD')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentFileMine(
    @Param('id') id: string,
    @Body() dto: UploadSubmissionDocumentDto,
    @UploadedFile() file: UploadedOpdSubmissionFile | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.uploadDocumentFileMine(id, dto, file, user, getAuditContext(request)),
      'File dokumen berhasil diunggah',
    );
  }

  @ApiOperation({ summary: 'Kirim ulang berkas setelah perbaikan (NEEDS_CORRECTION → CORRECTION_SUBMITTED)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/correction-submit')
  @Roles('OPD')
  async submitCorrectionMine(
    @Param('id') id: string,
    @Body() dto: SubmitOpdSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.submitCorrectionMine(id, dto, user, getAuditContext(request)),
      'Perbaikan berkas berhasil dikirim',
    );
  }
}

// ─── Internal PPIK ───────────────────────────────────────────────────────────

@ApiTags('Layanan Kepegawaian — Internal PPIK')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...INTERNAL_ROLES)
@Controller('api/v1/internal/layanan-kepegawaian')
export class InternalLayananKepegawaianController {
  constructor(
    @Inject(OpdSubmissionService)
    private readonly service: OpdSubmissionService,
  ) {}

  @ApiOperation({ summary: 'Daftar pengajuan layanan kepegawaian (PPIK view)' })
  @Get()
  async listInternal(@Query() query: OpdSubmissionQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.listInternal({ ...query, moduleKey: MODULE_KEY }, user));
  }

  @ApiOperation({ summary: 'Ringkasan status pengajuan (dashboard PPIK)' })
  @Get('summary')
  async summaryInternal(@Query() query: OpdSubmissionQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getInternalSummary({ ...query, moduleKey: MODULE_KEY }, user));
  }

  @ApiOperation({ summary: 'Ringkasan SLA layanan kepegawaian (OVERDUE / DUE_SOON / ON_TRACK)' })
  @Get('sla/summary')
  async slaSummary(@Query() query: OpdSubmissionQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getInternalSlaSummary({ ...query, moduleKey: MODULE_KEY }, user));
  }

  @ApiOperation({ summary: 'Antrian pengajuan OVERDUE' })
  @Get('sla/overdue')
  async slaOverdue(@Query() query: OpdSubmissionQueryDto, @CurrentUser() user: AuthUser) {
    return ok(
      await this.service.getInternalSlaQueue({ ...query, moduleKey: MODULE_KEY }, user, 'OVERDUE'),
    );
  }

  @ApiOperation({ summary: 'Antrian pengajuan DUE_SOON' })
  @Get('sla/due-soon')
  async slaDueSoon(@Query() query: OpdSubmissionQueryDto, @CurrentUser() user: AuthUser) {
    return ok(
      await this.service.getInternalSlaQueue(
        { ...query, moduleKey: MODULE_KEY },
        user,
        'DUE_SOON',
      ),
    );
  }

  @ApiOperation({ summary: 'Timeline aktivitas pengajuan (audit trail)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Get(':id/timeline')
  async timelineInternal(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getInternalTimeline(id, user));
  }

  @ApiOperation({ summary: 'Detail pengajuan (PPIK view dengan assignee dan SLA)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiResponse({ status: 404, description: 'Pengajuan tidak ditemukan' })
  @Get(':id')
  async getInternal(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getInternal(id, user));
  }

  @ApiOperation({ summary: 'Terima pengajuan (SUBMITTED → RECEIVED), SLA dimulai' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/receive')
  async receive(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.receive(id, dto, user, getAuditContext(request)));
  }

  @ApiOperation({ summary: 'Mulai verifikasi berkas (RECEIVED → IN_VERIFICATION)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/start-verification')
  async startVerification(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.startVerification(id, dto, user, getAuditContext(request)));
  }

  @ApiOperation({ summary: 'Minta perbaikan berkas OPD (SLA dijeda)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/request-correction')
  async requestCorrection(
    @Param('id') id: string,
    @Body() dto: RequestCorrectionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.requestCorrection(id, dto, user, getAuditContext(request)));
  }

  @ApiOperation({ summary: 'Verifikasi pengajuan (IN_VERIFICATION → VERIFIED)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/verify')
  async verify(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.verify(id, dto, user, getAuditContext(request)));
  }

  @ApiOperation({ summary: 'Tolak pengajuan (status → REJECTED)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.reject(id, dto, user, getAuditContext(request)));
  }

  @ApiOperation({ summary: 'Selesaikan pengajuan (VERIFIED → COMPLETED), SLA ditutup' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiResponse({ status: 400, description: 'Dokumen belum semua terverifikasi (tanpa overrideNote)' })
  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteOpdSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.complete(id, dto, user, getAuditContext(request)));
  }

  @ApiOperation({ summary: 'Verifikasi dokumen individual' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiParam({ name: 'documentId', description: 'ID dokumen (UUID)' })
  @Post(':id/documents/:documentId/verify')
  async verifyDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.verifyDocument(id, documentId, dto, user, getAuditContext(request)),
      'Dokumen berhasil diverifikasi',
    );
  }

  @ApiOperation({ summary: 'Minta perbaikan dokumen individual' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiParam({ name: 'documentId', description: 'ID dokumen (UUID)' })
  @Post(':id/documents/:documentId/request-correction')
  async requestDocumentCorrection(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: RequestCorrectionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.requestDocumentCorrection(
        id,
        documentId,
        dto,
        user,
        getAuditContext(request),
      ),
      'Perbaikan dokumen berhasil diminta',
    );
  }

  @ApiOperation({ summary: 'Tolak dokumen individual' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiParam({ name: 'documentId', description: 'ID dokumen (UUID)' })
  @Post(':id/documents/:documentId/reject')
  async rejectDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: RequestCorrectionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.rejectDocument(id, documentId, dto, user, getAuditContext(request)),
      'Dokumen berhasil ditolak',
    );
  }

  @ApiOperation({ summary: 'Upload file dokumen internal PPIK' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiConsumes('multipart/form-data')
  @Post(':id/documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadInternalDocumentFile(
    @Param('id') id: string,
    @Body() dto: UploadSubmissionDocumentDto,
    @UploadedFile() file: UploadedOpdSubmissionFile | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.uploadInternalDocumentFile(id, dto, file, user, getAuditContext(request)),
      'File dokumen internal PPIK berhasil diunggah',
    );
  }
}
