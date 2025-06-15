import { ParsedQs } from 'qs';
import { AuditLevel } from '../../enums/enumsRepo';

/**
 * Sanitization utilities for input validation and cleaning
 */

//  Repository Methods (simple types)
export const sanitizeStringSimple = (input: string | undefined): string => {
  if (!input) return '';
  return input.toString().trim().replace(/[<>]/g, '');
};

export const sanitizeNumberSimple = (input: string | number | undefined, defaultValue: number = 0): number => {
  if (input === undefined || input === null) return defaultValue;
  const num = typeof input === 'string' ? parseInt(input, 10) : Number(input);
  return isNaN(num) ? defaultValue : Math.max(0, num);
};

//  Express Controller Methods (Express query parameter types)
export const sanitizeString = (input: string | ParsedQs | (string | ParsedQs)[] | undefined): string => {
  if (!input) return '';
  if (Array.isArray(input)) return input[0]?.toString().trim().replace(/[<>]/g, '') || '';
  if (typeof input === 'object') return '';
  return input.toString().trim().replace(/[<>]/g, '');
};

export const sanitizeNumber = (input: string | ParsedQs | (string | ParsedQs)[] | undefined, defaultValue: number = 0): number => {
  if (input === undefined || input === null) return defaultValue;
  if (Array.isArray(input)) input = input[0];
  if (typeof input === 'object') return defaultValue;
  const num = typeof input === 'string' ? parseInt(input, 10) : Number(input);
  return isNaN(num) ? defaultValue : Math.max(0, num);
};

export const sanitizeSort = (input: string | ParsedQs | (string | ParsedQs)[] | undefined): 'asc' | 'desc' => {
  if (Array.isArray(input)) input = input[0];
  if (typeof input === 'object') return 'desc';
  return input === 'asc' ? 'asc' : 'desc';
};

export const sanitizeDate = (input: string | ParsedQs | (string | ParsedQs)[] | undefined): Date | undefined => {
  if (!input) return undefined;
  if (Array.isArray(input)) input = input[0];
  if (typeof input === 'object') return undefined;
  const date = new Date(input.toString());
  return isNaN(date.getTime()) ? undefined : date;
};

export const sanitizeActionTypes = (input: string | ParsedQs | (string | ParsedQs)[] | undefined): AuditLevel[] | undefined => {
  if (!input) return undefined;
  
  let types: (string | ParsedQs)[];
  if (Array.isArray(input)) {
    types = input;
  } else {
    types = [input];
  }
  
  const validTypes = types
    .filter(type => typeof type === 'string' || typeof type === 'number')
    .map(type => parseInt(type.toString(), 10))
    .filter(type => !isNaN(type) && Object.values(AuditLevel).includes(type));
  
  return validTypes.length > 0 ? validTypes : undefined;
};

// Utility to clean object properties of undefined values
export const removeUndefinedProperties = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== '' && obj[key] !== null) {
      cleaned[key as keyof T] = obj[key];
    }
  });
  return cleaned;
};