import type {Request, Response, NextFunction} from 'express';

export default function (API_KEY: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    if(req.headers['x-fq-api-key'] !== API_KEY) {
      return next(new Error('Invalid API key provided!'));
    }
    return next();
  };
}

