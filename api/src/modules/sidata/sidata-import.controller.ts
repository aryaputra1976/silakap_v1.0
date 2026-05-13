import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SidataImportService } from './sidata-import.service';
import {
  SidataAsnUploadDto,
  SidataBufferedFile,
  SidataGenericReferenceUploadDto,
  SidataImportIssueQueryDto,
  SidataUploadReferenceJabatanDto,
} from './sidata-import.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
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
  async findStagingByBatchId(@Param('id') id: string) {
    const result = await this.sidataImportService.findStagingByBatchId(id);
    return ok(result);
  }

  @Post('reference-jabatan/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadReferenceJabatan(
    @UploadedFile() file: SidataBufferedFile | undefined,
    @Body() body: SidataUploadReferenceJabatanDto,
  ) {
    const result = await this.sidataImportService.uploadReferenceJabatan({
      file,
      jenisJabatan: body.jenisJabatan,
    });

    return ok(result);
  }

  @Post('reference-batches/:id/commit')
  async commitReferenceJabatanBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.commitReferenceJabatanBatch(id);
    return ok(result);
  }

  @Post('reference/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadGenericReference(
    @UploadedFile() file: SidataBufferedFile | undefined,
    @Body() body: SidataGenericReferenceUploadDto,
  ) {
    const result = await this.sidataImportService.uploadGenericReference({
      file,
      referenceType: body.referenceType,
    });

    return ok(result);
  }

  @Post('reference-batches/:id/commit-generic')
  async commitGenericReferenceBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.commitGenericReferenceBatch(id);
    return ok(result);
  }

  // ─── Phase 5: ASN Import Endpoints ───────────────────────────────────────────

  @Post('asn/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadSiasnAsn(
    @UploadedFile() file: SidataBufferedFile | undefined,
    @Body() _body: SidataAsnUploadDto,
  ) {
    const result = await this.sidataImportService.uploadSiasnAsn({ file });
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
  async findAsnStagingByBatchId(@Param('id') id: string) {
    const result = await this.sidataImportService.findAsnStagingByBatchId(id);
    return ok(result);
  }

  @Post('asn-batches/:id/map')
  async mapSiasnAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.mapSiasnAsnBatch(id);
    return ok(result);
  }

  @Post('asn-batches/:id/commit')
  async commitSiasnAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.commitSiasnAsnBatch(id);
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
  async remapSiasnAsnBatch(@Param('id') id: string) {
    const result = await this.sidataImportService.remapSiasnAsnBatch(id);
    return ok(result);
  }
}
