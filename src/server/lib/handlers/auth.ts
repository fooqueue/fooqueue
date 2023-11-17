import type {Request, Response, NextFunction} from 'express';

export default function (API_KEY: string, DEV_MODE: boolean) {
  return async function (req: Request, res: Response, next: NextFunction) {
    if(req.headers['x-fqapi-key'] !== API_KEY && DEV_MODE !== true) {
      return next(new Error('Invalid API key provided!'));
    }
    return next();
  };
}

