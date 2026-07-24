import { Router, type IRouter } from "express";
import healthRouter from "./health";
import templateLibraryRouter from "../features/template-library/router";
import templateEditorRouter from "../features/template-editor/router";
import savedSectionsRouter from "../features/saved-sections/router";
import intakeRouter from "../features/intake/router";
import intakeUploadsRouter from "../features/intake-uploads/router";
import analysisRouter from "../features/analysis/router";
import packetRouter from "../features/packet/router";
import usersRouter from "../features/users/router";

const router: IRouter = Router();

router.use(healthRouter);
router.use(templateLibraryRouter);
router.use(templateEditorRouter);
router.use(savedSectionsRouter);
router.use(intakeRouter);
router.use(intakeUploadsRouter);
router.use(analysisRouter);
router.use(packetRouter);
router.use(usersRouter);

export default router;
