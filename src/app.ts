import express from "express";
import healthRouter from "./routes/health";

import { traceMiddleware } from "./middleware/trace";



export function createApp() {
  const app = express();
  app.use(express.json());

  // Trace primero: aplica a TODO lo que venga después.
  app.use(traceMiddleware);

  app.use(healthRouter);
  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });
  return app;
}