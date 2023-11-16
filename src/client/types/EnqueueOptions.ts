export type EnqueueOptions = {
  api_key?: string,
  fq_endpoint?: string,
  priority?: "low" | "high" | number,
  delay?: number,
  jobId?: string,
  repeat?: {
    pattern?: string,
    every?: number,
    limit?: number
  }
}