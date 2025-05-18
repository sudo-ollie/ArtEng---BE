import { Request, Response } from 'express';
import { AuditLevel } from "../../enums/enumsRepo";
import { services } from '../../api/services/container';

export const AuditLogController = {
  //  Get All Logs
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

  //  Get Logs By User
  getLogsByUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const logs = await services.auditLogService.getLogById(userId);
      
      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.log(`Audit Log Service | GetLogsByUser - Error ${error}`);
      services.auditLogger.auditLog(
        "ERROR - GetLogsByUser - AuditLog Service",
        AuditLevel.Error,
        "SYSTEM"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch"
      });
    }
  }
};