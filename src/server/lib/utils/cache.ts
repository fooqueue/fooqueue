import type {Redis} from 'ioredis';
import {type LogInterface } from './log';

export type CacheConfig = {
  CACHE_PREFIX: string,
  CACHE_EXPIRY_SECONDS: number
}

export type CacheInterface = {
  set: (key: string, data: any, ttl?: number) => Promise<void>,
  get: (key: string) => Promise<any>,
  del: (key: string) => Promise<void>,
}

export default function (redis: Redis, log: LogInterface, config: CacheConfig) {

  return {
    set: async (key: string, data: any, ttl: number = config.CACHE_EXPIRY_SECONDS): Promise<void> => {
      await redis.set(config.CACHE_PREFIX+':'+key, JSON.stringify(data));
      await redis.expire(config.CACHE_PREFIX+':'+key, ttl);
      log.info(`Set ${key} in cache. Set to expire in ${ttl} seconds`);
    },
    get: async (key: string): Promise<any> => {
      const value = await redis.get(config.CACHE_PREFIX+':'+key)
      if(!value) throw new Error('Value at '+key+' was null');
      log.info(`Got ${key} in cache`);
      return JSON.parse(value);
    },
    del: async (key: string): Promise<void> => {
      await redis.del(config.CACHE_PREFIX+':'+key);
      log.info(`Deleted ${key} in cache`);
    }
    

  }

}
