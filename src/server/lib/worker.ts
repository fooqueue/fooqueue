import { Worker, Job, type RedisClient } from 'bullmq';

import type {CacheInterface} from './utils/cache';

import {env} from 'node:process';
import type { LogInterface } from './utils/log';

const KEEP_COMPLETE_AGE: number = Number(env.KEEP_COMPLETE_AGE) || 3600; //1 hour
const KEEP_FAIL_AGE: number = Number(env.KEEP_FAIL_AGE) || 24 * 3600; //24 hours
const KEEP_COMPLETE_COUNT: number = Number(env.KEEP_COMPLETE_COUNT) || 25;
const KEEP_FAIL_COUNT: number = Number(env.KEEP_FAIL_COUNT) || 100;

export default async function (QUEUE_NAME: string, ENDPOINT: string, API_KEY: string, redis: RedisClient, cache: CacheInterface, log: LogInterface): Promise<Worker> {
  log.info(`Creating worker for queue ${QUEUE_NAME}`);
  const worker = new Worker(QUEUE_NAME, async (job: Job) => {
    const id = job.name;
    const action = job.data.action;
    const data = job.data.data;

    log.info(`Incoming job with id ${id}`);
  
    await cache.set(id, {status: 'processing'});
  
    const response = await fetch(ENDPOINT + action, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        'x-fq-api-key': API_KEY
      },
      body: JSON.stringify({
        id, data
      })
    });
    if(!response.ok) {
      try {
        const error = await response.json();
        await cache.set(id, {status: 'failed', outcome: {status: response.status, error: error}});
      } catch (err) {
        await cache.set(id, {status: 'failed', outcome: {error: `Handler returned an unknown error with status ${response.status}`}});
      }
      throw new Error(`Endpoint for job with id ${id} returned an Error ${response.status}. Marking as failed`);      
    }
    const result = await response.json();
    await cache.set(id, {status: 'complete', outcome: result});
    log.info(`Completed job with id ${id}`);
    
  }, {
    connection: redis, 
    concurrency: 10, 
    removeOnComplete: {
      count: KEEP_COMPLETE_COUNT, 
      age: KEEP_COMPLETE_AGE
    }, 
    removeOnFail: {
      count: KEEP_FAIL_COUNT, 
      age: KEEP_FAIL_AGE
    }
  });
  log.debug(`Started worker`);
  return worker;
}

