import type {EnqueueOptions} from './client/types/EnqueueOptions';
export type {EnqueueOptions as EnqueueOptions};
export type {CreateEnqueueOptions as CreateQueueOptions};

type CreateEnqueueOptions = {
  apiKey: string,
  endpoint: string,
}
/**
 * @param {CreateEnqueueOptions} options Optional configuration information. Either devMode must be set to true or apiKey and endpoint must be configured.
 */
export default function (createQueueOptions: CreateEnqueueOptions)
: (endpoint: string, data: unknown, options?: EnqueueOptions | undefined) => Promise<string> {
  if(!createQueueOptions.apiKey) throw new Error("API key must be set");
  if(!createQueueOptions.endpoint) console.warn("Fooqueue Server endpoint must be set");
  
  /**
  * @param {string} route The relative route in your application that Fooqueue will handle the enqueued job. This must accept POST requests. 
  * @param {any} data The data that will be posted to {endpoint}
  * @param {EnqueueOptions | undefined} options Optional configuration information
  */
  return async function (route: string, data: unknown, options?: EnqueueOptions): Promise<string> {
    if(!createQueueOptions.apiKey && !options?.apiKey) throw new Error("API key must always be set");
    if(!createQueueOptions.endpoint && !options?.endpoint) throw new Error("Fooqueue server URL must always be set");

    let priority_endpoint = options?.endpoint || createQueueOptions.endpoint;
    if(priority_endpoint[priority_endpoint.length - 1] === '/') priority_endpoint = priority_endpoint.slice(0, -1);
    const base_url = new URL(priority_endpoint+'/job');
    const url = new URL(base_url.toString().replace(/([^:]\/)\/+/g, "$1"));
    // set the options which are read by the server
    if(options?.priority) url.searchParams.append('priority', options.priority.toString());
    if(options?.delay) url.searchParams.append('delay', options.delay.toString());
    if(options?.jobId) url.searchParams.append('jobId', options.jobId);
    if(options?.repeat?.pattern) url.searchParams.append('cron', options.repeat.pattern);
    if(options?.repeat?.every) url.searchParams.append('every', options.repeat.every?.toString());
    if(options?.repeat?.limit) url.searchParams.append('limit', options.repeat.limit?.toString());


    const body = JSON.stringify({action: route, data: data});
    const send_to_url = url.toString();

    const response = await fetch(url.toString(), {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        'x-fq-api-key': options?.apiKey || createQueueOptions.apiKey
      },
      body: JSON.stringify({
          action: route,
          data: data
      })
      });
    const json = await response.json();
    return json.id;
  };
}