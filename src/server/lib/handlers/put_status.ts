import type {Request, Response, NextFunction} from 'express';
import {type CacheInterface} from '../utils/cache';

type Body = {
  status?: string | null,
  progress?: number | null,
  data?: Object | null
}

function validate_body(body: Body): Body {
  let status: Body["status"] = null;
  let progress: Body["progress"] = null;
  let data: Body["data"] = null;
  if(body.status && typeof body.status === 'string' && body.status.length < 100) {
    status = body.status;
  }

  if(body.progress) {
    const number = Number(body.progress);
    if(!isNaN(number) || number <= 1 || number >= 0) {
      progress = body.progress;
    }
  }

  if(typeof body?.data == 'object') {
    try {
      JSON.stringify(body.data);
      data = body.data;
    } catch (err) {

    }
  }
  return {status, progress, data}
}

function merge_status(original_status: Body, new_status: Body): Body {
  return {
    status: new_status.status || original_status.status,
    progress: new_status.progress || original_status.progress,
    data: new_status.data || original_status.data
  }
}

export default function (cache: CacheInterface) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const body = validate_body(req.body);
      const uuid = req.params.uuid;
      
      const status = await cache.get(uuid)
      if(!status) return;
      const new_status = merge_status(status, body);
      await cache.set(uuid, new_status);
      return res.status(200).json({...new_status});
    } catch (err) {
      return next(err);
    }
  }
}