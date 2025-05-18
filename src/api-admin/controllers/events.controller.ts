import { Request, Response } from 'express';
import { services } from '../../api/services/container';

export const AdminEventController = {
  deleteEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId || 'ADMIN';
      
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
      const userId = req.body.userId || 'ADMIN';
      
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
      const userId = req.body.userId || 'ADMIN';
      
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
  }
};