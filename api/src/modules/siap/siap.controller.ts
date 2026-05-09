import { Controller, Get } from '@nestjs/common';
import { ok } from '../shared/respond';

@Controller('api/v1/siap')
export class SiapController {
  @Get('cases')
  findCases() {
    return ok([], 'SIAP case endpoint ready');
  }

  @Get('tasks')
  findTasks() {
    return ok([], 'SIAP task endpoint ready');
  }
}
