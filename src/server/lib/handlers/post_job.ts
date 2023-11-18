import type {Request, Response, NextFunction} from 'express';
import type { Queue } from 'bullmq';

import { randomUUID } from 'crypto';
import { CacheInterface } from '../utils/cache';

import {type LogInterface} from '../utils/log';


type PostJobConfig = {
  HIGH_PRIORITY: number,
  DEFAULT_PRIORITY: number,
  LOW_PRIORITY: number
}

type Body = {
  action?: string | null,
  data?: unknown | null
}

type JobOptions = {
  priority: number,
  delay?: number,
  jobId: string,
  repeat?: {
    pattern?: string,
    every?: number,
    limit?: number
  }
}

function build_options(query: Request["query"], uuid: string, config: PostJobConfig): JobOptions {
  //priority
  const options: JobOptions = {jobId: uuid, priority: config.DEFAULT_PRIORITY};
  if(query.priority === 'high') options.priority = config.HIGH_PRIORITY;
  if(query.priority === 'low') options.priority = config.LOW_PRIORITY;
  if(!isNaN(Number(query.priority))) options.priority = Number(query.priority);
  //delay
  if(!isNaN(Number(query.delay))) options.delay = Number(query.delay);
  //repeat
  const cron_validation_regexp = new RegExp(/^(\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?(1?[0-9]|2[0-3]))) (\*|((\*\/)?([1-9]|[12][0-9]|3[0-1]))) (\*|((\*\/)?([1-9]|1[0-2]))) (\*|((\*\/)?[0-6]))$/);
  if(query.cron && typeof query.cron === 'string') {
    if(cron_validation_regexp.test(query.cron)) options.repeat = { pattern: query.cron };
  }
  if(!isNaN(Number(query.every))) {
    if(!options.repeat) {
      options.repeat = {every: Number(query.every)};
    } else {
      options.repeat.every = Number(query.every);
    }
  }
  if(!isNaN(Number(query.limit))) {
    if(!options.repeat) {
      options.repeat = {limit: Number(query.limit)};
    } else {
      options.repeat.limit = Number(query.limit);
    }
  }
  if(typeof query.jobId === 'string' && query.jobId?.length > 0) options.jobId = query.jobId;
  
  return options;

}

function validate_body(body: Body): Body {
  let action: Body["action"] = null;
  let data: Body["data"] = null;
  if(body.action && typeof body.action === 'string' && body.action.length < 1000) {
    action = body.action;
  }
  if(!action) throw Error("Name is a required parameter for new jobs");

  if(typeof body?.data == 'object') {
    try {
      JSON.stringify(body.data);
      data = body.data;
    } catch (err) {
      data = {};
    }
  }
  return {action, data};
}

export default function (queue: Queue, cache: CacheInterface, log: LogInterface, config: PostJobConfig): (req: Request, res: Response, next: NextFunction) => void {

  return async function (req: Request, res: Response, next: NextFunction) {
    try {

      //validate body... 
      const body = validate_body(req.body);
      const uuid = randomUUID();

      const options = build_options(req.query, uuid, config);

      console.log(options);
    
      await queue.add(uuid, body, options);
      log.debug(`Added item to ${queue.name} queue with ID ${uuid}`);
    
      await cache.set(uuid, {
        status: 'queued',
        progress: 0,
        data: null
      });
    
      return res.status(202).json({id: uuid});
    } catch (err) {
      return next(err);
    }
  
  
  };
}

