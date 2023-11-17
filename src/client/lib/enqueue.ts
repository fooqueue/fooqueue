
import type {EnqueueOptions} from '../types/EnqueueOptions';

type CreateEnqueueOptions = {
  apiKey?: string,
  devMode?:boolean,
  endpoint?: string,
}
/**
 * @param {CreateEnqueueOptions} options Optional configuration information. Either devMode must be set to true or apiKey and endpoint must be configured.
 */
export function CreateQueue (createQueueOptions: CreateEnqueueOptions = {
  apiKey: "UNSAFE_DO_NOT_USE_IN_PRODUCTION",
  devMode: false,
  endpoint: 'http://localhost:9181'
}): (endpoint: string, data: unknown, options: EnqueueOptions) => Promise<string> {
  if(createQueueOptions.apiKey === "UNSAFE_DO_NOT_USE_IN_PRODUCTION" && createQueueOptions.devMode !== true) throw new Error("API key must be set if not in Dev Mode");
  if(createQueueOptions.endpoint === "http://localhost:9181" && createQueueOptions.devMode !== true) console.warn("You are using the default endpoint variables but not running in Dev Mode. That's probably an error. Check the docs for more information");
  
  /**
  * @param {string} route The relative route in your application that Fooqueue will handle the enqueued job. This must accept POST requests. 
  * @param {any} data The data that will be posted to {endpoint}
  * @param {EnqueueOptions} options Optional configuration information
  */
  return async function (route: string, data: unknown, options: EnqueueOptions = {}): Promise<string> {
    if(!createQueueOptions.apiKey) throw new Error("Some API key must always be set");
    if(!createQueueOptions.endpoint) throw new Error("Some Fooqueue server URL must always be set");

    const base_url = new URL(createQueueOptions.endpoint+'/job');
    const url = new URL(base_url.toString().replace(/([^:]\/)\/+/g, "$1"));
    // set the options which are read by the server
    if(options.priority) url.searchParams.append('priority', options.priority.toString());
    if(options.delay) url.searchParams.append('delay', options.delay.toString());
    if(options.jobId) url.searchParams.append('jobId', options.jobId);
    if(options.repeat?.pattern) url.searchParams.append('cron', options.repeat.pattern);
    if(options.repeat?.every) url.searchParams.append('every', options.repeat.every?.toString());
    if(options.repeat?.limit) url.searchParams.append('limit', options.repeat.limit?.toString());


    const body = JSON.stringify({action: route, data: data});
    const send_to_url = url.toString();

    const response = await fetch(url.toString(), {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        'x-fqapi-key': options.api_key || createQueueOptions.apiKey
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