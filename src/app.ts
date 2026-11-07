import express from "express";
import healthRouter from "./routes/health";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });
  return app;
}