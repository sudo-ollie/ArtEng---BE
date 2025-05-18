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

      await this.auditLogger.auditLog(
        `${email} - Subscribed To Mailing List`,
        AuditLevel.Create,
        "SYSTEM"
      );

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
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        this.prisma.mailingList.count(),
        this.prisma.mailingList.findMany({
          skip,
          take: limit,
          orderBy: { registerTime: "desc" },
        }),
      ]);

      return {
        data: items,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error Fetching Mailing List :", error);
      await this.auditLogger.auditLog(
        `Error Fetching Mailing List : ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return { data: [], total: 0, page, limit };
    }
  }

  async exportMailingList(): Promise<string> {
    try {
      const emails = await this.prisma.mailingList.findMany({
        select: { email: true },
      });

      // CSV Creation
      const header = "Email";
      const emailRows = emails.map((item) => item.email);
      const csvContent = [header, ...emailRows].join("\n");

      await this.auditLogger.auditLog(
        "Successfully Exported Mailing List",
        AuditLevel.Export,
        "ADMIN"
      );

      return csvContent;
    } catch (error) {
      console.error("Error Exporting Mailing List:", error);
      await this.auditLogger.auditLog(
        `Error Exporting Mailing List: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return "";
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
