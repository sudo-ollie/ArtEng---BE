import { Request, Response } from 'express';
import { services } from '../../api/services/container';
import { AuthRequest } from '../../api/middleware/auth';

export const AdminEventController = {
  deleteEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || 'ADMIN';
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }
      
      const result = await services.eventService.deleteEvent(id, userId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error Deleting Event :', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  },
  
  lockEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || 'ADMIN';
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }
      
      const result = await services.eventService.lockEvent(id, userId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error Locking Event :', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  },
  
  privateEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { setPrivate } = req.body;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || 'ADMIN';
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Event ID Required'
        });
      }
      
      if (typeof setPrivate !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'setPrivate parameter is required and must be a boolean'
        });
      }
      
      const result = await services.eventService.privateEvent(id, setPrivate, userId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error Setting Event Privacy Level :', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  },
  
  getEventStats: async (req: Request, res: Response) => {
    try {
      const stats = await services.eventService.getEventStats();
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error Fetching Event Stats :', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  },

  createEvent: async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      const authReq = req as AuthRequest;
      const userId = authReq.auth?.userId || 'ADMIN';
      
      if (!eventData) {
        return res.status(400).json({
          success: false,
          message: 'Event data is required'
        });
      }
      
      const requiredFields = [
        'title', 
        'description', 
        'date', 
        'location', 
        'capacity', 
        'price', 
        'sponsor', 
        'bannerImage', 
        'thumbImage', 
        'sponsorLogo'
      ];
      
      const missingFields = requiredFields.filter(field => {
        const value = eventData[field];
        return value === undefined || value === null || value === '';
      });
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      if (isNaN(parseInt(eventData.capacity))) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be a valid number'
        });
      }

      if (isNaN(parseInt(eventData.price))) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid number'
        });
      }

      const eventDate = new Date(eventData.date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      const imageFields = ['bannerImage', 'thumbImage', 'sponsorLogo'];
      for (const field of imageFields) {
        const url = eventData[field];
        if (url && !url.startsWith('http')) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a valid URL`
          });
        }
      }

      const preparedEventData = {
        title: eventData.title.trim(),
        subtitle: eventData.subtitle?.trim() || '',
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
        eventLocked: false
      };
      
      const result = await services.eventService.createEvent(preparedEventData, userId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error Creating Event:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
};