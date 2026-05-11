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

export type UnitKerjaSummary = {
  id: string;
  kode: string;
  nama: string;
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
  case?: SiapCaseSummary & {
    asn?: Pick<AsnRecord, 'id' | 'nip' | 'nama'> | null;
  };
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

export type ChecklistItem = RequirementItem & {
  uploaded: boolean;
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
  asn: Pick<
    AsnRecord,
    'id' | 'nip' | 'nama' | 'golonganNama' | 'unitKerja'
  >;
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
    nomorKarpeg: string | null;
    alamatSekarang: string | null;
    alamatSesudahPensiun: string | null;
    noHp: string | null;
    namaPemohon: string | null;
    nikPemohon: string | null;
    hubunganPemohon: string | null;
    alamatPemohon: string | null;
    noHpPemohon: string | null;
    namaPenerimaManfaat: string | null;
    tanggalMeninggal: string | null;
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

export type SipensiunLetterPreview = {
  caseId: string;
  caseNumber: string;
  jenisPensiun: string;
  recipient: SipensiunRecipient;
  subject: string;
  metadata?: {
    governmentName?: string;
    agencyName?: string;
    addressLine?: string;
    cityLine?: string;
    letterNumber?: string;
    attachmentText?: string;
    subject?: string;
    letterDate?: string;
    signerTitle?: string;
    signerName?: string;
    signerNip?: string;
    referenceTitle?: string;
    referenceNumber?: string;
    referenceDate?: string;
    note?: string;
  };
  fields: {
    nama: string;
    nip: string;
    nomorSeriKarpeg: string;
    jabatanNama: string | null;
    golonganNama: string | null;
    unitKerjaNama: string | null;
    alamatSekarang: string;
    alamatSesudahPensiun: string;
    noHp: string;
    statusAsn: string | null;
    tmtPensiun: string | null;
    namaPemohon: string | null;
    nikPemohon: string | null;
    hubunganPemohon: string | null;
    alamatPemohon: string | null;
    noHpPemohon: string | null;
    namaPenerimaManfaat: string | null;
    tanggalMeninggal: string | null;
  };
  body: string;
  requirements: ChecklistItem[];
  missingDocuments: ChecklistItem[];
};

export type UpdateSipensiunLetterData = {
  nomorKarpeg?: string;
  alamatSekarang?: string;
  alamatSesudahPensiun?: string;
  noHp?: string;
  namaPemohon?: string;
  nikPemohon?: string;
  hubunganPemohon?: string;
  alamatPemohon?: string;
  noHpPemohon?: string;
  namaPenerimaManfaat?: string;
  tanggalMeninggal?: string;
};

export type SipensiunGeneratedLetter = {
  preview: SipensiunLetterPreview;
  document: DocumentRecord;
};

export type AnalyticsGroup = {
  key: string;
  label: string;
  total: number;
};

export type AnalyticsRecentTimeline = {
  id: string;
  caseId: string;
  caseNumber: string;
  serviceType: string;
  currentState: string;
  status: string;
  eventType: string;
  title: string;
  description: string | null;
  actorName: string | null;
  createdAt: string;
};

export type AnalyticsDashboard = {
  summary: {
    totalAsn: number;
    totalSipensiun: number;
    totalSiapCases: number;
    pendingTasks: number;
    completedTasks: number;
    uploadedDocuments: number;
    slaOverdue?: number;
  };
  activeCases?: {
    totalActive: number;
    draft: number;
    submitted: number;
  };
  documentCompleteness?: {
    totalDocuments: number;
    casesWithDocuments: number;
    casesWithoutDocuments: number;
  };
  casesByState: AnalyticsGroup[];
  casesByServiceType: AnalyticsGroup[];
  tasksByStatus: AnalyticsGroup[];
  documentsByType: AnalyticsGroup[];
  slaSummary?: AnalyticsGroup[];
  sipensiunByJenis?: AnalyticsGroup[];
  recentTimeline?: AnalyticsRecentTimeline[];
};

export type NotificationCaseSummary = {
  id: string;
  caseNumber: string;
  serviceType: string;
  title: string;
  currentState: string;
  status: string;
};

export type NotificationUserSummary = {
  id: string;
  username: string;
  name: string;
};

export type NotificationRecord = {
  id: string;
  userId: string | null;
  caseId: string | null;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  createdBy: string | null;
  case: NotificationCaseSummary | null;
  user: NotificationUserSummary | null;
};

export type NotificationUnreadCount = {
  unread: number;
};

export type NotificationMarkAllResult = {
  updated: number;
};

export type SlaProcessOverdueResult = {
  total: number;
  escalated: number;
  failed: number;
};

export type SiapWorklogStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVISION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export type SiapWorklogUserSummary = {
  id: string;
  username: string;
  name: string;
  unitKerjaId: string | null;
  unitKerja: UnitKerjaSummary | null;
};

export type SiapWorklogCaseSummary = {
  id: string;
  caseNumber: string;
  serviceType: string;
  title: string;
  currentState: string;
  status: string;
};

export type SiapWorklogTaskSummary = {
  id: string;
  taskType: string;
  title: string;
  status: string;
  dueDate: string | null;
};

export type SiapWorklog = {
  id: string;
  userId: string;
  unitKerjaId: string | null;
  caseId: string | null;
  taskId: string | null;
  workDate: string;
  category: string;
  title: string;
  description: string;
  output: string | null;
  volume: number | null;
  obstacle: string | null;
  status: SiapWorklogStatus;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: SiapWorklogUserSummary;
  unitKerja: UnitKerjaSummary | null;
  case: SiapWorklogCaseSummary | null;
  task: SiapWorklogTaskSummary | null;
  reviewer: NotificationUserSummary | null;
};

export type SiapWorklogDashboardStaff = {
  id: string;
  username: string;
  name: string;
  unitKerjaId: string | null;
  unitKerja: UnitKerjaSummary | null;
  roles: string[];
};

export type SiapWorklogDashboardStaffRow = {
  user: SiapWorklogDashboardStaff;
  hasUpdatedToday: boolean;
  todayWorklogCount: number;
  worklogCount: number;
  totalVolume: number;
  draft: number;
  submitted: number;
  revisionRequired: number;
  approved: number;
  rejected: number;
  obstacleCount: number;
  lastWorklogAt: string | null;
};

export type SiapWorklogDashboardGroup = {
  key: string;
  label: string;
  total: number;
};

export type SiapWorklogDashboardUnitRow = {
  unit: {
    id: string;
    kode: string;
    nama: string;
    parentId: string | null;
    level: number;
  };
  totalStaff: number;
  updatedToday: number;
  notUpdatedToday: number;
  worklogCount: number;
  totalVolume: number;
  draft: number;
  submitted: number;
  pendingReview: number;
  revisionRequired: number;
  approved: number;
  rejected: number;
  obstacleCount: number;
  healthScore: number;
};

export type SiapWorklogExecutiveDashboard = SiapWorklogTeamDashboard & {
  byUnit: SiapWorklogDashboardUnitRow[];
  strategicIssues: SiapWorklog[];
  executiveNotes: {
    attentionNeededUnits: number;
    highRiskUnitCount: number;
  };
};

export type SiapWorklogTeamDashboard = {
  scope: {
    unitKerjaId: string | null;
    from: string;
    to: string;
    date: string;
  };
  summary: {
    totalStaff: number;
    updatedToday: number;
    notUpdatedToday: number;
    pendingReview: number;
    approvedInPeriod: number;
    revisionInPeriod: number;
    submittedInPeriod: number;
    draftInPeriod: number;
    totalWorklogsInPeriod: number;
    totalVolumeInPeriod: number;
    obstacleCountInPeriod: number;
  };
  notUpdatedToday: SiapWorklogDashboardStaff[];
  byStaff: SiapWorklogDashboardStaffRow[];
  pendingReview: SiapWorklog[];
  recentObstacles: SiapWorklog[];
  statusDistribution: SiapWorklogDashboardGroup[];
  categoryDistribution: SiapWorklogDashboardGroup[];
};

export type CreateSiapWorklogPayload = {
  workDate: string;
  category: string;
  title: string;
  description: string;
  output?: string;
  volume?: number;
  obstacle?: string;
  caseId?: string;
  taskId?: string;
};

export type UpdateSiapWorklogPayload = Partial<CreateSiapWorklogPayload>;

export type ReviewSiapWorklogPayload = {
  note?: string;
};