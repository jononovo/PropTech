import { Router, type IRouter } from "express";
import healthRouter from "./health";
import templateLibraryRouter from "../features/template-library/router";
import templateEditorRouter from "../features/template-editor/router";
import savedSectionsRouter from "../features/saved-sections/router";
import intakeRouter from "../features/intake/router";
import intakeUploadsRouter from "../features/intake-uploads/router";
import variantsRouter from "../features/variants/router";
import approvedDocsRouter from "../features/approved-docs/router";
import mergeResolutionsRouter from "../features/merge-resolutions/router";
import variantShapesRouter from "../features/variant-shapes/router";
import analysisRouter from "../features/analysis/router";
import packetRouter from "../features/packet/router";
import packetManifestRouter from "../features/packet-manifest/router";
import usersRouter from "../features/users/router";
import modelsRouter from "../features/models/router";

const router: IRouter = Router();

router.use(healthRouter);
router.use(templateLibraryRouter);
router.use(templateEditorRouter);
router.use(savedSectionsRouter);
router.use(intakeRouter);
router.use(intakeUploadsRouter);
router.use(variantsRouter);
router.use(approvedDocsRouter);
router.use(mergeResolutionsRouter);
router.use(variantShapesRouter);
router.use(analysisRouter);
router.use(packetManifestRouter);
router.use(packetRouter);
router.use(usersRouter);
router.use(modelsRouter);

export default router;
