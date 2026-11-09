import { Router } from "express";
import { db, traces, traceEvents } from "../db";
import { desc, eq } from "drizzle-orm";

const router = Router();

// GET /traces -> lista los últimos 20
router.get("/", async (_req, res, next) => {
  try {
    const list = await db.select().from(traces).orderBy(desc(traces.createdAt)).limit(20);
    res.json(list);
  } catch (err) {
    next(err); // <-- Pasamos el error al Error Handler
  }
});

// GET /traces/:id -> detalle con eventos
router.get("/:id", async (req, res, next) => {
  try {
    const traceId = req.params.id;
    const trace = await db.select().from(traces).where(eq(traces.id, traceId)).limit(1);
    
    if (trace.length === 0) {
      return res.status(404).json({ error: "Trace no encontrado" });
    }

    const events = await db.select().from(traceEvents).where(eq(traceEvents.traceId, traceId));
    res.json({ ...trace[0], events });
  } catch (err) {
    next(err); // <-- Pasamos el error al Error Handler
  }
});

export default router;