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
import { CreateSipensiunCaseDto } from './dto/create-sipensiun-case.dto';
import { SipensiunCaseListQueryDto } from './dto/sipensiun-case-list-query.dto';
import { SipensiunService } from './sipensiun.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/sipensiun')
export class SipensiunController {
  constructor(
    @Inject(SipensiunService)
    private readonly sipensiunService: SipensiunService,
  ) {}

  @Get('cases')
  async findCases(@Query() query: SipensiunCaseListQueryDto) {
    const result = await this.sipensiunService.findCases(query);
    return ok(result);
  }

  @Get('cases/:id')
  async findCaseById(@Param('id') id: string) {
    const result = await this.sipensiunService.findCaseById(id);
    return ok(result);
  }

  @Post('cases')
  async createCase(
    @Body() dto: CreateSipensiunCaseDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.sipensiunService.createCase(dto, user);
    return ok(result, 'Usulan pensiun berhasil dibuat');
  }

  @Post('cases/:id/submit')
  async submitCase(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.sipensiunService.submitCase(id, user);
    return ok(result, 'Usulan pensiun berhasil disubmit');
  }
}
