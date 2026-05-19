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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/opd/submissions')
export class OpdSubmissionController {
  constructor(@Inject(OpdSubmissionService) private readonly service: OpdSubmissionService) {}

  @Get()
  @Roles('OPD')
  async listMine(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.listMine(query, user));
  }

  @Get('summary')
  @Roles('OPD')
  async summaryMine(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getMySummary(query, user));
  }

  @Get(':id/timeline')
  @Roles('OPD')
  async timelineMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMyTimeline(id, user));
  }

  @Get(':id')
  @Roles('OPD')
  async getMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMine(id, user));
  }

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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...INTERNAL_ROLES)
@Controller('api/v1/internal/opd-submissions')
export class InternalOpdSubmissionController {
  constructor(@Inject(OpdSubmissionService) private readonly service: OpdSubmissionService) {}

  @Get()
  async listInternal(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.listInternal(query, user));
  }

  @Get('summary')
  async summaryInternal(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSummary(query, user));
  }

  @Get('sla/summary')
  async slaSummary(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSlaSummary(query, user));
  }

  @Get('sla/overdue')
  async slaOverdue(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSlaQueue(query, user, 'OVERDUE'));
  }

  @Get('sla/due-soon')
  async slaDueSoon(
    @Query() query: OpdSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalSlaQueue(query, user, 'DUE_SOON'));
  }

  @Get(':id/timeline')
  async timelineInternal(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getInternalTimeline(id, user));
  }

  @Get(':id')
  async getInternal(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getInternal(id, user));
  }

  @Post(':id/receive')
  async receive(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.receive(id, dto, user, getAuditContext(request)));
  }

  @Post(':id/start-verification')
  async startVerification(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.startVerification(id, dto, user, getAuditContext(request)));
  }

  @Post(':id/request-correction')
  async requestCorrection(
    @Param('id') id: string,
    @Body() dto: RequestCorrectionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.requestCorrection(id, dto, user, getAuditContext(request)));
  }

  @Post(':id/verify')
  async verify(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.verify(id, dto, user, getAuditContext(request)));
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: InternalActionNoteDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.reject(id, dto, user, getAuditContext(request)));
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteOpdSubmissionDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return ok(await this.service.complete(id, dto, user, getAuditContext(request)));
  }

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
