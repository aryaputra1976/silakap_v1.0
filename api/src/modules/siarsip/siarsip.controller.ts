import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
  UseInterceptors,
  UploadedFile,
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
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { SiarsipService } from './siarsip.service';
import { UploadedDocumentFile } from './siarsip.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/siarsip')
export class SiarsipController {
  constructor(
    @Inject(SiarsipService)
    private readonly siarsipService: SiarsipService,
  ) {}

  @Get('documents')
  async findDocuments(@Query() query: DocumentListQueryDto) {
    const result = await this.siarsipService.findDocuments(query);
    return ok(result);
  }

  @Get('documents/:id')
  async findDocumentById(@Param('id') id: string) {
    const result = await this.siarsipService.findDocumentById(id);
    return ok(result);
  }

  @Get('documents/:id/download')
  async downloadDocument(@Param('id') id: string) {
    const result = await this.siarsipService.downloadDocument(id);

    return new StreamableFile(result.buffer, {
      type: result.mimeType,
      disposition: this.toContentDisposition(result.fileName),
    });
  }

  @Get('cases/:caseId/documents')
  async findDocumentsByCaseId(@Param('caseId') caseId: string) {
    const result = await this.siarsipService.findDocumentsByCaseId(caseId);
    return ok(result);
  }

  @Post('cases/:caseId/documents')
  async createDocument(
    @Param('caseId') caseId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siarsipService.createDocument(caseId, dto, user);
    return ok(result, 'Metadata dokumen berhasil disimpan');
  }

  @Post('cases/:caseId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  async uploadDocument(
    @Param('caseId') caseId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: UploadedDocumentFile | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.siarsipService.uploadDocument(
      caseId,
      dto,
      file,
      user,
      getAuditContext(request),
    );
    return ok(result, 'Dokumen berhasil diunggah');
  }

  @Get('cases/:caseId/checklist')
  async getChecklist(@Param('caseId') caseId: string) {
    const result = await this.siarsipService.getChecklist(caseId);
    return ok(result);
  }

  private toContentDisposition(fileName: string) {
    const safeFileName = fileName.replace(/["\r\n]/g, '_');
    return `attachment; filename="${safeFileName}"`;
  }
}
