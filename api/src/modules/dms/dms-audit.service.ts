import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { canAccessDmsDocument } from './constants/dms-permission.constant';
import { DmsAuditLogRecord, DmsAuditRepository } from './dms-audit.repository';
import { DmsRepository } from './dms.repository';

export interface DmsAuditTimelineItem {
  id: string;
  action: string;
  title: string;
  description: string | null;
  actor: {
    id: string;
    username: string;
    name: string;
  } | null;
  performedBy: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: Date;
}

@Injectable()
export class DmsAuditService {
  constructor(
    @Inject(DmsAuditRepository)
    private readonly dmsAuditRepository: DmsAuditRepository,
    @Inject(DmsRepository)
    private readonly dmsRepository: DmsRepository,
  ) {}

  async getDocumentTimeline(
    documentId: string,
    user: AuthUser,
  ): Promise<DmsAuditTimelineItem[]> {
    const document = await this.dmsRepository.findById(documentId.trim());

    if (!document) {
      throw new NotFoundException('Dokumen DMS tidak ditemukan');
    }

    if (!canAccessDmsDocument(document, user)) {
      throw new ForbiddenException(
        'Anda tidak berwenang mengakses audit dokumen DMS ini',
      );
    }

    const logs = await this.dmsAuditRepository.findDocumentAuditLogs(document.id);

    return logs.map((log) => this.toTimelineItem(log));
  }

  private toTimelineItem(log: DmsAuditLogRecord): DmsAuditTimelineItem {
    return {
      id: log.id,
      action: log.action,
      title: this.toActionTitle(log.action),
      description: this.toActionDescription(log),
      actor: log.user,
      performedBy: log.performedBy,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      beforeData: log.beforeData,
      afterData: log.afterData,
      createdAt: log.createdAt,
    };
  }

  private toActionTitle(action: string) {
    const labels: Record<string, string> = {
      DMS_DOCUMENT_CREATED: 'Dokumen dibuat',
      DMS_DOCUMENT_UPDATED: 'Metadata dokumen diperbarui',
      DMS_DOCUMENT_UPLOADED: 'File dokumen diunggah',
      DMS_DOCUMENT_SUBMITTED: 'Dokumen disubmit',
      DMS_DOCUMENT_VERIFIED: 'Dokumen diverifikasi',
      DMS_DOCUMENT_REJECTED: 'Dokumen ditolak',
      DMS_DOCUMENT_ARCHIVED: 'Dokumen diarsipkan',
      DMS_DOCUMENT_DELETED: 'Dokumen dihapus',
      DMS_DOCUMENT_DOWNLOADED: 'File dokumen diunduh',
    };

    return labels[action] ?? action.replaceAll('_', ' ');
  }

  private toActionDescription(log: DmsAuditLogRecord) {
    if (log.action === 'DMS_DOCUMENT_CREATED') {
      return 'Metadata dokumen DMS dibuat.';
    }

    if (log.action === 'DMS_DOCUMENT_UPDATED') {
      return 'Metadata dokumen DMS diperbarui.';
    }

    if (log.action === 'DMS_DOCUMENT_UPLOADED') {
      return 'File dokumen DMS berhasil diunggah atau diganti.';
    }

    if (log.action === 'DMS_DOCUMENT_SUBMITTED') {
      return 'Dokumen diajukan untuk proses verifikasi.';
    }

    if (log.action === 'DMS_DOCUMENT_VERIFIED') {
      return 'Dokumen disahkan sebagai bukti dukung.';
    }

    if (log.action === 'DMS_DOCUMENT_REJECTED') {
      return this.getRejectionNote(log.afterData) ?? 'Dokumen ditolak.';
    }

    if (log.action === 'DMS_DOCUMENT_ARCHIVED') {
      return 'Dokumen masuk arsip final.';
    }

    if (log.action === 'DMS_DOCUMENT_DELETED') {
      return 'Dokumen dihapus dari daftar aktif DMS.';
    }

    if (log.action === 'DMS_DOCUMENT_DOWNLOADED') {
      return 'File dokumen DMS diunduh oleh pengguna.';
    }

    return null;
  }

  private getRejectionNote(value: unknown) {
    if (!this.isRecord(value)) {
      return null;
    }

    const note = value.rejectionNote;

    return typeof note === 'string' && note.trim() ? note : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
