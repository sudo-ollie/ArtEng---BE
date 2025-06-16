import { body, query, validationResult } from 'express-validator';

export const sanitizeEmailData = (emails: any[]): any[] => {
  return emails.map(email => {
    if (typeof email === 'object' && email !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(email)) {
        if (typeof value === 'string') {
          sanitized[key] = value.trim();
          if (key.toLowerCase().includes('email') && value) {
            sanitized[key] = value.toLowerCase().trim();
          }
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return email;
  });
};

