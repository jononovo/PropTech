import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { CreateSavedSectionBody, CreateSavedSectionResponse, ListSavedSectionsResponse } from "@workspace/api-zod";
import { listSavedSections, writeSavedSection } from "./store";

const router: IRouter = Router();

router.get("/saved-sections", async (_req, res): Promise<void> => {
  res.json(ListSavedSectionsResponse.parse(await listSavedSections()));
});

router.post("/saved-sections", async (req, res): Promise<void> => {
  const parsed = CreateSavedSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Saved sections are copies, never links: store the section payload verbatim.
  const saved = { id: nanoid(10), ...parsed.data };
  await writeSavedSection(saved);
  res.status(201).json(CreateSavedSectionResponse.parse(saved));
});

export default router;
