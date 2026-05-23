import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SidataReferenceService } from './sidata-reference.service';
import {
  SidataGenericReferenceQueryDto,
  SidataJabatanQueryDto,
  SidataManualGenericReferenceDto,
  SidataManualJabatanDto,
  SidataManualUnitDto,
} from './sidata-reference.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'REVIEWER_MAPPING')
@Controller('api/v1/sidata/references')
export class SidataReferenceController {
  constructor(
    @Inject(SidataReferenceService)
    private readonly referenceService: SidataReferenceService,
  ) {}

  @Get('generic')
  async findGenericReferences(@Query() query: SidataGenericReferenceQueryDto) {
    const items = await this.referenceService.listGenericReferences(query);
    return ok(items);
  }

  @Post('generic')
  async createGenericReference(
    @Body() body: SidataManualGenericReferenceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.referenceService.createGenericReference(body, user), 'Referensi berhasil dibuat');
  }

  @Patch('generic/:type/:id')
  async updateGenericReference(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: SidataManualGenericReferenceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.referenceService.updateGenericReference(type, id, body, user), 'Referensi berhasil diperbarui');
  }

  @Delete('generic/:type/:id')
  async deactivateGenericReference(
    @Param('type') type: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.referenceService.deactivateGenericReference(type, id, user), 'Referensi berhasil dinonaktifkan');
  }

  @Post('units')
  async createUnit(@Body() body: SidataManualUnitDto, @CurrentUser() user: AuthUser) {
    return ok(await this.referenceService.createUnit(body, user), 'Unit kerja berhasil dibuat');
  }

  @Patch('units/:id')
  async updateUnit(
    @Param('id') id: string,
    @Body() body: SidataManualUnitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.referenceService.updateUnit(id, body, user), 'Unit kerja berhasil diperbarui');
  }

  @Delete('units/:id')
  async deactivateUnit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.referenceService.deactivateUnit(id, user), 'Unit kerja berhasil dinonaktifkan');
  }

  @Get('jenis-jabatan')
  async findJenisJabatan() {
    const items = await this.referenceService.findJenisJabatan();
    return ok(items);
  }

  @Post('jenis-jabatan/ensure')
  async ensureJenisJabatan(@CurrentUser() user: AuthUser) {
    const items = await this.referenceService.ensureDefaultJenisJabatan(user);
    return ok(items, 'Jenis jabatan dasar berhasil disiapkan');
  }

  @Get('jabatan')
  async findJabatan(@Query() query: SidataJabatanQueryDto) {
    const result = await this.referenceService.findJabatanList(query);
    return ok(result);
  }

  @Get('jabatan/:id')
  async findJabatanById(@Param('id') id: string) {
    const jabatan = await this.referenceService.findJabatanById(id);
    return ok(jabatan);
  }

  @Post('jabatan')
  async createJabatan(
    @Body() body: SidataManualJabatanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.referenceService.createJabatan(body, user), 'Jabatan berhasil dibuat');
  }

  @Patch('jabatan/:id')
  async updateJabatan(
    @Param('id') id: string,
    @Body() body: SidataManualJabatanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.referenceService.updateJabatan(id, body, user), 'Jabatan berhasil diperbarui');
  }

  @Delete('jabatan/:id')
  async deactivateJabatan(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.referenceService.deactivateJabatan(id, user), 'Jabatan berhasil dinonaktifkan');
  }
}
