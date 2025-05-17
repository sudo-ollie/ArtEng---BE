import { AuditLog } from "../../types/typesRepo";
import { AuditLevel } from "../../enums/auditTypes";
import { auditLogger } from "../../api/services";
import { AuditLogRepository } from "../../api/repositories/audit-log.repository";


export const AuditLogController = {
  //  Get All Logs
  getAllLogs: async (req: Request, res: Response) => {
    try {

    } catch (Error) {
      console.log(`Audit Log Service | GetAllLogs - Error ${Error}`);
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
};
