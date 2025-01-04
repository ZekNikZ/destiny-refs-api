import throttledQueue from "throttled-queue";
import env from "../utils/env";
import {
  ActivityHistory,
  BungieApiOptions,
  BungieResponse,
  PGCR,
  UserProfile,
} from "./bungie-types";

const throttle = throttledQueue(30, 10);

export async function fetchBungie<T>(
  url: string,
  options?: BungieApiOptions
): Promise<BungieResponse<T>> {
  const baseUrl = options?.statsUrl
    ? "https://stats.bungie.net"
    : "https://www.bungie.net";

  if (options?.includeApiKey) {
    options.headers = {
      ...options.headers,
      "X-API-Key": env.BUNGIE_API_KEY,
    };
  }

  const fetcher = () => fetch(`${baseUrl}${url}`, options);

  const response = await (options?.throttled ? throttle(fetcher) : fetcher());
  if (!response.ok) {
    return {
      Success: false,
      ErrorCode: 0,
      ThrottleSeconds: 0,
      ErrorStatus: "Connection Error",
      Message: "Cannot connect to Bungie API",
      MessageData: {},
    };
  }

  const json: BungieResponse<T> = await response.json();
  json.Success = json.ErrorCode === 1;
  return json;
}

export async function getUserProfile(
  membershipType: number,
  membershipId: number
) {
  return await fetchBungie<UserProfile>(
    `/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100,200,204`,
    {
      includeApiKey: true,
      statsUrl: true,
      throttled: true,
    }
  );
}

export async function getActivityHistory(
  membershipType: number | string,
  membershipId: number | string,
  characterId: number | string,
  page: number = 0,
  modes: string = "raid",
  count: number = 250
) {
  return await fetchBungie<ActivityHistory>(
    `/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?count=${count}&page=${page}&mode=${modes}`,
    {
      includeApiKey: true,
      statsUrl: true,
      throttled: true,
    }
  );
}

export async function getPostGameCarnageReport(instanceId: number | string) {
  return fetchBungie<PGCR>(
    `/Platform/Destiny2/Stats/PostGameCarnageReport/${instanceId}`,
    {
      includeApiKey: true,
      statsUrl: true,
    }
  );
}
