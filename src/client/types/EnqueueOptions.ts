export type EnqueueOptions = {
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
}