import Queue, { ProcessCallbackFunction } from "bull";
import env from "../utils/env";
import {
  cachePGCR,
  getCachedPGCR,
  parseBungiePGCR,
} from "../service/pgcr.service";
import { getPostGameCarnageReport } from "../bungie/bungie-api";

interface Job {
  instanceId: string;
}

export const queue = new Queue<Job>("pgcr", env.REDIS_HOST);

const process: ProcessCallbackFunction<Job> = async (job) => {
  const { instanceId } = job.data;

  try {
    let pgcr = await getCachedPGCR(instanceId);
    if (pgcr) {
      return;
    }

    const resp = await getPostGameCarnageReport(instanceId);
    if (!resp.Success) {
      console.error(
        `${instanceId} => ${resp.ErrorCode} ${resp.ErrorStatus} ${resp.Message} ${resp.MessageData}`
      );
      return;
    }

    pgcr = parseBungiePGCR(resp.Response);
    cachePGCR(instanceId, pgcr);

    console.log(
      `${instanceId} => complete | remaining: ~${await queue.count()}`
    );
  } catch (err) {
    console.error(`${instanceId} => ERR ${err}`);
    return;
  }
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
