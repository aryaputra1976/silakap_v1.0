export type NormalizedDocumentFilters = {
  caseId?: string;
  documentType?: string;
  q?: string;
  page: number;
  limit: number;
};

export type UploadedDocumentFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export type DownloadDocumentPayload = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};
