import Queue, { ProcessCallbackFunction } from "bull";
import env from "../utils/env";

interface Job {
  instanceId: string;
}

const queue = new Queue<Job>("pgcr", env.REDIS_HOST);

const process: ProcessCallbackFunction<Job> = async (job) => {
  const { instanceId } = job.data;
};

export function start(count?: number) {
  if (count) {
    queue.process(count, process);
  } else {
    queue.process(process);
  }
}

export function enqueue(job: Job) {
  return queue.add(job);
}
