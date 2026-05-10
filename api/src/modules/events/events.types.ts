export type NotificationEventPayload = {
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  caseId?: string;
  recipientUserIds?: string[];
  recipientRoleCodes?: string[];
  metadata?: Record<string, unknown>;
  createdBy?: string;
};
