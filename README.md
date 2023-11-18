<a name="readme-top"></a>
<img src="./logo.png" height="100px" align="left" />

# Fooqueue

A simple job queue service for SvelteKit.

<ol>
    <li><a href="#getting-started">Getting started</a></li>
    <li><a href="#howitworks">How it works</a></li>
    <li><a href="#production">Running in production</a></li>
    <li><a href="#reference">API Reference</a></li>
    <li><a href="#contributing">Issues</a></li>
    <li><a href="#contact">FAQ</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>

<!-- GETTING STARTED --><a name="getting-started"></a>

## Getting started

Install Fooqueue in your SvelteKit app's folder and start the development server.

```bash
npm install fooqueue
npx fooqueue
```

Fooqueue Server should start in development mode and output an FQ_SERVER_URL and FQ_API_KEY to the console.

Copy and paste these to your `.env` file (or wherever you set environment variables in your develpoment environment).

`.env`

```txt
FQ_SERVER_URL=http://localhost:9181
FQ_API_KEY=<UUID>
```

The `FQ_SERVER_URL` will report the correct port, but it will always assume that it is running at `http://localhost:<PORT>`. If you wish to access it via a different URL you will need to configure it manually.

Now, create a new route that contains the work you want to enqueue. You'll create a route like this for every different type of job you want to enqueue, so it's best to keep them together (eg: in a `/fooqueue/*` folder) to protect them from being invoked by anything other than Fooqueue Server.

`./src/routes/fooqueue/my_route_name`

```ts
export async function post(event: RequestEvent) {
  const { id, data } = await event.request.json();
  console.log(id, data);
  // do something...
  return {
    status: 200,
  };
  // no need to return any body or statusText
}
```

Now let's add a quick handler near the top of `hooks.server.ts` to make sure all incoming requests to `/fooqueue/*` endpoints go directly to our routes. We'll also check the api key in the `fq-api-key` to make sure it matches the `FQ_API_KEY` environment variable.

`hooks.server.ts`

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
  //the rest of your hook...
}
```

Now we need to create the our client to help us post to the queue. Create it in your `$lib/server` folder so it's easy to import, but can never end up on the client.

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

./src/routes/import_csv/+server.ts

```ts
import queue from "$lib/server/queue";

export async function load(event) {
  const fooqueue_job_id = await queue("/fooqueue/my_route_name", {
    hello: "world",
  });
  return {
    data: fooqueue_job_id,
  };
}
```

And that's it! Restart your Sveltekit app to make sure all the environment variables are properly injected, and invoke the route to enqueue your first job!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- HOW IT WORKS --><a name="howitworks"></a>

## How it works

SvelteKit is designed to support severless deployments. That means that server side code only runs in response to incoming HTTP requests. This makes persistent serverside connections to external services (such as a job queue) impossible.

Fooqueue consists of two parts:

1. **Server:** A simple web server (powered by Express) that connects to and manages a Redis job queue (powered by BullMQ). This receives new jobs as HTTP requests from your Sveltekit application, enqueues them, and then sends the jobs via HTTP back to your application (at a specific endpoint). The Fooqueue server can also be queried to return the status and progress of ongoing jobs.

2. **Client:** A simple library to make interacting with the Fooqueue server from your Sveltekit app easy.

There's also a very simple CLI that you can use to run the Fooqueue server in development mode.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- RUNNING IN PRODUCTION --><a name="production"></a>

## Running in production

The easiest way to get started is with Render - and Fooqueue runs fine on the Render's free tier.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/fooqueue/server)

As part of the deployment process, you will be prompted to set the `FQ_ENDPOINT` environment variable. Set it to your production Sveltekit app. An API key will be generated and saved as `FQ_API_KEY`. Make sure you set that as an environment variable in your production Sveltekit deployment, too.

If you've got a traditional server (eg: using Sveltekit with `adapter-node`), it can make sense to include Fooqueue in your `docker compose` or k8s deployment. This means you can have Fooqueue server running on the same VPS as your Sveltekit deployment, and can save extra latency on the HTTP round trips.

Otherwise, deploying Fooqueue server should be as simple as deploying any other Express app. Just make sure you've set the correct environment variables and it should all work!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- API REFERENCE --><a name="reference"></a>

## API reference

#### FooqueueSveltekitHandler

A function to route incoming requests from Fooqueue server directly to the handler route in Sveltekit, while checking that the API key provided in the incoming headers (`x-fq-api-key`) matches the FQ_API_KEY environment variable.

Throws an error if the NODE_ENV is not set to development, and returns a 401 response.

```ts
FooqueueSveltekitHandler(event: RequestEvent, resolve: ResolveHandler, FQ_API_KEY?: string): Promise<Response>
```

### enqueue

A function which sends a requst to the Fooqueue server.

```ts
export default async function (
  endpoint: string,
  data: any,
  options: EnqueueOptions = {}
): Promise<string>;
```

```ts
export type EnqueueOptions = {
  api_key?: string;
  fq_endpoint?: string;
  priority?: "low" | "high" | number;
  delay?: number;
  jobId?: string;
  repeat?: {
    pattern?: string;
    every?: number;
    limit?: number;
  };
};
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ISSUES --><a name="issues"></a>

## Issues

If you find an issue or bug, please [open a new issue](https://github.com/fooqueue/fooqueue/issues).

Before you do, please follow this checklist:

- [] Search the existing issues (including closed), to make sure it hasn't been asked and answered before.
- [] Have a quick read of the Fooqueue source. There's not much code and it's not complicated. Your answer might be there.
- [] Read the Code of Conduct and Contributor's Guidelines.

You can also open an issue as a feature request.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FAQ --><a name="faq"></a>

## FAQs

#### Can I use Fooqueue on Next.js, Nuxt.js or similar?

For sure! You'll need to replace `FooqueueSveltekitHandler()` with something to hook into Next.js's `middleware` in order to check the API token when running in production.

middleware.ts

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
