import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { services } from '../../api/services/container';
import { AuditLevel } from '../../enums/enumsRepo';
import { AuthRequest } from '../../api/middleware/auth';

// Helper function to sanitize email data
const sanitizeEmailData = (emails: any[]) => {
  return emails.map(email => ({
    id: email.id,
    email: email.email,
    registerTime: email.registerTime
  }));
};

export const AdminEmailListController = {
  getAllMailingList: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.auth.userId;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        services.auditLogger.auditLog(
          `ERROR - GetAllMailingList validation failed: ${JSON.stringify(errors.array())}`,
          AuditLevel.Error,
          userId
        );
        return res.status(400).json({
          success: false,
          message: "Invalid input parameters"
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await services.mailingList.getAllMailingList(page, limit);

      services.auditLogger.auditLog(
        `Successfully retrieved mailing list - Page: ${page}, Limit: ${limit}, Total: ${result.total || 0}`,
        AuditLevel.System,
        userId
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error getting mailing list:", error);

      const authReq = req as AuthRequest;
      services.auditLogger.auditLog(
        `ERROR - GetAllMailingList failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        AuditLevel.Error,
        authReq.auth?.userId || "SYSTEM"
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  exportMailingList: async (req: Request, res: Response) => {
    try {
      // Auth is already validated by middleware, get user info
      const authReq = req as AuthRequest;
      const userId = authReq.auth.userId;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        services.auditLogger.auditLog(
          `ERROR - ExportMailingList validation failed: ${JSON.stringify(errors.array())}`,
          AuditLevel.Error,
          userId
        );
        return res.status(400).json({
          success: false,
          message: "Invalid input parameters",
          errors: errors.array(),
        });
      }

      const emails = await services.mailingList.exportMailingList();

      //  Sanitize email data before sending
      const sanitizedEmails = Array.isArray(emails)
        ? sanitizeEmailData(emails)
        : [];

      services.auditLogger.auditLog(
        `Successfully exported mailing list - ${sanitizedEmails.length} emails exported`,
        AuditLevel.Export,
        userId
      );

      return res.status(200).json({
        success: true,
        data: sanitizedEmails,
      });
    } catch (error) {
      console.error("Error exporting mailing list:", error);

      const authReq = req as AuthRequest;
      services.auditLogger.auditLog(
        `ERROR - ExportMailingList failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        AuditLevel.Error,
        authReq.auth?.userId || "SYSTEM"
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  getMailingListStats: async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.auth.userId;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        services.auditLogger.auditLog(
          `ERROR - GetMailingListStats validation failed: ${JSON.stringify(errors.array())}`,
          AuditLevel.Error,
          userId
        );
        return res.status(400).json({
          success: false,
          message: "Invalid input parameters"
        });
      }

      const stats = await services.mailingList.getMailingListStats();

      services.auditLogger.auditLog(
        `Successfully retrieved mailing list stats - Total: ${stats.totalEmails}, Monthly Change: ${stats.monthlyChange}`,
        AuditLevel.System,
        userId
      );

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting mailing list stats:", error);

      const authReq = req as AuthRequest;
      services.auditLogger.auditLog(
        `ERROR - GetMailingListStats failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        AuditLevel.Error,
        authReq.auth?.userId || "SYSTEM"
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
};