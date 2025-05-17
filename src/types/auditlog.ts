export interface AuditLog {
  id: string;
  logDT: Date;
  logMessage: string;
  actionType: number;
  account: string;
}