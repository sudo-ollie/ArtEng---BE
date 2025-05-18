import { Request, Response } from 'express';
import { services } from '../services/container';

export const EmailListController = {
  joinMailingList: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid Email Provided'
        });
      }
      
      const result = await services.mailingList.addToMailingList(email);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('Failed Joining Mailing List : ', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  },
  
  leaveMailingList: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid Email Provided'
        });
      }
      
      const result = await services.mailingList.removeFromMailingList(email);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error Leaving Mailing List : ', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
};