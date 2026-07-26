import { Router, type IRouter } from "express";
import { MATRIX, RIGHTS, ROLE_META, type AccessRole } from "./matrix";

const router: IRouter = Router();

/** The access matrix, for the header popover. `you` = the caller's role. */
router.get("/access-matrix", (_req, res): void => {
  const profile = res.locals["profile"] as { username: string; role: string } | undefined;
  res.json({
    rights: RIGHTS,
    roles: (Object.keys(MATRIX) as AccessRole[]).map((role) => ({
      role,
      abbr: ROLE_META[role].abbr,
      rights: MATRIX[role],
    })),
    you: profile?.role ?? null,
  });
});

export default router;
