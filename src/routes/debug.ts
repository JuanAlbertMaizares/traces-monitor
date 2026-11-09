import { Router } from "express";

const router = Router();

router.get("/boom", () => {
  throw new Error("¡Boom! Error forzado desde /debug/boom");
});

export default router;