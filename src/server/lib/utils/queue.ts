import { Queue, RedisClient } from 'bullmq';
import type { LogInterface } from '../utils/log.js';

export default function queue (queue_name: string, log: LogInterface, client: RedisClient): Queue {
  if(!queue_name) throw new Error("Queue name must be set in config for queue connection to be created");
  const queue = new Queue(queue_name, {connection: client});
  log.info(`Queue instance with name ${queue_name} has been created`);
  return queue;  
}

