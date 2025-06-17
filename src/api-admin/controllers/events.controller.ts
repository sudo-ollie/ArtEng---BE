import { Request, Response } from "express";
import { services } from "../../api/services/container";
import { AuthRequest } from "../../api/middleware/auth";

export const AdminEventController = {
getAllEvents: async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.auth?.userId || "ADMIN";
    
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return res.status(401).json({
        success: false,
        message: "Valid authentication required",
      });
    }
    
    const pageParam = req.query.page as string;
    const limitParam = req.query.limit as string;
    const searchParam = req.query.search as string;
    const sortByParam = req.query.sortBy as string;
    const sortOrderParam = req.query.sortOrder as string;
    
    let page = 1;
    if (pageParam) {
      if (!/^\d+$/.test(pageParam)) {
        return res.status(400).json({
          success: false,
          message: "Page parameter must be a positive integer",
        });
      }
      page = parseInt(pageParam, 10);
      if (page < 1 || page > 10000) {
        return res.status(400).json({
          success: false,
          message: "Page must be between 1 and 10000",
        });
      }
    }
    
    let limit = 10;
    if (limitParam) {
      if (!/^\d+$/.test(limitParam)) {
        return res.status(400).json({
          success: false,
          message: "Limit parameter must be a positive integer",
        });
      }
      limit = parseInt(limitParam, 10);
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: "Limit must be between 1 and 100",
        });
      }
    }
    
    let search = "";
    if (searchParam) {
      if (typeof searchParam !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search parameter must be a string",
        });
      }

      search = searchParam.trim();

      if (search.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Search term cannot exceed 100 characters",
        });
      }
      
      const maliciousPatterns = [
        /[<>]/g,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /[\x00-\x1f\x7f-\x9f]/g,
      ];
      
      for (const pattern of maliciousPatterns) {
        if (pattern.test(search)) {
          return res.status(400).json({
            success: false,
            message: "Search term contains invalid characters",
          });
        }
      }

      search = search.replace(/\s+/g, " ");
    }
    
    const allowedSortFields = [
      "id", "title", "subtitle", "description", "date", "location", 
      "capacity", "price", "sponsor", "publishDate", "eventActive", 
      "eventPrivate", "eventLocked"
    ];
    
    let sortBy = "date";
    if (sortByParam) {
      if (typeof sortByParam !== "string") {
        return res.status(400).json({
          success: false,
          message: "SortBy parameter must be a string",
        });
      }
      
      const sanitizedSortBy = sortByParam.trim().toLowerCase();
      if (!allowedSortFields.includes(sanitizedSortBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sort field. Allowed fields: ${allowedSortFields.join(", ")}`,
        });
      }
      sortBy = sanitizedSortBy;
    }
    
    let sortOrder: "asc" | "desc" = "desc";
    if (sortOrderParam) {
      if (typeof sortOrderParam !== "string") {
        return res.status(400).json({
          success: false,
          message: "SortOrder parameter must be a string",
        });
      }
      
      const sanitizedSortOrder = sortOrderParam.trim().toLowerCase();
      if (!["asc", "desc"].includes(sanitizedSortOrder)) {
        return res.status(400).json({
          success: false,
          message: "Sort order must be either 'asc' or 'desc'",
        });
      }
      sortOrder = sanitizedSortOrder as "asc" | "desc";
    }

    const options = {
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortOrder,
    };
    
    console.log(`Admin getAllEvents request - User: ${userId}, Options:`, {
      page,
      limit,
      search: search || "none",
      sortBy,
      sortOrder,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    
    const result = await services.eventService.getAllEvents(options, userId);
    
    if (!result.success) {
      console.warn(`getAllEvents service failed for user ${userId}:`, result.message);
      return res.status(400).json(result);
    }
    
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
    });
    
    return res.status(200).json(result);
    
  } catch (error) {

    console.error("Error Fetching All Events:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as AuthRequest).auth?.userId,
      query: req.query,
      ip: req.ip,
    });
    
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
},

  deleteEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || "ADMIN";

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const result = await services.eventService.deleteEvent(id, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error Deleting Event :", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  lockEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || "ADMIN";

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const result = await services.eventService.lockEvent(id, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error Locking Event :", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  privateEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { setPrivate } = req.body;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || "ADMIN";

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Event ID Required",
        });
      }

      if (typeof setPrivate !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "setPrivate parameter is required and must be a boolean",
        });
      }

      const result = await services.eventService.privateEvent(
        id,
        setPrivate,
        userId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error Setting Event Privacy Level :", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  getEventStats: async (req: Request, res: Response) => {
    try {
      const stats = await services.eventService.getEventStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error Fetching Event Stats :", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  createEvent: async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || "ADMIN";

      if (!eventData) {
        return res.status(400).json({
          success: false,
          message: "Event data is required",
        });
      }

      const requiredFields = [
        "title",
        "description",
        "date",
        "location",
        "capacity",
        "price",
        "sponsor",
        "bannerImage",
        "thumbImage",
        "sponsorLogo",
      ];

      const missingFields = requiredFields.filter((field) => {
        const value = eventData[field];
        return value === undefined || value === null || value === "";
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      if (isNaN(parseInt(eventData.capacity))) {
        return res.status(400).json({
          success: false,
          message: "Capacity must be a valid number",
        });
      }

      if (isNaN(parseInt(eventData.price))) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number",
        });
      }

      const eventDate = new Date(eventData.date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const imageFields = ["bannerImage", "thumbImage", "sponsorLogo"];
      for (const field of imageFields) {
        const url = eventData[field];
        if (url && !url.startsWith("http")) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a valid URL`,
          });
        }
      }

      const preparedEventData = {
        title: eventData.title.trim(),
        subtitle: eventData.subtitle?.trim() || "",
        description: eventData.description.trim(),
        date: eventDate,
        location: eventData.location.trim(),
        capacity: parseInt(eventData.capacity),
        price: parseInt(eventData.price),
        sponsor: eventData.sponsor.trim(),
        bannerImage: eventData.bannerImage,
        thumbImage: eventData.thumbImage,
        sponsorLogo: eventData.sponsorLogo,
        eventActive: eventData.eventActive !== false,
        eventPrivate: eventData.eventPrivate === true,
        eventLocked: false,
      };

      const result = await services.eventService.createEvent(
        preparedEventData,
        userId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("Error Creating Event:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  getEventById: async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.auth?.userId || "ADMIN";

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return res.status(401).json({
        success: false,
        message: "Valid authentication required",
      });
    }

    console.log(`Admin getEventById request - User: ${userId}, EventID: ${id}`, {
      eventId: id,
      userId,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    const result = await services.eventService.getEventByIdAdmin(id, userId);

    if (!result.success) {
      console.warn(`getEventById service failed for user ${userId}:`, result.message);
      const statusCode = result.message === "Event not found" ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error Fetching Event by ID:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as AuthRequest).auth?.userId,
      eventId: req.params.id,
      ip: req.ip,
    });

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
},
};