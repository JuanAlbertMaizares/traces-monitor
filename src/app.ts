import express from "express";
import healthRouter from "./routes/health";
import tracesRouter from "./routes/traces";
import debugRouter from "./routes/debug";
import { traceMiddleware } from "./middleware/trace";
import { demoAuthMiddleware, demoLocaleMiddleware } from "./middleware/demo";
import { errorHandler } from "./middleware/error";

export function createApp() {
  const app = express();
  app.use(express.json());

  // 1. Trace (aplica a todo)
  app.use(traceMiddleware);

  // 2. Middlewares demo que mutan el request
  app.use(demoAuthMiddleware);
  app.use(demoLocaleMiddleware);

  // 3. Las rutas
  app.use(healthRouter);
  app.use("/debug", debugRouter);
  app.use("/traces", tracesRouter);

  // 4. Fallback 404
  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });

  // 5. ¡EL ERROR HANDLER SIEMPRE VA AL FINAL!
  app.use(errorHandler);
  
  return app;
}