import { Request, Response } from 'express';
import { AuditLevel } from "../../enums/enumsRepo";
import { container } from "../../api/services/container";
import { auditLogger } from '../../api/services';

export const AuditLogController = {
  //  Get All Logs
  getAllLogs: async (req: Request, res: Response) => {
    try {
      const auditLogRepository = container.get('auditLogRepository');
      
      const logs = await auditLogRepository.findAll();
      return res.json(logs);
      
    } catch (error) {
      console.log(`Audit Log Service | GetAllLogs - Error ${error}`);
      auditLogger.auditLog(
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
      const auditLogRepository = container.get('auditLogRepository');
      
      const logs = await auditLogRepository.findAll({ account: userId } as any);
      return res.json(logs);
    } catch (error) {
      console.log(`Audit Log Service | GetLogsByUser - Error ${error}`);
      auditLogger.auditLog(
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