import { Request, Response, RequestHandler } from 'express';

/**
 * A utility function that ensures proper typing for Express route handlers.
 * This resolves TypeScript type mismatch errors when passing controller methods to router.
 */
export function createHandler(
  handler: (req: Request, res: Response) => Promise<any> | any
): RequestHandler {
  return (req, res, next) => {
    try {
      const result = handler(req, res);
      if (result instanceof Promise) {
        result.catch((err) => next(err));
      }
    } catch (err) {
      next(err);
    }
  };
}