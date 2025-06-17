import { AuditLevel } from "../../enums/enumsRepo";
import { PrismaClient } from ".prisma/client";
import { AuditLoggerService } from "./auditLogger";

export class EmailListService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditLogger: AuditLoggerService
  ) {}

  async addToMailingList(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existingEmail = await this.prisma.mailingList.findFirst({
        where: { email },
      });

      if (existingEmail) {
        return {
          success: false,
          message: "Already Subscribed To Mailing List",
        };
      }

      await this.prisma.mailingList.create({
        data: {
          registerTime: new Date(),
          email,
        },
      });

      return { success: true, message: "Successfully Added To Mailing List" };
    } catch (error) {
      console.error("Error Adding To Mailing List :", error);
      await this.auditLogger.auditLog(
        `Error Adding To Mailing List : ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return { success: false, message: "Error Atting To Mailing List" };
    }
  }

  async removeFromMailingList(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existingEmail = await this.prisma.mailingList.findFirst({
        where: { email },
      });

      if (!existingEmail) {
        return { success: false, message: "Email not found in mailing list" };
      }

      await this.prisma.mailingList.delete({
        where: { id: existingEmail.id },
      });

      await this.auditLogger.auditLog(
        `${email} - Unsubscribed From Mailing List`,
        AuditLevel.Delete,
        "SYSTEM"
      );

      return {
        success: true,
        message: "Successfully Removed From Mailing List",
      };
    } catch (error) {
      console.error("Error Removing From Mailing List :", error);
      await this.auditLogger.auditLog(
        `Error Removing From Mailing List : ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return { success: false, message: "Error Removing From Mailing List" };
    }
  }

  async getAllMailingList(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        this.prisma.mailingList.count(),
        this.prisma.mailingList.findMany({
          skip,
          take: limit,
          orderBy: { registerTime: "desc" },
          select: {
            id: true,
            email: true,
            registerTime: true,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: items,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error("Error Fetching Mailing List:", error);
      await this.auditLogger.auditLog(
        `Error Fetching Mailing List: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  async getMailingListStats(): Promise<{
    totalEmails: number;
    monthlyChange: number;
    monthlyChangePercentage: number;
  }> {
    try {
      // Get total count
      const totalEmails = await this.prisma.mailingList.count();

      // Get this month's count
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);

      const thisMonthEmails = await this.prisma.mailingList.count({
        where: {
          registerTime: {
            gte: thisMonthStart,
          },
        },
      });

      // Get last month's count for comparison
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      lastMonthStart.setHours(0, 0, 0, 0);

      const lastMonthEnd = new Date(thisMonthStart);
      lastMonthEnd.setTime(lastMonthEnd.getTime() - 1);

      const lastMonthEmails = await this.prisma.mailingList.count({
        where: {
          registerTime: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      });

      // Calculate percentage change
      const monthlyChange = thisMonthEmails - lastMonthEmails;
      const monthlyChangePercentage =
        lastMonthEmails > 0
          ? (monthlyChange / lastMonthEmails) * 100
          : thisMonthEmails > 0
            ? 100
            : 0;

      await this.auditLogger.auditLog(
        `Mailing List Stats Retrieved - Total: ${totalEmails}, Monthly Change: ${monthlyChange}`,
        AuditLevel.System,
        "SYSTEM"
      );

      return {
        totalEmails,
        monthlyChange,
        monthlyChangePercentage,
      };
    } catch (error) {
      console.error("Error getting mailing list stats:", error);
      await this.auditLogger.auditLog(
        `Error Getting Mailing List Stats: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      throw error;
    }
  }

  async exportMailingList(): Promise<
    Array<{
      id: string;
      email: string;
      registerTime: Date;
    }>
  > {
    try {
      const emails = await this.prisma.mailingList.findMany({
        select: {
          id: true,
          email: true,
          registerTime: true,
        },
        orderBy: {
          registerTime: "desc",
        },
      });

      await this.auditLogger.auditLog(
        `Successfully Exported Mailing List - ${emails.length} emails`,
        AuditLevel.Export,
        "ADMIN"
      );

      return emails;
    } catch (error) {
      console.error("Error Exporting Mailing List:", error);
      await this.auditLogger.auditLog(
        `Error Exporting Mailing List: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return [];
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
