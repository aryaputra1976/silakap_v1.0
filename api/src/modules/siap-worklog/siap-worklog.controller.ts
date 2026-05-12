import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { getAuditContext } from '../shared/request-context';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { ReviewWorklogDto } from './dto/review-worklog.dto';
import { UploadWorklogAttachmentDto } from './dto/upload-worklog-attachment.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { WorklogListQueryDto } from './dto/worklog-list-query.dto';
import { UploadedWorklogAttachmentFile } from './siap-worklog-attachment.types';
import { SiapWorklogService } from './siap-worklog.service';

const SIAP_WORKLOG_VIEW_ROLES = [
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

const SIAP_WORKLOG_REVIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SIAP_WORKLOG_VIEW_ROLES)
@Controller('api/v1/siap/worklogs')
export class SiapWorklogController {
  constructor(
    @Inject(SiapWorklogService)
    private readonly worklogService: SiapWorklogService,
  ) {}

  @Get('my')
  async findMy(
    @Query() query: WorklogListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.worklogService.findMy(query, user);
    return ok(result);
  }

  @Get('team')
  @Roles(...SIAP_WORKLOG_REVIEW_ROLES)
  async findTeam(
    @Query() query: WorklogListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.worklogService.findTeam(query, user);
    return ok(result);
  }

  @Get(':id/attachments')
  async findAttachments(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.worklogService.findAttachments(id, user);
    return ok(result);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @Body() dto: UploadWorklogAttachmentDto,
    @UploadedFile() file: UploadedWorklogAttachmentFile | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.uploadAttachment(
      id,
      dto,
      file,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Bukti dukung berhasil diunggah');
  }

  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.deleteAttachment(
      id,
      attachmentId,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Bukti dukung berhasil dihapus');
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.worklogService.findById(id, user);
    return ok(result);
  }

  @Post()
  async create(
    @Body() dto: CreateWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.create(
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja berhasil dibuat');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.update(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja berhasil diperbarui');
  }

  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.submit(
      id,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja berhasil disubmit');
  }

  @Post(':id/approve')
  @Roles(...SIAP_WORKLOG_REVIEW_ROLES)
  async approve(
    @Param('id') id: string,
    @Body() dto: ReviewWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.approve(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja disetujui');
  }

  @Post(':id/revision')
  @Roles(...SIAP_WORKLOG_REVIEW_ROLES)
  async revision(
    @Param('id') id: string,
    @Body() dto: ReviewWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.revision(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja dikembalikan untuk revisi');
  }
}
