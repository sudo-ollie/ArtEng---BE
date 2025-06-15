import { AuditLog } from "./auditlog";

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}