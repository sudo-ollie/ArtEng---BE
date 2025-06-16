import { Request, Response } from 'express';
import { AuditLevel } from "../../enums/enumsRepo";
import { services } from '../../api/services/container';
import { 
  sanitizeString, 
  sanitizeNumber, 
  sanitizeSort, 
  sanitizeDate, 
  sanitizeActionTypes,
  removeUndefinedProperties 
} from '../../api/utils/sanitization';
import { AuditLogQueryOptions } from '../../types/AuditLogQueryOptions';

export const AuditLogController = {
  
  //  Get All Logs (keeping original for backward compatibility)
  getAllLogs: async (req: Request, res: Response) => {
    try {
      const logs = await services.auditLogService.getAllLogs();
      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - GetAllLogs - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch"
      });
    }
  },

  //  Enhanced paginated logs with filtering and sorting
  getLogsPaginated: async (req: Request, res: Response) => {
    try {
      const {
        limit,
        skip,
        sort,
        dateFrom,
        dateTo,
        actionTypes,
        account,
        searchTerm
      } = req.query;

      //  Sanitize all inputs
      const options: AuditLogQueryOptions = removeUndefinedProperties({
        limit: sanitizeNumber(limit, 50),
        skip: sanitizeNumber(skip, 0),
        sort: sanitizeSort(sort),
        dateFrom: sanitizeDate(dateFrom),
        dateTo: sanitizeDate(dateTo),
        actionTypes: sanitizeActionTypes(actionTypes),
        account: sanitizeString(account),
        searchTerm: sanitizeString(searchTerm)
      });

      const result = await services.auditLogService.getLogsPaginated(options);
      
      return res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          limit: options.limit,
          skip: options.skip
        }
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - GetLogsPaginated - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch Paginated Logs"
      });
    }
  },

  //  Get Logs By User (keeping original for backward compatibility)
  getLogsByUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const sanitizedUserId = sanitizeString(userId);
      
      if (!sanitizedUserId) {
        return res.status(400).json({
          success: false,
          message: "ERROR : Invalid User ID"
        });
      }

      const logs = await services.auditLogService.getLogsByUserId(sanitizedUserId);
      
      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      services.auditLogger.auditLog(
        `ERROR - GetLogsByUser - AuditLog Service - User: ${req.params.userId}`,
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch User Logs"
      });
    }
  },

  //  Enhanced user logs with pagination
  getUserLogsPaginated: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit, skip, sort, dateFrom, dateTo, actionTypes, searchTerm } = req.query;

      const sanitizedUserId = sanitizeString(userId);
      if (!sanitizedUserId) {
        return res.status(400).json({
          success: false,
          message: "ERROR : Invalid User ID"
        });
      }

      const options = {
        limit: sanitizeNumber(limit, 50),
        skip: sanitizeNumber(skip, 0),
        sort: sanitizeSort(sort),
        dateFrom: sanitizeDate(dateFrom),
        dateTo: sanitizeDate(dateTo),
        actionTypes: sanitizeActionTypes(actionTypes),
        searchTerm: sanitizeString(searchTerm)
      };

      //  Remove undefined values
      Object.keys(options).forEach(key => {
        if (options[key as keyof typeof options] === undefined || options[key as keyof typeof options] === '') {
          delete options[key as keyof typeof options];
        }
      });

      const result = await services.auditLogService.getUserLogsPaginated(sanitizedUserId, options);
      
      return res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          limit: options.limit,
          skip: options.skip
        }
      });
    } catch (error) {
      services.auditLogger.auditLog(
        `ERROR - GetUserLogsPaginated - AuditLog Service - User: ${req.params.userId}`,
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch User Logs"
      });
    }
  },

  //  Get logs by date range
  getLogsByDateRange: async (req: Request, res: Response) => {
    try {
      const { dateFrom, dateTo, limit, skip, sort } = req.query;

      const sanitizedDateFrom = sanitizeDate(dateFrom);
      const sanitizedDateTo = sanitizeDate(dateTo);

      if (!sanitizedDateFrom || !sanitizedDateTo) {
        return res.status(400).json({
          success: false,
          message: "ERROR : Invalid date range provided"
        });
      }

      const options = {
        limit: sanitizeNumber(limit, 50),
        skip: sanitizeNumber(skip, 0),
        sort: sanitizeSort(sort)
      };

      const result = await services.auditLogService.getLogsByDateRange(sanitizedDateFrom, sanitizedDateTo, options);
      
      return res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          limit: options.limit,
          skip: options.skip
        }
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - GetLogsByDateRange - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch Logs By Date Range"
      });
    }
  },

  //  Get logs by action type
  getLogsByActionType: async (req: Request, res: Response) => {
    try {
      const { actionTypes, limit, skip, sort } = req.query;

      const sanitizedActionTypes = sanitizeActionTypes(actionTypes);
      if (!sanitizedActionTypes || sanitizedActionTypes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "ERROR : Invalid action types provided"
        });
      }

      const options = {
        limit: sanitizeNumber(limit, 50),
        skip: sanitizeNumber(skip, 0),
        sort: sanitizeSort(sort)
      };

      const result = await services.auditLogService.getLogsByActionType(sanitizedActionTypes, options);
      
      return res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          limit: options.limit,
          skip: options.skip
        }
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - GetLogsByActionType - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch Logs By Action Type"
      });
    }
  },

  //  Search logs
  searchLogs: async (req: Request, res: Response) => {
    try {
      const { q, searchTerm, limit, skip, sort } = req.query;
      const search = sanitizeString(q || searchTerm);

      if (!search) {
        return res.status(400).json({
          success: false,
          message: "ERROR : Search term is required"
        });
      }

      const options = {
        limit: sanitizeNumber(limit, 50),
        skip: sanitizeNumber(skip, 0),
        sort: sanitizeSort(sort)
      };

      const result = await services.auditLogService.searchLogs(search, options);
      
      return res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          limit: options.limit,
          skip: options.skip
        },
        searchTerm: search
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - SearchLogs - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Search Logs"
      });
    }
  },

  //  Get recent logs
  getRecentLogs: async (req: Request, res: Response) => {
    try {
      const { count } = req.query;
      const sanitizedCount = sanitizeNumber(count, 10);

      const logs = await services.auditLogService.getRecentLogs(sanitizedCount);
      
      return res.status(200).json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - GetRecentLogs - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch Recent Logs"
      });
    }
  },

  //  Get log statistics
  getLogStatistics: async (req: Request, res: Response) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const sanitizedDateFrom = sanitizeDate(dateFrom);
      const sanitizedDateTo = sanitizeDate(dateTo);

      const stats = await services.auditLogService.getLogStatistics(sanitizedDateFrom, sanitizedDateTo);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - GetLogStatistics - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Fetch Log Statistics"
      });
    }
  },

  //  Delete old logs
  deleteOldLogs: async (req: Request, res: Response) => {
    try {
      const { days } = req.query;
      const sanitizedDays = sanitizeNumber(days, 90);

      //  Minimum 30 days to prevent accidental deletion of recent logs
      if (sanitizedDays < 30) {
        return res.status(400).json({
          success: false,
          message: "ERROR : Cannot delete logs newer than 30 days"
        });
      }

      const result = await services.auditLogService.deleteOldLogs(sanitizedDays);
      
      return res.status(200).json({
        success: result.success,
        message: result.success 
          ? `Successfully deleted ${result.deletedCount} old logs`
          : "Failed to delete old logs",
        deletedCount: result.deletedCount
      });
    } catch (error) {
      services.auditLogger.auditLog(
        "ERROR - DeleteOldLogs - AuditLog Service",
        AuditLevel.Error,
        "AuditLog Service"
      );
      return res.status(500).json({
        success: false,
        message: "ERROR : Failed To Delete Old Logs"
      });
    }
  }
};