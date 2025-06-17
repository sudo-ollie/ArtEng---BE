import { prisma } from "../db/client";
import { AuditLevel } from "../../enums/enumsRepo";
import { services } from "../services/container";
import { Event } from "../../types/typesRepo";
import { PrismaClient } from ".prisma/client";
import { AuditLoggerService } from "../services/auditLogger";

export class EventRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditLogger: AuditLoggerService
  ) {}

  async getEventById(id: string): Promise<Event | null> {
    try {
      return await prisma.event.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error(`Error Fetching Event-${id} :`, error);
      await services.auditLogger.auditLog(
        `Error Fetching Event-${id} : ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return null;
    }
  }

  async deleteEvent(
    id: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        return { success: false, message: "Event Not Found" };
      }

      if (event.eventLocked) {
        return { success: false, message: "Locked Event Cannot Be Deleted" };
      }

      await prisma.event.delete({
        where: { id },
      });

      await services.auditLogger.auditLog(
        `Deleted Event ${event.title} - ${id}`,
        AuditLevel.Delete,
        userId
      );

      return { success: true, message: "Event Deleted Successfully" };
    } catch (error) {
      console.error(`Error Deleting Event With ID ${id}:`, error);
      await services.auditLogger.auditLog(
        `Error Deleting Event With ID ${id}: ${error}`,
        AuditLevel.Error,
        userId
      );
      return { success: false, message: "Failed To Delete Event" };
    }
  }

  async lockEvent(
    id: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        return { success: false, message: "Event Not Found" };
      }

      await prisma.event.update({
        where: { id },
        data: { eventLocked: true },
      });

      await services.auditLogger.auditLog(
        `Locked Event ${event.title} With ID ${id}`,
        AuditLevel.Update,
        userId
      );

      return { success: true, message: "Event Successfully Locked" };
    } catch (error) {
      console.error(`Error Locking Event With ID ${id}:`, error);
      await services.auditLogger.auditLog(
        `Error Locking Event With ID ${id}: ${error}`,
        AuditLevel.Error,
        userId
      );
      return { success: false, message: "Failed To Lock Event" };
    }
  }

  async privateEvent(
    id: string,
    setPrivate: boolean,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        return { success: false, message: "Event Not Found" };
      }

      await prisma.event.update({
        where: { id },
        data: { eventPrivate: setPrivate },
      });

      const action = setPrivate ? true : false;

      await services.auditLogger.auditLog(
        `Set Event ${event.title} - ID ${id} To ${action}`,
        setPrivate ? AuditLevel.Deactivate : AuditLevel.Activate,
        userId
      );

      return {
        success: true,
        message: `Successfully Set EventID : ${id} To ${action}`,
      };
    } catch (error) {
      console.error(`Failed To Set Event-${id} Privacy Level:`, error);
      await services.auditLogger.auditLog(
        `Error Setting Event-${id} Privacy: ${error}`,
        AuditLevel.Error,
        userId
      );
      return {
        success: false,
        message: "Failed To Update Event Privacy Level",
      };
    }
  }

  async getEventStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
    totalAttendees: number;
  }> {
    try {
      const [totalEvents, activeEvents] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({
          where: { eventActive: true },
        }),
      ]);

      //  Place holder until I add an attendees table && functionality
      const totalAttendees = 0;

      return {
        totalEvents,
        activeEvents,
        totalAttendees,
      };
    } catch (error) {
      console.error("Error getting event stats:", error);
      await services.auditLogger.auditLog(
        `Error getting event stats: ${error}`,
        AuditLevel.Error,
        "SYSTEM"
      );
      return { totalEvents: 0, activeEvents: 0, totalAttendees: 0 };
    }
  }
  async createEvent(
    eventData: Omit<Event, "id" | "publishDate">,
    userId: string
  ): Promise<{ success: boolean; message: string; event?: Event }> {
    try {
      const publishDate = new Date();

      const event = await this.prisma.event.create({
        data: {
          ...eventData,
          publishDate,
        },
      });

      await this.auditLogger.auditLog(
        `Created Event ${event.title} with ID ${event.id}`,
        AuditLevel.Create,
        userId
      );

      return {
        success: true,
        message: "Event Created Successfully",
        event,
      };
    } catch (error) {
      console.error("Error Creating Event:", error);
      await this.auditLogger.auditLog(
        `Error Creating Event: ${error}`,
        AuditLevel.Error,
        userId
      );
      return { success: false, message: "Failed To Create Event" };
    }
  }

  async getAllEvents(
    options: {
      page: number;
      limit: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
    userId: string
  ) {
    try {
      // Log the action for audit purposes
      await this.auditLogger.auditLog(
        `Admin getAllEvents - Page: ${options.page}, Limit: ${options.limit}, Search: "${options.search || "none"}"`,
        AuditLevel.Export,
        userId
      );

      const {
        page,
        limit,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;
      const offset = (page - 1) * limit;

      // Build the where clause for search
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { subtitle: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { sponsor: { contains: search, mode: "insensitive" } },
        ];
      }

      // Build the orderBy clause
      const orderBy: any = {};

      // Validate sortBy field to prevent injection
      const allowedSortFields = [
        "id",
        "title",
        "subtitle",
        "description",
        "date",
        "location",
        "capacity",
        "price",
        "sponsor",
        "publishDate",
        "eventActive",
        "eventPrivate",
        "eventLocked",
      ];

      if (allowedSortFields.includes(sortBy)) {
        orderBy[sortBy] = sortOrder;
      } else {
        orderBy.date = "desc"; // fallback to default - sort by event date
      }

      // Get total count for pagination
      const totalCount = await this.prisma.event.count({
        where: whereClause,
      });

      // Get events with pagination
      const events = await this.prisma.event.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true,
          date: true,
          location: true,
          capacity: true,
          price: true,
          sponsor: true,
          bannerImage: true,
          thumbImage: true,
          sponsorLogo: true,
          publishDate: true,
          eventActive: true,
          eventPrivate: true,
          eventLocked: true,
        },
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: events,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      await this.auditLogger.auditLog(
        `Admin getAllEvents failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        AuditLevel.Error,
        userId
      );

      console.error("EventService.getAllEvents error:", error);

      return {
        success: false,
        message: "Failed to retrieve events",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

/**
 * Get public events - for public website display
 * Only returns active, non-private, future events
 */
async getPublicEvents(options?: {
  limit?: number;
  includeUpcoming?: boolean;
  includePast?: boolean;
}) {
  try {
    const { 
      limit = 50, 
      includeUpcoming = true, 
      includePast = false 
    } = options || {};

    // Build date filter
    const dateFilter: any = {};
    if (includeUpcoming && !includePast) {
      dateFilter.gte = new Date(); // Only future events
    } else if (includePast && !includeUpcoming) {
      dateFilter.lt = new Date(); // Only past events
    }
    // If both true or both false, no date filter (all events)

    const events = await this.prisma.event.findMany({
      where: {
        eventActive: true,
        eventPrivate: false,
        eventLocked: false,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      orderBy: [
        { date: includeUpcoming ? 'asc' : 'desc' }
      ],
      take: Math.min(limit, 100), // Cap at 100 for performance
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        date: true,
        location: true,
        capacity: true,
        price: true,
        sponsor: true,
        bannerImage: true,
        thumbImage: true,
        sponsorLogo: true,
        publishDate: true
        // Don't expose admin fields (eventActive, eventPrivate, eventLocked)
      }
    });

    return {
      success: true,
      data: events,
      count: events.length
    };

  } catch (error) {
    console.error('EventService.getPublicEvents error:', error);
    
    return {
      success: false,
      message: 'Failed to retrieve events',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get single public event by ID
 * Only returns if event is active, non-private, and not locked
 */
async getPublicEventById(eventId: string) {
  try {
    // Validate input
    if (!eventId || typeof eventId !== 'string') {
      return {
        success: false,
        message: 'Valid event ID is required'
      };
    }

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        eventActive: true,
        eventPrivate: false,
        eventLocked: false
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        date: true,
        location: true,
        capacity: true,
        price: true,
        sponsor: true,
        bannerImage: true,
        thumbImage: true,
        sponsorLogo: true,
        publishDate: true
      }
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found or not available'
      };
    }

    return {
      success: true,
      data: event
    };

  } catch (error) {
    console.error('EventService.getPublicEventById error:', error);
    
    return {
      success: false,
      message: 'Failed to retrieve event',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
}
