import express from "express";
import healthRouter from "./routes/health";
import { traceMiddleware } from "./middleware/trace";
import { demoAuthMiddleware, demoLocaleMiddleware } from "./middleware/demo";

export function createApp() {
  const app = express();
  app.use(express.json());

  // 1. El trace va primero para preparar el request
  app.use(traceMiddleware);

  // 2. Middlewares demo que mutan el request
  app.use(demoAuthMiddleware);
  app.use(demoLocaleMiddleware);

  // 3. Las rutas
  app.use(healthRouter);

  // 4. Fallback 404
  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });
  
  return app;
}