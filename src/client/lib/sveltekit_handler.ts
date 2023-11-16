import type { RequestEvent } from "../types/SvelteRequestEvent";
export type MaybePromise<T> = T | Promise<T>;

type ResolveHandler = (request: RequestEvent, options?: undefined) => MaybePromise<Response>
/**
 * @param {string} fooqueueApiKey The API key of your Fooqueue server, normally set using the FQ_API_KEY env var. 
 * @param {RequestEvent} event The Sveltekit hooks.server.ts event 
 * @param {ResolveHandler} resolve The Sveltekit hooks.server.ts resolve event
 */
import {env} from 'node:process';
export default async function FooQueueSveltekitHandler (event: RequestEvent, resolve: ResolveHandler, FQ_API_KEY: string = 'UNSAFE_DO_NOT_USE_IN_PRODUCTION'): Promise<Response> {
  if(env.NODE_ENV !== 'development' && FQ_API_KEY === 'UNSAFE_DO_NOT_USE_IN_PRODUCTION') throw new Error('Unsafe: NODE_ENV is not set to development, and you are using the default API key');
  if(event.request.headers.get('x-fq-api-key') === FQ_API_KEY) {
    const result = await resolve(event);
    return result;
  } else {
    const result = new Response(JSON.stringify({error: "Incorrect API key"}), {status: 401});
    return result;
  }
}