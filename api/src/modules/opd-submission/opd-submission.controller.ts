import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { getAuditContext } from '../shared/request-context';
import { ok } from '../shared/respond';
import { CreateOpdSubmissionDto } from './dto/create-opd-submission.dto';
import { OpdSubmissionQueryDto } from './dto/opd-submission-query.dto';
import {
  CompleteOpdSubmissionDto,
  InternalActionNoteDto,
  RequestCorrectionDto,
} from './dto/request-correction.dto';
import { SubmitOpdSubmissionDto } from './dto/submit-opd-submission.dto';
import { UpdateOpdSubmissionDto } from './dto/update-opd-submission.dto';
import { UploadSubmissionDocumentDto } from './dto/upload-submission-document.dto';
import {
  OpdSubmissionService,
  type UploadedOpdSubmissionFile,
} from './opd-submission.service';

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

@ApiTags('OPD — Pengajuan Layanan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/opd/submissions')
export class OpdSubmissionController {
  constructor(@Inject(OpdSubmissionService) private readonly service: OpdSubmissionService) {}

  @ApiOperation({ summary: 'Daftar pengajuan saya' })
  @ApiResponse({ status: 200, description: 'Paginated list pengajuan OPD milik user' })
  @Get()
  @Roles('OPD')
  async listMine(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.listMine(query, user));
  }

  @ApiOperation({ summary: 'Ringkasan status pengajuan saya' })
  @Get('summary')
  @Roles('OPD')
  async summaryMine(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getMySummary(query, user));
  }

  @ApiOperation({ summary: 'Timeline aktivitas pengajuan saya' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Get(':id/timeline')
  @Roles('OPD')
  async timelineMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMyTimeline(id, user));
  }

  @ApiOperation({ summary: 'Detail pengajuan saya' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiResponse({ status: 200, description: 'Detail pengajuan' })
  @ApiResponse({ status: 404, description: 'Pengajuan tidak ditemukan' })
  @Get(':id')
  @Roles('OPD')
  async getMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMine(id, user));
  }

  @ApiOperation({ summary: 'Buat draft pengajuan baru' })
  @ApiResponse({ status: 201, description: 'Draft berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Validasi gagal (moduleKey tidak valid, serviceType tidak dikenal, dll)' })
  @Post()
  @Roles('OPD')
  async createDraft(
    @Body() dto: CreateOpdSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.createDraft(dto, user, getAuditContext(request)),
      'Draft pengajuan OPD berhasil dibuat',
    );
  }

  @ApiOperation({ summary: 'Update draft pengajuan saya (status harus DRAFT)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Patch(':id')
  @Roles('OPD')
  async updateMine(
    @Param('id') id: string,
    @Body() dto: UpdateOpdSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(
      await this.service.updateMine(id, dto, user, getAuditContext(request)),
      'Draft pengajuan OPD berhasil diperbarui',
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
      'Pengajuan OPD berhasil dikirim',
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
      'Pengajuan OPD berhasil dibatalkan',
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
      'Metadata dokumen OPD berhasil disimpan',
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
      await this.service.uploadDocumentFileMine(
        id,
        dto,
        file,
        user,
        getAuditContext(request),
      ),
      'File dokumen OPD berhasil diunggah',
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
      'Perbaikan berkas OPD berhasil dikirim',
    );
  }
}

@ApiTags('Internal PPIK — Pemrosesan Pengajuan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...INTERNAL_ROLES)
@Controller('api/v1/internal/opd-submissions')
export class InternalOpdSubmissionController {
  constructor(@Inject(OpdSubmissionService) private readonly service: OpdSubmissionService) {}

  @ApiOperation({ summary: 'Daftar semua pengajuan (PPIK view)' })
  @Get()
  async listInternal(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.listInternal(query, user));
  }

  @ApiOperation({ summary: 'Ringkasan status pengajuan (PPIK dashboard)' })
  @Get('summary')
  async summaryInternal(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSummary(query, user));
  }

  @ApiOperation({ summary: 'Ringkasan SLA (jumlah OVERDUE, DUE_SOON, ON_TRACK)' })
  @Get('sla/summary')
  async slaSummary(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSlaSummary(query, user));
  }

  @ApiOperation({ summary: 'Antrian pengajuan OVERDUE (terlewat SLA)' })
  @Get('sla/overdue')
  async slaOverdue(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSlaQueue(query, user, 'OVERDUE'));
  }

  @ApiOperation({ summary: 'Antrian pengajuan DUE_SOON (mendekati batas SLA)' })
  @Get('sla/due-soon')
  async slaDueSoon(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSlaQueue(query, user, 'DUE_SOON'));
  }

  @ApiOperation({ summary: 'Timeline aktivitas pengajuan (audit trail)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @Get(':id/timeline')
  async timelineInternal(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalTimeline(id, user));
  }

  @ApiOperation({ summary: 'Detail pengajuan (PPIK view dengan data assignee dan SLA)' })
  @ApiParam({ name: 'id', description: 'ID pengajuan (UUID)' })
  @ApiResponse({ status: 200, description: 'Detail pengajuan lengkap' })
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

  @ApiOperation({ summary: 'Upload file dokumen internal PPIK (multipart/form-data)' })
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
      await this.service.uploadInternalDocumentFile(
        id,
        dto,
        file,
        user,
        getAuditContext(request),
      ),
      'File dokumen internal PPIK berhasil diunggah',
    );
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
      await this.service.verifyDocument(
        id,
        documentId,
        dto,
        user,
        getAuditContext(request),
      ),
      'Dokumen OPD berhasil diverifikasi',
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
      'Perbaikan dokumen OPD berhasil diminta',
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
      await this.service.rejectDocument(
        id,
        documentId,
        dto,
        user,
        getAuditContext(request),
      ),
      'Dokumen OPD berhasil ditolak',
    );
  }
}
