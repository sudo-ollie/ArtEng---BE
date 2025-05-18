import { Request, Response } from 'express';
import { AuditLevel } from "../../enums/auditTypes";
import { services } from '../../api/services/container';

export const AuditLogController = {
  // Get All Logs
  getAllLogs: async (req: Request, res: Response) => {
    try {
      const logs = await services.auditLogService.getAllLogs();
      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.log(`Audit Log Service | GetAllLogs - Error ${error}`);
      services.auditLogger.auditLog(
        "ERROR - GetAllLogs - AuditLog Service",
        AuditLevel.Error,
        "SYSTEM"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch"
      });
    }
  },

  // Get Logs By User
  getLogsByUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const logs = await services.auditLogService.getLogsByUserId(userId );
      
      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.log(`Audit Log Service | GetLogsByUser - Error ${error}`);
      services.auditLogger.auditLog(
        `ERROR - GetLogsByUser - AuditLog Service - User: ${req.params.userId}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch User Logs"
      });
    }
  },
};