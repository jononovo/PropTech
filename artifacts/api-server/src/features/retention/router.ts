import { Router, type IRouter } from "express";
import { findExpired, RETENTION_DAYS } from "./sweep";

const router: IRouter = Router();

/** Retention policy status: window + what the next sweep would purge. */
router.get("/retention", async (_req, res): Promise<void> => {
  res.json({
    policyDays: RETENTION_DAYS,
    policy: `Applications are purged (all documents, analysis artifacts, and history) ${RETENTION_DAYS} days after their last activity. See internal_docs/retention.md.`,
    pendingPurge: await findExpired(),
  });
});

export default router;
