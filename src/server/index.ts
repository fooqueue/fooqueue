import app from './server';

//TODO: Set environment varibles.
import {env} from 'node:process';

app(
  env.FQ_API_KEY,
  env.FQ_ENDPOINT,
  env.QUEUE_NAME,
  Number(env.FQ_PORT),
  env.FQ_REDIS_URL || env.REDIS_URL,
  env.CACHE_PREFIX,
  Number(env.CACHE_EXPIRY_SECONDS),
  Number(env.LOW_PRIORITY),
  Number(env.DEFAULT_PRIORITY),
  Number(env.HIGH_PRIORITY),
  env.LOG_LEVEL,
  false //not in dev mode
);