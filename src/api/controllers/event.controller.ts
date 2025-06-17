import { Request, Response } from "express";
import { services } from "../../api/services/container";

export const EventController = {
  // Get all public events
  getAllEvents: async (req: Request, res: Response) => {
    try {
      const limitParam = req.query.limit as string;
      const includeUpcoming = req.query.upcoming !== "false";
      const includePast = req.query.past === "true";

      // Validate limit parameter
      let limit = 50;
      if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
          limit = parsedLimit;
        }
      }

      const options = {
        limit,
        includeUpcoming,
        includePast,
      };

      const result = await services.eventService.getPublicEvents(options);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message || "Failed to fetch events",
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
      });
    } catch (error) {
      console.error("Public getAllEvents error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Get single public event by ID
  getEventById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const result = await services.eventService.getPublicEventById(id);

      if (!result.success) {
        const statusCode =
          result.message === "Event not found or not available" ? 404 : 500;
        return res.status(statusCode).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Public getEventById error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
};
