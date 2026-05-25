import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthUser } from '../../auth/auth.types';
import { DMS_VIEW_ROLES } from '../constants/dms-permission.constant';
import { DmsFolderService } from './dms-folder.service';

@Controller('dms/folders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DmsFolderController {
  constructor(
    @Inject(DmsFolderService)
    private readonly dmsFolderService: DmsFolderService,
  ) {}

  @Get()
  @Roles(...DMS_VIEW_ROLES)
  async getFolderTree(@CurrentUser() user: AuthUser) {
    return this.dmsFolderService.getFolderTree(user);
  }
}
