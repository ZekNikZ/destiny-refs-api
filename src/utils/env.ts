import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const ENV_SCHEMA = z.object({
  PORT: z.optional(z.coerce.number()),
  BUNGIE_API_KEY: z.string(),
  REDIS_HOST: z.string(),
});

export type ENV_TYPE = z.TypeOf<typeof ENV_SCHEMA>;

const env = ENV_SCHEMA.parse(process.env);
export default env;
