import type {Request, Response, NextFunction} from 'express';
import type {CacheInterface} from '../utils/cache';

export default function (cache: CacheInterface) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<Response> {

    const uuid = req.params.uuid;
  
    const status = await cache.get(uuid);
  
    return res.status(202).json(status);
  }
}

