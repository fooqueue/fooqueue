import express, { Application } from "express";
import type {Request, Response, NextFunction} from 'express';

import auth from './lib/handlers/auth';
import put_status from './lib/handlers/put_status';
import get_status from './lib/handlers/get_status';
import post_job from './lib/handlers/post_job';

import worker from './lib/worker';
import { randomUUID } from "crypto";

import RedisClient from "./lib/utils/redis";
import Cache from './lib/utils/cache';
import Log from './lib/utils/log';
import Queue from "./lib/utils/queue";

export default function (
  API_KEY: string = 'UNSAFE_DO_NOT_USE_IN_PRODUCTION',
  ENDPOINT: string = 'http://localhost:3000',
  QUEUE_NAME: string = 'fq:jobs',
  PORT: number = 3003,
  REDIS_URL: string = 'redis://localhost:6379',
  CACHE_PREFIX: string = 'fq:cache',
  CACHE_EXPIRY_SECONDS: number = 3600 * 24,
  LOW_PRIORITY: number = 1000,
  DEFAULT_PRIORITY: number = 1000,
  HIGH_PRIORITY: number = 10,
  LOG_LEVEL: "info" | "debug" | "warn" | "error" = "info",
  DEV_MODE: boolean =  false
) {

  

  const log = Log(LOG_LEVEL);
  const redis = RedisClient(REDIS_URL, log);
  const cache = Cache(redis, log, {
    CACHE_EXPIRY_SECONDS: CACHE_EXPIRY_SECONDS,
    CACHE_PREFIX: CACHE_PREFIX
  })
  const queue = Queue(QUEUE_NAME, log, redis);
  const app: Application = express();

  if(API_KEY === 'UNSAFE_DO_NOT_USE_IN_PRODUCTION' && DEV_MODE !== true) {
    throw new Error("API key has not been changed from unsafe default. This only works when NODE_ENV=development or when the cli is invoked with the --dev flag");
  }
  if(API_KEY === 'UNSAFE_DO_NOT_USE_IN_PRODUCTION') log.warn('Using development API key: Unsafe for any prodution environment');

  app
  .get('/job/:uuid/status', get_status(cache)) //unprotected route
  .use(auth(API_KEY, DEV_MODE)) //protect all following routes
  .post('/job', express.json(), post_job(queue, cache, log, {
    LOW_PRIORITY, DEFAULT_PRIORITY, HIGH_PRIORITY
  }))
  .put('/job/:uuid/status', express.json(), put_status(cache))
  .all('*', (req, res, next) => {
    return res.status(404).json({error: "Not found"});
  })
  .use((err: Error, req: Request, res: Response, next: NextFunction) => {
    log.error(err.stack || 'Unknown error');
    res.status(500).json({error: err.message})
  })
  .listen(PORT, "localhost", async function () {
    await new Promise(r => setTimeout(r, 1000)); //get redis time to connect
    log.info(`Server is running on port ${PORT}.`);
    worker(QUEUE_NAME, ENDPOINT, API_KEY, redis, cache, log);
  })
  .on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      log.error("Error: address already in use");
    } else {
      log.error(err);
    }
  });

  return app;
}
