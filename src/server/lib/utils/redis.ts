import {Redis} from 'ioredis';
import type { LogInterface } from './log';

export default function (REDIS_URL: string, log: LogInterface) {
  if(!REDIS_URL) throw Error('Redis URL is required to connect to redis.');
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 0
  });
  client.on('connecting', () => log.info('Connecting to Redis'));
  client.on('connect', () => log.info('Connected to Redis'));
  client.on('ready', () => log.info('Redis ready'));
  return client;
}