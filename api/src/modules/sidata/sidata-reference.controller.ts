import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SidataReferenceService } from './sidata-reference.service';
import { SidataJabatanQueryDto } from './sidata-reference.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/sidata/references')
export class SidataReferenceController {
  constructor(
    @Inject(SidataReferenceService)
    private readonly referenceService: SidataReferenceService,
  ) {}

  @Get('jenis-jabatan')
  async findJenisJabatan() {
    const items = await this.referenceService.findJenisJabatan();
    return ok(items);
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
}
