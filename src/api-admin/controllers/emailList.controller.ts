import { Request, Response } from 'express';
import { services } from '../../api/services/container';

export const AdminEmailListController = {
  getAllMailingList: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await services.mailingList.getAllMailingList(page, limit);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting mailing list:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  exportMailingList: async (req: Request, res: Response) => {
    try {
      const emails = await services.mailingList.exportMailingList();
      
      return res.status(200).json({
        success: true,
        data: emails
      });
    } catch (error) {
      console.error('Error exporting mailing list:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};