import { Request, Response } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { getAuth } from "@clerk/express";
import { ErrorCode } from "../../api/utils/errorTypes";
import { services } from "../../api/services/container";
import { AuditLevel } from "../../enums/enumsRepo";

export class AdminAuthController {
  static async verifyAdmin(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      const authHeader = req.headers.authorization;
      if (authHeader) {
        if (authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);

          try {
          } catch (tokenError) {
            await services.auditLogger.auditLog(
              `Token verification failed during admin verification from IP: ${clientIp}`,
              AuditLevel.Error,
              "ANONYMOUS"
            );
            console.error(tokenError);
          }
        }
      } else {
        await services.auditLogger.auditLog(
          `Admin verification attempted without authorization header from IP: ${clientIp}`,
          AuditLevel.Error,
          "ANONYMOUS"
        );
      }

      if (!auth.userId) {
        await services.auditLogger.auditLog(
          `Admin verification failed - No userId found from IP: ${clientIp}`,
          AuditLevel.Error,
          "ANONYMOUS"
        );

        res.status(401).json({
          success: false,
          error: {
            message: "Authentication required",
            code: ErrorCode.UNAUTHORIZED,
          },
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userRole = user.publicMetadata?.role as string | undefined;
      const userEmail = user.emailAddresses[0]?.emailAddress || "unknown";

      if (userRole !== "admin") {
        await services.auditLogger.auditLog(
          `Unauthorized admin verification attempt - User: ${userEmail} (${auth.userId}) - Role: ${userRole || "none"} from IP: ${clientIp}`,
          AuditLevel.Error,
          auth.userId
        );

        res.status(403).json({
          success: false,
          error: {
            message: "Admin access required",
            code: ErrorCode.FORBIDDEN,
          },
        });
        return;
      }

      await services.auditLogger.auditLog(
        `Admin verification successful - User: ${userEmail} (${auth.userId}) from IP: ${clientIp}`,
        AuditLevel.Login,
        auth.userId
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          role: userRole,
          lastSignInAt: user.lastSignInAt,
        },
        sessionInfo: {
          userId: auth.userId,
          sessionId: auth.sessionId,
        },
      });
    } catch (error) {
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      await services.auditLogger.auditLog(
        `Admin verification system error: ${error instanceof Error ? error.message : "Unknown error"} from IP: ${clientIp}`,
        AuditLevel.Error,
        "SYSTEM"
      );

      console.error("Error verifying admin access:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to verify admin access",
          code: ErrorCode.INTERNAL_ERROR,
        },
      });
    }
  }

  static async checkSession(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      if (!auth.userId) {
        await services.auditLogger.auditLog(
          `Admin session check failed - No userId from IP: ${clientIp}`,
          AuditLevel.Error,
          "ANONYMOUS"
        );

        res.status(401).json({
          error: {
            message: "Authentication required",
            code: ErrorCode.UNAUTHORIZED,
          },
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userRole = user.publicMetadata?.role as string | undefined;
      const userEmail = user.emailAddresses[0]?.emailAddress || "unknown";

      if (userRole !== "admin") {
        await services.auditLogger.auditLog(
          `Unauthorized admin session check - User: ${userEmail} (${auth.userId}) - Role: ${userRole || "none"} from IP: ${clientIp}`,
          AuditLevel.Error,
          auth.userId
        );

        res.status(403).json({
          error: {
            message: "Admin access required",
            code: ErrorCode.FORBIDDEN,
          },
        });
        return;
      }

      await services.auditLogger.auditLog(
        `Admin session check successful - User: ${userEmail} (${auth.userId}) from IP: ${clientIp}`,
        AuditLevel.System,
        auth.userId
      );

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          role: user.publicMetadata?.role,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const auth = getAuth(req);
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      await services.auditLogger.auditLog(
        `Admin session check system error: ${error instanceof Error ? error.message : "Unknown error"} from IP: ${clientIp}`,
        AuditLevel.Error,
        auth?.userId || "SYSTEM"
      );

      console.error("Session check error:", error);
      res.status(500).json({
        error: {
          message: "Session check failed",
          code: ErrorCode.INTERNAL_ERROR,
        },
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      if (!auth.userId) {
        await services.auditLogger.auditLog(
          `Admin logout attempted without authentication from IP: ${clientIp}`,
          AuditLevel.Error,
          "ANONYMOUS"
        );

        res.status(401).json({
          error: {
            message: "Authentication required",
            code: ErrorCode.UNAUTHORIZED,
          },
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userEmail = user.emailAddresses[0]?.emailAddress || "unknown";

      await services.auditLogger.auditLog(
        `Admin logout successful - User: ${userEmail} (${auth.userId}) from IP: ${clientIp}`,
        AuditLevel.System,
        auth.userId
      );

      console.log(`Admin logout: ${userEmail} (${auth.userId})`);

      res.json({
        success: true,
        message: "Admin session terminated successfully",
      });
    } catch (error) {
      const auth = getAuth(req);
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      await services.auditLogger.auditLog(
        `Admin logout system error: ${error instanceof Error ? error.message : "Unknown error"} from IP: ${clientIp}`,
        AuditLevel.Error,
        auth?.userId || "SYSTEM"
      );

      console.error("Admin logout error:", error);
      res.status(500).json({
        error: {
          message: "Logout failed",
          code: ErrorCode.INTERNAL_ERROR,
        },
      });
    }
  }

  static async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const auth = getAuth(req);
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      if (!auth.userId) {
        await services.auditLogger.auditLog(
          `Admin dashboard access attempted without authentication from IP: ${clientIp}`,
          AuditLevel.Error,
          "ANONYMOUS"
        );

        res.status(401).json({
          error: {
            message: "Authentication required",
            code: ErrorCode.UNAUTHORIZED,
          },
        });
        return;
      }

      const user = await clerkClient.users.getUser(auth.userId);
      const userRole = user.publicMetadata?.role as string | undefined;
      const userEmail = user.emailAddresses[0]?.emailAddress || "unknown";

      if (userRole !== "admin") {
        await services.auditLogger.auditLog(
          `Unauthorized admin dashboard access - User: ${userEmail} (${auth.userId}) - Role: ${userRole || "none"} from IP: ${clientIp}`,
          AuditLevel.Error,
          auth.userId
        );

        res.status(403).json({
          error: {
            message: "Admin access required",
            code: ErrorCode.FORBIDDEN,
          },
        });
        return;
      }

      const users = await clerkClient.users.getUserList({ limit: 10 });

      await services.auditLogger.auditLog(
        `Admin dashboard data accessed - User: ${userEmail} (${auth.userId}) from IP: ${clientIp}`,
        AuditLevel.System,
        auth.userId
      );

      res.json({
        stats: {
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.lastSignInAt).length,
          adminUsers: users.filter((u) => u.publicMetadata?.role === "admin")
            .length,
        },
        recentUsers: users.map((user) => ({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: user.publicMetadata?.role || "user",
          lastSignIn: user.lastSignInAt,
          createdAt: user.createdAt,
        })),
      });
    } catch (error) {
      const auth = getAuth(req);
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      await services.auditLogger.auditLog(
        `Admin dashboard data fetch system error: ${error instanceof Error ? error.message : "Unknown error"} from IP: ${clientIp}`,
        AuditLevel.Error,
        auth?.userId || "SYSTEM"
      );

      console.error("Error fetching dashboard data:", error);
      res.status(500).json({
        error: {
          message: "Failed to fetch dashboard data",
          code: ErrorCode.INTERNAL_ERROR,
        },
      });
    }
  }
}
