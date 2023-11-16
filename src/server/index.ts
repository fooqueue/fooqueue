import app from './server';

//TODO: Set environment varibles.
const env = require('node:process').env;

app(
  env.FQ_API_KEY,
  env.FQ_ENDPOINT,
  env.QUEUE_NAME,
  env.FQ_PORT,
  env.FQ_REDIS_URL || env.REDIS_URL,
  env.CACHE_PREFIX,
  env.CACHE_EXPIRY_SECONDS,
  env.LOW_PRIORITY,
  env.DEFAULT_PRIORITY,
  env.HIGH_PRIORITY,
  env.LOG_LEVEL,
  false //not in dev mode
);