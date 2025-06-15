import { AuditLevel } from "../enums/auditTypes";

export interface AuditLogQueryOptions {
  limit?: number;
  skip?: number;
  sort?: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
  actionTypes?: AuditLevel[];
  account?: string;
  searchTerm?: string;
}