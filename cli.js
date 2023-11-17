#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const app = require("./lib/server/server.js");

//TODO: Set environment varibles.
const env = require('node:process').env;

console.log(argv.development)
console.log(argv.dev)
console.log(env.NODE_ENV)

app.default(
  argv.apiKey || argv.key || argv.api || env.FQ_API_KEY,
  argv.endpoint || argv.e || env.FQ_ENDPOINT,
  argv.queueName || argv.q || env.QUEUE_NAME,
  argv.port || argv.p || env.FQ_PORT,
  argv.redisUrl || argv.r || env.FQ_REDIS_URL || env.REDIS_URL,
  argv.cachePrefix || argv.cp || env.CACHE_PREFIX,
  argv.cacheExpiry || argv.ces || env.CACHE_EXPIRY_SECONDS,
  argv.lowPriority || argv.lp || env.LOW_PRIORITY,
  argv.defaultPriority || argv.dp || env.DEFAULT_PRIORITY,
  argv.highPriority || argv.hp || env.HIGH_PRIORITY,
  argv.logLevel || argv.l || env.LOG_LEVEL,
  argv.development || argv.dev || env.NODE_ENV === "development" || false
);

