import { Request, Response } from 'express';
import { services } from '../../api/services/container';

export const EventController = {
  getAllEvents: async (req: Request, res: Response) => {
    try {
      const events = await services.eventService.getAllEvents();
      
      return res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('Error Fetching Events', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  },
  
  getEventById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Event ID Required'
        });
      }
      
      const event = await services.eventService.getEventById(id);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event Not Found'
        });
      }
      
      //    Private Check
      if (event.eventPrivate) {
        return res.status(403).json({
          success: false,
          message: 'Event Not Available'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('Error Fetching Event By ID : ', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
};