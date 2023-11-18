#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const app = require("./lib/server/server.js");
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

ensureDirectoryExistence('./lib/dev/DEV_API_KEY.txt');

let API_KEY = null;
try {
  const buffer = fs.readFileSync('./lib/dev/DEV_API_KEY.txt');
  API_KEY = buffer.toString('utf8')
} catch (err) {
  if(!API_KEY) {
    try {
      const uuid = crypto.randomUUID();
      fs.writeFileSync('./lib/dev/DEV_API_KEY.txt', uuid, 'utf8');
      API_KEY = uuid;
    } catch (err) {
      console.error("Error writing dev API key to file. Please check all environment vars and confirm that the correct API key is set.")
    }
  }
}


const env = require('node:process').env;
app.default(
  argv.apiKey || argv.key || argv.api || env.FQ_API_KEY || API_KEY,
  argv.endpoint || argv.e || env.FQ_ENDPOINT || 'http://localhost:5173',
  argv.queueName || argv.q || env.QUEUE_NAME || 'fq:jobs',
  argv.port || argv.p || env.FQ_PORT || 9181,
  argv.redisUrl || argv.r || env.FQ_REDIS_URL || 'redis://localhost:6379',
  argv.cachePrefix || argv.cp || env.CACHE_PREFIX || 'fq:cache',
  argv.cacheExpiry || argv.ces || env.CACHE_EXPIRY_SECONDS || 3600 * 24,
  argv.lowPriority || argv.lp || env.LOW_PRIORITY || 1000,
  argv.defaultPriority || argv.dp || env.DEFAULT_PRIORITY || 100,
  argv.highPriority || argv.hp || env.HIGH_PRIORITY || 10,
  argv.logLevel || argv.l || env.LOG_LEVEL || 'debug',
  argv.development || argv.dev || env.NODE_ENV === "development" || true
);

