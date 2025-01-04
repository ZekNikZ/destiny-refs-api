import { Router, Response } from "express";
import { z } from "zod";
import { validateRequestParams } from "zod-express-middleware";
import {
  cachePGCR,
  getCachedPGCR,
  parseBungiePGCR,
} from "../service/pgcr.service";
import {
  getActivityHistory,
  getPostGameCarnageReport,
  getUserProfile,
} from "../bungie/bungie-api";
import { enqueue, queue } from "../queue/pgcr.queue";

const router = Router();

type RaidStatsResponse =
  | { status: "error"; message: string }
  | { status: "queued"; missingCount: number; estimatedTime: number }
  | { status: "complete"; result: any };

router.get(
  "/stats/:membershipType/:membershipId",
  validateRequestParams(
    z.object({
      membershipType: z.coerce.number(),
      membershipId: z.coerce.number(),
    })
  ),
  async (req, res: Response<RaidStatsResponse>) => {
    const { membershipType, membershipId } = req.params;

    try {
      // Get user profile (characters)
      const userProfile = await getUserProfile(membershipType, membershipId);
      if (!userProfile.Success) {
        res.status(500).json({
          status: "error",
          message: "Failed to find user data",
        });
        return;
      }

      // Get activity history for each character
      const allActivities = await Promise.all(
        Object.values(userProfile.Response.characters.data).map(
          async (character) => {
            const result = [];

            let shouldContinue = false;
            let page = 0;
            do {
              shouldContinue = false;
              const activityHistory = await getActivityHistory(
                membershipType,
                membershipId,
                character.characterId,
                page,
                "raid"
              );
              if (!activityHistory.Success) {
                res.status(500).json({
                  status: "error",
                  message: "Failed to fetch activity history",
                });
                break;
              }

              result.push(...activityHistory.Response.activities);

              if (activityHistory.Response.activities.length === 250) {
                ++page;
                shouldContinue = true;
              }
            } while (shouldContinue);

            return result;
          }
        )
      ).then((x) => x.flat());

      // Get instances from cache
      const instanceIds = allActivities.map(
        (activity) => activity.activityDetails.instanceId
      );
      const instances = Object.fromEntries(
        await Promise.all(
          instanceIds.map(async (id) => [id, await getCachedPGCR(id)] as const)
        )
      );

      // Enqueue missing entries
      const missingEntries = Object.entries(instances).filter(
        ([, instance]) => instance === null
      );
      if (missingEntries.length > 0) {
        const queueLength = await queue.count();
        const missingCount = missingEntries.length;
        missingEntries.forEach(([instanceId]) => enqueue({ instanceId }));
        res.status(202).json({
          status: "queued",
          missingCount,
          estimatedTime: (queueLength + missingCount) / 20,
        });
        return;
      }

      const counts: Record<string, number> = {};
      const names: Record<string, string> = {};

      const GOS = [1042180643, 2497200493, 2659723068, 3458480158, 3845997235];

      // .filter((instance) => GOS.includes(instance.activityHash))
      for (const instance of Object.values(instances).filter(
        (x) => x !== null
      )) {
        for (const player of instance.players) {
          counts[`${player.membershipId}`] =
            (counts[`${player.membershipId}`] ?? 0) + 1;
          if (!names[`${player.membershipId}`] && player.displayName) {
            names[`${player.membershipId}`] = player.displayName;
          }
        }
      }

      const playerCounts = Object.entries(counts)
        .map(([id, count]) => [names[id], count] as const)
        .sort(([, a], [, b]) => b - a);

      // Process results
      res.json({
        status: "complete",
        result: playerCounts,
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        message: `${err}`,
      });
      return;
    }
  }
);

router.get(
  "/test/:instanceId",
  validateRequestParams(
    z.object({
      instanceId: z.coerce.number(),
    })
  ),
  async (req, res) => {
    const { instanceId } = req.params;

    let pgcr = await getCachedPGCR(instanceId);
    if (pgcr) {
      res.json({
        cached: true,
        pgcr,
      });
      return;
    }

    const resp = await getPostGameCarnageReport(instanceId);
    if (!resp.Success) {
      res.status(500).json({
        error: true,
      });
      return;
    }

    pgcr = parseBungiePGCR(resp.Response);
    cachePGCR(instanceId, pgcr);

    res.json({
      cached: false,
      pgcr,
    });
  }
);

export default router;
