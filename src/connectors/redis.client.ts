import { createClient } from "redis";
import env from "../utils/env";

const redis = await createClient({
  url: env.REDIS_HOST,
})
  .on("error", (err) => console.error("Redis Client Error", err))
  .on("connect", () => console.log("Connected to Redis!"))
  .connect();

export default redis;
