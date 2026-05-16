import {
  Controller,
  Body,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SidataService } from './sidata.service';
import {
  SIDATA_ASN_DOCUMENT_MAX_SIZE_BYTES,
  SidataAsnDocumentUploadDto,
  SidataAsnQueryDto,
  SidataUpdateAsnDto,
} from './sidata.types';

type SidataUploadedDocumentFile = {
  originalname: string;
  mimetype?: string;
  size?: number;
  buffer: Buffer;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'REVIEWER_MAPPING')
@Controller('api/v1/sidata')
export class SidataController {
  constructor(
    @Inject(SidataService)
    private readonly sidataService: SidataService,
  ) {}

  @Get('units')
  async findUnits() {
    const units = await this.sidataService.findUnits();
    return ok(units);
  }

  @Get('units/tree')
  async findUnitTree() {
    const tree = await this.sidataService.findUnitTree();
    return ok(tree);
  }

  @Get('dashboard/quality')
  async getAsnQualityDashboard(@CurrentUser() user: AuthUser) {
    const dashboard = await this.sidataService.getAsnQualityDashboard(user);
    return ok(dashboard);
  }

  @Get('asn')
  async findAsn(
    @Query() query: SidataAsnQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.sidataService.findAsnList(query, user);
    return ok(result);
  }

  @Get('asn/export')
  async exportAsn(
    @Query() query: SidataAsnQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.sidataService.exportAsnExcel(query, user);
    return new StreamableFile(result.stream, {
      type: result.mimeType,
      disposition: `attachment; filename="${result.fileName}"`,
    });
  }

  @Get('asn/:id/history')
  async findAsnHistory(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const history = await this.sidataService.findAsnHistory(id, user);
    return ok(history);
  }

  @Get('asn/:id/documents')
  async findAsnDocuments(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const documents = await this.sidataService.findAsnDocuments(id, user);
    return ok(documents);
  }

  @Post('asn/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: SIDATA_ASN_DOCUMENT_MAX_SIZE_BYTES,
      },
    }),
  )
  async uploadAsnDocument(
    @Param('id') id: string,
    @Body() body: SidataAsnDocumentUploadDto,
    @UploadedFile() file: SidataUploadedDocumentFile | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const document = await this.sidataService.uploadAsnDocument({
      asnId: id,
      dto: body,
      file,
      user,
    });
    return ok(document, 'Dokumen ASN berhasil diupload');
  }

  @Get('asn/:id/documents/:documentId/download')
  async downloadAsnDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.sidataService.downloadAsnDocument(id, documentId, user);
    return new StreamableFile(result.stream, {
      type: result.mimeType,
      disposition: `attachment; filename="${result.fileName}"`,
    });
  }

  @Delete('asn/:id/documents/:documentId')
  async deleteAsnDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const document = await this.sidataService.deleteAsnDocument(id, documentId, user);
    return ok(document, 'Dokumen ASN berhasil dinonaktifkan');
  }

  @Patch('asn/:id')
  async updateAsn(
    @Param('id') id: string,
    @Body() body: SidataUpdateAsnDto,
    @CurrentUser() user: AuthUser,
  ) {
    const asn = await this.sidataService.updateAsn(id, body, user);
    return ok(asn, 'Data ASN berhasil diperbarui');
  }

  @Get('asn/:id')
  async findAsnById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const asn = await this.sidataService.findAsnById(id, user);
    return ok(asn);
  }
}
