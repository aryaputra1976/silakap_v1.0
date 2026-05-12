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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { getAuditContext } from '../shared/request-context';
import { ok } from '../shared/respond';
import {
  DMS_ACCESS_ROLES,
  DMS_VERIFY_ROLES,
} from './constants/dms-permission.constant';
import { CreateDmsDocumentDto } from './dto/create-dms-document.dto';
import { DmsDocumentListQueryDto } from './dto/dms-document-list-query.dto';
import { DmsRejectDto } from './dto/dms-reject.dto';
import { DmsUploadDto } from './dto/dms-upload.dto';
import { DmsVerifyDto } from './dto/dms-verify.dto';
import { UpdateDmsDocumentDto } from './dto/update-dms-document.dto';
import { DmsService } from './dms.service';

type UploadedDmsControllerFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...DMS_ACCESS_ROLES)
@Controller('api/v1/dms/documents')
export class DmsController {
  constructor(
    @Inject(DmsService)
    private readonly dmsService: DmsService,
  ) {}

  @Get()
  async findMany(
    @Query() query: DmsDocumentListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.dmsService.findMany(query, user);
    return ok(result);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.dmsService.findById(id, user);
    return ok(result);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const result = await this.dmsService.download(
      id,
      user,
      getAuditContext(request),
    );

    response.setHeader('Content-Type', result.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.fileName)}"`,
    );

    response.send(result.buffer);
  }

  @Post()
  async create(
    @Body() dto: CreateDmsDocumentDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.create(
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Dokumen DMS berhasil dibuat');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDmsDocumentDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.update(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Dokumen DMS berhasil diperbarui');
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('id') id: string,
    @Body() dto: DmsUploadDto,
    @UploadedFile() file: UploadedDmsControllerFile | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.upload(
      id,
      dto,
      file,
      user,
      getAuditContext(request),
    );

    return ok(result, 'File dokumen DMS berhasil diunggah');
  }

  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.submit(
      id,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Dokumen DMS berhasil disubmit');
  }

  @Post(':id/verify')
  @Roles(...DMS_VERIFY_ROLES)
  async verify(
    @Param('id') id: string,
    @Body() dto: DmsVerifyDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.verify(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Dokumen DMS berhasil diverifikasi');
  }

  @Post(':id/reject')
  @Roles(...DMS_VERIFY_ROLES)
  async reject(
    @Param('id') id: string,
    @Body() dto: DmsRejectDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.reject(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Dokumen DMS ditolak');
  }

  @Post(':id/archive')
  @Roles(...DMS_VERIFY_ROLES)
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.archive(
      id,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Dokumen DMS berhasil diarsipkan');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.dmsService.remove(
      id,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Dokumen DMS berhasil dihapus');
  }
}