export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  roles: string[];
  unitKerjaId: string | null;
  unitKerja: UnitKerjaSummary | null;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
};

export type UnitKerjaSummary = {
  id: string;
  kode: string;
  nama: string;
};

export type AsnRecord = {
  id: string;
  nip: string;
  nik: string | null;
  nama: string;
  email: string | null;
  phone: string | null;
  unitKerjaId: string | null;
  unitKerja: UnitKerjaSummary | null;
  jabatanNama: string | null;
  golonganNama: string | null;
  jenisAsn: string | null;
  statusAsn: string | null;
  tanggalLahir: string | null;
  tmtPensiun: string | null;
};

export type SiapCaseSummary = {
  id: string;
  caseNumber: string;
  serviceType: string;
  title: string;
  description: string | null;
  asnId: string | null;
  currentState: string;
  status: string;
  priority: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiapTask = {
  id: string;
  caseId: string;
  taskType: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  assignedBy: string | null;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  case?: SiapCaseSummary & { asn?: Pick<AsnRecord, 'id' | 'nip' | 'nama'> | null };
};

export type WorkflowLog = {
  id: string;
  caseId: string;
  fromState: string | null;
  toState: string;
  action: string;
  note: string | null;
  performedBy: string | null;
  performedAt: string;
};

export type TimelineEntry = {
  id: string;
  caseId: string;
  taskId: string | null;
  eventType: string;
  title: string;
  description: string | null;
  performedBy: string | null;
  createdAt: string;
};

export type RequirementItem = {
  documentType: string;
  label: string;
  category: string;
  required: boolean;
  digital: boolean;
  notes?: string | null;
};

export type SipensiunRecipient = {
  category: string;
  recipientName: string;
  recipientCity: string;
  needsReview?: boolean;
};

export type SipensiunCaseListItem = {
  id: string;
  siapCaseId: string;
  asnId: string;
  jenisPensiun: string;
  tmtPensiun: string | null;
  catatan: string | null;
  siapCase: SiapCaseSummary;
  asn: Pick<AsnRecord, 'id' | 'nip' | 'nama' | 'unitKerja' | 'golonganNama'>;
  requirements: RequirementItem[];
  recipient?: SipensiunRecipient;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRecord = {
  id: string;
  caseId: string | null;
  documentType: string;
  fileName: string;
  originalFileName: string | null;
  storagePath: string;
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  version: number;
  uploadedBy: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  case?: SiapCaseSummary | null;
};

export type ChecklistItem = RequirementItem & {
  uploaded: boolean;
};

export type DocumentChecklist = {
  caseId: string;
  serviceType: string;
  isComplete: boolean;
  required: ChecklistItem[];
  missing: RequirementItem[];
  uploadedDocuments: DocumentRecord[];
};

export type SipensiunCaseDetail = {
  siapCase: SiapCaseSummary;
  sipensiunDetail: {
    id: string;
    siapCaseId: string;
    asnId: string;
    jenisPensiun: string;
    tmtPensiun: string | null;
    catatan: string | null;
    createdAt: string;
    updatedAt: string;
  };
  asn: AsnRecord;
  requirements: RequirementItem[];
  recipient?: SipensiunRecipient;
  checklist?: DocumentChecklist;
  tasks: SiapTask[];
  workflowLogs: WorkflowLog[];
  timelines: TimelineEntry[];
};

export type AnalyticsGroup = {
  key: string;
  label: string;
  total: number;
};

export type AnalyticsDashboard = {
  summary: {
    totalAsn: number;
    totalSipensiun: number;
    totalSiapCases: number;
    pendingTasks: number;
    completedTasks: number;
    uploadedDocuments: number;
  };
  casesByState: AnalyticsGroup[];
  casesByServiceType: AnalyticsGroup[];
  tasksByStatus: AnalyticsGroup[];
  documentsByType: AnalyticsGroup[];
};
