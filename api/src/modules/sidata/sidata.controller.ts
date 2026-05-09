import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SidataService } from './sidata.service';
import { SidataAsnQuery } from './sidata.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
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

  @Get('asn')
  async findAsn(@Query() query: SidataAsnQuery) {
    const result = await this.sidataService.findAsnList(query);
    return ok(result);
  }

  @Get('asn/:id')
  async findAsnById(@Param('id') id: string) {
    const asn = await this.sidataService.findAsnById(id);
    return ok(asn);
  }
}
