import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SidataImportService } from './sidata-import.service';
import {
  SidataAsnUploadDto,
  SidataAsnReconciliationQueryDto,
  SidataAuditLogQueryDto,
  SidataBufferedFile,
  SidataGenericReferenceUploadDto,
  SidataImportIssueQueryDto,
  ResolveAsnUnitKerjaMappingDto,
  SidataStagingQueryDto,
  SidataUploadReferenceJabatanDto,
} from './sidata-import.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT', 'REVIEWER_MAPPING')
@Controller('api/v1/sidata/import')
export class SidataImportController {
  constructor(
    @Inject(SidataImportService)
    private readonly sidataImportService: SidataImportService,
  ) {}

  @Get('reference-batches')
  async findBatches() {
    const result = await this.sidataImportService.findBatches();
    return ok(result);
  }

  @Get('reference-batches/:id')
  async findBatchById(@Param('id') id: string) {
    const result = await this.sidataImportService.findBatchById(id);
    return ok(result);
  }

  @Get('reference-batches/:id/staging')
  async findStagingByBatchId(
    @Param('id') id: string,
    @Query() query: SidataStagingQueryDto,
  ) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit ?? '50', 10) || 50));
    const result = await this.sidataImportService.findStagingByBatchId(id, { page, limit });
    return ok(result);
  }

  @Post('reference-jabatan/upload')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT')
  @Throttle({ upload: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadReferenceJabatan(
    @UploadedFile() file: SidataBufferedFile | undefined,
    @Body() body: SidataUploadReferenceJabatanDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const result = await this.sidataImportService.uploadReferenceJabatan({
      file,
      jenisJabatan: body.jenisJabatan,
      importedById: user?.id ?? null,
    });

    return ok(result);
  }

  @Post('reference-batches/:id/commit')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
  async commitReferenceJabatanBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.commitReferenceJabatanBatch(id);
    return ok(result);
  }

  @Post('reference/upload')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT')
  @Throttle({ upload: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadGenericReference(
    @UploadedFile() file: SidataBufferedFile | undefined,
    @Body() body: SidataGenericReferenceUploadDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const result = await this.sidataImportService.uploadGenericReference({
      file,
      referenceType: body.referenceType,
      importedById: user?.id ?? null,
    });

    return ok(result);
  }

  @Post('reference-batches/:id/commit-generic')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
  async commitGenericReferenceBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.commitGenericReferenceBatch(id);
    return ok(result);
  }

  @Post('reference-batches/:id/cancel')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT')
  async cancelReferenceBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.cancelReferenceBatch(id);
    return ok(result);
  }

  // ─── Phase 3B: JF Profile Import Endpoints ───────────────────────────────────

  @Post('reference-jf-profile/upload')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT')
  @Throttle({ upload: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadJfProfile(
    @UploadedFile() file: SidataBufferedFile | undefined,
    @CurrentUser() user?: AuthUser,
  ) {
    const result = await this.sidataImportService.uploadJfProfile({ file, importedById: user?.id ?? null });
    return ok(result);
  }

  @Post('reference-batches/:id/commit-jf-profile')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
  async commitJfProfileBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.commitJfProfileBatch(id);
    return ok(result);
  }

  // ─── Phase 5: ASN Import Endpoints ───────────────────────────────────────────

  @Post('asn/upload')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT')
  @Throttle({ upload: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadSiasnAsn(
    @UploadedFile() file: SidataBufferedFile | undefined,
    @Body() body: SidataAsnUploadDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const result = await this.sidataImportService.uploadSiasnAsn({
      file,
      tipePegawai: body.tipePegawai,
      importedById: user?.id ?? null,
    });
    return ok(result);
  }

  @Get('asn-batches')
  async findAsnImportBatches() {
    const result = await this.sidataImportService.findAsnImportBatches();
    return ok(result);
  }

  @Get('asn-batches/:id')
  async findAsnImportBatchById(@Param('id') id: string) {
    const result = await this.sidataImportService.findAsnImportBatchById(id);
    return ok(result);
  }

  @Get('asn-batches/:id/staging')
  async findAsnStagingByBatchId(
    @Param('id') id: string,
    @Query() query: SidataStagingQueryDto,
  ) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit ?? '50', 10) || 50));
    const result = await this.sidataImportService.findAsnStagingByBatchId(id, { page, limit });
    return ok(result);
  }

  @Post('asn-batches/:id/map')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'REVIEWER_MAPPING')
  async mapSiasnAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.enqueueMapSiasnAsnBatch(id);
    return ok(result);
  }

  @Post('asn-batches/:id/commit')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
  async commitSiasnAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.enqueueCommitSiasnAsnBatch(id);
    return ok(result);
  }

  @Post('asn-batches/:id/cancel')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT')
  async cancelAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.cancelAsnBatch(id);
    return ok(result);
  }

  // ─── Phase 8: Summary, Issues, Remap ─────────────────────────────────────────

  @Get('asn-batches/:id/summary')
  async getAsnImportBatchSummary(@Param('id') id: string) {
    const result = await this.sidataImportService.getAsnImportBatchSummary(id);
    return ok(result);
  }

  @Get('reference-batches/:id/summary')
  async getReferenceImportBatchSummary(@Param('id') id: string) {
    const result = await this.sidataImportService.getReferenceImportBatchSummary(id);
    return ok(result);
  }

  @Get('asn-batches/:id/reconciliation')
  async reconcileAsnBatch(
    @Param('id') id: string,
    @Query() query: SidataAsnReconciliationQueryDto,
  ) {
    const result = await this.sidataImportService.reconcileAsnBatch({
      batchId: id,
      query,
    });
    return ok(result);
  }

  @Get('asn-batches/:id/issues')
  async findAsnImportIssues(
    @Param('id') id: string,
    @Query() query: SidataImportIssueQueryDto,
  ) {
    const result = await this.sidataImportService.findAsnImportIssues({
      batchId: id,
      query,
    });
    return ok(result);
  }

  @Get('asn-batches/:id/export-issues')
  async exportAsnImportIssues(
    @Param('id') id: string,
    @Query() query: SidataImportIssueQueryDto,
  ) {
    const result = await this.sidataImportService.exportAsnImportIssuesCsv({
      batchId: id,
      query,
    });

    return new StreamableFile(result.stream, {
      type: result.mimeType,
      disposition: `attachment; filename="${result.fileName}"`,
    });
  }

  @Get('asn-batches/:id/needs-review')
  async findAsnImportNeedsReview(
    @Param('id') id: string,
    @Query() query: SidataImportIssueQueryDto,
  ) {
    const result = await this.sidataImportService.findAsnImportNeedsReview({
      batchId: id,
      query,
    });
    return ok(result);
  }

  @Get('asn-batches/:id/invalid')
  async findAsnImportInvalid(
    @Param('id') id: string,
    @Query() query: SidataImportIssueQueryDto,
  ) {
    const result = await this.sidataImportService.findAsnImportInvalid({
      batchId: id,
      query,
    });
    return ok(result);
  }

  @Post('asn-batches/:id/remap')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'REVIEWER_MAPPING')
  async remapSiasnAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.enqueueRemapSiasnAsnBatch(id);
    return ok(result);
  }

  @Post('asn-batches/:id/extract-references')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'REVIEWER_MAPPING')
  async extractReferencesFromAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.extractReferencesFromAsnBatch(id);
    return ok(result);
  }

  // ─── Phase 11A: Import Audit Log ─────────────────────────────────────────────

  @Post('asn-batches/:id/issues/:rowId/resolve-unit-kerja')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'REVIEWER_MAPPING')
  async resolveAsnUnitKerjaMapping(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() body: ResolveAsnUnitKerjaMappingDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const result = await this.sidataImportService.resolveAsnUnitKerjaMapping({
      batchId: id,
      rowId,
      unitKerjaId: body.unitKerjaId,
      note: body.note,
      actorId: user?.id,
    });
    return ok(result);
  }

  @Get('audit-logs')
  async listAuditLogs(@Query() query: SidataAuditLogQueryDto) {
    const result = await this.sidataImportService.listAuditLogs(query);
    return ok(result);
  }
}
