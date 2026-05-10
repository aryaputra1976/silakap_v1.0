import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SlaEscalationService } from './sla-escalation.service';

const DEFAULT_INTERVAL_MS = 60_000;

@Injectable()
export class SlaWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlaWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(SlaEscalationService)
    private readonly slaEscalationService: SlaEscalationService,
  ) {}

  onModuleInit() {
    if (process.env.SLA_WORKER_ENABLED === 'false') {
      this.logger.warn('SLA worker disabled by SLA_WORKER_ENABLED=false');
      return;
    }

    const intervalMs = this.getIntervalMs();

    this.timer = setInterval(() => {
      void this.process();
    }, intervalMs);

    void this.process();

    this.logger.log(`SLA worker started. interval=${intervalMs}ms`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async process() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const result = await this.slaEscalationService.processOverdue();

      if (result.escalated > 0 || result.failed > 0) {
        this.logger.log(
          `SLA escalation result: total=${result.total}, escalated=${result.escalated}, failed=${result.failed}`,
        );
      }
    } finally {
      this.running = false;
    }
  }

  private getIntervalMs() {
    const value = Number(process.env.SLA_WORKER_INTERVAL_MS);

    if (!Number.isFinite(value)) {
      return DEFAULT_INTERVAL_MS;
    }

    return Math.min(Math.max(Math.trunc(value), 10_000), 600_000);
  }
}
