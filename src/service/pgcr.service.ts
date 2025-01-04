import * as Bungie from "../bungie/bungie-types";
import redis from "../connectors/redis.client";
import { deserialize, PGCR, serialize } from "../types/pgcr.types";

const BL_DATE = Date.parse("2020-11-10T18:00:00.000Z");
const WQ_DATE = Date.parse("2022-02-22T18:00:00.000Z");

export function parseBungiePGCR(pgcr: Bungie.PGCR): PGCR {
  const timestamp = Date.parse(pgcr.period);

  const playerIdSet = new Set();
  pgcr.entries.forEach((entry) =>
    playerIdSet.add(entry.player.destinyUserInfo.membershipId)
  );
  const uniquePlayerCount = playerIdSet.size;

  return {
    versionCode: 1,
    wasFresh:
      timestamp < BL_DATE
        ? pgcr.startingPhaseIndex === 0
        : timestamp > WQ_DATE
          ? (pgcr.activityWasStartedFromBeginning ?? null)
          : null,
    wasCompleted: pgcr.entries.some(
      (entry) => entry.values?.completed?.basic?.value > 0
    ),
    timestamp,
    instanceId: parseInt(pgcr.activityDetails.instanceId),
    activityHash: pgcr.activityDetails.directorActivityHash,
    uniquePlayerCount,
    players:
      uniquePlayerCount < 20
        ? pgcr.entries.map((entry) => ({
            membershipType: entry.player.destinyUserInfo.membershipType,
            membershipId: parseInt(entry.player.destinyUserInfo.membershipId),
            characterId: parseInt(entry.characterId),
            displayName: entry.player.destinyUserInfo.bungieGlobalDisplayName
              ? entry.player.destinyUserInfo.bungieGlobalDisplayNameCode
                ? `${entry.player.destinyUserInfo.bungieGlobalDisplayName}#${entry.player.destinyUserInfo.bungieGlobalDisplayNameCode.toString().padStart(4, "0")}`
                : entry.player.destinyUserInfo.bungieGlobalDisplayName
              : (entry.player.destinyUserInfo.displayName ?? "N/A"),
            class:
              entry.player.characterClass?.toLowerCase() as PGCR["players"][number]["class"],
            emblemHash: entry.player.emblemHash,
            iconPath: entry.player.destinyUserInfo.iconPath,
            stats: {
              kills: entry.values?.kills?.basic?.value ?? 0,
              assists: entry.values?.assists?.basic?.value ?? 0,
              deaths: entry.values?.deaths?.basic?.value ?? 0,
              completed: entry.values?.completed?.basic?.value > 0,
              timePlayedSeconds:
                entry.values?.timePlayedSeconds?.basic?.value ?? 0,
              precisionKills:
                entry.extended?.values?.precisionKills?.basic?.value ?? 0,
              grenadeKills:
                entry.extended?.values?.grenadeKills?.basic?.value ?? 0,
              meleeKills: entry.extended?.values?.meleeKills?.basic?.value ?? 0,
              superKills: entry.extended?.values?.superKills?.basic?.value ?? 0,
              abilityKills:
                entry.extended?.values?.abilityKills?.basic?.value ?? 0,
            },
          }))
        : [],
  };
}

export async function cachePGCR(instanceId: string | number, pgcr: PGCR) {
  const cacheKey = `pgcr:${instanceId}`;
  await redis.set(cacheKey, serialize(pgcr));
}

export async function getCachedPGCR(
  instanceId: string | number
): Promise<PGCR | null> {
  const cacheKey = `pgcr:${instanceId}`;

  // Attempt to get from cache
  const cachedValue = await redis.get(cacheKey);
  if (cachedValue) {
    return deserialize(cachedValue);
  }

  // If not found, return null
  return null;
}
