import { DmsDocumentRecord } from '../dms.repository';

export class DmsMapper {
  static toResponse(record: DmsDocumentRecord) {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      subCategory: record.subCategory,
      tags: record.tags,
      accessLevel: record.accessLevel,
      status: record.status,
      periodYear: record.periodYear,
      periodMonth: record.periodMonth,
      periodQuarter: record.periodQuarter,

      unitKerjaId: record.unitKerjaId,
      asnId: record.asnId,
      caseId: record.caseId,
      worklogId: record.worklogId,

      fileName: record.fileName,
      originalFileName: record.originalFileName,
      storagePath: record.storagePath,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      checksum: record.checksum,
      version: record.version,

      submittedAt: record.submittedAt,
      submittedById: record.submittedById,
      verifiedAt: record.verifiedAt,
      verifiedById: record.verifiedById,
      rejectedAt: record.rejectedAt,
      rejectionNote: record.rejectionNote,
      archivedAt: record.archivedAt,

      createdAt: record.createdAt,
      createdById: record.createdById,
      updatedAt: record.updatedAt,
      updatedById: record.updatedById,

      unitKerja: record.unitKerja,
      asn: record.asn,
      case: record.case,
      worklog: record.worklog,
      createdBy: record.createdBy,
      submittedBy: record.submittedBy,
      verifiedBy: record.verifiedBy,
    };
  }

  static toAuditData(record: DmsDocumentRecord) {
    return {
      id: record.id,
      title: record.title,
      category: record.category,
      subCategory: record.subCategory,
      tags: record.tags,
      accessLevel: record.accessLevel,
      status: record.status,
      periodYear: record.periodYear,
      periodMonth: record.periodMonth,
      periodQuarter: record.periodQuarter,
      unitKerjaId: record.unitKerjaId,
      asnId: record.asnId,
      caseId: record.caseId,
      worklogId: record.worklogId,
      fileName: record.fileName,
      originalFileName: record.originalFileName,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      createdById: record.createdById,
      submittedById: record.submittedById,
      verifiedById: record.verifiedById,
      submittedAt: record.submittedAt?.toISOString() ?? null,
      verifiedAt: record.verifiedAt?.toISOString() ?? null,
      rejectedAt: record.rejectedAt?.toISOString() ?? null,
      archivedAt: record.archivedAt?.toISOString() ?? null,
    };
  }
}
