import express, { Application } from "express";
import type {Request, Response} from 'express';
import cors from 'cors';

import auth from './lib/handlers/auth.js';
import put_status from './lib/handlers/put_status.js';
import get_status from './lib/handlers/get_status.js';
import post_job from './lib/handlers/post_job.js';

import worker from './lib/worker.js';

import RedisClient from "./lib/utils/redis.js";
import Cache from './lib/utils/cache.js';
import Log from './lib/utils/log.js';
import Queue from "./lib/utils/queue.js";

export default function (
  API_KEY: string | null,
  ENDPOINT = 'http://localhost:5173',
  QUEUE_NAME = 'fq:jobs',
  PORT = 9181,
  REDIS_URL = 'redis://localhost:6379',
  CACHE_PREFIX = 'fq:cache',
  CACHE_EXPIRY_SECONDS = 3600 * 24,
  LOW_PRIORITY = 1000,
  DEFAULT_PRIORITY = 100,
  HIGH_PRIORITY = 10,
  LOG_LEVEL = 'info',
  DEV_MODE =  false
) {

  if(ENDPOINT[ENDPOINT.length - 1] === '/') ENDPOINT = ENDPOINT.slice(0, -1); //don't accept trailing slash on endpoint;

  if(!API_KEY) throw new Error("Invalid API key provided");

  const log = Log(LOG_LEVEL);
  const redis = RedisClient(REDIS_URL, log);
  const cache = Cache(redis, log, {
    CACHE_EXPIRY_SECONDS: CACHE_EXPIRY_SECONDS,
    CACHE_PREFIX: CACHE_PREFIX
  });
  const queue = Queue(QUEUE_NAME, log, redis);
  const app: Application = express();

  if(DEV_MODE) {
    console.log(`✅ Launching Fooqueue Server in DEVELOPMENT mode for app located at ${ENDPOINT}, with the following variables: 
    FQ_API_KEY=${API_KEY}
    FQ_SERVER_ENDPOINT=http://localhost:${PORT}
    `);
    console.log(`❗️ If you see this message in production you're doing something wrong. Please check the documentation. ❗️`);
  } else {
    console.log(`✅ Launching Fooqueue Server in PRODUCTION mode for app located at ${ENDPOINT}`);
  }

  app
  .use(express.json(), (req, res, next) => {
    return next();
  })
  .get('/job/:uuid/status', cors(), get_status(cache)) //unprotected route
  .use(auth(API_KEY)) //protect all following routes
  .post('/job', express.json(), post_job(queue, cache, log, {
    LOW_PRIORITY, DEFAULT_PRIORITY, HIGH_PRIORITY
  }))
  .put('/job/:uuid/status', express.json(), put_status(cache))
  .all('*', (req, res) => {
    return res.status(404).json({error: "Not found"});
  })
  .use((err: Error, req: Request, res: Response) => {
    log.error(err.stack || 'Unknown error');
    res.status(500).json({error: err.message});
  })
  .listen(PORT, "localhost", async function () {
    await new Promise(r => setTimeout(r, 1000)); //get redis time to connect
    log.debug(`Server is running on port ${PORT}.`);
    worker(QUEUE_NAME, ENDPOINT, API_KEY, redis, cache, log);
  })
  .on("error", (err: {code?: string, message?: string}) => {
    if (err.code && err.code === "EADDRINUSE") {
      log.error("Error: address already in use");
    } else {
      log.error(err.message || "Unknonw error");
    }
  });

  return app;
}
