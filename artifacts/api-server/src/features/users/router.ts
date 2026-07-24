import { Router, type IRouter } from "express";
import { ListUsersResponse, LoginBody, LoginResponse } from "@workspace/api-zod";
import { listUsers, verifyLogin } from "./store";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  res.json(ListUsersResponse.parse(await listUsers()));
});

router.post("/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await verifyLogin(parsed.data.username, parsed.data.password);
  if (!user) {
    res.status(401).json({ error: "Wrong username or password." });
    return;
  }
  res.json(LoginResponse.parse(user));
});

export default router;
