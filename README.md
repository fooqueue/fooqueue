<a name="readme-top"></a>
<img src="./logo.png" height="100px" align="left" />

# Fooqueue

A simple job queue and background tasks service for SvelteKit apps.

<ol>
    <li><a href="#howitworks">How it works</a></li>
    <li><a href="#getting-started">Getting started</a></li>
    <li><a href="#production">Running in production</a></li>
    <li><a href="#reference">API Reference</a></li>
    <li><a href="#contributing">Issues</a></li>
    <li><a href="#contact">FAQ</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>

<!-- HOW IT WORKS --><a name="howitworks"></a>

## How it works

SvelteKit is designed to support severless deployments, so server-side code can only runs in response to incoming HTTP requests. That means persistant processes (eg: job queues workers) are impossible.

Fooqueue consists of two parts:

1. **Server:** A simple web server (powered by Express) that connects to and manages a Redis job queue (powered by BullMQ). This receives new jobs as HTTP requests from your Sveltekit application, enqueues them, and then sends the jobs via HTTP back to your application (at a specified endpoint). The Fooqueue Server can also be queried to return the status and progress of ongoing jobs, to indicate progress on your client.

2. **Client:** A simple library to make interacting with the Fooqueue server from your Sveltekit app easy.

There's also a very simple CLI for running the Fooqueue Server in development.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED --><a name="getting-started"></a>

## Getting started

Install Fooqueue in your SvelteKit app's folder and start the development server.

```bash
npm install fooqueue
npx fooqueue
```

Fooqueue Server should start in development mode and output values for `FQ_SERVER_ENDPOINTx` and `FQ_API_KEY` to the console.

Copy and paste these to your `.env` file (or wherever you set environment variables in your develpoment environment).

`.env`

```txt
FQ_API_KEY=<UUID>
FQ_SERVER_ENDPOINT=http://localhost:9181
```

**NOTE:** The CLI will always report `FQ_SERVER_URL` as being at `http://localhost:<PORT>`. You can change the default port with `npx fooqueue -p <PORT>`. If your development server is not accessible on `localhost` you will need to specify the environment variable manually.

The next step is to create a new route that contains the work you want to enqueue.

You'll create a route like this for every different type of job you want to enqueue, so it's best to keep them together (eg: in a `/fooqueue/*` folder) to protect them from being invoked by anything other than Fooqueue Server.

`./src/routes/fooqueue/my_first_worker_process/+server.ts`

```ts
export async function post(event: RequestEvent) {
  const { id, data } = await event.request.json();
  console.log(id, data);
  // do something with your data
  return {
    status: 200,
  };
  // no need to return any body or statusText
}
```

Now let's add a quick handler near the top of `hooks.server.ts` to make sure all incoming requests to `/fooqueue/*` endpoints go directly to our routes. We'll also check the api key in the `fq-api-key` to make sure it matches the `FQ_API_KEY` environment variable.

`./src/hooks.server.ts`

```ts
import { FQ_API_KEY } from "$env/static/private";
export async function handle<Handle>({ event, resolve }) {
  if (event.url.pathname.startsWith("/fooqueue")) {
    if (FQ_API_KEY === event.request.headers.get("x-fq-api-key")) {
      const result = await resolve(event);
      return result;
    } else {
      const result = new Response(
        JSON.stringify({ error: "Incorrect API key" }),
        { status: 401 }
      );
      return result;
    }
  }
  //the rest of your hooks.server.ts file...
}
```

Now we need to initialize the client to help us post to the queue. Create it in your `$lib/server` folder so it's easy to import, but can never end up on the client.

`./src/$lib/server/queue.ts`

```ts
import { FQ_SERVER_ENDPOINT, FQ_API_KEY } from "$env/static/private";
import Fooqueue from "fooqueue";
const queue = Fooqueue({
  endpoint: FQ_SERVER_ENDPOINT,
  apiKey: FQ_API_KEY,
});
export default queue;
```

Okay! You can now create enqueued jobs, using the client you just created. It's as simple as importing and using it anywhere on the server side.

`./src/routes/import_csv/+server.ts`

```ts
import queue from "$lib/server/queue";
export async function load(event) {
  const fooqueue_job_id = await queue("/fooqueue/my_first_worker_process", {
    hello: "world",
  });
  return {
    data: fooqueue_job_id,
  };
}
```

And that's it! Restart your Sveltekit app to make sure all the environment variables are properly injected, and invoke the route to enqueue your first job!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- RUNNING IN PRODUCTION --><a name="production"></a>

## Running in production

The easiest way to get started is with Render - and Fooqueue runs fine on the Render's free tier, although the free Redis tier only includes 25mb of memory.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/fooqueue/server)

As part of the deployment process, you will be prompted to set the `FQ_APP_ENDPOINT` environment variable. Set it to the URL of your production Sveltekit app. An API key will be generated and saved as `FQ_API_KEY`. Make sure you set that as an environment variable in your production Sveltekit deployment, too.

If you've got a traditional server (eg: using Sveltekit with `adapter-node`), it can make sense to include Fooqueue in your `docker compose` or k8s deployment. Running Fooqueue Server on the same VPS or VPC as your Sveltekit app might make sense in terms of latency and easy of deploys.

Otherwise, deploying Fooqueue Server should be as simple as deploying any other Express app. Just make sure you've set the correct environment variables and it should all work!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- REFERENCE --><a name="reference"></a>

## Reference

#### CLI flags

You can specify a number of options when starting the development server using `npx fooqueue`.

```bash
npx fooqueue --apiKey <FQ_API_KEY> --endpoint <YOUR_SVELTEKIT_APP_URL> --queueName <QUEUE_NAME> --port <FQ_SERVER_PORT> --redisUrl <REDIS_CONNECTION_STRING> --cachePrefix <REDIS_CACHE_KEY_PREFIX> --logLevel <info|debug|warn|error> --dev
```

#### Client

The client library (`import Fooqueue from 'fooqueue'`) consists of a function which initializes the Fooqueue client helper library and returns an async function that you can use to enqueue requests.

The initializing function accepts options of the `CreateEnqueueOptions` type:

```ts
type CreateEnqueueOptions = {
  apiKey: string;
  endpoint: string;
};
```

That function will return a function with a type signature:

```ts
(route: string, data: unknown, options?: {
  apiKey?: string, //override the API key set in initialization
  endpoint?: string, //override the endpoint set in initalization
  priority?: "low" | "high" | number,
  delay?: number, //job will be delayed in seconds
  jobId?: string, //optionally assign a job id. Must be unique. Otherwise a uuidv4 will be generated.
  repeat?: { //if you want the job to repeat
    pattern?: string, //will be read by cron-parser
    every?: number, //repeat every x seconds
    limit?: number //limit the amount of times the job runs
  }
}): Promise<string>
```

This function returns a promise which resolves to the `job_id` of the enqueued job.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ISSUES --><a name="issues"></a>

## Issues

If you find an issue or bug, please [open a new issue](https://github.com/fooqueue/fooqueue/issues).

Before you do, please follow this checklist:

- Search the existing issues (including closed), to make sure it hasn't been asked and answered before.
- Have a quick read of the Fooqueue source. There's not much code and it's not complicated. Your answer might be there.
- Read the Code of Conduct and Contributor's Guidelines.

You can also open an issue as a feature request.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FAQ --><a name="faq"></a>

## FAQs

#### Is there a hosted/SaaS offering of Fooqueue?

Nope. Fooqueue is 100% open source and self hosted. There are some similar commercial offerings out there (check out [Inngest](https://www.inngest.com/) and [Zeplo](https://www.zeplo.io/)). That being said, deploying to Render is so straightforward that it's not that different to a hosted product in terms of getting up and running.

#### Why should I trust my job queue to a dependency instead of writing it myself?

Of course, you don't have to. That said, Fooqueue aims to be basically what you would write if you were to write it yourself. It's only a few hundred lines of code (and pretty simple code at that!) The only dependencies required by Fooqueue Server are Express and BullMQ. A reasonable Typescript developer should be able to dive into the source code and fully grok it in less than an hour. If you want to fork it and maintain your own fork, it really shouldn't be complicated. Treat it as your own!

#### Can I use Fooqueue on Next.js, Nuxt.js or similar?

For sure! You'll need to hook into Next.js's `middleware` function instead of `hooks.server.ts`. Everything else should be the same.

`middleware.ts`

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/fooqueue")) {
    if (
      request.headers.get("x-fq-api-key") !== process.env.FQ_API_KEY &&
      process.env.NODE_ENV !== "development"
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const response = NextResponse.next();
      return response;
    }
  }
  //the rest of your middleware function...
}
```

#### Do I need to run `npx fooqueue` in a seperate terminal window to my normal `npm run dev`?

Running `npx fooqueue` in a seperate terminal window helps keep your stdout clearly separated. But if you want to run them in the same window, you can do use [Concurrently](https://github.com/kimmobrunfeldt/concurrently) or something similar.

`package.json`

```json
"scripts": {
  "dev": "npx concurrently --raw \"fooqueue\" \"vite dev\"",
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE --><a name="license"></a>

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGEMENTS --><a name="acknowledgements"></a>

## Acknowledgements

There are a number of similar projects that helped inspire some aspects of the design of Fooqueue. [Quirrel](https://quirrel.dev) is another open source job queue solution for serverless apps, with a range of nifty features. [Inngest](https://www.inngest.com/) and [Zeplo](https://www.zeplo.io/) are similar commercial offerings, too.

The Fooqueue server makes heavy use of [BullMQ](https://bullmq.io/) for Redis under the hood.

Bug report and feature request templates were lifted from [Iconic Framework](https://github.com/ionic-team/ionic-framework/).

And thanks to Samuele C. De Tomasi for [@el3um4s/typescript-npm-package-starter](https://www.npmjs.com/package/@el3um4s/typescript-npm-package-starter), which was used as the template for this repo.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
