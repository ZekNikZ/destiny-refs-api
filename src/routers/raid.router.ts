import { Router } from "express";
import { z } from "zod";
import { validateRequestParams } from "zod-express-middleware";
import {
  cachePGCR,
  getCachedPGCR,
  parseBungiePGCR,
} from "../service/pgcr.service";
import { getPostGameCarnageReport } from "../bungie/bungie-api";

const router = Router();

router.get(
  "/stats/:membershipId",
  validateRequestParams(
    z.object({
      membershipId: z.coerce.number(),
    })
  ),
  async (req, res) => {
    const { membershipId } = req.params;

    res.json({
      membershipId,
    });
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
