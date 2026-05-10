import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { SiarsipService } from './siarsip.service';

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

  @Get('cases/:caseId/checklist')
  async getChecklist(@Param('caseId') caseId: string) {
    const result = await this.siarsipService.getChecklist(caseId);
    return ok(result);
  }
}
