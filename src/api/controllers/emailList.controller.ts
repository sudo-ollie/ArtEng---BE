import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { services } from '../services/container';
import { AuditLevel } from '../../enums/enumsRepo';
import { sanitizeEmailData } from '../utils/sanitizeEmail';
import { ApiError, ErrorCode } from '../utils/errorTypes';

export const EmailListController = {
  validateJoinMailingList: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .isLength({ min: 5, max: 254 })
      .withMessage('Email must be between 5 and 254 characters')
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      .withMessage('Invalid email format')
      .custom((value) => {
        const domain = value.split('@')[1];
        if (!domain || domain.length < 3) {
          throw new Error('Invalid email domain');
        }
        
        const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
        if (disposableDomains.includes(domain.toLowerCase())) {
          throw new Error('Disposable email addresses are not allowed');
        }
        
        return true;
      })
      .escape(),
  ],

  validateLeaveMailingList: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .isLength({ min: 5, max: 254 })
      .withMessage('Email must be between 5 and 254 characters')
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      .withMessage('Invalid email format')
      .escape(),
  ],

  joinMailingList: async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await services.auditLogger.auditLog(
          `ERROR - JoinMailingList validation failed: ${JSON.stringify(errors.array())} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
          AuditLevel.Error,
          'Mailing Service'
        );

        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg
          }))
        });
      }

      const { email } = req.body;

      const emailAttemptKey = `email_join_${email}`;

      await services.auditLogger.auditLog(
        `Mailing list join attempt for email: ${email} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
        AuditLevel.System,
        'Mailing Service'
      );

      const result = await services.mailingList.addToMailingList(email);
      
      if (!result.success) {
        await services.auditLogger.auditLog(
          `Mailing list join failed: ${result.message} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
          AuditLevel.Error,
          'Mailing Service'
        );

        return res.status(400).json(result);
      }

      await services.auditLogger.auditLog(
        `Successfully joined mailing list`,
        AuditLevel.Create,
        'Mailing Service'
      );
      
      return res.status(201).json({
        success: true,
        message: 'Successfully added to mailing list',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed Joining Mailing List:', error);

      await services.auditLogger.auditLog(
        `ERROR - JoinMailingList failed: ${error instanceof Error ? error.message : 'Unknown error'} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
        AuditLevel.Error,
        'Mailing Service'
      );

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  },
  
  leaveMailingList: async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await services.auditLogger.auditLog(
          `ERROR - LeaveMailingList validation failed: ${JSON.stringify(errors.array())} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
          AuditLevel.Error,
          'Mailing Service'
        );

        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg
          }))
        });
      }

      const { email } = req.body;

      await services.auditLogger.auditLog(
        `Mailing list leave attempt for email: ${email} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
        AuditLevel.System,
        'Mailing Service'
      );

      const result = await services.mailingList.removeFromMailingList(email);
      
      if (!result.success) {
        await services.auditLogger.auditLog(
          `Mailing list leave failed: ${result.message} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
          AuditLevel.Error,
          'Mailing Service'
        );

        return res.status(400).json(result);
      }

      await services.auditLogger.auditLog(
        `Successfully left mailing list`,
        AuditLevel.Delete,
        'Mailing Service'
      );
      
      return res.status(200).json({
        success: true,
        message: 'Successfully removed from mailing list',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error Leaving Mailing List:', error);

      await services.auditLogger.auditLog(
        `ERROR - LeaveMailingList failed: ${error instanceof Error ? error.message : 'Unknown error'} | UA : ${req.get('User-Agent')} | IP : ${req.ip}`,
        AuditLevel.Error,
        'Mailing Service'
      );

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
};