
import {env} from 'node:process';
import type {EnqueueOptions} from '../types/EnqueueOptions';
/**
 * @param {string} endpoint The relative endpoint in your application that Fooqueue will handle the enqueued job. This must accept POST requests. 
 * @param {any} data The data that will be posted to {endpoint}
 * @param {EnqueueOptions} options Optional configuration information
 */
export default async function (endpoint: string, data: unknown, options: EnqueueOptions = {}): Promise<string> {
  const API_KEY: string = options.api_key || env.FQ_API_KEY || "UNSAFE_DO_NOT_USE_IN_PRODUCTION";
  if(API_KEY === 'UNSAFE_DO_NOT_USE_IN_PRODUCTION' && env.NODE_ENV !== 'development') throw new Error("Environment variable FQ_API_KEY must be set or api_key must be passed to options");

  const FQ_ENDPOINT: string = options.fq_endpoint || env.FQ_ENDPOINT || 'http://localhost:9181';
  if(FQ_ENDPOINT === 'http://localhost:9181' && env.NODE_ENV !== 'development') console.warn(`The Fooqueue server URL is set to ${FQ_ENDPOINT}, even though NODE_ENV is not "development". If you are running in a production environment, you may not be able to make requests to a local network`);

  const base_url = new URL(FQ_ENDPOINT+endpoint);
  const url = new URL(base_url.toString().replace(/([^:]\/)\/+/g, "$1"));
  // set the options which are read by the server
  if(options.priority) url.searchParams.append('priority', options.priority.toString());
  if(options.delay) url.searchParams.append('delay', options.delay.toString());
  if(options.jobId) url.searchParams.append('jobId', options.jobId);
  if(options.repeat?.pattern) url.searchParams.append('cron', options.repeat.pattern);
  if(options.repeat?.every) url.searchParams.append('every', options.repeat.every?.toString());
  if(options.repeat?.limit) url.searchParams.append('limit', options.repeat.limit?.toString());

  const response = await fetch(url.toString(), {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'x-fqapi-key': API_KEY
    },
    body: JSON.stringify({
        action: endpoint,
        data: data
    })
    });
  const json = await response.json();
  return json.id;
}